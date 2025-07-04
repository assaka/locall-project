import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const CheckoutSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().min(500).max(100000), // Min $5, Max $1000 in cents
  customerEmail: z.string().email(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const validation = CheckoutSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { 
      userId, 
      amount, 
      customerEmail, 
      successUrl = `${process.env.NEXTAUTH_URL}/wallet/success`,
      cancelUrl = `${process.env.NEXTAUTH_URL}/wallet/cancel`
    } = validation.data

    // Create or retrieve customer
    let customer
    
    try {
      // Try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
        
        // Update customer metadata with userId if not already set
        if (!customer.metadata?.userId) {
          customer = await stripe.customers.update(customer.id, {
            metadata: {
              userId: userId
            }
          })
        }
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            userId: userId
          }
        })
      }
    } catch (error) {
      console.error('Error handling customer:', error)
      return NextResponse.json(
        { error: 'Failed to process customer information' },
        { status: 500 }
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Wallet Top-up',
              description: `Add $${(amount / 100).toFixed(2)} to your wallet balance`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        type: 'wallet_topup'
      },
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          userId: userId,
          type: 'wallet_topup'
        }
      }
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
