#!/usr/bin/env node
/**
 * Locall Project - End-to-End Testing Script
 * Tests all major API endpoints and features
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  testUser: {
    email: 'test@example.com',
    phone: '+1234567890'
  },
  testWorkspace: 'test-workspace-id'
};

// Test results tracker
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  results: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m',  // Green
    error: '\x1b[31m',    // Red
    warn: '\x1b[33m',     // Yellow
    reset: '\x1b[0m'      // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function recordTest(name, status, details = '') {
  testResults.results.push({ name, status, details, timestamp: new Date() });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

// Test API endpoint
async function testEndpoint(endpoint, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const success = response.status === expectedStatus;
    
    log(`Testing ${method} ${endpoint}: ${response.status}`, success ? 'success' : 'error');
    return { success, status: response.status, data: await response.text() };
  } catch (error) {
    log(`Error testing ${endpoint}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Check file existence
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  log(`Checking ${description}: ${exists ? 'EXISTS' : 'MISSING'}`, exists ? 'success' : 'error');
  recordTest(description, exists ? 'PASS' : 'FAIL', filePath);
  
  return exists;
}

// Main testing function
async function runTests() {
  log('Starting Locall Project End-to-End Tests', 'info');
  log('==========================================', 'info');

  // 1. Check critical files
  log('\n📁 CHECKING CRITICAL FILES', 'info');
  checkFile('package.json', 'Package.json');
  checkFile('next.config.ts', 'Next.js config');
  checkFile('tsconfig.json', 'TypeScript config');
  checkFile('.env.local', 'Environment variables');
  
  // 2. Check core services
  log('\n🔧 CHECKING CORE SERVICES', 'info');
  checkFile('src/lib/ai-transcription-service.ts', 'AI Transcription Service');
  checkFile('src/lib/whisper-transcription-service.ts', 'Whisper Service');
  checkFile('src/lib/billing-service.ts', 'Billing Service');
  checkFile('src/lib/pricing.ts', 'Pricing Service');
  
  // 3. Check API endpoints
  log('\n🌐 CHECKING API ENDPOINTS', 'info');
  const endpoints = [
    '/api/health',
    '/api/analytics',
    '/api/available-numbers',
    '/api/billing/customer',
    '/api/recordings',
    '/api/routing/advanced',
    '/api/vonage-webhook'
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      recordTest(`API ${endpoint}`, result.success ? 'PASS' : 'FAIL', `Status: ${result.status}`);
    } catch (error) {
      recordTest(`API ${endpoint}`, 'FAIL', error.message);
    }
  }

  // 4. Check frontend components
  log('\n🎨 CHECKING FRONTEND COMPONENTS', 'info');
  checkFile('src/app/analytics/page.tsx', 'Analytics Dashboard');
  checkFile('src/app/components/CallAnalytics.tsx', 'Call Analytics Component');
  checkFile('src/app/dashboard/page.tsx', 'Main Dashboard');
  checkFile('src/app/call/page.tsx', 'Call Page');
  checkFile('src/app/booking/page.tsx', 'Booking Page');

  // 5. Check database migrations
  log('\n🗄️ CHECKING DATABASE STRUCTURE', 'info');
  checkFile('sql/feature_tables.sql', 'Feature Tables SQL');
  checkFile('sql/user.sql', 'User Tables SQL');
  checkFile('sql/RLSpolicy.sql', 'RLS Policies');

  // 6. Environment variable check
  log('\n🔐 CHECKING ENVIRONMENT VARIABLES', 'info');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VONAGE_API_KEY',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    const exists = process.env[envVar] !== undefined;
    recordTest(`ENV ${envVar}`, exists ? 'PASS' : 'FAIL', exists ? 'Set' : 'Missing');
  });

  // 7. Generate test report
  log('\n📊 GENERATING TEST REPORT', 'info');
  generateTestReport();
}

function generateTestReport() {
  const totalTests = testResults.passed + testResults.failed + testResults.skipped;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

  log('\n' + '='.repeat(50), 'info');
  log('🎯 TEST RESULTS SUMMARY', 'info');
  log('='.repeat(50), 'info');
  log(`Total Tests: ${totalTests}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, 'error');
  log(`Skipped: ${testResults.skipped}`, 'warn');
  log(`Success Rate: ${successRate}%`, successRate > 80 ? 'success' : 'warn');

  // Detailed results
  log('\n📋 DETAILED RESULTS:', 'info');
  testResults.results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    log(`${icon} ${result.name}: ${result.status} ${result.details}`, 
         result.status === 'PASS' ? 'success' : result.status === 'FAIL' ? 'error' : 'warn');
  });

  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'info');
  if (testResults.failed > 0) {
    log('❗ Critical issues found - address failed tests before proceeding', 'error');
  }
  if (successRate < 80) {
    log('⚠️ Low success rate - review project setup and dependencies', 'warn');
  }
  if (successRate >= 90) {
    log('🎉 Excellent! Project is in good shape for development', 'success');
  }

  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      successRate: parseFloat(successRate)
    },
    results: testResults.results
  };

  fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));
  log('\n📄 Test report saved to: test-report.json', 'info');
}

// Feature-specific tests
async function testCallFlow() {
  log('\n📞 TESTING CALL FLOW', 'info');
  
  // Test call creation
  const callData = {
    from: '+1234567890',
    to: '+0987654321',
    workspace_id: TEST_CONFIG.testWorkspace,
    user_id: 'test-user'
  };

  const callResult = await testEndpoint('/api/vonage-call', 'POST', callData, 200);
  recordTest('Call Creation', callResult.success ? 'PASS' : 'FAIL');

  // Test recording retrieval
  const recordingResult = await testEndpoint('/api/recordings?workspaceId=' + TEST_CONFIG.testWorkspace);
  recordTest('Recording Retrieval', recordingResult.success ? 'PASS' : 'FAIL');
}

async function testBillingFlow() {
  log('\n💳 TESTING BILLING FLOW', 'info');
  
  // Test customer creation
  const customerData = {
    workspace_id: TEST_CONFIG.testWorkspace,
    email: TEST_CONFIG.testUser.email,
    name: 'Test Customer'
  };

  const customerResult = await testEndpoint('/api/billing/customer', 'POST', customerData, 200);
  recordTest('Customer Creation', customerResult.success ? 'PASS' : 'FAIL');

  // Test billing analytics
  const analyticsResult = await testEndpoint('/api/billing/usage?workspaceId=' + TEST_CONFIG.testWorkspace);
  recordTest('Billing Analytics', analyticsResult.success ? 'PASS' : 'FAIL');
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(() => {
      const exitCode = testResults.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runTests, testEndpoint, checkFile };
