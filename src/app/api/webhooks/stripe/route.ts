import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { WalletService } from '@/lib/wallet-service'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing Stripe signature')
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id)

  if (!session.customer || !session.payment_intent) {
    console.error('Missing customer or payment_intent in session:', session.id)
    return
  }

  try {
    // Get the payment intent to get the amount
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    )

    if (paymentIntent.status !== 'succeeded') {
      console.log('Payment intent not succeeded yet:', paymentIntent.id)
      return
    }

    // Extract user ID from customer metadata or session metadata
    let userId: string | null = null
    
    if (session.metadata?.userId) {
      userId = session.metadata.userId
    } else if (typeof session.customer === 'string') {
      // Get customer to check for userId in metadata
      const customer = await stripe.customers.retrieve(session.customer)
      if (!customer.deleted && customer.metadata?.userId) {
        userId = customer.metadata.userId
      }
    }

    if (!userId) {
      console.error('Could not find userId for session:', session.id)
      return
    }

    // Credit the user's wallet
    const amount = paymentIntent.amount // Amount in cents
    await WalletService.topUpWallet(
      userId,
      amount,
      paymentIntent.id,
      `Wallet top-up via Stripe checkout (${session.id})`
    )

    console.log(`Successfully credited ${amount} cents to user ${userId}`)
  } catch (error) {
    console.error('Error processing checkout session:', error)
    throw error
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id)
  
  // This might be redundant if we're handling checkout.session.completed
  // But it's good to have as a backup for direct payment intents
  
  if (!paymentIntent.customer) {
    console.log('No customer associated with payment intent:', paymentIntent.id)
    return
  }

  try {
    let userId: string | null = null
    
    // Check payment intent metadata first
    if (paymentIntent.metadata?.userId) {
      userId = paymentIntent.metadata.userId
    } else if (typeof paymentIntent.customer === 'string') {
      // Get customer to check for userId in metadata
      const customer = await stripe.customers.retrieve(paymentIntent.customer)
      if (!customer.deleted && customer.metadata?.userId) {
        userId = customer.metadata.userId
      }
    }

    if (!userId) {
      console.log('Could not find userId for payment intent:', paymentIntent.id)
      return
    }

    // Check if this payment intent was already processed
    // (to avoid double-crediting from both checkout.session.completed and this event)
    const existingTransaction = await WalletService.getTransactionHistory(userId, 50)
    const alreadyProcessed = existingTransaction.some(
      tx => tx.stripe_payment_intent_id === paymentIntent.id
    )

    if (alreadyProcessed) {
      console.log('Payment intent already processed:', paymentIntent.id)
      return
    }

    // Credit the user's wallet
    const amount = paymentIntent.amount // Amount in cents
    await WalletService.topUpWallet(
      userId,
      amount,
      paymentIntent.id,
      `Wallet top-up via Stripe payment intent`
    )

    console.log(`Successfully credited ${amount} cents to user ${userId} from payment intent`)
  } catch (error) {
    console.error('Error processing payment intent:', error)
    throw error
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id)
  
  // Log the failure for monitoring purposes
  console.error('Payment failed:', {
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer,
    amount: paymentIntent.amount,
    lastPaymentError: paymentIntent.last_payment_error
  })

  // You might want to notify the user or take other actions here
  // For now, we'll just log it
}
