import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

// Get recordings for a user/agency or specific recording
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const recordingId = searchParams.get('recordingId');
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');

    // Get specific recording
    if (recordingId) {
      const { data: call, error } = await supabaseAdmin
        .from('calls')
        .select('*, call_transcripts(*)')
        .eq('id', recordingId)
        .single();

      if (error || !call) {
        return errorResponse('Recording not found', 404);
      }

      const recording = {
        id: call.id,
        vonage_call_id: call.vonage_call_id,
        url: call.recording_url,
        duration: call.duration,
        from: call.from,
        to: call.to,
        status: call.status,
        created_at: call.created_at,
        transcript: call.call_transcripts?.[0] || null,
        workspace_id: call.workspace_id,
        user_id: call.user_id
      };

      return successResponse({ recording });
    }

    // Get recordings list
    let query = supabaseAdmin
      .from('calls')
      .select('id, vonage_call_id, recording_url, duration, from, to, status, created_at, workspace_id, user_id')
      .not('recording_url', 'is', null)
      .order('created_at', { ascending: false });

    // Filter by agency/workspace
    if (agencyId || workspaceId) {
      const filterValue = agencyId || workspaceId;
      query = query.eq('workspace_id', filterValue);
    }

    // Filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: calls, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching recordings:', error);
      return errorResponse('Failed to fetch recordings', 500);
    }

    const recordings = (calls || []).map(call => ({
      id: call.id,
      vonage_call_id: call.vonage_call_id,
      url: call.recording_url,
      duration: call.duration,
      from: call.from,
      to: call.to,
      status: call.status,
      created_at: call.created_at,
      workspace_id: call.workspace_id,
      user_id: call.user_id
    }));

    return successResponse({ recordings });

  } catch (error) {
    console.error('Recordings API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Update recording metadata
export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const { recordingId, metadata } = body;

    if (!recordingId) {
      return errorResponse('Missing recordingId', 400);
    }

    const { data: call, error } = await supabaseAdmin
      .from('calls')
      .update({
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', recordingId)
      .select()
      .single();

    if (error) {
      return errorResponse('Failed to update recording', 500);
    }

    return successResponse({ 
      message: 'Recording updated successfully',
      recording: call 
    });

  } catch (error) {
    console.error('Recording update error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Delete recording
export async function DELETE(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recordingId');

    if (!recordingId) {
      return errorResponse('Missing recordingId', 400);
    }

    // Get recording details first
    const { data: call, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('recording_url, workspace_id, user_id')
      .eq('id', recordingId)
      .single();

    if (fetchError || !call) {
      return errorResponse('Recording not found', 404);
    }

    // Delete related transcripts first
    await supabaseAdmin
      .from('call_transcripts')
      .delete()
      .eq('call_id', recordingId);

    // Remove recording URL from call record (don't delete the call itself)
    const { error: updateError } = await supabaseAdmin
      .from('calls')
      .update({
        recording_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (updateError) {
      return errorResponse('Failed to delete recording reference', 500);
    }

    // Note: In production, you should also delete the actual file from storage
    // Example for S3/cloud storage deletion:
    /*
    if (call.recording_url) {
      await deleteRecordingFile(call.recording_url);
    }
    */

    return successResponse({ 
      message: 'Recording deleted successfully',
      recordingId 
    });

  } catch (error) {
    console.error('Recording deletion error:', error);
    return errorResponse('Internal server error', 500);
  }
}
