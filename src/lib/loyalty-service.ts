// lib/loyalty-service.ts
import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface ReferralProgram {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  reward_type: 'credits' | 'discount' | 'cash';
  reward_amount: number;
  min_referrals: number;
  max_rewards_per_user?: number;
  is_active: boolean;
  terms_conditions?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  workspace_id: string;
  code: string;
  referral_program_id: string;
  uses_count: number;
  max_uses?: number;
  expires_at?: Date;
  is_active: boolean;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code_id: string;
  workspace_id: string;
  status: 'pending' | 'completed' | 'credited' | 'fraud';
  conversion_event?: string;
  conversion_value?: number;
  reward_amount?: number;
  fraud_score?: number;
  created_at: Date;
  updated_at: Date;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  workspace_id: string;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'bonus';
  points: number;
  reason: string;
  reference_id?: string;
  metadata?: any;
  created_at: Date;
}

export interface SocialReward {
  id: string;
  user_id: string;
  workspace_id: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  action: 'share' | 'like' | 'follow' | 'review';
  reference_url: string;
  points_earned: number;
  verified: boolean;
  verification_data?: any;
  created_at: Date;
}

export interface LoyaltyTier {
  name: string;
  min_referrals: number;
  bonus_multiplier: number;
  perks: string[];
}

export interface SocialShareReward {
  platform: string;
  reward_amount: number;
  daily_limit: number;
  weekly_limit: number;
}

export interface FraudDetectionResult {
  isFraud: boolean;
  score: number;
  reasons: string[];
  action: 'allow' | 'review' | 'block';
  risk_score: number;
  recommended_action: 'allow' | 'review' | 'block';
  is_suspicious: boolean;
}

export class LoyaltyService {
  private static readonly SOCIAL_PLATFORMS = {
    email: { platform: 'email', reward_amount: 25, daily_limit: 500, weekly_limit: 2000 },
    whatsapp: { platform: 'whatsapp', reward_amount: 30, daily_limit: 300, weekly_limit: 1500 }
  };

  private static readonly SOCIAL_SHARE_REWARDS = {
    email: { platform: 'email', reward_amount: 25, daily_limit: 500, weekly_limit: 2000 },
    whatsapp: { platform: 'whatsapp', reward_amount: 30, daily_limit: 300, weekly_limit: 1500 }
  };

  private static readonly LOYALTY_TIERS: LoyaltyTier[] = [
    { name: 'Bronze', min_referrals: 0, bonus_multiplier: 1.0, perks: ['Basic support'] },
    { name: 'Silver', min_referrals: 5, bonus_multiplier: 1.2, perks: ['Priority support', '20% bonus rewards'] },
    { name: 'Gold', min_referrals: 15, bonus_multiplier: 1.5, perks: ['Premium support', '50% bonus rewards', 'Advanced analytics'] },
    { name: 'Platinum', min_referrals: 50, bonus_multiplier: 2.0, perks: ['Dedicated support', '100% bonus rewards', 'Custom integrations', 'White-label options'] }
  ];

  private static readonly REFERRAL_REWARD_AMOUNT = 1000; // $10.00 in cents
  private static readonly REFEREE_REWARD_AMOUNT = 500; // $5.00 in cents

