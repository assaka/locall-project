import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * This endpoint handles inbound calls and directs them to the IVR system
 * This is the webhook URL that should be configured in your Vonage application
 * for handling incoming calls to your purchased numbers
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const conversationUuid = url.searchParams.get('conversation_uuid');

  if (!from || !to) {
    // Return a basic error NCCO
    return NextResponse.json([
      {
        action: 'talk',
        text: 'We are experiencing technical difficulties. Please try calling again later.',
        voiceName: 'Amy'
      }
    ]);
  }

  try {
    // Log the incoming call
    await supabaseAdmin.from('calls').insert({
      vonage_call_id: conversationUuid,
      from_number: from,
      to_number: to,
      direction: 'inbound',
      status: 'started',
      started_at: new Date().toISOString()
    });

    // Get workspace for the destination number
    const { data: numberData } = await supabaseAdmin
      .from('numbers')
      .select('workspace_id, workspaces(id, name, ivr_enabled)')
      .eq('phone_number', to)
      .single();

    const workspace = numberData?.workspaces as any;
    const useIVR = workspace?.ivr_enabled !== false; // Default to true

    if (useIVR) {
      // Redirect to IVR system
      const ncco = [
        {
          action: 'conversation',
          name: `ivr-${conversationUuid}`,
          record: true,
          eventUrl: [`${process.env.BASE_URL || 'http://localhost:3000'}/api/ivr?from=${from}&to=${to}`],
          eventMethod: 'GET'
        }
      ];

      return NextResponse.json(ncco);
    } else {
      // Direct transfer to a configured number
      const transferNumber = process.env.DEFAULT_TRANSFER_NUMBER || '+1234567890';
      
      const ncco = [
        {
          action: 'talk',
          text: 'Please hold while we connect you.',
          voiceName: 'Amy'
        },
        {
          action: 'connect',
          endpoint: [
            {
              type: 'phone',
              number: transferNumber
            }
          ],
          eventUrl: [`${process.env.BASE_URL || 'http://localhost:3000'}/api/ivr/transfer`],
          eventMethod: 'POST'
        }
      ];

      return NextResponse.json(ncco);
    }

  } catch (error) {
    console.error('Inbound call error:', error);
    
    // Return fallback NCCO
    return NextResponse.json([
      {
        action: 'talk',
        text: 'We are experiencing technical difficulties. Please try calling again later.',
        voiceName: 'Amy'
      }
    ]);
  }
}

/**
 * Handle call events (for call status updates)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      conversation_uuid, 
      status, 
      direction,
      from,
      to,
      duration,
      start_time,
      end_time 
    } = body;

    if (!conversation_uuid) {
      return NextResponse.json({ error: 'Missing conversation_uuid' }, { status: 400 });
    }

    // Update call record
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (duration) updateData.duration = parseInt(duration);
    if (start_time) updateData.started_at = new Date(start_time).toISOString();
    if (end_time) updateData.ended_at = new Date(end_time).toISOString();

    await supabaseAdmin
      .from('calls')
      .update(updateData)
      .eq('vonage_call_id', conversation_uuid);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Call event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
