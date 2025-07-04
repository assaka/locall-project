import { supabase } from '../app/utils/supabaseClient';

export interface WebformSubmission {
  id: string;
  form_id: string;
  visitor_id: string;
  workspace_id: string;
  data: Record<string, any>;
  utm_data?: Record<string, any>;
  page_url?: string;
  referrer?: string;
  ip_address?: string;
  user_agent?: string;
  fraud_score: number;
  spam_indicators: string[];
  status: 'pending' | 'verified' | 'spam' | 'processed';
  created_at: string;
  processed_at?: string;
  processed_by?: string;
}

export interface WebformConfig {
  id: string;
  workspace_id: string;
  name: string;
  form_selector: string;
  fields: Record<string, any>;
  spam_protection: {
    enabled: boolean;
    honeypot: boolean;
    rate_limit: number;
    captcha: boolean;
  };
  notifications: {
    email: string[];
    webhook_url?: string;
    slack_webhook?: string;
  };
  tracking_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormAnalytics {
  total_submissions: number;
  verified_submissions: number;
  spam_submissions: number;
  conversion_rate: number;
  avg_completion_time: number;
  top_sources: Array<{ source: string; count: number }>;
  submissions_by_day: Array<{ date: string; count: number }>;
  field_completion_rates: Record<string, number>;
}

export class WebformSubmissionService {

