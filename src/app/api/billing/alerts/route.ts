import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const unresolvedOnly = searchParams.get('unresolved_only') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    const alerts = await BillingService.getAlerts(workspaceId, unresolvedOnly);

    return NextResponse.json(alerts);

  } catch (error) {
    console.error('Error fetching billing alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
