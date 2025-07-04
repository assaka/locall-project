import { NextRequest, NextResponse } from 'next/server';
import { vonageCallService } from '@/lib/vonage-call-service';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...callData } = body;

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
      case 'make_call':
        const { to, from, workspace_id, form_id, campaign_id, message, record } = callData;

        if (!to || !from) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: to, from' },
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

        // Create call request
        const callRequest = {
          to,
          from,
          answer_url: `${process.env.BASE_URL}/api/vonage-webhook/answer`,
          event_url: `${process.env.BASE_URL}/api/vonage-webhook/event`,
          workspace_id,
          user_id: user.id,
          form_id,
          campaign_id,
          metadata: { message, record }
        };

        const callResponse = await vonageCallService.makeCall(callRequest);

        return NextResponse.json({
          success: true,
          data: callResponse,
          message: 'Call initiated successfully'
        });

      case 'hangup_call':
        const { uuid } = callData;

        if (!uuid) {
          return NextResponse.json(
            { success: false, error: 'Missing required field: uuid' },
            { status: 400 }
          );
        }

        // Verify user owns this call
        const { data: call, error: callError } = await supabase
          .from('calls')
          .select('user_id, workspace_id')
          .eq('vonage_uuid', uuid)
          .single();

        if (callError || !call || call.user_id !== user.id) {
          return NextResponse.json(
            { success: false, error: 'Call not found or access denied' },
            { status: 404 }
          );
        }

        await vonageCallService.hangupCall(uuid);

        return NextResponse.json({
          success: true,
          message: 'Call ended successfully'
        });

      case 'get_call_details':
        const { call_uuid } = callData;

        if (!call_uuid) {
          return NextResponse.json(
            { success: false, error: 'Missing required field: call_uuid' },
            { status: 400 }
          );
        }

        // Verify user owns this call
        const { data: callDetails, error: detailsError } = await supabase
          .from('calls')
          .select('*')
          .eq('vonage_uuid', call_uuid)
          .eq('user_id', user.id)
          .single();

        if (detailsError || !callDetails) {
          return NextResponse.json(
            { success: false, error: 'Call not found or access denied' },
            { status: 404 }
          );
        }

        // Get latest details from Vonage
        const vonageDetails = await vonageCallService.getCallDetails(call_uuid);

        return NextResponse.json({
          success: true,
          data: {
            ...callDetails,
            vonage_details: vonageDetails
          }
        });

      case 'send_sms':
        const { sms_to, sms_from, text, sms_workspace_id } = callData;

        if (!sms_to || !sms_from || !text) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: sms_to, sms_from, text' },
            { status: 400 }
          );
        }

        const smsResponse = await vonageCallService.sendSMS(
          sms_to,
          sms_from,
          text,
          sms_workspace_id
        );

        return NextResponse.json({
          success: true,
          data: smsResponse,
          message: 'SMS sent successfully'
        });

      case 'get_available_numbers':
        const { country = 'US' } = callData;
        const availableNumbers = await vonageCallService.getAvailableNumbers(country);

        return NextResponse.json({
          success: true,
          data: availableNumbers
        });

      case 'purchase_number':
        const { purchase_country, msisdn, purchase_workspace_id } = callData;

        if (!purchase_country || !msisdn) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: purchase_country, msisdn' },
            { status: 400 }
          );
        }

        const purchaseResponse = await vonageCallService.purchaseNumber(
          purchase_country,
          msisdn,
          purchase_workspace_id
        );

        return NextResponse.json({
          success: true,
          data: purchaseResponse,
          message: 'Number purchased successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Vonage API error:', error);
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
    const user_id = searchParams.get('user_id');

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

    // Build query
    let query = supabase
      .from('calls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    const { data: calls, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: calls || []
    });

  } catch (error) {
    console.error('Error fetching calls:', error);
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
