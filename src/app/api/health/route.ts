import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic functionality
    const tests = {
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        stripeKey: !!process.env.STRIPE_SECRET_KEY,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      pricing: {
        phoneNumberCost: process.env.PHONE_NUMBER_COST || '100',
        callCostPerSecond: process.env.CALL_COST_PER_SECOND || '1',
        smsCostPerSegment: process.env.SMS_COST_PER_SEGMENT || '5',
        routingExecutionCost: process.env.ROUTING_EXECUTION_COST || '2',
      },
      email: {
        resendConfigured: !!process.env.RESEND_API_KEY,
        smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        fromEmail: process.env.FROM_EMAIL || 'not-set',
      },
      security: {
        adminSecret: !!process.env.ADMIN_SECRET,
        testSecret: !!process.env.TEST_SECRET,
        cronSecret: !!process.env.CRON_SECRET,
      },
      status: 'Backend API is running'
    }

    return NextResponse.json({
      success: true,
      message: 'Billing Backend Health Check',
      timestamp: new Date().toISOString(),
      tests,
      endpoints: {
        wallet: [
          'GET /api/wallet/balance?userId=<id>',
          'PUT /api/wallet/balance (update threshold)',
          'POST /api/wallet/deduct (usage deduction)'
        ],
        stripe: [
          'POST /api/stripe/checkout (create session)',
          'POST /api/webhooks/stripe (webhook handler)'
        ],
        admin: [
          'GET /api/admin/database (status)',
          'POST /api/admin/database (management)'
        ],
        monitoring: [
          'POST /api/cron/balance-monitor (alerts)',
          'GET /api/test (health check)',
          'POST /api/test (system tests)'
        ]
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
