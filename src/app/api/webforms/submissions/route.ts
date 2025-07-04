import { NextRequest, NextResponse } from 'next/server';
import { WebformSubmissionService } from '../../../../lib/webform-submission-service';

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

    // Get form analytics
    if (action === 'analytics') {
      const formId = searchParams.get('formId') || undefined;
      const days = parseInt(searchParams.get('days') || '30');
      const analytics = await WebformSubmissionService.getFormAnalytics(workspaceId, formId, days);
      return NextResponse.json(analytics);
    }

    // Get webform configurations
    if (action === 'configs') {
      const configs = await WebformSubmissionService.getWebformConfigs(workspaceId);
      return NextResponse.json(configs);
    }

    // Get submissions with filters
    const filters = {
      form_id: searchParams.get('formId') || undefined,
      status: searchParams.get('status') || undefined,
      date_from: searchParams.get('dateFrom') || undefined,
      date_to: searchParams.get('dateTo') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await WebformSubmissionService.getSubmissions(workspaceId, filters);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const {
        form_id,
        visitor_id,
        workspace_id,
        data,
        utm_data,
        page_url,
        referrer,
        ip_address,
        user_agent
      } = body;

      if (!form_id || !visitor_id || !workspace_id || !data) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const submission = await WebformSubmissionService.createSubmission({
        form_id,
        visitor_id,
        workspace_id,
        data,
        utm_data,
        page_url,
        referrer,
        ip_address,
        user_agent
      });

      return NextResponse.json(submission, { status: 201 });
    }

    if (action === 'create_config') {
      const {
        workspace_id,
        name,
        form_selector,
        fields,
        spam_protection,
        notifications,
        tracking_enabled
      } = body;

      if (!workspace_id || !name || !form_selector) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const config = await WebformSubmissionService.createWebformConfig({
        workspace_id,
        name,
        form_selector,
        fields: fields || {},
        spam_protection: spam_protection || {
          enabled: true,
          honeypot: true,
          rate_limit: 5,
          captcha: false
        },
        notifications: notifications || { email: [] },
        tracking_enabled: tracking_enabled !== false
      });

      return NextResponse.json(config, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in submissions API POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'update_status') {
      const { submission_id, status, processed_by } = body;

      if (!submission_id || !status) {
        return NextResponse.json(
          { error: 'Submission ID and status are required' },
          { status: 400 }
        );
      }

      const submission = await WebformSubmissionService.updateSubmissionStatus(
        submission_id,
        status,
        processed_by
      );

      return NextResponse.json(submission);
    }

    if (action === 'update_config') {
      const { config_id, updates } = body;

      if (!config_id || !updates) {
        return NextResponse.json(
          { error: 'Config ID and updates are required' },
          { status: 400 }
        );
      }

      const config = await WebformSubmissionService.updateWebformConfig(config_id, updates);
      return NextResponse.json(config);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in submissions API PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID is required' },
        { status: 400 }
      );
    }

    await WebformSubmissionService.deleteWebformConfig(configId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in submissions API DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
