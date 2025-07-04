import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';
import { AITranscriptionService } from '@/lib/ai-transcription-service';

// Get call transcript and sentiment analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const recordingId = searchParams.get('recordingId');

    if (!callId && !recordingId) {
      return errorResponse('Missing callId or recordingId parameter', 400);
    }

    // Get call record first
    let query = supabaseAdmin
      .from('calls')
      .select('*');

    if (callId) {
      query = query.eq('id', callId);
    } else {
      query = query.eq('recording_id', recordingId);
    }

    const { data: call, error: callError } = await query.single();

    if (callError || !call) {
      return errorResponse('Call not found', 404);
    }

    // Check if transcript already exists
    const { data: existingTranscript, error: transcriptError } = await supabaseAdmin
      .from('call_transcripts')
      .select('*')
      .eq('call_id', call.id)
      .single();

    if (existingTranscript) {
      return successResponse({
        transcript: {
          id: existingTranscript.id,
          call_id: call.id,
          transcript: existingTranscript.transcript_text,
          sentiment_score: existingTranscript.sentiment_score,
          confidence: existingTranscript.confidence,
          language: existingTranscript.language || 'en',
          created_at: existingTranscript.created_at,
          processing_status: existingTranscript.processing_status || 'completed'
        }
      });
    }

    // If no transcript exists and there's a recording URL, trigger processing
    if (call.recording_url) {
      // Create pending transcript record
      const { data: newTranscript, error: createError } = await supabaseAdmin
        .from('call_transcripts')
        .insert({
          call_id: call.id,
          recording_url: call.recording_url,
          processing_status: 'processing',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating transcript record:', createError);
        return errorResponse('Failed to create transcript record', 500);
      }

      // Trigger async transcription processing with AI
      AITranscriptionService.processCallAnalysis(call.id, call.recording_url);

      return successResponse({
        transcript: {
          id: newTranscript.id,
          call_id: call.id,
          transcript: 'Transcription in progress...',
          sentiment_score: null,
          confidence: null,
          language: 'en',
          created_at: newTranscript.created_at,
          processing_status: 'processing'
        }
      });
    }

    return errorResponse('No recording available for transcription', 404);

  } catch (error) {
    console.error('Transcripts API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Process sentiment analysis for existing transcript
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const { callId, transcriptText, forceReprocess = false } = body;

    if (!callId || !transcriptText) {
      return errorResponse('Missing callId or transcriptText', 400);
    }

    // Check if analysis already exists
    if (!forceReprocess) {
      const { data: existing } = await supabaseAdmin
        .from('call_transcripts')
        .select('sentiment_score, confidence')
        .eq('call_id', callId)
        .single();

      if (existing && existing.sentiment_score !== null) {
        return successResponse({
          sentiment_score: existing.sentiment_score,
          confidence: existing.confidence,
          message: 'Sentiment analysis already exists'
        });
      }
    }

    // Perform sentiment analysis using AI
    const sentimentResult = await AITranscriptionService.analyzeSentiment(transcriptText);

    // Update transcript with sentiment data
    const { error: updateError } = await supabaseAdmin
      .from('call_transcripts')
      .update({
        sentiment_score: sentimentResult.sentiment_score,
        confidence: sentimentResult.confidence,
        sentiment_details: {
          overall_sentiment: sentimentResult.overall_sentiment,
          emotions: sentimentResult.emotions,
          key_phrases: sentimentResult.key_phrases,
          conversation_metrics: sentimentResult.conversation_metrics
        },
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('call_id', callId);

    if (updateError) {
      console.error('Error updating sentiment:', updateError);
      return errorResponse('Failed to update sentiment analysis', 500);
    }

    return successResponse({
      sentiment_score: sentimentResult.sentiment_score,
      confidence: sentimentResult.confidence,
      overall_sentiment: sentimentResult.overall_sentiment,
      emotions: sentimentResult.emotions,
      key_phrases: sentimentResult.key_phrases
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Async function to process transcription
async function processTranscriptionAsync(callId: string, recordingUrl: string) {
  try {
    console.log(`Starting AI transcription for call ${callId}`);
    
    // Use the AI transcription service for complete analysis
    await AITranscriptionService.processCallAnalysis(callId, recordingUrl);
    
    console.log(`AI transcription completed for call ${callId}`);
  } catch (error) {
    console.error(`AI transcription failed for call ${callId}:`, error);
    
    // Mark as failed
    await supabaseAdmin
      .from('call_transcripts')
      .update({
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('call_id', callId);
  }
}
