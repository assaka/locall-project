import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics-service';
import { supabase } from '@/app/utils/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const workspaceId = searchParams.get('workspace_id');

    // Validate required parameters
    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: type, start_date, end_date' 
        },
        { status: 400 }
      );
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract JWT token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Verify user has access to workspace if specified
    if (workspaceId) {
      const { data: member, error: memberError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json(
          { success: false, error: 'Access denied to workspace' },
          { status: 403 }
        );
      }
    }

    let analyticsData;

    switch (type) {
      case 'calls':
        analyticsData = await analyticsService.getCallAnalytics(
          startDate,
          endDate,
          workspaceId || undefined
        );
        break;

      case 'forms':
        analyticsData = await analyticsService.getFormAnalytics(
          startDate,
          endDate,
          workspaceId || undefined
        );
        break;

      case 'users':
        analyticsData = await analyticsService.getUserAnalytics(
          startDate,
          endDate,
          workspaceId || undefined
        );
        break;

      case 'overview':
        // Get combined analytics for dashboard overview
        const [callAnalytics, formAnalytics, userAnalytics] = await Promise.all([
          analyticsService.getCallAnalytics(startDate, endDate, workspaceId || undefined),
          analyticsService.getFormAnalytics(startDate, endDate, workspaceId || undefined),
          analyticsService.getUserAnalytics(startDate, endDate, workspaceId || undefined)
        ]);

        analyticsData = {
          calls: callAnalytics,
          forms: formAnalytics,
          users: userAnalytics,
          summary: {
            total_calls: callAnalytics.total_calls,
            total_forms: formAnalytics.total_submissions,
            total_users: userAnalytics.total_users,
            call_conversion_rate: callAnalytics.conversion_rate,
            form_conversion_rate: formAnalytics.conversion_rate,
            active_users_30d: userAnalytics.active_users_30d
          }
        };
        break;

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid analytics type. Use: calls, forms, users, or overview' 
          },
          { status: 400 }
        );
    }

    // Log analytics access for audit trail
    await analyticsService.logUserActivity(
      user.id,
      `analytics_${type}_viewed`,
      workspaceId || undefined,
      { date_range: { start: startDate, end: endDate } }
    );

    return NextResponse.json({
      success: true,
      data: analyticsData,
      meta: {
        type,
        date_range: { start: startDate, end: endDate },
        workspace_id: workspaceId,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'track_activity':
        await analyticsService.logUserActivity(
          user.id,
          data.activity_type,
          data.workspace_id,
          data.metadata
        );
        break;

      case 'track_form_view':
        await analyticsService.trackFormView(
          data.form_id,
          data.visitor_id,
          data.workspace_id,
          data.source
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
