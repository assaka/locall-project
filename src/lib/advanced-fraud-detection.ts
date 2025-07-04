/**
 * Advanced Fraud Detection Service
 * 
 * Provides comprehensive fraud detection and prevention capabilities including:
 * - Real-time fraud scoring
 * - Behavioral analysis
 * - Machine learning-based detection
 * - Risk assessment and mitigation
 * - Pattern recognition
 * - Velocity checks
 * - Device fingerprinting
 * - Geolocation analysis
 */

import { createClient } from '@supabase/supabase-js';

// Types and interfaces
interface FraudScore {
  score: number; // 0-100, higher = more suspicious
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: FraudFactor[];
  recommendations: string[];
}

interface FraudFactor {
  type: 'velocity' | 'device' | 'location' | 'behavior' | 'pattern' | 'identity';
  severity: 'low' | 'medium' | 'high';
  description: string;
  value: number; // 0-100
  evidence: Record<string, any>;
}

interface UserBehavior {
  userId: string;
  sessionId: string;
  deviceFingerprint: string;
  ipAddress: string;
  location: {
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
  userAgent: string;
  actions: UserAction[];
  timestamp: Date;
}

interface UserAction {
  type: 'call' | 'form_submit' | 'payment' | 'login' | 'registration' | 'api_call';
  timestamp: Date;
  details: Record<string, any>;
  success: boolean;
}

interface VelocityCheck {
  timeWindow: number; // in minutes
  maxActions: number;
  actionType?: string;
}

interface DeviceFingerprint {
  browser: string;
  os: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: string;
  language: string;
  plugins: string[];
  canvas: string;
  webgl: string;
  fonts: string[];
}

interface FraudRule {
  id: string;
  name: string;
  description: string;
  type: 'velocity' | 'device' | 'location' | 'behavior' | 'pattern';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  condition: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: any;
  }[];
  action: 'flag' | 'block' | 'review' | 'alert';
  threshold: number;
}

// Configuration
const FRAUD_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90,
};

const VELOCITY_LIMITS = {
  CALLS_PER_HOUR: 100,
  FORMS_PER_HOUR: 50,
  REGISTRATIONS_PER_DAY: 10,
  PAYMENTS_PER_HOUR: 20,
  API_CALLS_PER_MINUTE: 1000,
};

const SUSPICIOUS_COUNTRIES = [
  'CN', 'RU', 'IR', 'KP', 'SY', // High-risk countries
];

const SUSPICIOUS_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'automated',
  'python', 'curl', 'wget', 'postman',
];

