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

    const paymentMethods = await BillingService.getPaymentMethods(workspaceId);

    return NextResponse.json(paymentMethods);

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, customerId, paymentMethodId } = await request.json();

    if (!workspaceId || !customerId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'WorkspaceId, customerId, and paymentMethodId are required' },
        { status: 400 }
      );
    }

    const result = await BillingService.addPaymentMethod({
      customer_id: customerId,
      payment_method_id: paymentMethodId,
      set_as_default: true
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
