import { NextRequest, NextResponse } from 'next/server';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';
import { supabaseAdmin } from '@/lib/supabase';

const SOCIAL_REWARDS = {
  facebook: { points: 50, daily_limit: 200, weekly_limit: 1000 },
  twitter: { points: 50, daily_limit: 200, weekly_limit: 1000 },
  linkedin: { points: 75, daily_limit: 150, weekly_limit: 750 },
  instagram: { points: 40, daily_limit: 160, weekly_limit: 800 }
};

// Process social media reward
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const {
      platform,
      action,
      referenceUrl,
      workspaceId = 'default-workspace',
      metadata = {}
    } = body;

    if (!platform || !action || !referenceUrl) {
      return errorResponse('Platform, action, and referenceUrl are required', 400);
    }

    const userId = auth.userId;
    const rewardConfig = SOCIAL_REWARDS[platform as keyof typeof SOCIAL_REWARDS];

    if (!rewardConfig) {
      return errorResponse('Unsupported platform', 400);
    }

    // Check if user already got reward for this URL
    const { data: existingReward } = await supabaseAdmin
      .from('social_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_url', referenceUrl)
      .single();

    if (existingReward) {
      return errorResponse('Reward already claimed for this content', 409);
    }

    // Check daily and weekly limits
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { data: dailyRewards } = await supabaseAdmin
      .from('social_rewards')
      .select('points_earned')
      .eq('user_id', userId)
      .eq('platform', platform)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const { data: weeklyRewards } = await supabaseAdmin
      .from('social_rewards')
      .select('points_earned')
      .eq('user_id', userId)
      .eq('platform', platform)
      .gte('created_at', `${weekStartStr}T00:00:00.000Z`);

    const dailyTotal = dailyRewards?.reduce((sum: number, reward: any) => sum + reward.points_earned, 0) || 0;
    const weeklyTotal = weeklyRewards?.reduce((sum: number, reward: any) => sum + reward.points_earned, 0) || 0;

    if (dailyTotal >= rewardConfig.daily_limit) {
      return errorResponse('Daily reward limit reached for this platform', 429);
    }

    if (weeklyTotal >= rewardConfig.weekly_limit) {
      return errorResponse('Weekly reward limit reached for this platform', 429);
    }

    // Create social reward record
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('social_rewards')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        platform,
        action,
        reference_url: referenceUrl,
        points_earned: rewardConfig.points,
        verified: false, // Will be verified later
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (rewardError) throw rewardError;

    // Start verification process (simplified for demo)
    setTimeout(async () => {
      await verifyAndCreditReward(reward.id);
    }, 5000);

    return successResponse({
      reward,
      message: 'Social reward submitted for verification'
    }, 201);

  } catch (error) {
    console.error('Error processing social reward:', error);
    return errorResponse('Failed to process social reward', 500);
  }
}

