import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    const usage = await BillingService.getUsageAnalytics(workspaceId, timeRange);

    return NextResponse.json(usage);

  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
