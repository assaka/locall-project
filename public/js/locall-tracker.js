/**
 * Locall Webform Tracking Script
 * Embed this script on any website to track form submissions and user interactions
 * 
 * Usage:
 * <script src="https://your-domain.com/js/locall-tracker.js" data-workspace-id="your-workspace-id"></script>
 * 
 * Or initialize manually:
 * <script>
 *   window.LocallTracker.init({
 *     workspaceId: 'your-workspace-id',
 *     apiEndpoint: 'https://your-domain.com/api',
 *     enableHeatmaps: true,
 *     enableRecordings: false
 *   });
 * </script>
 */

(function(window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.LocallTracker) {
    console.warn('Locall Tracker already initialized');
    return;
  }

  // Default configuration
  const DEFAULT_CONFIG = {
    workspaceId: null,
    apiEndpoint: '/api',
    enableHeatmaps: false,
    enableRecordings: false,
    enableSpamProtection: true,
    trackUtmParams: true,
    trackReferrer: true,
    trackUserAgent: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    debug: false
  };

  // Global state
  let config = { ...DEFAULT_CONFIG };
  let sessionId = null;
  let visitorId = null;
  let pageStartTime = Date.now();
  let formInteractions = new Map();
  let utmParams = {};
  let isInitialized = false;

  /**
   * Main Tracker Class
   */
  class LocallTracker {
    constructor() {
      this.events = [];
      this.formSubmissions = [];
    }

    /**
     * Initialize the tracker
     */
    init(userConfig = {}) {
      if (isInitialized) {
        this.log('warn', 'Tracker already initialized');
        return;
      }

      // Merge configuration
      config = { ...config, ...userConfig };

      // Auto-detect workspace ID from script tag
      if (!config.workspaceId) {
        config.workspaceId = this.detectWorkspaceId();
      }

      if (!config.workspaceId) {
        console.error('Locall Tracker: workspaceId is required');
        return;
      }

      // Initialize session
      this.initSession();

      // Capture UTM parameters
      if (config.trackUtmParams) {
        this.captureUtmParams();
      }

      // Set up event listeners
      this.setupEventListeners();

      // Set up spam protection
      if (config.enableSpamProtection) {
        this.setupSpamProtection();
      }

      // Track page view
      this.trackPageView();

      isInitialized = true;
      this.log('info', 'Locall Tracker initialized', { config, sessionId, visitorId });
    }

    /**
     * Detect workspace ID from script tag
     */
    detectWorkspaceId() {
      const scripts = document.querySelectorAll('script[src*="locall-tracker"]');
      for (const script of scripts) {
        const workspaceId = script.getAttribute('data-workspace-id');
        if (workspaceId) return workspaceId;
      }
      return null;
    }

    /**
     * Initialize session and visitor tracking
     */
    initSession() {
      // Get or create visitor ID
      visitorId = this.getStoredValue('locall_visitor_id');
      if (!visitorId) {
        visitorId = this.generateId();
        this.setStoredValue('locall_visitor_id', visitorId, 365 * 24 * 60 * 60 * 1000); // 1 year
      }

      // Get or create session ID
      sessionId = this.getStoredValue('locall_session_id');
      const lastActivity = this.getStoredValue('locall_last_activity');
      const now = Date.now();

      if (!sessionId || !lastActivity || (now - parseInt(lastActivity)) > config.sessionTimeout) {
        sessionId = this.generateId();
        this.setStoredValue('locall_session_id', sessionId, config.sessionTimeout);
      }

      this.setStoredValue('locall_last_activity', now.toString(), config.sessionTimeout);
    }

    /**
     * Capture UTM parameters from URL
     */
    captureUtmParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      
      utmKeys.forEach(key => {
        const value = urlParams.get(key);
        if (value) {
          utmParams[key] = value;
          this.setStoredValue(`locall_${key}`, value, 30 * 24 * 60 * 60 * 1000); // 30 days
        } else {
          // Try to get from storage if not in URL
          const stored = this.getStoredValue(`locall_${key}`);
          if (stored) {
            utmParams[key] = stored;
          }
        }
      });
    }

    /**
     * Set up event listeners for form tracking
     */
    setupEventListeners() {
      // Track form submissions
      document.addEventListener('submit', (event) => {
        this.handleFormSubmission(event);
      });

      // Track form interactions
      document.addEventListener('focus', (event) => {
        if (event.target.matches('input, textarea, select')) {
          this.trackFormInteraction(event.target, 'focus');
        }
      }, true);

      document.addEventListener('blur', (event) => {
        if (event.target.matches('input, textarea, select')) {
          this.trackFormInteraction(event.target, 'blur');
        }
      }, true);

      document.addEventListener('change', (event) => {
        if (event.target.matches('input, textarea, select')) {
          this.trackFormInteraction(event.target, 'change');
        }
      });

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackPageView({ event_type: 'page_exit' });
      });

      // Track clicks on trackable elements
      document.addEventListener('click', (event) => {
        this.handleClickTracking(event);
      });
    }

    /**
     * Set up spam protection (honeypot fields)
     */
    setupSpamProtection() {
      // Add honeypot fields to all forms
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (!form.querySelector('.locall-honeypot')) {
          const honeypot = document.createElement('input');
          honeypot.type = 'text';
          honeypot.name = 'locall_honeypot_check';
          honeypot.className = 'locall-honeypot';
          honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;';
          honeypot.tabIndex = -1;
          honeypot.autocomplete = 'off';
          form.appendChild(honeypot);
        }
      });
    }

    /**
     * Handle form submissions
     */
    handleFormSubmission(event) {
      const form = event.target;
      const formData = new FormData(form);
      
      // Check honeypot for spam
      const honeypotValue = formData.get('locall_honeypot_check');
      if (config.enableSpamProtection && honeypotValue) {
        this.log('warn', 'Spam detected via honeypot');
        return; // Don't track spam submissions
      }

      // Extract form data
      const data = {};
      const sensitiveFields = ['password', 'credit_card', 'social_security', 'ssn'];
      
      for (const [key, value] of formData.entries()) {
        if (key === 'locall_honeypot_check') continue;
        
        // Don't capture sensitive data
        const isSensitive = sensitiveFields.some(field => 
          key.toLowerCase().includes(field) || 
          form.querySelector(`[name="${key}"]`)?.type === 'password'
        );
        
        if (!isSensitive) {
          data[key] = value;
        }
      }

      const submissionData = {
        form_id: form.id || this.generateFormId(form),
        form_action: form.action || window.location.href,
        form_method: form.method || 'GET',
        form_data: data,
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString(),
        ...this.getTrackingContext()
      };

      this.trackFormSubmission(submissionData);
    }

    /**
     * Track form field interactions
     */
    trackFormInteraction(element, eventType) {
      const formId = element.form?.id || this.generateFormId(element.form);
      const fieldKey = `${formId}_${element.name || element.id}`;
      
      if (!formInteractions.has(fieldKey)) {
        formInteractions.set(fieldKey, {
          form_id: formId,
          field_name: element.name || element.id,
          field_type: element.type,
          interactions: []
        });
      }

      const interaction = formInteractions.get(fieldKey);
      interaction.interactions.push({
        event_type: eventType,
        timestamp: Date.now(),
        value_length: element.value ? element.value.length : 0
      });
    }

    /**
     * Handle click tracking
     */
    handleClickTracking(event) {
      const element = event.target;
      
      // Track clicks on elements with data-locall-track attribute
      if (element.hasAttribute('data-locall-track')) {
        const trackingData = {
          element_type: element.tagName.toLowerCase(),
          element_text: element.textContent?.trim() || '',
          element_id: element.id || '',
          element_class: element.className || '',
          tracking_label: element.getAttribute('data-locall-track'),
          page_url: window.location.href,
          timestamp: new Date().toISOString(),
          ...this.getTrackingContext()
        };

        this.trackEvent('element_click', trackingData);
      }
    }

    /**
     * Track page views
     */
    trackPageView(additionalData = {}) {
      const pageData = {
        page_url: window.location.href,
        page_title: document.title,
        page_referrer: document.referrer,
        timestamp: new Date().toISOString(),
        time_on_page: Date.now() - pageStartTime,
        ...this.getTrackingContext(),
        ...additionalData
      };

      this.trackEvent('page_view', pageData);
    }

    /**
     * Track form submissions
     */
    trackFormSubmission(data) {
      this.sendToAPI('/webforms/submissions', data);
    }

    /**
     * Enhanced form tracking with spam detection
     */
    setupAdvancedFormTracking() {
      this.formTracker = new FormTracker(this);
    }

    /**
     * Track general events
     */
    trackEvent(eventType, data) {
      const eventData = {
        event_type: eventType,
        ...data,
        ...this.getTrackingContext()
      };

      this.sendToAPI('/analytics/events', eventData);
    }

    /**
     * Get common tracking context
     */
    getTrackingContext() {
      return {
        workspace_id: config.workspaceId,
        session_id: sessionId,
        visitor_id: visitorId,
        utm_params: utmParams,
        user_agent: config.trackUserAgent ? navigator.userAgent : null,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };
    }

    /**
     * Send data to API
     */
    async sendToAPI(endpoint, data) {
      try {
        const url = `${config.apiEndpoint}${endpoint}`;
        
        // Use fetch if available, otherwise fallback to XMLHttpRequest
        if (typeof fetch !== 'undefined') {
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
        } else {
          // Fallback for older browsers
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify(data));
        }

        this.log('info', 'Data sent to API', { endpoint, data });
      } catch (error) {
        this.log('error', 'Failed to send data to API', error);
        
        // Store in queue for retry
        this.queueData(endpoint, data);
      }
    }

    /**
     * Queue data for retry
     */
    queueData(endpoint, data) {
      try {
        const queue = JSON.parse(localStorage.getItem('locall_queue') || '[]');
        queue.push({ endpoint, data, timestamp: Date.now() });
        
        // Keep only last 50 items
        if (queue.length > 50) {
          queue.splice(0, queue.length - 50);
        }
        
        localStorage.setItem('locall_queue', JSON.stringify(queue));
      } catch (error) {
        this.log('error', 'Failed to queue data', error);
      }
    }

    /**
     * Process queued data
     */
    processQueue() {
      try {
        const queue = JSON.parse(localStorage.getItem('locall_queue') || '[]');
        const now = Date.now();
        
        // Remove items older than 24 hours
        const validItems = queue.filter(item => (now - item.timestamp) < 24 * 60 * 60 * 1000);
        
        validItems.forEach(item => {
          this.sendToAPI(item.endpoint, item.data);
        });
        
        localStorage.removeItem('locall_queue');
      } catch (error) {
        this.log('error', 'Failed to process queue', error);
      }
    }

    /**
     * Generate unique IDs
     */
    generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    /**
     * Generate form ID if not present
     */
    generateFormId(form) {
      if (!form) return 'unknown-form';
      
      // Try various methods to identify the form
      if (form.id) return form.id;
      if (form.name) return form.name;
      if (form.className) return form.className.replace(/\s+/g, '-');
      
      // Generate based on action or inputs
      const action = form.action;
      if (action) {
        const url = new URL(action, window.location.href);
        return url.pathname.replace(/[^a-zA-Z0-9]/g, '-');
      }
      
      // Fallback to position in document
      const forms = Array.from(document.forms);
      const index = forms.indexOf(form);
      return `form-${index}`;
    }

    /**
     * Storage helpers
     */
    getStoredValue(key) {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (parsed.expires && Date.now() > parsed.expires) {
          localStorage.removeItem(key);
          return null;
        }
        
        return parsed.value;
      } catch {
        return localStorage.getItem(key); // Fallback for non-JSON values
      }
    }

    setStoredValue(key, value, ttl = null) {
      try {
        const item = {
          value: value,
          expires: ttl ? Date.now() + ttl : null
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch {
        // Fallback if localStorage is not available
        try {
          localStorage.setItem(key, value);
        } catch {
          // Storage not available
        }
      }
    }

    /**
     * Logging helper
     */
    log(level, message, data = null) {
      if (config.debug) {
        console[level](`[Locall Tracker] ${message}`, data);
      }
    }

    /**
     * Public API methods
     */
    track(eventName, properties = {}) {
      this.trackEvent(eventName, properties);
    }

    identify(userId, traits = {}) {
      const identifyData = {
        user_id: userId,
        traits: traits,
        ...this.getTrackingContext()
      };
      
      this.sendToAPI('/analytics/identify', identifyData);
    }

    setConfig(newConfig) {
      config = { ...config, ...newConfig };
    }

    getConfig() {
      return { ...config };
    }

    getSessionInfo() {
      return {
        sessionId,
        visitorId,
        utmParams
      };
    }
  }

  // Create global instance
  window.LocallTracker = new LocallTracker();

  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.LocallTracker.init();
    });
  } else {
    // DOM is already ready
    setTimeout(() => {
      window.LocallTracker.init();
    }, 0);
  }

  // Process any queued data when page loads
  window.addEventListener('load', () => {
    if (window.LocallTracker) {
      window.LocallTracker.processQueue();
    }
  });

  /**
   * Enhanced Form Tracking Class
   */
  class FormTracker {
    constructor(tracker) {
      this.tracker = tracker;
      this.formInteractions = new Map();
      this.fieldStartTimes = new Map();
      this.spamScore = 0;
      this.init();
    }

    init() {
      this.attachFormListeners();
      this.attachFieldListeners();
      this.setupSpamDetection();
    }

    attachFormListeners() {
      document.addEventListener('submit', (event) => {
        if (event.target.tagName === 'FORM') {
          this.handleFormSubmit(event);
        }
      }, true);
    }

    attachFieldListeners() {
      // Monitor all form fields
      document.addEventListener('focus', (event) => {
        if (this.isFormField(event.target)) {
          this.handleFieldFocus(event.target);
        }
      }, true);

      document.addEventListener('blur', (event) => {
        if (this.isFormField(event.target)) {
          this.handleFieldBlur(event.target);
        }
      }, true);

      document.addEventListener('input', (event) => {
        if (this.isFormField(event.target)) {
          this.handleFieldInput(event.target);
        }
      }, true);
    }

    isFormField(element) {
      return element && (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT'
      );
    }

    handleFieldFocus(field) {
      const fieldKey = this.getFieldKey(field);
      this.fieldStartTimes.set(fieldKey, Date.now());
      
      this.tracker.trackEvent('field_focus', {
        field_name: field.name || field.id,
        field_type: field.type,
        form_id: this.getFormId(field),
        timestamp: new Date().toISOString()
      });
    }

    handleFieldBlur(field) {
      const fieldKey = this.getFieldKey(field);
      const startTime = this.fieldStartTimes.get(fieldKey);
      const timeSpent = startTime ? Date.now() - startTime : 0;

      this.tracker.trackEvent('field_blur', {
        field_name: field.name || field.id,
        field_type: field.type,
        form_id: this.getFormId(field),
        time_spent: timeSpent,
        value_length: field.value ? field.value.length : 0,
        timestamp: new Date().toISOString()
      });
    }

    handleFieldInput(field) {
      this.tracker.trackEvent('field_input', {
        field_name: field.name || field.id,
        field_type: field.type,
        form_id: this.getFormId(field),
        value_length: field.value ? field.value.length : 0,
        timestamp: new Date().toISOString()
      });

      // Update spam score based on input patterns
      this.updateSpamScore(field);
    }

    handleFormSubmit(event) {
      const form = event.target;
      const formData = this.extractFormData(form);
      const spamScore = this.calculateFinalSpamScore(formData);

      // Capture UTM parameters
      const utmData = this.tracker.getUTMParams();

      const submissionData = {
        form_id: this.getFormId(form),
        form_data: formData,
        utm_data: utmData,
        spam_score: spamScore,
        user_journey: this.tracker.getUserJourney ? this.tracker.getUserJourney() : [],
        page_url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      };

      // Block submission if high spam score
      if (spamScore > 80) {
        event.preventDefault();
        this.showSpamMessage();
        return false;
      }

      this.tracker.trackEvent('form_submit', submissionData);
      
      // Send to analytics endpoint
      this.tracker.sendToAPI('/webforms/submit', submissionData);
    }

    extractFormData(form) {
      const formData = {};
      const elements = form.elements;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.name && element.type !== 'submit') {
          if (element.type === 'checkbox' || element.type === 'radio') {
            if (element.checked) {
              formData[element.name] = element.value;
            }
          } else {
            formData[element.name] = element.value;
          }
        }
      }

      return formData;
    }

    setupSpamDetection() {
      // Monitor rapid form filling
      this.rapidFillThreshold = 1000; // ms
      this.keywordSpamList = [
        'bitcoin', 'crypto', 'investment', 'earn money', 'click here',
        'guaranteed', 'free money', 'viagra', 'casino', 'winner'
      ];
    }

    updateSpamScore(field) {
      const value = field.value.toLowerCase();
      
      // Check for spam keywords
      this.keywordSpamList.forEach(keyword => {
        if (value.includes(keyword)) {
          this.spamScore += 20;
        }
      });

      // Check for rapid filling
      const fieldKey = this.getFieldKey(field);
      const startTime = this.fieldStartTimes.get(fieldKey);
      if (startTime && Date.now() - startTime < this.rapidFillThreshold) {
        this.spamScore += 10;
      }

      // Check for suspicious patterns
      if (this.hasSuspiciousPattern(value)) {
        this.spamScore += 15;
      }
    }

    hasSuspiciousPattern(value) {
      // Multiple URLs
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urls = value.match(urlPattern);
      if (urls && urls.length > 2) return true;

      // Excessive repetition
      const words = value.split(/\s+/);
      const uniqueWords = new Set(words);
      if (words.length > 10 && uniqueWords.size / words.length < 0.3) return true;

      // All caps
      if (value.length > 20 && value === value.toUpperCase()) return true;

      return false;
    }

    calculateFinalSpamScore(formData) {
      let score = this.spamScore;

      // Check email domain
      const email = formData.email;
      if (email && this.isSuspiciousEmailDomain(email)) {
        score += 25;
      }

      // Check phone number pattern
      const phone = formData.phone;
      if (phone && this.isSuspiciousPhone(phone)) {
        score += 15;
      }

      return Math.min(score, 100);
    }

    isSuspiciousEmailDomain(email) {
      const suspiciousDomains = [
        'guerrillamail.com', '10minutemail.com', 'mailinator.com',
        'yopmail.com', 'tempmail.org', 'sharklasers.com'
      ];
      
      const domain = email.split('@')[1];
      return suspiciousDomains.includes(domain);
    }

    isSuspiciousPhone(phone) {
      // Check for obviously fake patterns
      const cleanPhone = phone.replace(/\D/g, '');
      
      // All same digits
      if (/^(\d)\1+$/.test(cleanPhone)) return true;
      
      // Sequential numbers
      if (cleanPhone === '1234567890' || cleanPhone === '0123456789') return true;
      
      return false;
    }

    showSpamMessage() {
      alert('Your submission appears to be spam and has been blocked. Please contact us directly if this is an error.');
    }

    getFormId(element) {
      const form = element.closest('form');
      return form ? (form.id || form.name || 'unnamed-form') : 'no-form';
    }

    getFieldKey(field) {
      return `${this.getFormId(field)}-${field.name || field.id}`;
    }
  }

  // Make FormTracker available globally
  window.FormTracker = FormTracker;

})(window, document);
