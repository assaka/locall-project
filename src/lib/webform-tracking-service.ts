// lib/webform-tracking-service.ts
import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface WebformEvent {
  id: string;
  form_id: string;
  visitor_id: string;
  session_id: string;
  event_type: 'page_view' | 'form_view' | 'field_focus' | 'field_blur' | 'field_change' | 'form_submit' | 'form_abandon';
  field_name?: string;
  field_value?: string;
  timestamp: string;
  page_url: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  user_agent: string;
  ip_address: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  metadata?: Record<string, any>;
}

export interface UserJourney {
  visitor_id: string;
  session_id: string;
  first_visit: string;
  last_visit: string;
  total_sessions: number;
  page_views: number;
  form_views: number;
  form_submits: number;
  time_on_site: number;
  bounce_rate: number;
  conversion_rate: number;
  attribution: {
    first_touch: {
      source?: string;
      medium?: string;
      campaign?: string;
      referrer?: string;
    };
    last_touch: {
      source?: string;
      medium?: string;
      campaign?: string;
      referrer?: string;
    };
  };
  journey_path: string[];
}

export interface SpamDetectionResult {
  is_spam: boolean;
  confidence: number;
  reasons: string[];
  risk_factors: {
    suspicious_patterns: boolean;
    known_bad_ip: boolean;
    bot_behavior: boolean;
    duplicate_submission: boolean;
    velocity_abuse: boolean;
  };
}

export interface FormAnalytics {
  form_id: string;
  total_views: number;
  total_submissions: number;
  conversion_rate: number;
  average_completion_time: number;
  abandonment_rate: number;
  field_analytics: {
    field_name: string;
    focus_rate: number;
    completion_rate: number;
    average_time_spent: number;
    error_rate: number;
  }[];
  traffic_sources: {
    source: string;
    views: number;
    conversions: number;
    conversion_rate: number;
  }[];
  device_breakdown: {
    device_type: string;
    views: number;
    conversions: number;
    conversion_rate: number;
  }[];
  geographic_data: {
    country: string;
    views: number;
    conversions: number;
  }[];
}

export class WebformTrackingService {
  private static readonly SPAM_KEYWORDS = [
    'bitcoin', 'crypto', 'investment', 'profit', 'earn money', 'work from home',
    'click here', 'guaranteed', 'free money', 'limited time', 'act now',
    'viagra', 'casino', 'loan', 'debt', 'winner', 'congratulations'
  ];

  private static readonly SUSPICIOUS_DOMAINS = [
    'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'yopmail.com',
    'tempmail.org', 'sharklasers.com', 'guerrillamailblock.com'
  ];

