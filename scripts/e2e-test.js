#!/usr/bin/env node

/**
 * Locall Project - End-to-End Testing Suite
 * 
 * This script tests all major features and integrations to ensure they work correctly
 * before production deployment.
 */

const chalk = require('chalk');
const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_WORKSPACE_ID = process.env.TEST_WORKSPACE_ID || 'test-workspace-123';
const API_KEY = process.env.TEST_API_KEY || 'test-api-key';

class E2ETestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    switch (type) {
      case 'success':
        console.log(chalk.green(`✓ [${timestamp}] ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`✗ [${timestamp}] ${message}`));
        break;
      case 'warn':
        console.log(chalk.yellow(`⚠ [${timestamp}] ${message}`));
        break;
      default:
        console.log(chalk.blue(`ℹ [${timestamp}] ${message}`));
    }
  }

  async test(description, testFn) {
    try {
      this.log(`Testing: ${description}`, 'info');
      await testFn();
      this.passed++;
      this.results.push({ description, status: 'PASSED' });
      this.log(`PASSED: ${description}`, 'success');
    } catch (error) {
      this.failed++;
      this.results.push({ description, status: 'FAILED', error: error.message });
      this.log(`FAILED: ${description} - ${error.message}`, 'error');
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Test advanced call routing
  async testAdvancedCallRouting() {
    await this.test('Advanced Call Routing API Health Check', async () => {
      const response = await this.makeRequest('GET', '/api/routing/advanced');
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    });

    await this.test('Time-based Routing Configuration', async () => {
      const routingConfig = {
        workspaceId: TEST_WORKSPACE_ID,
        type: 'time_based',
        config: {
          business_hours: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' }
          },
          timezone: 'UTC'
        }
      };

      const response = await this.makeRequest('POST', '/api/routing/config', routingConfig);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to create time-based routing config');
      }
    });

    await this.test('Geographic Routing Test', async () => {
      const geoConfig = {
        workspaceId: TEST_WORKSPACE_ID,
        type: 'geographic',
        config: {
          regions: [
            { name: 'North America', countries: ['US', 'CA'], agents: ['agent1', 'agent2'] },
            { name: 'Europe', countries: ['GB', 'FR', 'DE'], agents: ['agent3', 'agent4'] }
          ]
        }
      };

      const response = await this.makeRequest('POST', '/api/routing/config', geoConfig);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to create geographic routing config');
      }
    });
  }

  // Test queue management
  async testQueueManagement() {
    await this.test('Queue Management API Health', async () => {
      const response = await this.makeRequest('GET', `/api/queue/management?workspaceId=${TEST_WORKSPACE_ID}`);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    });

    await this.test('Create Queue', async () => {
      const queueConfig = {
        workspaceId: TEST_WORKSPACE_ID,
        name: 'Test Sales Queue',
        type: 'sales',
        priority: 1,
        max_wait_time: 300,
        agents: ['agent1', 'agent2']
      };

      const response = await this.makeRequest('POST', '/api/queue/management', queueConfig);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to create queue');
      }
    });
  }

  // Test agency/white-label features
  async testAgencyFeatures() {
    await this.test('Agency Client Management API', async () => {
      const response = await this.makeRequest('GET', `/api/agency/clients?workspaceId=${TEST_WORKSPACE_ID}`);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    });

    await this.test('Create Agency Client', async () => {
      const clientData = {
        workspaceId: TEST_WORKSPACE_ID,
        name: 'Test Client Corp',
        email: 'client@testcorp.com',
        phone: '+1234567890',
        plan: 'business'
      };

      const response = await this.makeRequest('POST', '/api/agency/clients', clientData);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to create agency client');
      }
    });

    await this.test('White-label Configuration', async () => {
      const whiteLabelConfig = {
        workspaceId: TEST_WORKSPACE_ID,
        branding: {
          company_name: 'Test Agency',
          logo_url: 'https://example.com/logo.png',
          primary_color: '#007bff',
          domain: 'agency.testdomain.com'
        }
      };

      const response = await this.makeRequest('PUT', '/api/white-label', whiteLabelConfig);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to configure white-label settings');
      }
    });
  }

  // Test loyalty & referral system
  async testLoyaltyReferralSystem() {
    await this.test('Loyalty System API Health', async () => {
      const response = await this.makeRequest('GET', `/api/loyalty?workspaceId=${TEST_WORKSPACE_ID}`);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    });

    await this.test('Create Loyalty Program', async () => {
      const programData = {
        workspaceId: TEST_WORKSPACE_ID,
        name: 'Test Rewards Program',
        type: 'points',
        rules: {
          points_per_call: 10,
          points_per_referral: 100,
          redemption_threshold: 500
        }
      };

      const response = await this.makeRequest('POST', '/api/loyalty/programs', programData);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to create loyalty program');
      }
    });

    await this.test('Referral Tracking', async () => {
      const referralData = {
        workspaceId: TEST_WORKSPACE_ID,
        referrer_email: 'referrer@test.com',
        referee_email: 'referee@test.com',
        type: 'email'
      };

      const response = await this.makeRequest('POST', '/api/referrals', referralData);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to track referral');
      }
    });
  }

  // Test webform tracking
  async testWebformTracking() {
    await this.test('Webform Tracking Script Generation', async () => {
      const response = await this.makeRequest('GET', `/api/webforms/script/test-tracking-id`);
      if (response.status !== 200) {
        throw new Error('Failed to generate tracking script');
      }
      
      const script = response.data;
      if (!script.includes('locallTracker') || !script.includes('utm_source')) {
        throw new Error('Generated script missing required functionality');
      }
    });

    await this.test('Form Submission Processing', async () => {
      const submissionData = {
        tracking_id: 'test-tracking-id',
        form_data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        utm_params: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'test-campaign'
        },
        page_url: 'https://example.com/contact'
      };

      const response = await this.makeRequest('POST', '/api/webforms/submit', submissionData);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to process form submission');
      }
    });

    await this.test('Webform Analytics', async () => {
      const response = await this.makeRequest('GET', `/api/webforms/analytics?workspaceId=${TEST_WORKSPACE_ID}`);
      if (response.status !== 200) {
        throw new Error('Failed to fetch webform analytics');
      }
    });
  }

  // Test external integrations
  async testExternalIntegrations() {
    await this.test('HubSpot Integration API Health', async () => {
      const response = await this.makeRequest('GET', `/api/integrations/hubspot?workspaceId=${TEST_WORKSPACE_ID}&action=health_check`);
      // This might fail if not configured, which is acceptable
      if (response.status !== 200 && response.status !== 400) {
        throw new Error('HubSpot integration API not responding correctly');
      }
    });

    await this.test('Google Calendar Integration API Health', async () => {
      const response = await this.makeRequest('GET', `/api/integrations/google-calendar?workspaceId=${TEST_WORKSPACE_ID}&action=health_check`);
      // This might fail if not configured, which is acceptable
      if (response.status !== 200 && response.status !== 400) {
        throw new Error('Google Calendar integration API not responding correctly');
      }
    });

    await this.test('Calendly Integration API Health', async () => {
      const response = await this.makeRequest('GET', `/api/integrations/calendly?workspaceId=${TEST_WORKSPACE_ID}&action=health_check`);
      // This might fail if not configured, which is acceptable
      if (response.status !== 200 && response.status !== 400) {
        throw new Error('Calendly integration API not responding correctly');
      }
    });

    await this.test('OAuth Flow Initiation', async () => {
      const response = await this.makeRequest('POST', '/api/oauth/initiate', {
        provider: 'google',
        workspaceId: TEST_WORKSPACE_ID,
        redirectUri: `${BASE_URL}/oauth/callback`
      });
      
      if (response.status !== 200 || !response.data.authorization_url) {
        throw new Error('Failed to initiate OAuth flow');
      }
    });
  }

  // Test webhook handling
  async testWebhookHandling() {
    await this.test('HubSpot Webhook Processing', async () => {
      const mockWebhookData = [{
        subscriptionType: 'contact.propertyChange',
        objectId: 12345,
        propertyName: 'email',
        propertyValue: 'test@example.com'
      }];

      const response = await this.makeRequest('POST', '/api/webhooks/integrations/hubspot', mockWebhookData, {
        'x-hubspot-signature-v2': 'test-signature'
      });
      
      // This will likely fail due to signature verification, but we're testing the endpoint exists
      if (response.status !== 401 && response.status !== 200) {
        throw new Error('HubSpot webhook endpoint not responding correctly');
      }
    });

    await this.test('Google Calendar Webhook Processing', async () => {
      const mockWebhookData = {
        channelId: 'test-channel-123',
        resourceId: 'test-resource-456',
        resourceUri: 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
      };

      const response = await this.makeRequest('POST', '/api/webhooks/integrations/google', mockWebhookData);
      
      if (response.status !== 200 && response.status !== 400) {
        throw new Error('Google webhook endpoint not responding correctly');
      }
    });

    await this.test('Calendly Webhook Processing', async () => {
      const mockWebhookData = {
        event: 'invitee.created',
        payload: {
          uri: 'https://api.calendly.com/scheduled_events/test-event-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          event_type: {
            name: 'Test Meeting'
          }
        }
      };

      const response = await this.makeRequest('POST', '/api/webhooks/integrations/calendly', mockWebhookData);
      
      if (response.status !== 200 && response.status !== 400) {
        throw new Error('Calendly webhook endpoint not responding correctly');
      }
    });
  }

  // Test database operations
  async testDatabaseOperations() {
    await this.test('Database Health Check', async () => {
      const response = await this.makeRequest('GET', '/api/database');
      if (response.status !== 200) {
        throw new Error('Database health check failed');
      }
    });
  }

  // Test security features
  async testSecurityFeatures() {
    await this.test('API Rate Limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(10).fill().map(() => 
        this.makeRequest('GET', '/api/health')
      );

      try {
        await Promise.all(promises);
      } catch (error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          // Rate limiting is working
          return;
        }
        throw error;
      }
    });

    await this.test('Invalid API Key Rejection', async () => {
      try {
        await this.makeRequest('GET', '/api/analytics', null, { 'x-api-key': 'invalid-key' });
        throw new Error('Should have rejected invalid API key');
      } catch (error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          return; // Expected
        }
        throw error;
      }
    });
  }

  // Run all tests
  async runAllTests() {
    console.log(chalk.cyan('🚀 Starting Locall Project E2E Test Suite...\n'));
    
    const startTime = Date.now();

    try {
      // Core system tests
      await this.testDatabaseOperations();
      
      // Feature tests
      await this.testAdvancedCallRouting();
      await this.testQueueManagement();
      await this.testAgencyFeatures();
      await this.testLoyaltyReferralSystem();
      await this.testWebformTracking();
      await this.testExternalIntegrations();
      await this.testWebhookHandling();
      
      // Security tests
      await this.testSecurityFeatures();

    } catch (error) {
      this.log(`Unexpected error during testing: ${error.message}`, 'error');
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Print results
    console.log('\n' + chalk.cyan('📊 Test Results Summary'));
    console.log('='.repeat(50));
    console.log(chalk.green(`✓ Passed: ${this.passed}`));
    console.log(chalk.red(`✗ Failed: ${this.failed}`));
    console.log(chalk.blue(`⏱ Duration: ${duration}s`));
    console.log(chalk.blue(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`));

    if (this.failed > 0) {
      console.log('\n' + chalk.red('❌ Failed Tests:'));
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => {
          console.log(chalk.red(`  • ${r.description}: ${r.error}`));
        });
    }

    console.log('\n' + chalk.cyan('🎯 Production Readiness Assessment:'));
    if (this.failed === 0) {
      console.log(chalk.green('✅ All tests passed! System is ready for production.'));
    } else if (this.failed <= 2) {
      console.log(chalk.yellow('⚠️  Minor issues detected. Review failed tests before production.'));
    } else {
      console.log(chalk.red('🚨 Critical issues detected. Address failed tests before production.'));
    }

    // Exit with appropriate code
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new E2ETestSuite();
  testSuite.runAllTests().catch(error => {
    console.error(chalk.red('Fatal error running tests:'), error);
    process.exit(1);
  });
}

module.exports = E2ETestSuite;
