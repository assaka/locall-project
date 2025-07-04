import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    const subscriptions = await BillingService.getSubscriptions(workspaceId);

    return NextResponse.json(subscriptions);

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, priceId, customerId } = await request.json();

    if (!workspaceId || !priceId || !customerId) {
      return NextResponse.json(
        { error: 'WorkspaceId, priceId, and customerId are required' },
        { status: 400 }
      );
    }

    const subscription = await BillingService.createSubscription({
      customer_id: customerId,
      price_id: priceId,
      metadata: { workspaceId }
    });

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
