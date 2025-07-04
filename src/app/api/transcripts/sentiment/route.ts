import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

// Get sentiment analysis for a specific call
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return errorResponse('Missing callId parameter', 400);
    }

    const { data: transcript, error } = await supabaseAdmin
      .from('call_transcripts')
      .select('sentiment_score, confidence, sentiment_details, processing_status')
      .eq('call_id', callId)
      .single();

    if (error) {
      return errorResponse('Transcript not found', 404);
    }

    if (transcript.processing_status === 'processing') {
      return successResponse({
        sentiment_score: null,
        confidence: null,
        status: 'processing',
        message: 'Sentiment analysis in progress'
      });
    }

    if (transcript.processing_status === 'failed') {
      return errorResponse('Sentiment analysis failed', 500);
    }

    return successResponse({
      sentiment_score: transcript.sentiment_score,
      confidence: transcript.confidence,
      details: transcript.sentiment_details,
      status: 'completed'
    });

  } catch (error) {
    console.error('Sentiment API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Trigger sentiment re-analysis
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const { callId } = body;

    if (!callId) {
      return errorResponse('Missing callId', 400);
    }

    // Get existing transcript
    const { data: transcript, error } = await supabaseAdmin
      .from('call_transcripts')
      .select('transcript_text')
      .eq('call_id', callId)
      .single();

    if (error || !transcript.transcript_text) {
      return errorResponse('No transcript found for sentiment analysis', 404);
    }

    // Re-run sentiment analysis
    const sentimentResult = await analyzeSentiment(transcript.transcript_text);

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('call_transcripts')
      .update({
        sentiment_score: sentimentResult.score,
        confidence: sentimentResult.confidence,
        sentiment_details: sentimentResult.details,
        updated_at: new Date().toISOString()
      })
      .eq('call_id', callId);

    if (updateError) {
      return errorResponse('Failed to update sentiment analysis', 500);
    }

    return successResponse({
      sentiment_score: sentimentResult.score,
      confidence: sentimentResult.confidence,
      details: sentimentResult.details,
      message: 'Sentiment analysis updated successfully'
    });

  } catch (error) {
    console.error('Sentiment re-analysis error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Enhanced sentiment analysis function
async function analyzeSentiment(text: string): Promise<{
  score: number;
  confidence: number;
  details: any;
}> {
  try {
    // Enhanced sentiment lexicon
    const sentimentLexicon = {
      // Very positive
      excellent: 2, amazing: 2, fantastic: 2, outstanding: 2, wonderful: 2,
      perfect: 2, awesome: 2, brilliant: 2, superb: 2, exceptional: 2,
      
      // Positive
      good: 1, great: 1, nice: 1, pleased: 1, satisfied: 1, happy: 1,
      helpful: 1, friendly: 1, professional: 1, quick: 1, easy: 1,
      
      // Negative
      bad: -1, poor: -1, slow: -1, difficult: -1, frustrated: -1,
      disappointed: -1, unhappy: -1, confused: -1, complicated: -1,
      
      // Very negative
      terrible: -2, awful: -2, horrible: -2, disgusting: -2, hate: -2,
      worst: -2, useless: -2, pathetic: -2, ridiculous: -2, outrageous: -2
    };

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    let totalScore = 0;
    let sentimentWordCount = 0;
    const foundSentiments: string[] = [];

    // Analyze each word
    words.forEach(word => {
      if (sentimentLexicon[word] !== undefined) {
        totalScore += sentimentLexicon[word];
        sentimentWordCount++;
        foundSentiments.push(word);
      }
    });

    // Calculate metrics
    let score = 0;
    let confidence = 0;

    if (sentimentWordCount > 0) {
      score = totalScore / sentimentWordCount;
      // Confidence based on number of sentiment words and text length
      confidence = Math.min(sentimentWordCount / Math.max(words.length * 0.1, 1), 1);
    }

    // Normalize score to -1 to 1 range
    score = Math.max(-1, Math.min(1, score / 2));

    // Determine sentiment label
    let label = 'neutral';
    if (score > 0.2) label = 'positive';
    else if (score > 0.5) label = 'very positive';
    else if (score < -0.2) label = 'negative';
    else if (score < -0.5) label = 'very negative';

    return {
      score,
      confidence,
      details: {
        sentiment_label: label,
        total_score: totalScore,
        sentiment_word_count: sentimentWordCount,
        total_words: words.length,
        found_sentiments: foundSentiments,
        analysis_method: 'lexicon-based',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      score: 0,
      confidence: 0,
      details: { 
        error: 'Analysis failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
