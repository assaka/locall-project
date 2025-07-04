import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isAfterHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  // Example: after hours is before 9am or after 5pm
  return hour < 9 || hour > 17;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validate required fields
  if (!body.phone_number || !body.call_status) {
    return NextResponse.json({ success: false, error: 'Missing required fields: phone_number or call_status' }, { status: 400 });
  }
  try {
    // --- Begin IVRController.handleVonageWebhook logic ---
    const { phone_number, call_status, dtmf_input } = body;
    const afterHours = isAfterHours();
    // Log the call
    const { data, error } = await supabaseAdmin.from('ivr_call_logs').insert({
      phone_number,
      call_status,
      dtmf_input,
      is_after_hours: afterHours
    }).select().single();
    if (error) throw error;
    let result;
    if (afterHours && !dtmf_input) {
      result = {
        action: 'talk',
        text: 'Press 1 to schedule an appointment.'
      };
    } else if (dtmf_input === '1') {
      // Send Calendly SMS
      try {
        const calendly_link = process.env.CALENDLY_LINK || 'https://calendly.com/your-link';
        await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/sms/send-calendly`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number,
            calendly_link,
            call_id: data.id
          })
        });
      } catch (error) {
        console.error('Failed to send Calendly SMS:', error);
      }
      
      result = {
        action: 'talk',
        text: 'Thank you. We will send you a text message with a link to schedule your appointment.'
      };
    } else if (dtmf_input) {
      result = {
        action: 'talk',
        text: 'Thank you. We will contact you to schedule your appointment.'
      };
    } else {
      result = { action: 'continue' };
    }
    // --- End IVRController.handleVonageWebhook logic ---
    return NextResponse.json({ success: true, result });
  } catch (error) {
    // Log the error to the server console for debugging
    // eslint-disable-next-line no-console
    console.error('IVR Webhook Error:', error);
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      message = JSON.stringify(error, null, 2);
    } else {
      message = String(error);
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
}