  static async generateReferralCode(userId: string): Promise<string> {
    try {
      // Generate unique referral code
      let code: string;
      let isUnique = false;
      let attempts = 0;
      
      do {
        // Create a memorable 8-character code
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        code = `REF${timestamp.slice(-2)}${random}`.slice(0, 8);
        
        // Check if code already exists
        const { data: existing } = await supabaseAdmin
          .from('referral_codes')
          .select('id')
          .eq('code', code)
          .single();
          
        isUnique = !existing;
        attempts++;
      } while (!isUnique && attempts < 10);

      if (!isUnique) {
        throw new Error('Failed to generate unique referral code');
      }

      // Store the referral code
      const { error } = await supabaseAdmin
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return code;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  static async processReferral(
    referralCode: string,
    refereeEmail: string,
    metadata: {
      ip_address: string;
      user_agent: string;
      device_fingerprint?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }
  ): Promise<{ success: boolean; referralId?: string; error?: string }> {
    try {
      // Find referral code
      const { data: referralCodeData } = await supabaseAdmin
        .from('referral_codes')
        .select('user_id, is_active')
        .eq('code', referralCode)
        .eq('is_active', true)
        .single();

      if (!referralCodeData) {
        return { success: false, error: 'Invalid referral code' };
      }

      // Check if referee already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', refereeEmail)
        .single();

      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Fraud detection
      const fraudCheck = await this.detectFraud(referralCodeData.user_id, metadata);
      
      if (fraudCheck.recommended_action === 'block') {
        return { success: false, error: 'Referral blocked due to suspicious activity' };
      }

      // Create referral record
      const { data: referral, error } = await supabaseAdmin
        .from('referrals')
        .insert({
          referrer_id: referralCodeData.user_id,
          referral_code: referralCode,
          referee_email: refereeEmail,
          status: fraudCheck.recommended_action === 'review' ? 'pending' : 'pending',
          reward_amount: this.REFERRAL_REWARD_AMOUNT,
          metadata,
          fraud_score: fraudCheck.risk_score,
          fraud_reasons: fraudCheck.reasons
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, referralId: referral.id };
    } catch (error) {
      console.error('Error processing referral:', error);
      return { success: false, error: 'Failed to process referral' };
    }
  }

  static async completeReferral(refereeUserId: string): Promise<void> {
    try {
      // Find pending referral for this user
      const { data: referral } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referee_id', refereeUserId)
        .eq('status', 'pending')
        .single();

      if (!referral) {
        console.log('No pending referral found for user:', refereeUserId);
        return;
      }

      // Get referrer's loyalty tier
      const tier = await this.getUserLoyaltyTier(referral.referrer_id);
      const bonusMultiplier = tier.bonus_multiplier;
      
      const finalReferrerReward = Math.round(this.REFERRAL_REWARD_AMOUNT * bonusMultiplier);
      const refereeReward = this.REFEREE_REWARD_AMOUNT;

      // Start transaction
      await supabaseAdmin.rpc('complete_referral_transaction', {
        p_referral_id: referral.id,
        p_referrer_id: referral.referrer_id,
        p_referee_id: refereeUserId,
        p_referrer_reward: finalReferrerReward,
        p_referee_reward: refereeReward
      });

      // Log the completion
      console.log(`Referral completed: ${referral.id}, Referrer reward: $${finalReferrerReward/100}, Referee reward: $${refereeReward/100}`);
    } catch (error) {
      console.error('Error completing referral:', error);
      throw error;
    }
  }

  static async processSocialShare(
    userId: string,
    platform: string,
    metadata: {
      ip_address: string;
      user_agent: string;
      share_url?: string;
      post_id?: string;
    }
  ): Promise<{ success: boolean; reward?: number; error?: string }> {
    try {
      const shareReward = this.SOCIAL_SHARE_REWARDS[platform];
      if (!shareReward) {
        return { success: false, error: 'Invalid platform' };
      }

      // Check daily and weekly limits
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: dailyShares } = await supabaseAdmin
        .from('social_shares')
        .select('reward_amount')
        .eq('user_id', userId)
        .eq('platform', platform)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      const { data: weeklyShares } = await supabaseAdmin
        .from('social_shares')
        .select('reward_amount')
        .eq('user_id', userId)
        .eq('platform', platform)
        .gte('created_at', `${weekStartStr}T00:00:00.000Z`);

      const dailyTotal = dailyShares?.reduce((sum: number, share: any) => sum + share.reward_amount, 0) || 0;
      const weeklyTotal = weeklyShares?.reduce((sum: number, share: any) => sum + share.reward_amount, 0) || 0;

      if (dailyTotal >= shareReward.daily_limit) {
        return { success: false, error: 'Daily sharing limit reached' };
      }

      if (weeklyTotal >= shareReward.weekly_limit) {
        return { success: false, error: 'Weekly sharing limit reached' };
      }

      // Record the share and add reward
      const { error: shareError } = await supabaseAdmin
        .from('social_shares')
        .insert({
          user_id: userId,
          platform,
          reward_amount: shareReward.reward_amount,
          metadata,
          created_at: new Date().toISOString()
        });

      if (shareError) throw shareError;

      // Add reward to user's balance
      await this.addRewardToBalance(userId, shareReward.reward_amount, `Social share on ${platform}`);

      return { success: true, reward: shareReward.reward_amount };
    } catch (error) {
      console.error('Error processing social share:', error);
      return { success: false, error: 'Failed to process social share' };
    }
  }

  static async detectFraud(
    referrerId: string,
    metadata: {
      ip_address: string;
      user_agent: string;
      device_fingerprint?: string;
    }
  ): Promise<FraudDetectionResult> {
    let riskScore = 0;
    const reasons: string[] = [];

    try {
      // Check for IP address reuse
      const { data: ipShares } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerId)
        .contains('metadata', { ip_address: metadata.ip_address })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (ipShares && ipShares.length > 3) {
        riskScore += 30;
        reasons.push('Multiple referrals from same IP in 24 hours');
      }

      // Check for device fingerprint reuse
      if (metadata.device_fingerprint) {
        const { data: deviceShares } = await supabaseAdmin
          .from('referrals')
          .select('id')
          .eq('referrer_id', referrerId)
          .contains('metadata', { device_fingerprint: metadata.device_fingerprint })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

        if (deviceShares && deviceShares.length > 1) {
          riskScore += 40;
          reasons.push('Multiple referrals from same device');
        }
      }

      // Check user agent patterns
      const { data: uaShares } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerId)
        .contains('metadata', { user_agent: metadata.user_agent })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (uaShares && uaShares.length > 5) {
        riskScore += 25;
        reasons.push('Multiple referrals with identical user agent');
      }

      // Check referral velocity
      const { data: recentReferrals } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

      if (recentReferrals && recentReferrals.length > 10) {
        riskScore += 50;
        reasons.push('Unusually high referral velocity');
      }

      // Determine action based on risk score
      let recommendedAction: 'allow' | 'review' | 'block';
      if (riskScore >= 70) {
        recommendedAction = 'block';
      } else if (riskScore >= 40) {
        recommendedAction = 'review';
      } else {
        recommendedAction = 'allow';
      }

      return {
        isFraud: riskScore > 70,
        score: riskScore,
        action: recommendedAction,
        is_suspicious: riskScore > 0,
        risk_score: riskScore,
        reasons,
        recommended_action: recommendedAction
      };
    } catch (error) {
      console.error('Error in fraud detection:', error);
      return {
        isFraud: true,
        score: 100,
        action: 'review',
        is_suspicious: true,
        risk_score: 100,
        reasons: ['Fraud detection system error'],
        recommended_action: 'review'
      };
    }
  }

