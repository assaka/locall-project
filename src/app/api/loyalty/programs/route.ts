import { NextRequest, NextResponse } from 'next/server';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Get referral programs for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

    const { data: programs, error } = await supabaseAdmin
      .from('referral_programs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse({ programs });

  } catch (error) {
    console.error('Error fetching referral programs:', error);
    return errorResponse('Failed to fetch referral programs', 500);
  }
}

// Create new referral program
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const {
      workspaceId = 'default-workspace',
      name,
      description,
      reward_type,
      reward_amount,
      min_referrals = 1,
      max_rewards_per_user,
      terms_conditions,
      is_active = true
    } = body;

    if (!name || !reward_type || !reward_amount) {
      return errorResponse('Missing required fields: name, reward_type, reward_amount', 400);
    }

    const { data: program, error } = await supabaseAdmin
      .from('referral_programs')
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        reward_type,
        reward_amount: parseInt(reward_amount),
        min_referrals: parseInt(min_referrals),
        max_rewards_per_user: max_rewards_per_user ? parseInt(max_rewards_per_user) : null,
        terms_conditions,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(program, 201);

  } catch (error) {
    console.error('Error creating referral program:', error);
    return errorResponse('Failed to create referral program', 500);
  }
}

// Update referral program
export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse('Program ID is required', 400);
    }

    const { data: program, error } = await supabaseAdmin
      .from('referral_programs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(program);

  } catch (error) {
    console.error('Error updating referral program:', error);
    return errorResponse('Failed to update referral program', 500);
  }
}
