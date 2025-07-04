import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '../../../lib/dashboard-service';

// Helper function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  let workspaceId = searchParams.get('workspaceId');

  // If no workspace ID is provided or it's not a valid UUID, generate a default one
  if (!workspaceId || !isValidUUID(workspaceId)) {
    workspaceId = '00000000-0000-0000-0000-000000000000'; // Default UUID
  }

  try {
    switch (action) {
      case 'metrics':
        const metrics = await DashboardService.getDashboardMetrics(workspaceId);
        return NextResponse.json({ success: true, data: metrics });

      case 'health':
        const health = await DashboardService.getSystemHealth(workspaceId);
        return NextResponse.json({ success: true, data: health });

      case 'activity':
        const activity = await DashboardService.getRecentActivity(workspaceId, 20);
        return NextResponse.json({ success: true, data: activity });

      case 'realtime-stats':
        const realtimeStats = await DashboardService.getRealtimeStats(workspaceId);
        return NextResponse.json({ success: true, data: realtimeStats });

      default:
        // Return comprehensive dashboard data
        const [dashboardMetrics, systemHealth, recentActivity] = await Promise.all([
          DashboardService.getDashboardMetrics(workspaceId),
          DashboardService.getSystemHealth(workspaceId),
          DashboardService.getRecentActivity(workspaceId, 10)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            metrics: dashboardMetrics,
            health: systemHealth,
            activity: recentActivity
          }
        });
    }
  } catch (error) {
    console.error('Dashboard API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