  static async getUserLoyaltyTier(userId: string): Promise<LoyaltyTier> {
    try {
      // Count completed referrals
      const { data: referrals } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId)
        .eq('status', 'credited');

      const referralCount = referrals?.length || 0;

      // Find appropriate tier
      for (let i = this.LOYALTY_TIERS.length - 1; i >= 0; i--) {
        if (referralCount >= this.LOYALTY_TIERS[i].min_referrals) {
          return this.LOYALTY_TIERS[i];
        }
      }

      return this.LOYALTY_TIERS[0]; // Default to Bronze
    } catch (error) {
      console.error('Error getting loyalty tier:', error);
      return this.LOYALTY_TIERS[0];
    }
  }

  static async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    currentTier: LoyaltyTier;
    nextTier?: LoyaltyTier;
    referralsToNextTier?: number;
  }> {
    try {
      const { data: referrals } = await supabaseAdmin
        .from('referrals')
        .select('status, reward_amount')
        .eq('referrer_id', userId);

      const totalReferrals = referrals?.length || 0;
      const completedReferrals = referrals?.filter((r: any) => r.status === 'credited').length || 0;
      const pendingReferrals = referrals?.filter((r: any) => r.status === 'pending').length || 0;
      const totalEarned = referrals?.filter((r: any) => r.status === 'credited')
        .reduce((sum: number, r: any) => sum + r.reward_amount, 0) || 0;

      const currentTier = await this.getUserLoyaltyTier(userId);
      const currentTierIndex = this.LOYALTY_TIERS.findIndex(t => t.name === currentTier.name);
      const nextTier = currentTierIndex < this.LOYALTY_TIERS.length - 1 ? 
        this.LOYALTY_TIERS[currentTierIndex + 1] : undefined;
      const referralsToNextTier = nextTier ? 
        Math.max(0, nextTier.min_referrals - completedReferrals) : undefined;

      return {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalEarned,
        currentTier,
        nextTier,
        referralsToNextTier
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    }
  }

  static async getSocialShareStats(userId: string): Promise<{
    dailyShares: Record<string, number>;
    weeklyShares: Record<string, number>;
    totalEarned: number;
    availableRewards: Record<string, number>;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: shares } = await supabaseAdmin
        .from('social_shares')
        .select('platform, reward_amount, created_at')
        .eq('user_id', userId);

      const dailyShares: Record<string, number> = {};
      const weeklyShares: Record<string, number> = {};
      let totalEarned = 0;

      Object.keys(this.SOCIAL_SHARE_REWARDS).forEach(platform => {
        dailyShares[platform] = 0;
        weeklyShares[platform] = 0;
      });

      shares?.forEach((share: any) => {
        const shareDate = share.created_at.split('T')[0];
        totalEarned += share.reward_amount;

        if (shareDate === today) {
          dailyShares[share.platform] = (dailyShares[share.platform] || 0) + share.reward_amount;
        }

        if (shareDate >= weekStartStr) {
          weeklyShares[share.platform] = (weeklyShares[share.platform] || 0) + share.reward_amount;
        }
      });

      // Calculate available rewards for each platform
      const availableRewards: Record<string, number> = {};
      Object.entries(this.SOCIAL_SHARE_REWARDS).forEach(([platform, config]) => {
        const dailyUsed = dailyShares[platform] || 0;
        const weeklyUsed = weeklyShares[platform] || 0;
        
        availableRewards[platform] = Math.min(
          config.daily_limit - dailyUsed,
          config.weekly_limit - weeklyUsed
        );
      });

      return {
        dailyShares,
        weeklyShares,
        totalEarned,
        availableRewards
      };
    } catch (error) {
      console.error('Error getting social share stats:', error);
      throw error;
    }
  }

  private static async addRewardToBalance(
    userId: string,
    amount: number,
    description: string
  ): Promise<void> {
    try {
      // Update user balance
      const { error: balanceError } = await supabaseAdmin.rpc('increment_user_balance', {
        user_id: userId,
        amount_cents: amount
      });

      if (balanceError) throw balanceError;

      // Record transaction
      const { error: transactionError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount: amount,
          description,
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;
    } catch (error) {
      console.error('Error adding reward to balance:', error);
      throw error;
    }
  }

  static getAllLoyaltyTiers(): LoyaltyTier[] {
    return [...this.LOYALTY_TIERS];
  }

  static getSocialShareRewards(): Record<string, SocialShareReward> {
    return { ...this.SOCIAL_SHARE_REWARDS };
  }
}
