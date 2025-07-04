import { NextRequest, NextResponse } from 'next/server';
import { brevoEmailService } from '@/lib/brevo-email-service';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...emailData } = body;

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
      case 'send_email':
        const { to, subject, html_content, text_content, workspace_id, campaign_id } = emailData;

        if (!to || !subject || (!html_content && !text_content)) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: to, subject, and content' },
            { status: 400 }
          );
        }

        // Verify user has access to workspace
        if (workspace_id) {
          const { data: member, error: memberError } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', workspace_id)
            .eq('user_id', user.id)
            .single();

          if (memberError || !member) {
            return NextResponse.json(
              { success: false, error: 'Access denied to workspace' },
              { status: 403 }
            );
          }
        }

        const emailResponse = await brevoEmailService.sendEmail({
          to: Array.isArray(to) ? to : [{ email: to }],
          subject,
          html_content,
          text_content,
          workspace_id,
          user_id: user.id,
          campaign_id
        });

        return NextResponse.json({
          success: true,
          data: emailResponse,
          message: 'Email sent successfully'
        });

      case 'send_bulk_email':
        const { emails, bulk_workspace_id } = emailData;

        if (!emails || !Array.isArray(emails)) {
          return NextResponse.json(
            { success: false, error: 'Missing or invalid emails array' },
            { status: 400 }
          );
        }

        const bulkResponse = await brevoEmailService.sendBulkEmail(
          emails,
          bulk_workspace_id,
          user.id
        );

        return NextResponse.json({
          success: true,
          data: bulkResponse,
          message: 'Bulk emails processed'
        });

      case 'create_template':
        const { name, template_subject, template_html_content, template_text_content, variables } = emailData;

        if (!name || !template_subject || !template_html_content) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: name, template_subject, template_html_content' },
            { status: 400 }
          );
        }

        const template = await brevoEmailService.createTemplate({
          name,
          subject: template_subject,
          html_content: template_html_content,
          text_content: template_text_content || '',
          variables: variables || []
        });

        return NextResponse.json({
          success: true,
          data: template,
          message: 'Template created successfully'
        });

      case 'send_welcome_email':
        const { welcome_email, welcome_name, welcome_workspace_id } = emailData;

        if (!welcome_email || !welcome_name) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: welcome_email, welcome_name' },
            { status: 400 }
          );
        }

        await brevoEmailService.sendWelcomeEmail(
          welcome_email,
          welcome_name,
          welcome_workspace_id
        );

        return NextResponse.json({
          success: true,
          message: 'Welcome email sent successfully'
        });

      case 'send_invite_email':
        const { invite_email, inviter_name, workspace_name, invite_link, invite_workspace_id } = emailData;

        if (!invite_email || !inviter_name || !workspace_name || !invite_link) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: invite_email, inviter_name, workspace_name, invite_link' },
            { status: 400 }
          );
        }

        await brevoEmailService.sendInviteEmail(
          invite_email,
          inviter_name,
          workspace_name,
          invite_link,
          invite_workspace_id
        );

        return NextResponse.json({
          success: true,
          message: 'Invite email sent successfully'
        });

      case 'get_templates':
        const { get_workspace_id } = emailData;
        const templates = await brevoEmailService.getTemplates(get_workspace_id);

        return NextResponse.json({
          success: true,
          data: templates
        });

      case 'get_analytics':
        const { start_date, end_date, analytics_workspace_id } = emailData;

        if (!start_date || !end_date) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: start_date, end_date' },
            { status: 400 }
          );
        }

        const analytics = await brevoEmailService.getEmailAnalytics(
          start_date,
          end_date,
          analytics_workspace_id
        );

        return NextResponse.json({
          success: true,
          data: analytics
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Email API error:', error);
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get('workspace_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

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

    // Build query for email history
    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    if (start_date && end_date) {
      query = query
        .gte('created_at', start_date)
        .lte('created_at', end_date);
    }

    const { data: emails, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: emails || []
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
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
