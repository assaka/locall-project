import { NextRequest, NextResponse } from 'next/server';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Generate unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Get user's referral codes
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';
    const userId = auth.userId;

    const { data: codes, error } = await supabaseAdmin
      .from('referral_codes')
      .select(`
        *,
        referral_programs (
          name,
          reward_type,
          reward_amount
        ),
        referrals:referrals!referral_code_id (
          id,
          status,
          created_at,
          referee_id
        )
      `)
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate stats for each code
    const codesWithStats = codes?.map((code: any) => ({
      ...code,
      total_uses: code.referrals?.length || 0,
      completed_referrals: code.referrals?.filter((r: any) => r.status === 'credited').length || 0,
      pending_referrals: code.referrals?.filter((r: any) => r.status === 'pending').length || 0
    }));

    return successResponse({ codes: codesWithStats });

  } catch (error) {
    console.error('Error fetching referral codes:', error);
    return errorResponse('Failed to fetch referral codes', 500);
  }
}

// Create new referral code
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const {
      workspaceId = 'default-workspace',
      programId,
      customCode,
      maxUses,
      expiresAt
    } = body;

    if (!programId) {
      return errorResponse('Program ID is required', 400);
    }

    // Verify program exists and is active
    const { data: program } = await supabaseAdmin
      .from('referral_programs')
      .select('*')
      .eq('id', programId)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (!program) {
      return errorResponse('Invalid or inactive referral program', 400);
    }

    let code = customCode;
    if (!code) {
      // Generate unique code
      let attempts = 0;
      do {
        code = generateReferralCode();
        const { data: existing } = await supabaseAdmin
          .from('referral_codes')
          .select('id')
          .eq('code', code)
          .eq('workspace_id', workspaceId)
          .single();
        
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return errorResponse('Failed to generate unique code', 500);
      }
    } else {
      // Check if custom code is already taken
      const { data: existing } = await supabaseAdmin
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .eq('workspace_id', workspaceId)
        .single();

      if (existing) {
        return errorResponse('Code already exists', 409);
      }
    }

    const { data: referralCode, error } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        user_id: auth.userId,
        workspace_id: workspaceId,
        code,
        referral_program_id: programId,
        uses_count: 0,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(referralCode, 201);

  } catch (error) {
    console.error('Error creating referral code:', error);
    return errorResponse('Failed to create referral code', 500);
  }
}

// Update referral code
export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const { id, is_active, max_uses, expires_at } = body;

    if (!id) {
      return errorResponse('Code ID is required', 400);
    }

    // Verify user owns this code
    const { data: existingCode } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!existingCode) {
      return errorResponse('Referral code not found', 404);
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (max_uses !== undefined) updateData.max_uses = max_uses ? parseInt(max_uses) : null;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null;

    const { data: updatedCode, error } = await supabaseAdmin
      .from('referral_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(updatedCode);

  } catch (error) {
    console.error('Error updating referral code:', error);
    return errorResponse('Failed to update referral code', 500);
  }
}