  // Get submissions for a workspace
  static async getSubmissions(workspaceId: string, filters?: {
    form_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ submissions: WebformSubmission[]; total: number }> {
    try {
      let query = supabase
        .from('webform_submissions')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId);

      if (filters?.form_id) {
        query = query.eq('form_id', filters.form_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      query = query.order('created_at', { ascending: false });

      if (filters?.limit) {
        query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        submissions: data || [],
        total: count || 0
      };

    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  }

  // Create a new submission
  static async createSubmission(submissionData: {
    form_id: string;
    visitor_id: string;
    workspace_id: string;
    data: Record<string, any>;
    utm_data?: Record<string, any>;
    page_url?: string;
    referrer?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<WebformSubmission> {
    try {
      // Analyze for spam
      const spamAnalysis = await this.analyzeSpam(submissionData);
      
      const { data, error } = await supabase
        .from('webform_submissions')
        .insert({
          ...submissionData,
          fraud_score: spamAnalysis.fraud_score,
          spam_indicators: spamAnalysis.indicators,
          status: spamAnalysis.fraud_score > 0.7 ? 'spam' : 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Process notifications if not spam
      if (data.status !== 'spam') {
        await this.sendNotifications(data);
      }

      // Update form analytics
      await this.updateFormAnalytics(submissionData.form_id, data);

      return data;

    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  // Update submission status
  static async updateSubmissionStatus(
    submissionId: string, 
    status: WebformSubmission['status'],
    processedBy?: string
  ): Promise<WebformSubmission> {
    try {
      const updateData: any = {
        status,
        processed_at: new Date().toISOString()
      };

      if (processedBy) {
        updateData.processed_by = processedBy;
      }

      const { data, error } = await supabase
        .from('webform_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error updating submission status:', error);
      throw error;
    }
  }

  // Get form analytics
  static async getFormAnalytics(workspaceId: string, formId?: string, days: number = 30): Promise<FormAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let baseQuery = supabase
        .from('webform_submissions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString());

      if (formId) {
        baseQuery = baseQuery.eq('form_id', formId);
      }

      const { data: submissions, error } = await baseQuery;

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        return {
          total_submissions: 0,
          verified_submissions: 0,
          spam_submissions: 0,
          conversion_rate: 0,
          avg_completion_time: 0,
          top_sources: [],
          submissions_by_day: [],
          field_completion_rates: {}
        };
      }

      // Calculate analytics
      const total_submissions = submissions.length;
      const verified_submissions = submissions.filter(s => s.status === 'verified').length;
      const spam_submissions = submissions.filter(s => s.status === 'spam').length;
      const conversion_rate = (verified_submissions / total_submissions) * 100;

      // Top sources from UTM data
      const sources = submissions
        .filter(s => s.utm_data?.source)
        .reduce((acc, s) => {
          const source = s.utm_data.source;
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const top_sources = Object.entries(sources)
        .map(([source, count]) => ({ source, count: count as number }))
        .sort((a, b) => (b.count as number) - (a.count as number))
        .slice(0, 10);

      // Submissions by day
      const submissionsByDay = submissions.reduce((acc, s) => {
        const date = new Date(s.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const submissions_by_day = Object.entries(submissionsByDay)
        .map(([date, count]) => ({ date, count: count as number }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Field completion rates
      const field_completion_rates = this.calculateFieldCompletionRates(submissions);

      return {
        total_submissions,
        verified_submissions,
        spam_submissions,
        conversion_rate,
        avg_completion_time: 0, // TODO: Implement if tracking completion time
        top_sources,
        submissions_by_day,
        field_completion_rates
      };

    } catch (error) {
      console.error('Error getting form analytics:', error);
      throw error;
    }
  }

  // Get webform configurations
  static async getWebformConfigs(workspaceId: string): Promise<WebformConfig[]> {
    try {
      const { data, error } = await supabase
        .from('webform_configs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error fetching webform configs:', error);
      throw error;
    }
  }

  // Create webform configuration
  static async createWebformConfig(config: Omit<WebformConfig, 'id' | 'created_at' | 'updated_at'>): Promise<WebformConfig> {
    try {
      const { data, error } = await supabase
        .from('webform_configs')
        .insert(config)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error creating webform config:', error);
      throw error;
    }
  }

  // Update webform configuration
  static async updateWebformConfig(configId: string, updates: Partial<WebformConfig>): Promise<WebformConfig> {
    try {
      const { data, error } = await supabase
        .from('webform_configs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId)
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error updating webform config:', error);
      throw error;
    }
  }

  // Delete webform configuration
  static async deleteWebformConfig(configId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('webform_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

    } catch (error) {
      console.error('Error deleting webform config:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async analyzeSpam(submissionData: any): Promise<{
    fraud_score: number;
    indicators: string[];
  }> {
    const indicators: string[] = [];
    let fraud_score = 0;

    // Check for common spam patterns
    const data = submissionData.data;
    
    // Email validation
    if (data.email) {
      const email = data.email.toLowerCase();
      
      // Disposable email domains
      const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      if (disposableDomains.some(domain => email.includes(domain))) {
        indicators.push('disposable_email');
        fraud_score += 0.4;
      }

      // Suspicious patterns
      if (email.includes('+test') || email.includes('+spam')) {
        indicators.push('test_email');
        fraud_score += 0.3;
      }
    }

    // Name validation
    if (data.name) {
      const name = data.name.toLowerCase();
      
      // Common spam names
      const spamNames = ['test', 'spam', 'admin', 'fake'];
      if (spamNames.some(spam => name.includes(spam))) {
        indicators.push('suspicious_name');
        fraud_score += 0.2;
      }

      // All caps or numbers
      if (data.name === data.name.toUpperCase() || /\d{3,}/.test(data.name)) {
        indicators.push('suspicious_name_format');
        fraud_score += 0.2;
      }
    }

    // Message content analysis
    if (data.message) {
      const message = data.message.toLowerCase();
      
      // Spam keywords
      const spamKeywords = ['buy now', 'click here', 'free money', 'viagra', 'casino'];
      if (spamKeywords.some(keyword => message.includes(keyword))) {
        indicators.push('spam_keywords');
        fraud_score += 0.5;
      }

      // Too many links
      const linkCount = (message.match(/http/g) || []).length;
      if (linkCount > 2) {
        indicators.push('too_many_links');
        fraud_score += 0.3;
      }
    }

    // Check submission timing (too fast)
    if (submissionData.completion_time && submissionData.completion_time < 3) {
      indicators.push('too_fast_submission');
      fraud_score += 0.3;
    }

    // Rate limiting check
    if (submissionData.ip_address) {
      const recent = await this.checkRecentSubmissions(submissionData.ip_address);
      if (recent > 5) {
        indicators.push('rate_limit_exceeded');
        fraud_score += 0.6;
      }
    }

    return {
      fraud_score: Math.min(1, fraud_score),
      indicators
    };
  }

  private static async checkRecentSubmissions(ipAddress: string): Promise<number> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { count, error } = await supabase
        .from('webform_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) throw error;

      return count || 0;

    } catch (error) {
      console.error('Error checking recent submissions:', error);
      return 0;
    }
  }

  private static async sendNotifications(submission: WebformSubmission): Promise<void> {
    try {
      // Get form configuration for notifications
      const { data: config } = await supabase
        .from('webform_configs')
        .select('notifications')
        .eq('id', submission.form_id)
        .single();

      if (!config?.notifications) return;

      // TODO: Implement actual notifications
      // - Email notifications via Brevo
      // - Webhook notifications
      // - Slack notifications

    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't throw as this shouldn't break the main flow
    }
  }

  private static async updateFormAnalytics(formId: string, submission: WebformSubmission): Promise<void> {
    try {
      // Update or create form analytics record
      // This could be a separate table for aggregated stats
      // For now, we'll rely on real-time calculations

    } catch (error) {
      console.error('Error updating form analytics:', error);
      // Don't throw as this shouldn't break the main flow
    }
  }

  private static calculateFieldCompletionRates(submissions: WebformSubmission[]): Record<string, number> {
    const fieldStats: Record<string, { total: number; completed: number }> = {};

    submissions.forEach(submission => {
      Object.entries(submission.data).forEach(([field, value]) => {
        if (!fieldStats[field]) {
          fieldStats[field] = { total: 0, completed: 0 };
        }
        fieldStats[field].total++;
        if (value && value !== '') {
          fieldStats[field].completed++;
        }
      });
    });

    const completionRates: Record<string, number> = {};
    Object.entries(fieldStats).forEach(([field, stats]) => {
      completionRates[field] = (stats.completed / stats.total) * 100;
    });

    return completionRates;
  }
}
