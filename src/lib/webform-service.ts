// lib/webform-service.ts
import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface WebformConfig {
  id: string;
  workspace_id: string;
  name: string;
  form_id: string;
  tracking_script_id: string;
  domains: string[];
  utm_tracking: boolean;
  user_journey_tracking: boolean;
  spam_protection: boolean;
  conversion_goals: ConversionGoal[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConversionGoal {
  name: string;
  type: 'form_submit' | 'page_view' | 'element_click' | 'time_on_page';
  trigger: string;
  value?: number;
}

export interface WebformSubmission {
  id: string;
  form_id: string;
  workspace_id: string;
  visitor_id: string;
  session_id: string;
  form_data: any;
  utm_data?: UTMData;
  user_journey?: UserJourneyStep[];
  spam_score: number;
  is_spam: boolean;
  ip_address: string;
  user_agent: string;
  referrer?: string;
  conversion_value?: number;
  created_at: Date;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface UserJourneyStep {
  timestamp: Date;
  event_type: 'page_view' | 'click' | 'form_interaction' | 'scroll' | 'time_milestone';
  page_url: string;
  element?: string;
  duration?: number;
  metadata?: any;
}

export interface WebformAnalytics {
  total_submissions: number;
  valid_submissions: number;
  spam_submissions: number;
  conversion_rate: number;
  top_sources: Array<{ source: string; count: number; conversion_rate: number }>;
  top_pages: Array<{ page: string; submissions: number; avg_time: number }>;
  user_journey_insights: {
    avg_pages_before_conversion: number;
    avg_time_to_conversion: number;
    common_paths: Array<{ path: string[]; count: number }>;
  };
}

export class WebformService {
  
  // Create webform tracking configuration
  static async createWebformConfig(data: Partial<WebformConfig>): Promise<WebformConfig> {
    const trackingScriptId = this.generateTrackingScriptId();
    
    const { data: config, error } = await supabaseAdmin
      .from('webform_configs')
      .insert({
        ...data,
        tracking_script_id: trackingScriptId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return config;
  }

  // Update webform configuration
  static async updateWebformConfig(id: string, data: Partial<WebformConfig>): Promise<WebformConfig> {
    const { data: config, error } = await supabaseAdmin
      .from('webform_configs')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return config;
  }

  // Get webform configurations for workspace
  static async getWebformConfigs(workspaceId: string): Promise<WebformConfig[]> {
    const { data, error } = await supabaseAdmin
      .from('webform_configs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getWebforms(workspaceId: string): Promise<WebformConfig[]> {
    const { data, error } = await supabaseAdmin
      .from('webform_configs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createWebform(workspaceId: string, name: string, config?: any): Promise<WebformConfig> {
    const formId = `form_${crypto.randomBytes(8).toString('hex')}`;
    const trackingId = `track_${crypto.randomBytes(8).toString('hex')}`;

    const webformData = {
      workspace_id: workspaceId,
      name,
      form_id: formId,
      tracking_script_id: trackingId,
      domains: [],
      utm_tracking: true,
      user_journey_tracking: true,
      spam_protection: true,
      conversion_goals: [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...config
    };

    const { data, error } = await supabaseAdmin
      .from('webform_configs')
      .insert(webformData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Generate tracking script
  static generateTrackingScript(trackingScriptId: string, config: WebformConfig): string {
    return `
(function() {
  var trackingId = '${trackingScriptId}';
  var config = ${JSON.stringify({
    utm_tracking: config.utm_tracking,
    user_journey_tracking: config.user_journey_tracking,
    spam_protection: config.spam_protection,
    conversion_goals: config.conversion_goals
  })};
  
  var API_BASE = '${process.env.NEXT_PUBLIC_APP_URL}/api/webforms';
  var visitorId = localStorage.getItem('locall_visitor_id') || generateVisitorId();
  var sessionId = sessionStorage.getItem('locall_session_id') || generateSessionId();
  var userJourney = [];
  
  // Store IDs
  localStorage.setItem('locall_visitor_id', visitorId);
  sessionStorage.setItem('locall_session_id', sessionId);
  
  // Generate unique IDs
  function generateVisitorId() {
    return 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
  
  function generateSessionId() {
    return 's_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
  
  // Extract UTM parameters
  function getUTMData() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    };
  }
  
  // Track user journey step
  function trackJourneyStep(eventType, data) {
    if (!config.user_journey_tracking) return;
    
    var step = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      page_url: window.location.href,
      ...data
    };
    
    userJourney.push(step);
    
    // Limit journey steps to prevent memory issues
    if (userJourney.length > 100) {
      userJourney = userJourney.slice(-50);
    }
  }
  
  // Track page view
  function trackPageView() {
    trackJourneyStep('page_view', {
      referrer: document.referrer,
      title: document.title
    });
  }
  
  // Track form interactions
  function trackFormInteraction(form, eventType) {
    var formId = form.id || form.className || 'unknown';
    trackJourneyStep('form_interaction', {
      element: formId,
      event_type: eventType
    });
  }
  
  // Calculate spam score
  function calculateSpamScore(formData) {
    var score = 0;
    
    // Check for suspicious patterns
    var text = JSON.stringify(formData).toLowerCase();
    
    // Suspicious keywords
    var spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'million'];
    spamKeywords.forEach(function(keyword) {
      if (text.includes(keyword)) score += 20;
    });
    
    // Multiple URLs
    var urlCount = (text.match(/https?:\\/\\//g) || []).length;
    if (urlCount > 2) score += 30;
    
    // All caps text
    var capsCount = (text.match(/[A-Z]/g) || []).length;
    var totalChars = text.replace(/[^a-zA-Z]/g, '').length;
    if (totalChars > 0 && (capsCount / totalChars) > 0.5) score += 25;
    
    // Very short submission time (likely bot)
    var timeOnPage = Date.now() - window.locallStartTime;
    if (timeOnPage < 3000) score += 40;
    
    return Math.min(score, 100);
  }
  
  // Submit form data
  function submitFormData(form, formData) {
    var utmData = config.utm_tracking ? getUTMData() : null;
    var spamScore = config.spam_protection ? calculateSpamScore(formData) : 0;
    
    var payload = {
      tracking_id: trackingId,
      visitor_id: visitorId,
      session_id: sessionId,
      form_data: formData,
      utm_data: utmData,
      user_journey: config.user_journey_tracking ? userJourney : null,
      spam_score: spamScore,
      url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    };
    
    // Send data to API
    fetch(API_BASE + '/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(function(error) {
      console.error('Locall tracking error:', error);
    });
  }
  
  // Process conversion goals
  function checkConversionGoals(eventType, data) {
    config.conversion_goals.forEach(function(goal) {
      if (goal.type === eventType) {
        var match = false;
        
        switch (eventType) {
          case 'form_submit':
            match = true; // All form submits count
            break;
          case 'page_view':
            match = window.location.href.includes(goal.trigger);
            break;
          case 'element_click':
            match = data.element && data.element.includes(goal.trigger);
            break;
        }
        
        if (match) {
          fetch(API_BASE + '/conversion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tracking_id: trackingId,
              visitor_id: visitorId,
              session_id: sessionId,
              goal_name: goal.name,
              goal_value: goal.value || 0,
              trigger_data: data
            })
          }).catch(function(error) {
            console.error('Locall conversion tracking error:', error);
          });
        }
      }
    });
  }
  
  // Initialize tracking
  window.locallStartTime = Date.now();
  
  // Track initial page view
  trackPageView();
  checkConversionGoals('page_view', { url: window.location.href });
  
  // Track form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form.tagName === 'FORM') {
      var formData = {};
      var formElements = form.elements;
      
      for (var i = 0; i < formElements.length; i++) {
        var element = formElements[i];
        if (element.name && element.value) {
          formData[element.name] = element.value;
        }
      }
      
      trackFormInteraction(form, 'submit');
      submitFormData(form, formData);
      checkConversionGoals('form_submit', { form_data: formData });
    }
  });
  
  // Track form focus events
  document.addEventListener('focus', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      var form = e.target.closest('form');
      if (form) {
        trackFormInteraction(form, 'focus');
      }
    }
  }, true);
  
  // Track clicks
  document.addEventListener('click', function(e) {
    trackJourneyStep('click', {
      element: e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.className ? '.' + e.target.className.split(' ')[0] : ''),
      text: e.target.textContent ? e.target.textContent.substr(0, 50) : ''
    });
    
    checkConversionGoals('element_click', {
      element: e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.className ? '.' + e.target.className : '')
    });
  });
  
  // Track scroll depth
  var maxScroll = 0;
  window.addEventListener('scroll', function() {
    var scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
      if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
        trackJourneyStep('scroll', { depth: maxScroll });
      }
    }
  });
  
  // Track time milestones
  var timeTracked = [30, 60, 120, 300]; // 30s, 1m, 2m, 5m
  timeTracked.forEach(function(seconds) {
    setTimeout(function() {
      trackJourneyStep('time_milestone', { seconds: seconds });
    }, seconds * 1000);
  });
  
  // Expose API for manual tracking
  window.locallTracker = {
    trackEvent: function(eventType, data) {
      trackJourneyStep(eventType, data);
    },
    trackConversion: function(goalName, value) {
      fetch(API_BASE + '/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tracking_id: trackingId,
          visitor_id: visitorId,
          session_id: sessionId,
          goal_name: goalName,
          goal_value: value || 0,
          manual: true
        })
      });
    }
  };
})();`;
  }

  // Process form submission
  static async processSubmission(data: {
    tracking_id: string;
    visitor_id: string;
    session_id: string;
    form_data: any;
    utm_data?: UTMData;
    user_journey?: UserJourneyStep[];
    spam_score: number;
    url: string;
    referrer?: string;
    user_agent: string;
    ip_address: string;
  }): Promise<WebformSubmission> {
    // Get form config by tracking ID
    const { data: config } = await supabaseAdmin
      .from('webform_configs')
      .select('*')
      .eq('tracking_script_id', data.tracking_id)
      .eq('is_active', true)
      .single();

    if (!config) {
      throw new Error('Invalid tracking ID or inactive form');
    }

    // Determine if submission is spam
    const isSpam = config.spam_protection && data.spam_score > 70;

    const { data: submission, error } = await supabaseAdmin
      .from('webform_submissions')
      .insert({
        form_id: config.form_id,
        workspace_id: config.workspace_id,
        visitor_id: data.visitor_id,
        session_id: data.session_id,
        form_data: data.form_data,
        utm_data: data.utm_data,
        user_journey: data.user_journey,
        spam_score: data.spam_score,
        is_spam: isSpam,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        referrer: data.referrer,
        page_url: data.url,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // If not spam, trigger any integrations or notifications
    if (!isSpam) {
      await this.triggerIntegrations(config, submission);
    }

    return submission;
  }

  // Process conversion event
  static async processConversion(data: {
    tracking_id: string;
    visitor_id: string;
    session_id: string;
    goal_name: string;
    goal_value: number;
    trigger_data?: any;
    manual?: boolean;
  }): Promise<void> {
    const { data: config } = await supabaseAdmin
      .from('webform_configs')
      .select('*')
      .eq('tracking_script_id', data.tracking_id)
      .single();

    if (!config) return;

    await supabaseAdmin
      .from('webform_conversions')
      .insert({
        workspace_id: config.workspace_id,
        form_id: config.form_id,
        visitor_id: data.visitor_id,
        session_id: data.session_id,
        goal_name: data.goal_name,
        goal_value: data.goal_value,
        trigger_data: data.trigger_data,
        is_manual: data.manual || false,
        created_at: new Date().toISOString()
      });
  }

  // Get webform analytics
  static async getAnalytics(
    workspaceId: string,
    formId?: string,
    timeRange: string = '30d'
  ): Promise<WebformAnalytics> {
    const startDate = this.getStartDate(timeRange);
    
    let submissionsQuery = supabaseAdmin
      .from('webform_submissions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    if (formId) {
      submissionsQuery = submissionsQuery.eq('form_id', formId);
    }

    const { data: submissions } = await submissionsQuery;

    const totalSubmissions = submissions?.length || 0;
    const validSubmissions = submissions?.filter(s => !s.is_spam).length || 0;
    const spamSubmissions = totalSubmissions - validSubmissions;

    // Calculate top sources
    const sourceMap: Record<string, { count: number; valid: number }> = {};
    submissions?.forEach(sub => {
      const source = sub.utm_data?.utm_source || 'direct';
      if (!sourceMap[source]) {
        sourceMap[source] = { count: 0, valid: 0 };
      }
      sourceMap[source].count++;
      if (!sub.is_spam) sourceMap[source].valid++;
    });

    const topSources = Object.entries(sourceMap)
      .map(([source, stats]) => ({
        source,
        count: stats.count,
        conversion_rate: stats.count > 0 ? (stats.valid / stats.count * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top pages
    const pageMap: Record<string, { submissions: number; totalTime: number; count: number }> = {};
    submissions?.forEach(sub => {
      const page = sub.page_url || 'unknown';
      if (!pageMap[page]) {
        pageMap[page] = { submissions: 0, totalTime: 0, count: 0 };
      }
      pageMap[page].submissions++;
      
      // Calculate time on page from user journey
      if (sub.user_journey && sub.user_journey.length > 0) {
        const firstStep = new Date(sub.user_journey[0].timestamp);
        const lastStep = new Date(sub.user_journey[sub.user_journey.length - 1].timestamp);
        const timeOnPage = (lastStep.getTime() - firstStep.getTime()) / 1000;
        pageMap[page].totalTime += timeOnPage;
        pageMap[page].count++;
      }
    });

    const topPages = Object.entries(pageMap)
      .map(([page, stats]) => ({
        page,
        submissions: stats.submissions,
        avg_time: stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0
      }))
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 10);

    // User journey insights
    const journeys = submissions?.filter(s => s.user_journey && !s.is_spam) || [];
    const avgPagesBeforeConversion = journeys.length > 0 
      ? journeys.reduce((sum, j) => sum + (j.user_journey?.filter(step => step.event_type === 'page_view').length || 0), 0) / journeys.length
      : 0;

    const avgTimeToConversion = journeys.length > 0
      ? journeys.reduce((sum, j) => {
          if (!j.user_journey || j.user_journey.length === 0) return sum;
          const first = new Date(j.user_journey[0].timestamp);
          const last = new Date(j.user_journey[j.user_journey.length - 1].timestamp);
          return sum + ((last.getTime() - first.getTime()) / 1000);
        }, 0) / journeys.length
      : 0;

    return {
      total_submissions: totalSubmissions,
      valid_submissions: validSubmissions,
      spam_submissions: spamSubmissions,
      conversion_rate: totalSubmissions > 0 ? (validSubmissions / totalSubmissions * 100) : 0,
      top_sources: topSources,
      top_pages: topPages,
      user_journey_insights: {
        avg_pages_before_conversion: Math.round(avgPagesBeforeConversion * 10) / 10,
        avg_time_to_conversion: Math.round(avgTimeToConversion),
        common_paths: [] // Would require more complex analysis
      }
    };
  }

  // Trigger integrations when form is submitted
  private static async triggerIntegrations(config: WebformConfig, submission: WebformSubmission): Promise<void> {
    try {
      // Send to connected CRM systems
      const { data: connections } = await supabaseAdmin
        .from('oauth_connections')
        .select('*')
        .eq('workspace_id', config.workspace_id)
        .eq('status', 'active');

      for (const connection of connections || []) {
        switch (connection.provider) {
          case 'hubspot':
            await this.sendToHubSpot(connection, submission);
            break;
          case 'salesforce':
            await this.sendToSalesforce(connection, submission);
            break;
        }
      }

      // Send email notifications if configured
      // await this.sendEmailNotification(config, submission);

    } catch (error) {
      console.error('Error triggering integrations:', error);
    }
  }

  private static async sendToHubSpot(connection: any, submission: WebformSubmission): Promise<void> {
    try {
      const contactData = {
        properties: {
          email: submission.form_data.email,
          firstname: submission.form_data.first_name || submission.form_data.name,
          lastname: submission.form_data.last_name,
          phone: submission.form_data.phone,
          company: submission.form_data.company,
          website: submission.form_data.website,
          hs_lead_status: 'NEW',
          lifecyclestage: 'lead'
        }
      };

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error sending to HubSpot:', error);
    }
  }

  private static async sendToSalesforce(connection: any, submission: WebformSubmission): Promise<void> {
    // Implementation would depend on Salesforce API integration
    console.log('Salesforce integration not implemented yet');
  }

  private static generateTrackingScriptId(): string {
    return 'wf_' + crypto.randomBytes(8).toString('hex');
  }

  private static getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
