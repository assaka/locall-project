/**
 * IVR System Integration Test
 * 
 * This file contains manual test scenarios for the IVR system.
 * Run these tests by calling the API endpoints directly or using a tool like Postman.
 */

export interface IVRTestScenario {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  params?: Record<string, string>;
  body?: Record<string, any>;
  expectedResponse: any;
  businessHours?: boolean;
}

export const IVR_TEST_SCENARIOS: IVRTestScenario[] = [
  {
    name: 'After Hours Initial Call',
    description: 'Test initial call during after-hours (should return after-hours menu)',
    endpoint: '/api/ivr',
    method: 'GET',
    params: {
      from: '+1234567890',
      to: '+1987654321'
    },
    businessHours: false,
    expectedResponse: {
      length: 2,
      firstAction: 'talk',
      containsText: 'office is currently closed',
      secondAction: 'input'
    }
  },
  {
    name: 'Business Hours Initial Call',
    description: 'Test initial call during business hours (should return business menu)',
    endpoint: '/api/ivr',
    method: 'GET',
    params: {
      from: '+1234567890',
      to: '+1987654321'
    },
    businessHours: true,
    expectedResponse: {
      length: 2,
      firstAction: 'talk',
      containsText: 'For sales, press 1',
      secondAction: 'input'
    }
  },
  {
    name: 'After Hours Appointment Scheduling',
    description: 'Test pressing 1 during after-hours (should trigger Calendly SMS)',
    endpoint: '/api/ivr',
    method: 'POST',
    body: {
      from: '+1234567890',
      to: '+1987654321',
      dtmf: '1',
      conversation_uuid: 'test-uuid-123'
    },
    businessHours: false,
    expectedResponse: {
      length: 2,
      firstAction: 'talk',
      containsText: 'send you a text message',
      secondAction: 'input'
    }
  },
  {
    name: 'After Hours Voicemail',
    description: 'Test pressing 2 during after-hours (should start voicemail recording)',
    endpoint: '/api/ivr',
    method: 'POST',
    body: {
      from: '+1234567890',
      to: '+1987654321',
      dtmf: '2',
      conversation_uuid: 'test-uuid-456'
    },
    businessHours: false,
    expectedResponse: {
      length: 3,
      firstAction: 'talk',
      containsText: 'leave your message',
      secondAction: 'record',
      thirdAction: 'talk'
    }
  },
  {
    name: 'Business Hours Sales Transfer',
    description: 'Test pressing 1 during business hours (should transfer to sales)',
    endpoint: '/api/ivr',
    method: 'POST',
    body: {
      from: '+1234567890',
      to: '+1987654321',
      dtmf: '1',
      conversation_uuid: 'test-uuid-789'
    },
    businessHours: true,
    expectedResponse: {
      length: 2,
      firstAction: 'talk',
      containsText: 'Please hold',
      secondAction: 'connect'
    }
  },
  {
    name: 'Invalid DTMF Input',
    description: 'Test invalid DTMF input (should return error message and retry)',
    endpoint: '/api/ivr',
    method: 'POST',
    body: {
      from: '+1234567890',
      to: '+1987654321',
      dtmf: '9',
      conversation_uuid: 'test-uuid-invalid'
    },
    businessHours: true,
    expectedResponse: {
      length: 2,
      firstAction: 'talk',
      containsText: 'Invalid selection',
      secondAction: 'input'
    }
  }
];

/**
 * Test runner function - can be called programmatically
 */
export async function runIVRTests(baseUrl: string = 'http://localhost:3000'): Promise<any[]> {
  const results = [];

  for (const scenario of IVR_TEST_SCENARIOS) {
    console.log(`\n🧪 Running test: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);

    try {
      let url = `${baseUrl}${scenario.endpoint}`;
      const options: RequestInit = {
        method: scenario.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (scenario.method === 'GET' && scenario.params) {
        const searchParams = new URLSearchParams(scenario.params);
        url += `?${searchParams.toString()}`;
      }

      if (scenario.method === 'POST' && scenario.body) {
        options.body = JSON.stringify(scenario.body);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      // Basic validation
      const passed = response.ok && Array.isArray(result);
      
      results.push({
        scenario: scenario.name,
        passed,
        response: {
          status: response.status,
          data: result
        },
        expected: scenario.expectedResponse
      });

      console.log(`${passed ? '✅' : '❌'} Status: ${response.status}`);
      console.log(`📤 Response length: ${Array.isArray(result) ? result.length : 'Not array'}`);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`🎬 First action: ${result[0]?.action}`);
        console.log(`💬 First text snippet: ${result[0]?.text?.substring(0, 50)}...`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        expected: scenario.expectedResponse
      });
    }
  }

  return results;
}

/**
 * Manual test instructions
 */
export const MANUAL_TEST_INSTRUCTIONS = `
# IVR System Manual Testing Instructions

## Prerequisites
1. Ensure your server is running on http://localhost:3000
2. Set up environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - VONAGE_API_KEY
   - VONAGE_API_SECRET
   - CALENDLY_LINK

## Test Scenarios

### 1. Test After-Hours Menu
**URL:** GET http://localhost:3000/api/ivr?from=+1234567890&to=+1987654321
**Time:** Set system time to evening (after 5 PM) or weekend
**Expected:** NCCO with after-hours menu

### 2. Test Business Hours Menu  
**URL:** GET http://localhost:3000/api/ivr?from=+1234567890&to=+1987654321
**Time:** Set system time to business hours (9 AM - 5 PM, weekdays)
**Expected:** NCCO with business hours menu

### 3. Test Appointment Scheduling
**URL:** POST http://localhost:3000/api/ivr
**Body:** 
{
  "from": "+1234567890",
  "to": "+1987654321", 
  "dtmf": "1",
  "conversation_uuid": "test-123"
}
**Expected:** NCCO with appointment scheduling message + SMS sent

### 4. Test Voicemail
**URL:** POST http://localhost:3000/api/ivr  
**Body:**
{
  "from": "+1234567890",
  "to": "+1987654321",
  "dtmf": "2", 
  "conversation_uuid": "test-456"
}
**Expected:** NCCO with voicemail recording instructions

### 5. Test Call Transfer
**URL:** POST http://localhost:3000/api/ivr
**Body:**
{
  "from": "+1234567890",
  "to": "+1987654321",
  "dtmf": "1",
  "conversation_uuid": "test-789"  
}
**Time:** Business hours
**Expected:** NCCO with transfer to sales

## Vonage Integration Testing

### Configure Webhook URLs in Vonage Dashboard:
1. **Answer URL:** https://yourdomain.com/api/calls/inbound
2. **Event URL:** https://yourdomain.com/api/calls/inbound

### Test with Real Phone Calls:
1. Purchase a phone number through the app
2. Call the number during business hours
3. Verify business menu plays
4. Press digits and verify transfers work

5. Call the number after hours
6. Verify after-hours menu plays  
7. Press 1 and verify SMS is sent
8. Press 2 and verify voicemail recording starts

## Database Verification
Check these tables for logged data:
- ivr_call_logs
- sms_calendly  
- voicemails
- call_transfers
- calls
`;

// Export for use in other files
export default {
  scenarios: IVR_TEST_SCENARIOS,
  runTests: runIVRTests,
  instructions: MANUAL_TEST_INSTRUCTIONS
};
