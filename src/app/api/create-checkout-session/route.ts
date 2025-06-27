import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' });

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1Re2CjH9BVUkbVYISmWf7MH1',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/purchase?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/purchase?canceled=1`,
      metadata: { user_id },
    });
    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe error:', error);
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = String((error as { message: string }).message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