  static async generateTrackingScript(formId: string, userId: string): Promise<string> {
    try {
      // Generate unique tracking token
      const trackingToken = crypto.randomBytes(32).toString('hex');
      
      // Store tracking configuration
      await supabaseAdmin
        .from('webform_tracking_configs')
        .upsert({
          form_id: formId,
          user_id: userId,
          tracking_token: trackingToken,
          is_active: true,
          created_at: new Date().toISOString()
        });

      // Generate the tracking script
      const script = `
(function() {
  // Locall Form Tracking Script v2.0
  const FORM_ID = '${formId}';
  const TRACKING_TOKEN = '${trackingToken}';
  const API_BASE = '${process.env.NEXT_PUBLIC_APP_URL || 'https://app.locall.ai'}/api';
  
  let visitorId = null;
  let sessionId = null;
  let pageLoadTime = Date.now();
  let formViewLogged = false;
  let fieldInteractions = {};
  let formStartTime = null;

  // Generate or retrieve visitor ID
  function getOrCreateVisitorId() {
    let stored = localStorage.getItem('locall_visitor_id');
    if (!stored) {
      stored = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('locall_visitor_id', stored);
    }
    return stored;
  }

  // Generate session ID
  function generateSessionId() {
    return 's_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Get device information
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\\sce|palm|smartphone|iemobile/i.test(ua)) {
      deviceType = 'mobile';
    }

    let browser = 'unknown';
    if (ua.indexOf('Chrome') > -1) browser = 'chrome';
    else if (ua.indexOf('Firefox') > -1) browser = 'firefox';
    else if (ua.indexOf('Safari') > -1) browser = 'safari';
    else if (ua.indexOf('Edge') > -1) browser = 'edge';
    else if (ua.indexOf('Opera') > -1) browser = 'opera';

    let os = 'unknown';
    if (ua.indexOf('Windows') > -1) os = 'windows';
    else if (ua.indexOf('Mac') > -1) os = 'macos';
    else if (ua.indexOf('Linux') > -1) os = 'linux';
    else if (ua.indexOf('Android') > -1) os = 'android';
    else if (ua.indexOf('iOS') > -1) os = 'ios';

    return { deviceType, browser, os };
  }

  // Extract UTM parameters
  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    };
  }

  // Send tracking event
  async function trackEvent(eventData) {
    try {
      const deviceInfo = getDeviceInfo();
      const utmParams = getUtmParams();
      
      const payload = {
        form_id: FORM_ID,
        tracking_token: TRACKING_TOKEN,
        visitor_id: visitorId,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        ...deviceInfo,
        ...utmParams,
        ...eventData
      };

      await fetch(API_BASE + '/webform-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Locall tracking error:', error);
    }
  }

  // Initialize tracking
  function initTracking() {
    visitorId = getOrCreateVisitorId();
    sessionId = generateSessionId();

    // Track page view
    trackEvent({
      event_type: 'page_view'
    });

    // Find and track forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => setupFormTracking(form));

    // Setup mutation observer for dynamically added forms
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
            forms.forEach(form => setupFormTracking(form));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Setup form tracking
  function setupFormTracking(form) {
    if (form.dataset.locallTracked) return;
    form.dataset.locallTracked = 'true';

    // Track form view when it becomes visible
    const formObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !formViewLogged) {
          formViewLogged = true;
          formStartTime = Date.now();
          trackEvent({
            event_type: 'form_view'
          });
        }
      });
    });
    formObserver.observe(form);

    // Track field interactions
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      const fieldName = field.name || field.id || field.type;
      
      field.addEventListener('focus', () => {
        fieldInteractions[fieldName] = {
          ...fieldInteractions[fieldName],
          focusTime: Date.now()
        };
        
        trackEvent({
          event_type: 'field_focus',
          field_name: fieldName
        });
      });

      field.addEventListener('blur', () => {
        const interaction = fieldInteractions[fieldName];
        if (interaction && interaction.focusTime) {
          interaction.timeSpent = Date.now() - interaction.focusTime;
        }
        
        trackEvent({
          event_type: 'field_blur',
          field_name: fieldName,
          field_value: field.type === 'password' ? '[HIDDEN]' : field.value?.substring(0, 100)
        });
      });

      field.addEventListener('change', () => {
        trackEvent({
          event_type: 'field_change',
          field_name: fieldName,
          field_value: field.type === 'password' ? '[HIDDEN]' : field.value?.substring(0, 100)
        });
      });
    });

    // Track form submission
    form.addEventListener('submit', (e) => {
      const completionTime = formStartTime ? Date.now() - formStartTime : null;
      
      trackEvent({
        event_type: 'form_submit',
        metadata: {
          completion_time: completionTime,
          field_interactions: fieldInteractions
        }
      });
    });

    // Track form abandonment (when user leaves page)
    window.addEventListener('beforeunload', () => {
      if (formViewLogged && formStartTime) {
        trackEvent({
          event_type: 'form_abandon',
          metadata: {
            time_on_form: Date.now() - formStartTime,
            field_interactions: fieldInteractions
          }
        });
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }

  // Expose global tracking function for manual events
  window.locallTrack = function(eventType, data) {
    trackEvent({
      event_type: eventType,
      ...data
    });
  };
})();`;

      return script;
    } catch (error) {
      console.error('Error generating tracking script:', error);
      throw error;
    }
  }

  static async processTrackingEvent(eventData: Partial<WebformEvent>): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate tracking token
      const { data: config } = await supabaseAdmin
        .from('webform_tracking_configs')
        .select('*')
        .eq('form_id', eventData.form_id)
        .eq('tracking_token', eventData.metadata?.tracking_token)
        .eq('is_active', true)
        .single();

      if (!config) {
        return { success: false, error: 'Invalid tracking configuration' };
      }

      // Spam detection for form submissions
      if (eventData.event_type === 'form_submit') {
        const spamCheck = await this.detectSpam(eventData);
        if (spamCheck.is_spam && spamCheck.confidence > 0.8) {
          console.log('Spam submission blocked:', spamCheck.reasons);
          return { success: false, error: 'Submission blocked' };
        }
      }

      // Store the event
      const { error } = await supabaseAdmin
        .from('webform_events')
        .insert({
          form_id: eventData.form_id,
          visitor_id: eventData.visitor_id,
          session_id: eventData.session_id,
          event_type: eventData.event_type,
          field_name: eventData.field_name,
          field_value: eventData.field_value,
          timestamp: eventData.timestamp || new Date().toISOString(),
          page_url: eventData.page_url,
          referrer: eventData.referrer,
          utm_source: eventData.utm_source,
          utm_medium: eventData.utm_medium,
          utm_campaign: eventData.utm_campaign,
          utm_term: eventData.utm_term,
          utm_content: eventData.utm_content,
          user_agent: eventData.user_agent,
          ip_address: eventData.ip_address,
          device_type: eventData.device_type,
          browser: eventData.browser,
          os: eventData.os,
          location: eventData.location,
          metadata: eventData.metadata
        });

