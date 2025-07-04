import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse(auth.error || 'Authentication failed', 401);
    }

    const userId = auth.userId || 'demo-user-id';

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('integrations')
      .select('id, provider, is_active, config, sync_status, last_sync_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (provider) {
      query = query.eq('provider', provider);
    }
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }

    const { data: integrations, error } = await query;

    if (error) {
      console.error('Error fetching integrations:', error);
      return errorResponse('Failed to fetch integrations', 500);
    }

    // Remove sensitive data from config
    const sanitizedIntegrations = integrations?.map(integration => ({
      ...integration,
      config: {
        ...integration.config,
        access_token: integration.config?.access_token ? '[HIDDEN]' : undefined,
        refresh_token: integration.config?.refresh_token ? '[HIDDEN]' : undefined,
        api_key: integration.config?.api_key ? '[HIDDEN]' : undefined
      }
    }));

    return successResponse({ data: sanitizedIntegrations });

  } catch (error) {
    console.error('Integrations GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse(auth.error || 'Authentication failed', 401);
    }

    const userId = auth.userId || 'demo-user-id';

    const body = await request.json();
    const { provider, config, is_active = true } = body;

    if (!provider || !config) {
      return errorResponse('Missing required fields: provider, config', 400);
    }

    const validProviders = ['calendly', 'google_calendar', 'hubspot', 'salesforce'];
    if (!validProviders.includes(provider)) {
      return errorResponse(`Invalid provider. Must be one of: ${validProviders.join(', ')}`, 400);
    }

    // Check if integration already exists
    const { data: existing } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (existing) {
      return errorResponse('Integration with this provider already exists', 409);
    }

    // Create integration
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .insert({
        user_id: userId,
        provider,
        config,
        is_active,
        sync_status: 'pending'
      })
      .select('id, provider, is_active, sync_status, created_at')
      .single();

    if (error) {
      console.error('Error creating integration:', error);
      return errorResponse('Failed to create integration', 500);
    }

    return successResponse(integration, 201);

  } catch (error) {
    console.error('Integrations POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}
