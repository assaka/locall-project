/**
 * Enhanced Loyalty & Referral System Service
 * Advanced features for customer retention and growth
 */

import { supabase } from '../app/utils/supabaseClient';
import crypto from 'crypto';

export interface AdvancedLoyaltyProgram {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  type: 'points' | 'tier' | 'cashback' | 'hybrid';
  status: 'active' | 'paused' | 'draft' | 'archived';
  
  // Earning rules
  earning_rules: {
    calls_completed: number; // Points per call
    forms_submitted: number; // Points per form
    referrals_made: number; // Points per referral
    monthly_spending: number; // Points per dollar spent
    social_shares: number; // Points per share
    reviews_left: number; // Points per review
    account_age_bonus: number; // Monthly loyalty bonus
  };
  
  // Redemption options
  redemption_options: Array<{
    id: string;
    name: string;
    description: string;
    cost_points: number;
    reward_type: 'discount' | 'credit' | 'feature_unlock' | 'priority_support' | 'custom';
    value: number; // Dollar value or percentage
    max_per_user?: number;
    expires_days?: number;
    terms?: string;
  }>;
  
  // Tier system
  tier_system: {
    enabled: boolean;
    tiers: Array<{
      name: string;
      min_points: number;
      multiplier: number;
      perks: string[];
      icon?: string;
      color?: string;
    }>;
  };
  
  // Gamification
  gamification: {
    badges_enabled: boolean;
    leaderboard_enabled: boolean;
    challenges_enabled: boolean;
    streak_bonuses: boolean;
  };
  
  created_at: string;
  updated_at: string;
}

export interface EnhancedReferralProgram {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'scheduled' | 'ended';
  
  // Referral mechanics
  referrer_rewards: Array<{
    milestone: number; // Number of successful referrals
    reward_type: 'points' | 'cash' | 'credit' | 'discount';
    amount: number;
    description: string;
  }>;
  
  referee_rewards: {
    immediate_reward: {
      type: 'points' | 'cash' | 'credit' | 'discount';
      amount: number;
    };
    milestone_rewards?: Array<{
      action: 'first_call' | 'first_month' | 'first_form';
      reward_type: 'points' | 'cash' | 'credit';
      amount: number;
    }>;
  };
  
  // Advanced features
  double_sided: boolean; // Both referrer and referee get rewards
  multi_tier: boolean; // Rewards increase with more referrals
  time_limited: boolean;
  start_date?: string;
  end_date?: string;
  max_referrals_per_user?: number;
  max_total_referrals?: number;
  
  // Fraud prevention
  fraud_protection: {
    ip_validation: boolean;
    email_verification: boolean;
    device_fingerprinting: boolean;
    cooldown_period_hours: number;
    max_referrals_per_day: number;
  };
  
  created_at: string;
  updated_at: string;
}

export interface UserLoyalty {
  id: string;
  user_id: string;
  workspace_id: string;
  program_id: string;
  
  // Points and tier
  points_balance: number;
  lifetime_points: number;
  current_tier: string;
  tier_progress: number;
  
  // Engagement metrics
  total_calls: number;
  total_forms: number;
  total_referrals: number;
  total_social_shares: number;
  total_reviews: number;
  
  // Streaks and achievements
  current_streak_days: number;
  longest_streak_days: number;
  badges_earned: string[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    earned_at: string;
    points_awarded: number;
  }>;
  
  // Referral data
  referral_code: string;
  referrals_made: number;
  referrals_completed: number;
  total_referral_rewards: number;
  
  created_at: string;
  updated_at: string;
}

export interface LoyaltyChallenge {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  type: 'individual' | 'team' | 'community';
  status: 'active' | 'upcoming' | 'completed';
  
  objectives: Array<{
    action: string;
    target: number;
    current?: number;
    points_reward: number;
  }>;
  
  start_date: string;
  end_date: string;
  max_participants?: number;
  entry_fee_points?: number;
  prize_pool: number;
  
  participants: Array<{
    user_id: string;
    progress: number;
    completed: boolean;
    rank?: number;
  }>;
  
  created_at: string;
}