      if (error) throw error;

      // Update user journey
      await this.updateUserJourney(eventData);

      return { success: true };
    } catch (error) {
      console.error('Error processing tracking event:', error);
      return { success: false, error: 'Failed to process event' };
    }
  }

  static async detectSpam(eventData: Partial<WebformEvent>): Promise<SpamDetectionResult> {
    let confidence = 0;
    const reasons: string[] = [];
    const riskFactors = {
      suspicious_patterns: false,
      known_bad_ip: false,
      bot_behavior: false,
      duplicate_submission: false,
      velocity_abuse: false
    };

    try {
      // Check for spam keywords in form data
      const formText = JSON.stringify(eventData.metadata || {}).toLowerCase();
      const spamKeywordMatches = this.SPAM_KEYWORDS.filter(keyword => 
        formText.includes(keyword)
      );
      
      if (spamKeywordMatches.length > 0) {
        confidence += 0.3;
        reasons.push(`Contains spam keywords: ${spamKeywordMatches.join(', ')}`);
        riskFactors.suspicious_patterns = true;
      }

      // Check for suspicious email domains
      const emailField = eventData.metadata?.fields?.find((f: any) => 
        f.type === 'email' || f.name?.includes('email')
      );
      
      if (emailField) {
        const domain = emailField.value?.split('@')[1]?.toLowerCase();
        if (domain && this.SUSPICIOUS_DOMAINS.includes(domain)) {
          confidence += 0.4;
          reasons.push('Temporary/disposable email domain');
          riskFactors.suspicious_patterns = true;
        }
      }

      // Check for bot behavior (too fast completion)
      const completionTime = eventData.metadata?.completion_time;
      if (completionTime && completionTime < 3000) { // Less than 3 seconds
        confidence += 0.5;
        reasons.push('Suspiciously fast form completion');
        riskFactors.bot_behavior = true;
      }

      // Check for duplicate submissions
      const { data: recentSubmissions } = await supabaseAdmin
        .from('webform_events')
        .select('id')
        .eq('event_type', 'form_submit')
        .eq('ip_address', eventData.ip_address)
        .eq('form_id', eventData.form_id)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      if (recentSubmissions && recentSubmissions.length > 2) {
        confidence += 0.6;
        reasons.push('Multiple submissions from same IP');
        riskFactors.duplicate_submission = true;
      }

      // Check submission velocity from same visitor
      const { data: visitorSubmissions } = await supabaseAdmin
        .from('webform_events')
        .select('id')
        .eq('event_type', 'form_submit')
        .eq('visitor_id', eventData.visitor_id)
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

      if (visitorSubmissions && visitorSubmissions.length > 5) {
        confidence += 0.7;
        reasons.push('High submission velocity from visitor');
        riskFactors.velocity_abuse = true;
      }

      // Check for known bad IPs (could integrate with external service)
      // For now, just basic checks
      if (eventData.ip_address?.startsWith('10.') || 
          eventData.ip_address?.startsWith('192.168.') ||
          eventData.ip_address?.startsWith('127.')) {
        confidence += 0.2;
        reasons.push('Private/local IP address');
        riskFactors.known_bad_ip = true;
      }

      return {
        is_spam: confidence > 0.5,
        confidence: Math.min(confidence, 1.0),
        reasons,
        risk_factors: riskFactors
      };
    } catch (error) {
      console.error('Error in spam detection:', error);
      return {
        is_spam: false,
        confidence: 0,
        reasons: ['Spam detection error'],
        risk_factors: riskFactors
      };
    }
  }

  static async updateUserJourney(eventData: Partial<WebformEvent>): Promise<void> {
    try {
      if (!eventData.visitor_id) return;

      // Get or create user journey
      const { data: existingJourney } = await supabaseAdmin
        .from('user_journeys')
        .select('*')
        .eq('visitor_id', eventData.visitor_id)
        .single();

      const now = new Date().toISOString();
      
      if (existingJourney) {
        // Update existing journey
        const updatedJourney: any = {
          last_visit: now,
          total_sessions: existingJourney.session_id !== eventData.session_id ? 
            existingJourney.total_sessions + 1 : existingJourney.total_sessions,
          page_views: eventData.event_type === 'page_view' ? 
            existingJourney.page_views + 1 : existingJourney.page_views,
          form_views: eventData.event_type === 'form_view' ? 
            existingJourney.form_views + 1 : existingJourney.form_views,
          form_submits: eventData.event_type === 'form_submit' ? 
            existingJourney.form_submits + 1 : existingJourney.form_submits
        };

        // Update last touch attribution
        if (eventData.utm_source || eventData.referrer) {
          updatedJourney.attribution = {
            ...existingJourney.attribution,
            last_touch: {
              source: eventData.utm_source,
              medium: eventData.utm_medium,
              campaign: eventData.utm_campaign,
              referrer: eventData.referrer
            }
          };
        }

        // Update journey path
        if (eventData.page_url && 
            !existingJourney.journey_path.includes(eventData.page_url)) {
          updatedJourney.journey_path = [
            ...existingJourney.journey_path,
            eventData.page_url
          ].slice(-50); // Keep last 50 pages
        }

        await supabaseAdmin
          .from('user_journeys')
          .update(updatedJourney)
          .eq('visitor_id', eventData.visitor_id);
      } else {
        // Create new journey
        const newJourney = {
          visitor_id: eventData.visitor_id,
          session_id: eventData.session_id,
          first_visit: now,
          last_visit: now,
          total_sessions: 1,
          page_views: eventData.event_type === 'page_view' ? 1 : 0,
          form_views: eventData.event_type === 'form_view' ? 1 : 0,
          form_submits: eventData.event_type === 'form_submit' ? 1 : 0,
          time_on_site: 0,
          bounce_rate: 0,
          conversion_rate: 0,
          attribution: {
            first_touch: {
              source: eventData.utm_source,
              medium: eventData.utm_medium,
              campaign: eventData.utm_campaign,
              referrer: eventData.referrer
            },
            last_touch: {
              source: eventData.utm_source,
              medium: eventData.utm_medium,
              campaign: eventData.utm_campaign,
              referrer: eventData.referrer
            }
          },
          journey_path: eventData.page_url ? [eventData.page_url] : []
        };

        await supabaseAdmin
          .from('user_journeys')
          .insert(newJourney);
      }
    } catch (error) {
      console.error('Error updating user journey:', error);
    }
  }

  static async getFormAnalytics(
    formId: string,
    dateRange: { start: string; end: string }
  ): Promise<FormAnalytics> {
    try {
      // Get all events for the form in date range
      const { data: events } = await supabaseAdmin
        .from('webform_events')
        .select('*')
        .eq('form_id', formId)
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end);

      if (!events) {
        throw new Error('Failed to fetch form events');
      }

      // Calculate basic metrics
      const formViews = events.filter((e: any) => e.event_type === 'form_view');
      const formSubmissions = events.filter((e: any) => e.event_type === 'form_submit');
      const total_views = formViews.length;
      const total_submissions = formSubmissions.length;
      const conversion_rate = total_views > 0 ? (total_submissions / total_views) * 100 : 0;

      // Calculate average completion time
      const completionTimes = formSubmissions
        .map((s: any) => s.metadata?.completion_time)
        .filter((t: any) => t && typeof t === 'number');
      const average_completion_time = completionTimes.length > 0 ? 
        completionTimes.reduce((sum: number, time: number) => sum + time, 0) / completionTimes.length : 0;

      // Calculate abandonment rate
      const formAbandons = events.filter((e: any) => e.event_type === 'form_abandon');
      const abandonment_rate = total_views > 0 ? (formAbandons.length / total_views) * 100 : 0;

      // Field analytics
      const fieldEvents = events.filter((e: any) => 
        ['field_focus', 'field_blur', 'field_change'].includes(e.event_type)
      );
      
      const fieldStats: Record<string, any> = {};
      fieldEvents.forEach((event: any) => {
        if (!event.field_name) return;
        
        if (!fieldStats[event.field_name]) {
          fieldStats[event.field_name] = {
            focuses: 0,
            blurs: 0,
            changes: 0,
            times: []
          };
        }
        
        if (event.event_type === 'field_focus') fieldStats[event.field_name].focuses++;
        if (event.event_type === 'field_blur') fieldStats[event.field_name].blurs++;
        if (event.event_type === 'field_change') fieldStats[event.field_name].changes++;
      });

      const field_analytics = Object.entries(fieldStats).map(([fieldName, stats]: [string, any]) => ({
        field_name: fieldName,
        focus_rate: total_views > 0 ? (stats.focuses / total_views) * 100 : 0,
        completion_rate: stats.focuses > 0 ? (stats.changes / stats.focuses) * 100 : 0,
        average_time_spent: stats.times.length > 0 ? 
          stats.times.reduce((sum: number, time: number) => sum + time, 0) / stats.times.length : 0,
        error_rate: 0 // Would need additional tracking for validation errors
      }));

      // Traffic sources
      const sourceStats: Record<string, { views: number; conversions: number }> = {};
      events.forEach((event: any) => {
        const source = event.utm_source || 'direct';
        if (!sourceStats[source]) {
          sourceStats[source] = { views: 0, conversions: 0 };
        }
        
        if (event.event_type === 'form_view') sourceStats[source].views++;
        if (event.event_type === 'form_submit') sourceStats[source].conversions++;
      });

      const traffic_sources = Object.entries(sourceStats).map(([source, stats]) => ({
        source,
        views: stats.views,
        conversions: stats.conversions,
        conversion_rate: stats.views > 0 ? (stats.conversions / stats.views) * 100 : 0
      }));

      // Device breakdown
      const deviceStats: Record<string, { views: number; conversions: number }> = {};
      events.forEach((event: any) => {
        const device = event.device_type || 'unknown';
        if (!deviceStats[device]) {
          deviceStats[device] = { views: 0, conversions: 0 };
        }
        
        if (event.event_type === 'form_view') deviceStats[device].views++;
        if (event.event_type === 'form_submit') deviceStats[device].conversions++;
      });

      const device_breakdown = Object.entries(deviceStats).map(([device_type, stats]) => ({
        device_type,
        views: stats.views,
        conversions: stats.conversions,
        conversion_rate: stats.views > 0 ? (stats.conversions / stats.views) * 100 : 0
      }));

      // Geographic data
      const geoStats: Record<string, { views: number; conversions: number }> = {};
      events.forEach((event: any) => {
        const country = event.location?.country || 'Unknown';
        if (!geoStats[country]) {
          geoStats[country] = { views: 0, conversions: 0 };
        }
        
        if (event.event_type === 'form_view') geoStats[country].views++;
        if (event.event_type === 'form_submit') geoStats[country].conversions++;
      });

      const geographic_data = Object.entries(geoStats).map(([country, stats]) => ({
        country,
        views: stats.views,
        conversions: stats.conversions
      }));

      return {
        form_id: formId,
        total_views,
        total_submissions,
        conversion_rate,
        average_completion_time,
        abandonment_rate,
        field_analytics,
        traffic_sources,
        device_breakdown,
        geographic_data
      };
    } catch (error) {
      console.error('Error getting form analytics:', error);
      throw error;
    }
  }

  static async getUserJourney(visitorId: string): Promise<UserJourney | null> {
    try {
      const { data: journey } = await supabaseAdmin
        .from('user_journeys')
        .select('*')
        .eq('visitor_id', visitorId)
        .single();

      return journey;
    } catch (error) {
      console.error('Error getting user journey:', error);
      return null;
    }
  }

  static async getRealtimeMetrics(formId: string): Promise<{
    active_visitors: number;
    todays_views: number;
    todays_submissions: number;
    conversion_rate_today: number;
    recent_submissions: any[];
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // Active visitors (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentEvents } = await supabaseAdmin
        .from('webform_events')
        .select('visitor_id')
        .eq('form_id', formId)
        .gte('timestamp', fiveMinutesAgo);

      const active_visitors = new Set(recentEvents?.map((e: any) => e.visitor_id) || []).size;

      // Today's metrics
      const { data: todayEvents } = await supabaseAdmin
        .from('webform_events')
        .select('event_type, timestamp, metadata')
        .eq('form_id', formId)
        .gte('timestamp', todayStart);

      const todays_views = todayEvents?.filter((e: any) => e.event_type === 'form_view').length || 0;
      const todays_submissions = todayEvents?.filter((e: any) => e.event_type === 'form_submit').length || 0;
      const conversion_rate_today = todays_views > 0 ? (todays_submissions / todays_views) * 100 : 0;

      // Recent submissions
      const recent_submissions = todayEvents
        ?.filter((e: any) => e.event_type === 'form_submit')
        .slice(-10) // Last 10 submissions
        .map((e: any) => ({
          timestamp: e.timestamp,
          metadata: e.metadata
        })) || [];

      return {
        active_visitors,
        todays_views,
        todays_submissions,
        conversion_rate_today,
        recent_submissions
      };
    } catch (error) {
      console.error('Error getting realtime metrics:', error);
      return {
        active_visitors: 0,
        todays_views: 0,
        todays_submissions: 0,
        conversion_rate_today: 0,
        recent_submissions: []
      };
    }
  }
}
