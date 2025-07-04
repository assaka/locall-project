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

    const { data: whiteLabels, error } = await supabaseAdmin
      .from('white_labels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching white labels:', error);
      return errorResponse('Failed to fetch white labels', 500);
    }

    return successResponse({ data: whiteLabels });

  } catch (error) {
    console.error('White labels GET error:', error);
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
    const { 
      client_name, 
      subdomain, 
      custom_domain,
      branding_config,
      is_active = true 
    } = body;

    if (!client_name || !subdomain) {
      return errorResponse('Missing required fields: client_name, subdomain', 400);
    }

    // Check if subdomain is already taken
    const { data: existing } = await supabaseAdmin
      .from('white_labels')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    if (existing) {
      return errorResponse('Subdomain already taken', 409);
    }

    // Create white label
    const { data: whiteLabel, error } = await supabaseAdmin
      .from('white_labels')
      .insert({
        user_id: userId,
        client_name,
        subdomain,
        custom_domain,
        branding_config: branding_config || {
          logo_url: '',
          primary_color: '#3B82F6',
          secondary_color: '#1F2937',
          company_name: client_name
        },
        is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating white label:', error);
      return errorResponse('Failed to create white label', 500);
    }

    return successResponse(whiteLabel, 201);

  } catch (error) {
    console.error('White labels POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse(auth.error || 'Authentication failed', 401);
    }

    const userId = auth.userId || 'demo-user-id';

    const body = await request.json();
    const { 
      id,
      client_name, 
      custom_domain,
      branding_config,
      is_active 
    } = body;

    if (!id) {
      return errorResponse('Missing required field: id', 400);
    }

    // Update white label
    const { data: whiteLabel, error } = await supabaseAdmin
      .from('white_labels')
      .update({
        ...(client_name && { client_name }),
        ...(custom_domain !== undefined && { custom_domain }),
        ...(branding_config && { branding_config }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating white label:', error);
      return errorResponse('Failed to update white label', 500);
    }

    if (!whiteLabel) {
      return errorResponse('White label not found', 404);
    }

    return successResponse(whiteLabel);

  } catch (error) {
    console.error('White labels PUT error:', error);
    return errorResponse('Internal server error', 500);
  }
}
