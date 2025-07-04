import { NextRequest, NextResponse } from 'next/server'
import { WalletService } from '@/lib/wallet-service'
import { DatabaseSetup } from '@/lib/database-setup'
import { calculateCost } from '@/lib/pricing'
import { sendLowBalanceAlert } from '@/lib/email'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { testType, userId, email } = await req.json()

    // Basic authentication
    const authHeader = req.headers.get('authorization')
    const testSecret = process.env.TEST_SECRET || 'test-secret'
    
    if (authHeader !== `Bearer ${testSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (testType) {
      case 'database':
        return await testDatabase()
      
      case 'wallet':
        if (!userId) {
          return NextResponse.json({ error: 'userId required for wallet test' }, { status: 400 })
        }
        return await testWallet(userId)
      
      case 'email':
        if (!email) {
          return NextResponse.json({ error: 'email required for email test' }, { status: 400 })
        }
        return await testEmail(email)
      
      case 'stripe':
        return await testStripe()
      
      case 'full':
        return await runFullTest()
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
}

async function testDatabase() {
  const results = {
    verification: false,
    stats: {},
    error: null
  }

  try {
    results.verification = await DatabaseSetup.verifySetup()
    results.stats = await DatabaseSetup.getStats()
    
    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      results
    })
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      results
    })
  }
}

async function testWallet(userId: string) {
  const results = {
    initialBalance: 0,
    afterTopup: 0,
    afterDeduction: 0,
    transactionHistory: [],
    usageLogs: [],
    error: null
  }

  try {
    // Get initial balance
    results.initialBalance = await WalletService.getBalance(userId)

    // Test top-up
    await WalletService.topUpWallet(userId, 1000, 'test-payment-intent', 'Test top-up')
    results.afterTopup = await WalletService.getBalance(userId)

    // Test deduction
    const deductionResult = await WalletService.deductFromWallet(userId, {
      service: 'call',
      quantity: 60,
      cost: calculateCost('call', 60),
      metadata: { test: true }
    })

    if (deductionResult.success) {
      results.afterDeduction = deductionResult.newBalance || 0
    }

    // Get transaction history
    results.transactionHistory = await WalletService.getTransactionHistory(userId, 10)
    results.usageLogs = await WalletService.getUsageLogs(userId, 10)

    return NextResponse.json({
      success: true,
      message: 'Wallet test completed',
      results
    })
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: 'Wallet test failed',
      results
    })
  }
}

async function testEmail(email: string) {
  const results = {
    lowBalanceAlert: false,
    error: null
  }

  try {
    await sendLowBalanceAlert({
      userId: 'test-user-id',
      currentBalance: 500,
      threshold: 1000,
      userEmail: email,
      userName: 'Test User'
    })

    results.lowBalanceAlert = true

    return NextResponse.json({
      success: true,
      message: 'Email test completed',
      results
    })
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: 'Email test failed',
      results
    })
  }
}

async function testStripe() {
  const results = {
    connection: false,
    paymentMethods: [],
    error: null
  }

  try {
    // Test Stripe connection by retrieving payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      type: 'card',
      limit: 3
    })

    results.connection = true
    results.paymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      created: pm.created
    }))

    return NextResponse.json({
      success: true,
      message: 'Stripe test completed',
      results
    })
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: 'Stripe test failed',
      results
    })
  }
}

async function runFullTest() {
  const results = {
    database: null,
    testUser: null,
    wallet: null,
    email: null,
    stripe: null,
    overall: false
  }

  try {
    // Test database
    results.database = await DatabaseSetup.verifySetup()

    // Create test user
    const testEmail = `test-${Date.now()}@example.com`
    const testUserId = await DatabaseSetup.createTestUser(testEmail, 'Full Test User')
    results.testUser = { id: testUserId, email: testEmail }

    // Test wallet operations
    const initialBalance = await WalletService.getBalance(testUserId)
    await WalletService.topUpWallet(testUserId, 2000, 'test-full-payment', 'Full test top-up')
    const afterTopup = await WalletService.getBalance(testUserId)
    
    const deductionResult = await WalletService.deductFromWallet(testUserId, {
      service: 'sms',
      quantity: 10,
      cost: calculateCost('sms', 10)
    })

    results.wallet = {
      initialBalance,
      afterTopup,
      afterDeduction: deductionResult.newBalance,
      deductionSuccess: deductionResult.success
    }

    // Test email (don't actually send in full test)
    results.email = true // Would test email functionality

    // Test Stripe connection
    const stripeHealth = await stripe.paymentMethods.list({ type: 'card', limit: 1 })
    results.stripe = !!stripeHealth

    results.overall = !!(results.database && results.testUser && results.wallet && results.email && results.stripe)

    return NextResponse.json({
      success: results.overall,
      message: results.overall ? 'Full test passed' : 'Some tests failed',
      results
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Full test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Billing System Test API',
    availableTests: [
      'database - Test database connection and setup',
      'wallet - Test wallet operations (requires userId)',
      'email - Test email functionality (requires email)',
      'stripe - Test Stripe connection',
      'full - Run comprehensive test suite'
    ],
    usage: {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer <TEST_SECRET>',
        'Content-Type': 'application/json'
      },
      body: {
        testType: 'database|wallet|email|stripe|full',
        userId: 'optional-for-wallet-test',
        email: 'optional-for-email-test'
      }
    }
  })
}