// Get user's social rewards stats
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';
    const platform = searchParams.get('platform');
    const timeRange = searchParams.get('timeRange') || '30d';

    const userId = auth.userId;
    const startDate = getStartDate(timeRange);

    let query = supabaseAdmin
      .from('social_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: rewards, error } = await query;

    if (error) throw error;

    // Calculate stats by platform
    const statsByPlatform: Record<string, any> = {};
    
    Object.keys(SOCIAL_REWARDS).forEach(platform => {
      const platformRewards = rewards?.filter(r => r.platform === platform) || [];
      const totalEarned = platformRewards.reduce((sum, r) => sum + r.points_earned, 0);
      const verifiedRewards = platformRewards.filter(r => r.verified);
      
      statsByPlatform[platform] = {
        total_rewards: platformRewards.length,
        verified_rewards: verifiedRewards.length,
        pending_rewards: platformRewards.length - verifiedRewards.length,
        total_points: totalEarned,
        verified_points: verifiedRewards.reduce((sum, r) => sum + r.points_earned, 0),
        config: SOCIAL_REWARDS[platform as keyof typeof SOCIAL_REWARDS]
      };
    });

    // Get current day/week limits usage
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const currentUsage: Record<string, any> = {};
    
    for (const platform of Object.keys(SOCIAL_REWARDS)) {
      const { data: dailyRewards } = await supabaseAdmin
        .from('social_rewards')
        .select('points_earned')
        .eq('user_id', userId)
        .eq('platform', platform)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      const { data: weeklyRewards } = await supabaseAdmin
        .from('social_rewards')
        .select('points_earned')
        .eq('user_id', userId)
        .eq('platform', platform)
        .gte('created_at', `${weekStartStr}T00:00:00.000Z`);

      const dailyUsed = dailyRewards?.reduce((sum: number, r: any) => sum + r.points_earned, 0) || 0;
      const weeklyUsed = weeklyRewards?.reduce((sum: number, r: any) => sum + r.points_earned, 0) || 0;
      
      const config = SOCIAL_REWARDS[platform as keyof typeof SOCIAL_REWARDS];
      
      currentUsage[platform] = {
        daily_used: dailyUsed,
        daily_remaining: Math.max(0, config.daily_limit - dailyUsed),
        weekly_used: weeklyUsed,
        weekly_remaining: Math.max(0, config.weekly_limit - weeklyUsed)
      };
    }

    return successResponse({
      stats_by_platform: statsByPlatform,
      current_usage: currentUsage,
      recent_rewards: rewards?.slice(0, 20),
      total_points_earned: rewards?.reduce((sum, r) => sum + (r.verified ? r.points_earned : 0), 0) || 0
    });

  } catch (error) {
    console.error('Error fetching social rewards stats:', error);
    return errorResponse('Failed to fetch social rewards stats', 500);
  }
}

// Verify and credit a social reward
async function verifyAndCreditReward(rewardId: string): Promise<void> {
  try {
    const { data: reward } = await supabaseAdmin
      .from('social_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (!reward || reward.verified) {
      return;
    }

    // In a real implementation, this would verify the social media action
    // For demo purposes, we'll simulate verification
    const isVerified = Math.random() > 0.1; // 90% success rate

    if (isVerified) {
      // Mark as verified
      await supabaseAdmin
        .from('social_rewards')
        .update({
          verified: true,
          verification_data: {
            verified_at: new Date().toISOString(),
            method: 'automated'
          }
        })
        .eq('id', rewardId);

      // Credit loyalty points
      await supabaseAdmin
        .from('loyalty_transactions')
        .insert({
          user_id: reward.user_id,
          workspace_id: reward.workspace_id,
          transaction_type: 'earn',
          points: reward.points_earned,
          reason: `Social reward: ${reward.platform} ${reward.action}`,
          reference_id: rewardId,
          created_at: new Date().toISOString()
        });

      // Update user's loyalty balance
      await updateUserLoyaltyBalance(reward.user_id, reward.workspace_id);
    } else {
      // Mark as failed verification
      await supabaseAdmin
        .from('social_rewards')
        .update({
          verified: false,
          verification_data: {
            verified_at: new Date().toISOString(),
            method: 'automated',
            failure_reason: 'Could not verify social media action'
          }
        })
        .eq('id', rewardId);
    }

  } catch (error) {
    console.error('Error verifying social reward:', error);
  }
}

// Helper function to update user loyalty balance
async function updateUserLoyaltyBalance(userId: string, workspaceId: string): Promise<void> {
  const { data: transactions } = await supabaseAdmin
    .from('loyalty_transactions')
    .select('points')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId);

  const balance = transactions?.reduce((total: number, transaction: any) => total + transaction.points, 0) || 0;

  await supabaseAdmin
    .from('user_loyalty_balances')
    .upsert({
      user_id: userId,
      workspace_id: workspaceId,
      points_balance: balance,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,workspace_id'
    });
}

// Helper function to get start date for time range
function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}