class EnhancedLoyaltyService {
  /**
   * Create a new advanced loyalty program
   */
  async createLoyaltyProgram(
    workspaceId: string,
    programData: Omit<AdvancedLoyaltyProgram, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<AdvancedLoyaltyProgram> {
    try {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .insert({
          workspace_id: workspaceId,
          ...programData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize default achievements and badges
      await this.createDefaultAchievements(workspaceId, data.id);

      return data as AdvancedLoyaltyProgram;
    } catch (error) {
      console.error('Failed to create loyalty program:', error);
      throw error;
    }
  }

  /**
   * Create enhanced referral program
   */
  async createReferralProgram(
    workspaceId: string,
    programData: Omit<EnhancedReferralProgram, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<EnhancedReferralProgram> {
    try {
      const { data, error } = await supabase
        .from('referral_programs')
        .insert({
          workspace_id: workspaceId,
          ...programData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data as EnhancedReferralProgram;
    } catch (error) {
      console.error('Failed to create referral program:', error);
      throw error;
    }
  }

  /**
   * Award points for various actions
   */
  async awardPoints(
    userId: string,
    workspaceId: string,
    action: string,
    points: number,
    metadata?: any
  ): Promise<void> {
    try {
      // Get user's loyalty data
      const { data: userLoyalty, error: loyaltyError } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        throw loyaltyError;
      }

      // Create loyalty record if it doesn't exist
      if (!userLoyalty) {
        await this.initializeUserLoyalty(userId, workspaceId);
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          transaction_type: 'earn',
          points: points,
          reason: action,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        });

      if (transactionError) throw transactionError;

      // Update user's loyalty balance
      await this.updateUserLoyaltyBalance(userId, workspaceId);

      // Check for achievements and tier upgrades
      await this.checkAchievements(userId, workspaceId, action);
      await this.checkTierUpgrade(userId, workspaceId);
    } catch (error) {
      console.error('Failed to award points:', error);
      throw error;
    }
  }

  /**
   * Process referral with enhanced fraud detection
   */
  async processReferral(
    referralCode: string,
    refereeData: {
      email: string;
      name?: string;
      phone?: string;
    },
    metadata: {
      ip_address: string;
      user_agent: string;
      device_fingerprint?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }
  ): Promise<{
    success: boolean;
    referral_id?: string;
    fraud_score: number;
    action_taken: 'approved' | 'pending_review' | 'blocked';
    message: string;
  }> {
    try {
      // Find referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select(`
          *,
          user:users(*),
          program:referral_programs(*)
        `)
        .eq('code', referralCode)
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        return {
          success: false,
          fraud_score: 0,
          action_taken: 'blocked',
          message: 'Invalid or inactive referral code',
        };
      }

      // Check if referee already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', refereeData.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          fraud_score: 0.8,
          action_taken: 'blocked',
          message: 'User already exists',
        };
      }

      // Enhanced fraud detection
      const fraudAnalysis = await this.performFraudAnalysis(
        codeData.user_id,
        refereeData,
        metadata
      );

      // Determine action based on fraud score and program settings
      let actionTaken: 'approved' | 'pending_review' | 'blocked' = 'approved';
      
      if (fraudAnalysis.score > 0.8) {
        actionTaken = 'blocked';
      } else if (fraudAnalysis.score > 0.5) {
        actionTaken = 'pending_review';
      }

      // Create referral record
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: codeData.user_id,
          referral_code: referralCode,
          referee_email: refereeData.email,
          referee_name: refereeData.name,
          referee_phone: refereeData.phone,
          workspace_id: codeData.workspace_id,
          program_id: codeData.program_id,
          status: actionTaken === 'approved' ? 'pending_conversion' : actionTaken,
          fraud_score: fraudAnalysis.score,
          fraud_indicators: fraudAnalysis.indicators,
          metadata,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (referralError) throw referralError;

      // Send immediate referee reward if program allows
      if (actionTaken === 'approved' && codeData.program.referee_rewards?.immediate_reward) {
        await this.sendImmediateRefereeReward(referral.id, codeData.program.referee_rewards.immediate_reward);
      }

      return {
        success: true,
        referral_id: referral.id,
        fraud_score: fraudAnalysis.score,
        action_taken: actionTaken,
        message: this.getActionMessage(actionTaken),
      };
    } catch (error) {
      console.error('Failed to process referral:', error);
      throw error;
    }
  }

  /**
   * Complete referral when conversion happens
   */
  async completeReferral(
    referralId: string,
    conversionType: 'signup' | 'first_call' | 'first_payment' | 'custom',
    conversionValue?: number
  ): Promise<void> {
    try {
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select(`
          *,
          program:referral_programs(*),
          referrer:users(*)
        `)
        .eq('id', referralId)
        .single();

      if (referralError || !referral) {
        throw new Error('Referral not found');
      }

      if (referral.status !== 'pending_conversion') {
        throw new Error('Referral not eligible for completion');
      }

      // Calculate rewards based on program rules
      const referrerReward = this.calculateReferrerReward(referral.program, referral.referrer);
      const refereeReward = this.calculateRefereeReward(referral.program, conversionType);

      // Update referral status
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'completed',
          conversion_type: conversionType,
          conversion_value: conversionValue,
          referrer_reward: referrerReward,
          referee_reward: refereeReward,
          completed_at: new Date().toISOString(),
        })
        .eq('id', referralId);

      if (updateError) throw updateError;

      // Award points to referrer
      await this.awardPoints(
        referral.referrer_id,
        referral.workspace_id,
        'referral_completed',
        referrerReward,
        { referral_id: referralId, conversion_type: conversionType }
      );

      // Award points to referee if they exist as a user
      if (referral.referee_id) {
        await this.awardPoints(
          referral.referee_id,
          referral.workspace_id,
          'referral_signup',
          refereeReward,
          { referral_id: referralId }
        );
      }

      // Check for milestone achievements
      await this.checkReferralMilestones(referral.referrer_id, referral.workspace_id);
    } catch (error) {
      console.error('Failed to complete referral:', error);
      throw error;
    }
  }

  /**
   * Create and manage loyalty challenges
   */
  async createChallenge(
    workspaceId: string,
    challengeData: Omit<LoyaltyChallenge, 'id' | 'workspace_id' | 'created_at' | 'participants'>
  ): Promise<LoyaltyChallenge> {
    try {
      const { data, error } = await supabase
        .from('loyalty_challenges')
        .insert({
          workspace_id: workspaceId,
          ...challengeData,
          participants: [],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data as LoyaltyChallenge;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      throw error;
    }
  }

  /**
   * Join a loyalty challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      const { data: challenge, error: challengeError } = await supabase
        .from('loyalty_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError || !challenge) {
        throw new Error('Challenge not found');
      }

      // Check if user already joined
      const alreadyJoined = challenge.participants.some((p: any) => p.user_id === userId);
      if (alreadyJoined) {
        throw new Error('User already joined this challenge');
      }

      // Check participation limits
      if (challenge.max_participants && challenge.participants.length >= challenge.max_participants) {
        throw new Error('Challenge is full');
      }

      // Add user to participants
      const updatedParticipants = [
        ...challenge.participants,
        {
          user_id: userId,
          progress: 0,
          completed: false,
          joined_at: new Date().toISOString(),
        },
      ];

      const { error: updateError } = await supabase
        .from('loyalty_challenges')
        .update({ participants: updatedParticipants })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Deduct entry fee if applicable
      if (challenge.entry_fee_points && challenge.entry_fee_points > 0) {
        await this.deductPoints(
          userId,
          challenge.workspace_id,
          challenge.entry_fee_points,
          `Challenge entry fee: ${challenge.name}`
        );
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
      throw error;
    }
  }

  /**
   * Enhanced fraud analysis
   */
  private async performFraudAnalysis(
    referrerId: string,
    refereeData: any,
    metadata: any
  ): Promise<{ score: number; indicators: string[] }> {
    let score = 0;
    const indicators: string[] = [];

    try {
      // Check IP address patterns
      const { data: recentReferrals } = await supabase
        .from('referrals')
        .select('metadata')
        .eq('referrer_id', referrerId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentReferrals) {
        const sameIpCount = recentReferrals.filter(
          (r: any) => r.metadata?.ip_address === metadata.ip_address
        ).length;

        if (sameIpCount > 2) {
          score += 0.3;
          indicators.push('Multiple referrals from same IP');
        }
      }

      // Check user agent patterns
      const sameUserAgentCount = recentReferrals?.filter(
        (r: any) => r.metadata?.user_agent === metadata.user_agent
      ).length || 0;

      if (sameUserAgentCount > 1) {
        score += 0.2;
        indicators.push('Multiple referrals with same user agent');
      }

      // Check email patterns
      if (refereeData.email) {
        const emailDomain = refereeData.email.split('@')[1];
        
        // Check for temporary email services
        const tempEmailDomains = ['10minutemail.com', 'guerrillamail.com', 'tempmail.org'];
        if (tempEmailDomains.includes(emailDomain)) {
          score += 0.4;
          indicators.push('Temporary email domain');
        }

        // Check for similar email patterns
        const { data: existingUsers } = await supabase
          .from('users')
          .select('email')
          .ilike('email', `%${emailDomain}`);

        const domainCount = existingUsers?.length || 0;
        if (domainCount > 10) {
          score += 0.1;
          indicators.push('High usage from email domain');
        }
      }

      // Check referral velocity
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentReferralsByUser } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerId)
        .gte('created_at', last24Hours);

      const recentCount = recentReferralsByUser?.length || 0;
      if (recentCount > 5) {
        score += 0.3;
        indicators.push('High referral velocity');
      }

      // Device fingerprinting check
      if (metadata.device_fingerprint) {
        const { data: fingerprintMatches } = await supabase
          .from('referrals')
          .select('id')
          .eq('referrer_id', referrerId)
          .contains('metadata', { device_fingerprint: metadata.device_fingerprint });

        if (fingerprintMatches && fingerprintMatches.length > 1) {
          score += 0.4;
          indicators.push('Device fingerprint match');
        }
      }

      return { score: Math.min(score, 1), indicators };
    } catch (error) {
      console.error('Fraud analysis error:', error);
      return { score: 0, indicators: [] };
    }
  }

  /**
   * Helper methods
   */
  private async initializeUserLoyalty(userId: string, workspaceId: string): Promise<void> {
    const referralCode = await this.generateReferralCode();
    
    await supabase
      .from('user_loyalty')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        points_balance: 0,
        lifetime_points: 0,
        current_tier: 'Bronze',
        tier_progress: 0,
        referral_code: referralCode,
        badges_earned: [],
        achievements: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  private async generateReferralCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;

    do {
      const timestamp = Date.now().toString(36).slice(-4);
      const random = crypto.randomBytes(2).toString('hex').toUpperCase();
      code = `${timestamp}${random}`;

      const { data: existing } = await supabase
        .from('user_loyalty')
        .select('id')
        .eq('referral_code', code)
        .single();

      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    return code;
  }

  private calculateReferrerReward(program: any, referrer: any): number {
    // Implement reward calculation based on program rules and referrer tier
    const baseReward = program.referrer_rewards?.[0]?.amount || 100;
    const tierMultiplier = 1; // Calculate based on referrer tier
    return Math.round(baseReward * tierMultiplier);
  }

  private calculateRefereeReward(program: any, conversionType: string): number {
    // Implement referee reward calculation
    return program.referee_rewards?.immediate_reward?.amount || 50;
  }

  private getActionMessage(action: 'approved' | 'pending_review' | 'blocked'): string {
    switch (action) {
      case 'approved':
        return 'Referral approved and processed successfully';
      case 'pending_review':
        return 'Referral is pending manual review due to fraud indicators';
      case 'blocked':
        return 'Referral blocked due to high fraud score';
      default:
        return 'Referral processed';
    }
  }

  private async updateUserLoyaltyBalance(userId: string, workspaceId: string): Promise<void> {
    // Implementation for updating user loyalty balance
    // This would typically involve aggregating transaction points
  }

  private async checkAchievements(userId: string, workspaceId: string, action: string): Promise<void> {
    // Implementation for checking and awarding achievements
  }

  private async checkTierUpgrade(userId: string, workspaceId: string): Promise<void> {
    // Implementation for checking tier upgrades
  }

  private async checkReferralMilestones(userId: string, workspaceId: string): Promise<void> {
    // Implementation for checking referral milestones
  }

  private async sendImmediateRefereeReward(referralId: string, reward: any): Promise<void> {
    // Implementation for sending immediate rewards to referee
  }

  private async deductPoints(userId: string, workspaceId: string, points: number, reason: string): Promise<void> {
    // Implementation for deducting points
  }

  private async createDefaultAchievements(workspaceId: string, programId: string): Promise<void> {
    // Implementation for creating default achievements and badges
  }
}

// Export singleton instance
export const enhancedLoyaltyService = new EnhancedLoyaltyService();
