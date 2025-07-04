import { NextRequest, NextResponse } from 'next/server';
import { PerformanceService } from '../../../lib/performance-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Get current performance stats
    if (action === 'current' || !action) {
      const stats = await PerformanceService.getCurrentMetrics(workspaceId);
      return NextResponse.json(stats);
    }

    // Get historical data
    if (action === 'historical') {
      const hours = parseInt(searchParams.get('hours') || '24');
      const data = await PerformanceService.getHistoricalData(workspaceId, hours);
      return NextResponse.json(data);
    }

    // Get alerts
    if (action === 'alerts') {
      const includeResolved = searchParams.get('includeResolved') === 'true';
      const alerts = await PerformanceService.getAlerts(workspaceId, includeResolved);
      return NextResponse.json(alerts);
    }

    // Simulate metrics (for demo)
    if (action === 'simulate') {
      const metrics = await PerformanceService.simulateMetrics(workspaceId);
      return NextResponse.json(metrics);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in performance API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Record new metrics
    if (action === 'record') {
      const { metrics } = body;
      
      if (!metrics) {
        return NextResponse.json(
          { error: 'Metrics data is required' },
          { status: 400 }
        );
      }

      const result = await PerformanceService.recordMetrics(workspace_id, metrics);
      return NextResponse.json(result, { status: 201 });
    }

    // Acknowledge alert
    if (action === 'acknowledge_alert') {
      const { alert_id, acknowledged_by } = body;

      if (!alert_id || !acknowledged_by) {
        return NextResponse.json(
          { error: 'Alert ID and acknowledged_by are required' },
          { status: 400 }
        );
      }

      await PerformanceService.acknowledgeAlert(alert_id, acknowledged_by);
      return NextResponse.json({ success: true });
    }

    // Resolve alert
    if (action === 'resolve_alert') {
      const { alert_id } = body;

      if (!alert_id) {
        return NextResponse.json(
          { error: 'Alert ID is required' },
          { status: 400 }
        );
      }

      await PerformanceService.resolveAlert(alert_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in performance API POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
