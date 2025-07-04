import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth-service';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { connectionId, syncType = 'all' } = await request.json();
    
    if (!connectionId) {
      return errorResponse('Connection ID is required', 400);
    }

    // Verify user owns this connection
    const { data: connection } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', auth.userId)
      .single();

    if (!connection) {
      return errorResponse('Connection not found', 404);
    }

    let results: any = { success: true };

    try {
      // Refresh token if needed
      if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
        await OAuthService.refreshToken(connectionId);
      }

      // Perform sync based on type
      if (syncType === 'contacts' || syncType === 'all') {
        if (['hubspot', 'google'].includes(connection.provider)) {
          const contactResult = await OAuthService.syncContacts(connectionId);
          results.contacts = contactResult;
        }
      }

      if (syncType === 'appointments' || syncType === 'all') {
        if (['google', 'calendly'].includes(connection.provider)) {
          const appointmentResult = await OAuthService.syncAppointments(connectionId);
          results.appointments = appointmentResult;
        }
      }

      // Log sync event
      await supabaseAdmin
        .from('integration_events')
        .insert({
          workspace_id: connection.workspace_id,
          provider: connection.provider,
          event_type: 'sync_completed',
          metadata: {
            connection_id: connectionId,
            sync_type: syncType,
            results
          }
        });

      return successResponse(results);

    } catch (syncError) {
      // Log sync error
      await supabaseAdmin
        .from('integration_events')
        .insert({
          workspace_id: connection.workspace_id,
          provider: connection.provider,
          event_type: 'sync_failed',
          metadata: {
            connection_id: connectionId,
            sync_type: syncType,
            error: syncError instanceof Error ? syncError.message : 'Unknown error'
          }
        });

      throw syncError;
    }

  } catch (error) {
    console.error('OAuth sync error:', error);
    return errorResponse('Sync failed', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return errorResponse('Workspace ID is required', 400);
    }

    // Get all connections for workspace
    const connections = await OAuthService.getWorkspaceConnections(workspaceId);

    // Get recent sync events
    const { data: events } = await supabaseAdmin
      .from('integration_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('event_type', ['sync_completed', 'sync_failed'])
      .order('created_at', { ascending: false })
      .limit(50);

    return successResponse({
      connections,
      recent_events: events || []
    });

  } catch (error) {
    console.error('OAuth sync status error:', error);
    return errorResponse('Failed to get sync status', 500);
  }
}