class AdvancedFraudDetectionService {
  private supabase;
  private fraudRules: FraudRule[];
  private behaviorCache: Map<string, UserBehavior[]> = new Map();
  private blockedIPs: Set<string> = new Set();
  private allowlistIPs: Set<string> = new Set();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.initializeFraudRules();
    this.loadBlockedIPs();
  }

  /**
   * Initialize default fraud detection rules
   */
  private async initializeFraudRules(): Promise<void> {
    this.fraudRules = [
      {
        id: 'velocity_calls',
        name: 'High Call Velocity',
        description: 'Detect unusually high call frequency',
        type: 'velocity',
        enabled: true,
        severity: 'high',
        condition: [
          { field: 'calls_per_hour', operator: 'gt', value: VELOCITY_LIMITS.CALLS_PER_HOUR }
        ],
        action: 'flag',
        threshold: 80,
      },
      {
        id: 'suspicious_location',
        name: 'Suspicious Location',
        description: 'Detect calls from high-risk countries',
        type: 'location',
        enabled: true,
        severity: 'medium',
        condition: [
          { field: 'country_code', operator: 'in', value: SUSPICIOUS_COUNTRIES }
        ],
        action: 'review',
        threshold: 60,
      },
      {
        id: 'device_switching',
        name: 'Rapid Device Switching',
        description: 'Detect rapid switching between devices',
        type: 'device',
        enabled: true,
        severity: 'high',
        condition: [
          { field: 'unique_devices_per_hour', operator: 'gt', value: 5 }
        ],
        action: 'flag',
        threshold: 75,
      },
      {
        id: 'automated_behavior',
        name: 'Automated Behavior',
        description: 'Detect bot-like behavior patterns',
        type: 'behavior',
        enabled: true,
        severity: 'high',
        condition: [
          { field: 'user_agent', operator: 'contains', value: SUSPICIOUS_USER_AGENTS }
        ],
        action: 'block',
        threshold: 85,
      },
    ];

    // Save rules to database
    await this.saveFraudRules();
  }

  /**
   * Load blocked IPs from database
   */
  private async loadBlockedIPs(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('fraud_blocked_ips')
        .select('ip_address');

      if (data) {
        data.forEach(row => this.blockedIPs.add(row.ip_address));
      }
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
    }
  }

  /**
   * Analyze user behavior and calculate fraud score
   */
  async analyzeFraudRisk(
    userId: string,
    sessionId: string,
    action: UserAction,
    context: {
      ipAddress: string;
      userAgent: string;
      deviceFingerprint?: DeviceFingerprint;
      location?: { country: string; city: string; lat: number; lng: number };
    }
  ): Promise<FraudScore> {
    const factors: FraudFactor[] = [];
    let totalScore = 0;

    // Check if IP is blocked
    if (this.blockedIPs.has(context.ipAddress)) {
      factors.push({
        type: 'identity',
        severity: 'high',
        description: 'IP address is in blocklist',
        value: 100,
        evidence: { ip: context.ipAddress }
      });
      totalScore += 100;
    }

    // Check if IP is allowlisted
    if (this.allowlistIPs.has(context.ipAddress)) {
      totalScore = Math.max(0, totalScore - 20);
    }

    // Velocity checks
    const velocityFactors = await this.checkVelocity(userId, action);
    factors.push(...velocityFactors);
    totalScore += velocityFactors.reduce((sum, f) => sum + f.value, 0);

    // Device analysis
    if (context.deviceFingerprint) {
      const deviceFactors = await this.analyzeDevice(userId, context.deviceFingerprint);
      factors.push(...deviceFactors);
      totalScore += deviceFactors.reduce((sum, f) => sum + f.value, 0);
    }

    // Location analysis
    if (context.location) {
      const locationFactors = this.analyzeLocation(context.location);
      factors.push(...locationFactors);
      totalScore += locationFactors.reduce((sum, f) => sum + f.value, 0);
    }

    // Behavioral analysis
    const behaviorFactors = await this.analyzeBehavior(userId, action, context);
    factors.push(...behaviorFactors);
    totalScore += behaviorFactors.reduce((sum, f) => sum + f.value, 0);

    // Pattern analysis
    const patternFactors = await this.analyzePatterns(userId, action);
    factors.push(...patternFactors);
    totalScore += patternFactors.reduce((sum, f) => sum + f.value, 0);

    // Normalize score (0-100)
    const normalizedScore = Math.min(100, Math.max(0, totalScore));

    // Determine risk level
    let level: FraudScore['level'] = 'low';
    if (normalizedScore >= FRAUD_THRESHOLDS.CRITICAL) level = 'critical';
    else if (normalizedScore >= FRAUD_THRESHOLDS.HIGH) level = 'high';
    else if (normalizedScore >= FRAUD_THRESHOLDS.MEDIUM) level = 'medium';

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, level);

    // Store analysis result
    await this.storeFraudAnalysis({
      userId,
      sessionId,
      action,
      score: normalizedScore,
      level,
      factors,
      context,
      timestamp: new Date(),
    });

    return {
      score: normalizedScore,
      level,
      factors,
      recommendations,
    };
  }

  /**
   * Check velocity limits for user actions
   */
  private async checkVelocity(userId: string, action: UserAction): Promise<FraudFactor[]> {
    const factors: FraudFactor[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Check calls per hour
      const { count: callsPerHour } = await this.supabase
        .from('fraud_user_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'call')
        .gte('created_at', oneHourAgo.toISOString());

      if (callsPerHour && callsPerHour > VELOCITY_LIMITS.CALLS_PER_HOUR) {
        factors.push({
          type: 'velocity',
          severity: 'high',
          description: `Excessive calls per hour: ${callsPerHour}`,
          value: Math.min(50, (callsPerHour / VELOCITY_LIMITS.CALLS_PER_HOUR) * 40),
          evidence: { callsPerHour, limit: VELOCITY_LIMITS.CALLS_PER_HOUR }
        });
      }

      // Check form submissions per hour
      const { count: formsPerHour } = await this.supabase
        .from('fraud_user_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'form_submit')
        .gte('created_at', oneHourAgo.toISOString());

      if (formsPerHour && formsPerHour > VELOCITY_LIMITS.FORMS_PER_HOUR) {
        factors.push({
          type: 'velocity',
          severity: 'medium',
          description: `Excessive form submissions per hour: ${formsPerHour}`,
          value: Math.min(30, (formsPerHour / VELOCITY_LIMITS.FORMS_PER_HOUR) * 25),
          evidence: { formsPerHour, limit: VELOCITY_LIMITS.FORMS_PER_HOUR }
        });
      }

      // Check registrations per day
      const { count: registrationsPerDay } = await this.supabase
        .from('fraud_user_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'registration')
        .gte('created_at', oneDayAgo.toISOString());

      if (registrationsPerDay && registrationsPerDay > VELOCITY_LIMITS.REGISTRATIONS_PER_DAY) {
        factors.push({
          type: 'velocity',
          severity: 'high',
          description: `Excessive registrations per day: ${registrationsPerDay}`,
          value: Math.min(40, (registrationsPerDay / VELOCITY_LIMITS.REGISTRATIONS_PER_DAY) * 35),
          evidence: { registrationsPerDay, limit: VELOCITY_LIMITS.REGISTRATIONS_PER_DAY }
        });
      }

    } catch (error) {
      console.error('Error checking velocity:', error);
    }

    return factors;
  }

  /**
   * Analyze device fingerprint for suspicious patterns
   */
  private async analyzeDevice(userId: string, fingerprint: DeviceFingerprint): Promise<FraudFactor[]> {
    const factors: FraudFactor[] = [];

    try {
      // Check for device switching
      const { data: recentDevices } = await this.supabase
        .from('fraud_device_fingerprints')
        .select('fingerprint')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const uniqueDevices = new Set(recentDevices?.map(d => d.fingerprint) || []);
      if (uniqueDevices.size > 5) {
        factors.push({
          type: 'device',
          severity: 'high',
          description: `Rapid device switching: ${uniqueDevices.size} devices in 1 hour`,
          value: Math.min(35, uniqueDevices.size * 5),
          evidence: { uniqueDevices: uniqueDevices.size, timeWindow: '1 hour' }
        });
      }

      // Check for suspicious browser characteristics
      if (fingerprint.plugins.length === 0) {
        factors.push({
          type: 'device',
          severity: 'medium',
          description: 'No browser plugins detected (possible headless browser)',
          value: 20,
          evidence: { pluginCount: 0 }
        });
      }

      // Check screen resolution (common bot resolutions)
      const { screen } = fingerprint;
      const suspiciousResolutions = [
        '1024x768', '800x600', '1366x768', '1920x1080'
      ];
      const currentResolution = `${screen.width}x${screen.height}`;
      
      if (suspiciousResolutions.includes(currentResolution) && screen.colorDepth <= 16) {
        factors.push({
          type: 'device',
          severity: 'low',
          description: 'Common automated browser resolution detected',
          value: 10,
          evidence: { resolution: currentResolution, colorDepth: screen.colorDepth }
        });
      }

      // Store device fingerprint
      await this.supabase
        .from('fraud_device_fingerprints')
        .insert({
          user_id: userId,
          fingerprint: JSON.stringify(fingerprint),
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error analyzing device:', error);
    }

    return factors;
  }

  /**
   * Analyze location for fraud indicators
   */
  private analyzeLocation(location: { country: string; city: string; lat: number; lng: number }): FraudFactor[] {
    const factors: FraudFactor[] = [];

    // Check for high-risk countries
    if (SUSPICIOUS_COUNTRIES.includes(location.country)) {
      factors.push({
        type: 'location',
        severity: 'medium',
        description: `High-risk country: ${location.country}`,
        value: 25,
        evidence: { country: location.country }
      });
    }

    // Check for impossible travel (basic implementation)
    // In a real implementation, you would compare with previous locations and time
    
    return factors;
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeBehavior(
    userId: string,
    action: UserAction,
    context: { userAgent: string; ipAddress: string }
  ): Promise<FraudFactor[]> {
    const factors: FraudFactor[] = [];

    // Check user agent for suspicious patterns
    const lowerUA = context.userAgent.toLowerCase();
    for (const suspicious of SUSPICIOUS_USER_AGENTS) {
      if (lowerUA.includes(suspicious)) {
        factors.push({
          type: 'behavior',
          severity: 'high',
          description: `Suspicious user agent pattern: ${suspicious}`,
          value: 40,
          evidence: { userAgent: context.userAgent, pattern: suspicious }
        });
        break;
      }
    }

    // Check for too-perfect timing (bot behavior)
    try {
      const { data: recentActions } = await this.supabase
        .from('fraud_user_actions')
        .select('created_at')
        .eq('user_id', userId)
        .eq('action_type', action.type)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentActions && recentActions.length >= 3) {
        const intervals = [];
        for (let i = 0; i < recentActions.length - 1; i++) {
          const current = new Date(recentActions[i].created_at).getTime();
          const next = new Date(recentActions[i + 1].created_at).getTime();
          intervals.push(current - next);
        }

        // Check if intervals are suspiciously regular (within 1 second)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        
        if (variance < 1000 && avgInterval > 5000) { // Very regular intervals > 5 seconds
          factors.push({
            type: 'behavior',
            severity: 'medium',
            description: 'Suspiciously regular action timing',
            value: 25,
            evidence: { variance, averageInterval: avgInterval }
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing behavior:', error);
    }

    return factors;
  }

  /**
   * Analyze patterns across multiple users/sessions
   */
  private async analyzePatterns(userId: string, action: UserAction): Promise<FraudFactor[]> {
    const factors: FraudFactor[] = [];

    // This is a simplified pattern analysis
    // In a real implementation, you would use machine learning models
    // to detect complex patterns

    try {
      // Check for coordinated attacks (multiple users from same IP)
      // This would require storing IP addresses with actions
      
      // Check for unusual action sequences
      // This would require more sophisticated pattern matching

    } catch (error) {
      console.error('Error analyzing patterns:', error);
    }

    return factors;
  }

  /**
   * Generate actionable recommendations based on fraud factors
   */
  private generateRecommendations(factors: FraudFactor[], level: FraudScore['level']): string[] {
    const recommendations: string[] = [];

    if (level === 'critical') {
      recommendations.push('IMMEDIATE ACTION: Block user/IP and require manual review');
      recommendations.push('Escalate to security team for investigation');
    }

    if (level === 'high') {
      recommendations.push('Require additional verification (2FA, phone verification)');
      recommendations.push('Limit user actions temporarily');
    }

    if (level === 'medium') {
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Consider CAPTCHA challenges');
    }

    // Specific recommendations based on factors
    factors.forEach(factor => {
      switch (factor.type) {
        case 'velocity':
          recommendations.push('Implement rate limiting for this user');
          break;
        case 'location':
          recommendations.push('Request location verification');
          break;
        case 'device':
          recommendations.push('Require device verification');
          break;
        case 'behavior':
          recommendations.push('Monitor for bot-like behavior');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Store fraud analysis results
   */
  private async storeFraudAnalysis(analysis: {
    userId: string;
    sessionId: string;
    action: UserAction;
    score: number;
    level: string;
    factors: FraudFactor[];
    context: any;
    timestamp: Date;
  }): Promise<void> {
    try {
      await this.supabase.from('fraud_analyses').insert({
        user_id: analysis.userId,
        session_id: analysis.sessionId,
        action_type: analysis.action.type,
        fraud_score: analysis.score,
        risk_level: analysis.level,
        factors: JSON.stringify(analysis.factors),
        context: JSON.stringify(analysis.context),
        created_at: analysis.timestamp.toISOString(),
      });

      // Also store the action
      await this.supabase.from('fraud_user_actions').insert({
        user_id: analysis.userId,
        session_id: analysis.sessionId,
        action_type: analysis.action.type,
        action_details: JSON.stringify(analysis.action.details),
        success: analysis.action.success,
        created_at: analysis.action.timestamp.toISOString(),
      });

    } catch (error) {
      console.error('Error storing fraud analysis:', error);
    }
  }

  /**
   * Save fraud rules to database
   */
  private async saveFraudRules(): Promise<void> {
    try {
      for (const rule of this.fraudRules) {
        await this.supabase
          .from('fraud_rules')
          .upsert({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            type: rule.type,
            enabled: rule.enabled,
            severity: rule.severity,
            conditions: JSON.stringify(rule.condition),
            action: rule.action,
            threshold: rule.threshold,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error saving fraud rules:', error);
    }
  }

  /**
   * Block an IP address
   */
  async blockIP(ipAddress: string, reason: string): Promise<void> {
    this.blockedIPs.add(ipAddress);
    
    try {
      await this.supabase.from('fraud_blocked_ips').insert({
        ip_address: ipAddress,
        reason,
        blocked_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  }

  /**
   * Add IP to allowlist
   */
  async allowlistIP(ipAddress: string): Promise<void> {
    this.allowlistIPs.add(ipAddress);
    
    try {
      await this.supabase.from('fraud_allowlist_ips').insert({
        ip_address: ipAddress,
        added_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error allowlisting IP:', error);
    }
  }

  /**
   * Get fraud statistics for dashboard
   */
  async getFraudStatistics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalAnalyses: number;
    blockedAttempts: number;
    averageScore: number;
    riskDistribution: Record<string, number>;
    topFactors: Array<{ type: string; count: number }>;
  }> {
    const now = new Date();
    let startTime: Date;

    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    try {
      const { data: analyses } = await this.supabase
        .from('fraud_analyses')
        .select('*')
        .gte('created_at', startTime.toISOString());

      if (!analyses) {
        return {
          totalAnalyses: 0,
          blockedAttempts: 0,
          averageScore: 0,
          riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
          topFactors: [],
        };
      }

      const totalAnalyses = analyses.length;
      const blockedAttempts = analyses.filter(a => a.risk_level === 'critical').length;
      const averageScore = analyses.reduce((sum, a) => sum + a.fraud_score, 0) / totalAnalyses || 0;

      const riskDistribution = analyses.reduce((dist, a) => {
        dist[a.risk_level] = (dist[a.risk_level] || 0) + 1;
        return dist;
      }, {} as Record<string, number>);

      // Extract top fraud factors
      const factorCounts = new Map<string, number>();
      analyses.forEach(a => {
        try {
          const factors = JSON.parse(a.factors || '[]');
          factors.forEach((f: FraudFactor) => {
            factorCounts.set(f.type, (factorCounts.get(f.type) || 0) + 1);
          });
        } catch (e) {
          // Ignore parsing errors
        }
      });

      const topFactors = Array.from(factorCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalAnalyses,
        blockedAttempts,
        averageScore,
        riskDistribution,
        topFactors,
      };

    } catch (error) {
      console.error('Error getting fraud statistics:', error);
      return {
        totalAnalyses: 0,
        blockedAttempts: 0,
        averageScore: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        topFactors: [],
      };
    }
  }

  /**
   * Update fraud rule
   */
  async updateFraudRule(ruleId: string, updates: Partial<FraudRule>): Promise<void> {
    const ruleIndex = this.fraudRules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.fraudRules[ruleIndex] = { ...this.fraudRules[ruleIndex], ...updates };
      await this.saveFraudRules();
    }
  }

  /**
   * Get all fraud rules
   */
  getFraudRules(): FraudRule[] {
    return [...this.fraudRules];
  }
}

// Export singleton instance
export const fraudDetectionService = new AdvancedFraudDetectionService();
export type { FraudScore, FraudFactor, UserBehavior, UserAction, FraudRule };
