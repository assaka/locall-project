import { NextRequest, NextResponse } from 'next/server'
import { WalletService } from '@/lib/wallet-service'

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, return mock billing data
    const userId = 'demo-user-id'
    
    // Get current balance
    let balance = 1000 // Default balance in cents
    try {
      balance = await WalletService.getBalance(userId)
    } catch (error) {
      console.log('Using default balance for demo')
    }

    // Get transaction history
    let transactions = []
    try {
      transactions = await WalletService.getTransactionHistory(userId, 10)
    } catch (error) {
      // Return mock transactions for demo
      transactions = [
        {
          id: '1',
          user_id: userId,
          type: 'top-up',
          amount: 2000,
          description: 'Wallet top-up via Stripe',
          created_at: new Date().toISOString(),
          stripe_payment_intent_id: 'pi_demo_123'
        },
        {
          id: '2', 
          user_id: userId,
          type: 'deduction',
          amount: 500,
          description: 'Call usage: 60 seconds',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          stripe_payment_intent_id: null
        }
      ]
    }

    // Get usage logs
    let usageLogs = []
    try {
      usageLogs = await WalletService.getUsageLogs(userId, 10)
    } catch (error) {
      // Return mock usage logs for demo
      usageLogs = [
        {
          id: '1',
          user_id: userId,
          service: 'call',
          cost: 300,
          quantity: 30,
          unit: 'seconds',
          created_at: new Date().toISOString(),
          metadata: { from: '+1234567890', to: '+0987654321' }
        },
        {
          id: '2',
          user_id: userId, 
          service: 'sms',
          cost: 200,
          quantity: 2,
          unit: 'messages',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          metadata: { to: '+1234567890' }
        }
      ]
    }

    return NextResponse.json({
      success: true,
      wallet: {
        balance: balance / 100, // Convert cents to dollars
        currency: '$',
        lastUpdated: new Date().toISOString()
      },
      usage: {
        calls: { count: 25, cost: 12.50 },
        sms: { count: 150, cost: 7.50 },
        storage: { gb: 2.3, cost: 4.99 }
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type === 'top-up' ? 'topup' : 'deduction',
        amount: t.amount / 100, // Convert cents to dollars
        description: t.description,
        timestamp: t.created_at,
        status: 'completed'
      })),
      subscription: {
        plan: 'Pro',
        status: 'active',
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 29.99
      },
      paymentMethods: [
        {
          id: 'pm_demo_1',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          isDefault: true
        }
      ],
      data: {
        balance,
        balanceFormatted: `$${(balance / 100).toFixed(2)}`,
        transactions,
        usageLogs,
        alertThreshold: 500,
        alertThresholdFormatted: '$5.00'
      }
    })

  } catch (error) {
    console.error('Billing API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, amount, threshold } = body

    if (action === 'topup' && amount) {
      // Mock top-up response
      return NextResponse.json({
        success: true,
        message: 'Top-up initiated successfully',
        data: {
          amount,
          paymentIntentId: 'pi_demo_' + Date.now()
        }
      })
    }

    if (action === 'updateThreshold' && threshold !== undefined) {
      // Mock threshold update
      return NextResponse.json({
        success: true,
        message: 'Alert threshold updated successfully',
        data: {
          threshold,
          thresholdFormatted: `$${(threshold / 100).toFixed(2)}`
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Billing POST API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
