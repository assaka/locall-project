import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth-service';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=missing_code_or_state`
      );
    }

    // Exchange code for token and store connection
    const { connection } = await OAuthService.exchangeCodeForToken(
      params.provider,
      code,
      state
    );

    // Trigger initial sync
    try {
      if (params.provider === 'hubspot') {
        await OAuthService.syncContacts(connection.id);
      } else if (['google', 'calendly'].includes(params.provider)) {
        await OAuthService.syncAppointments(connection.id);
      }
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
      // Don't fail the whole flow if sync fails
    }

    // Log the connection event
    await supabaseAdmin
      .from('integration_events')
      .insert({
        workspace_id: connection.workspace_id,
        provider: params.provider,
        event_type: 'connected',
        metadata: {
          connection_id: connection.id,
          provider_user_id: connection.provider_user_id,
          provider_email: connection.provider_email
        }
      });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=connected&provider=${params.provider}`
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`
    );
  }
}
