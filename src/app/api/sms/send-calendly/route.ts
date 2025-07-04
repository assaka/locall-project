import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sendVonageSMS(phone_number: string, calendly_link: string): Promise<{ status: string; messageId?: string; error?: string }> {
  const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
  const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
  const FROM = process.env.VONAGE_FROM || process.env.BUSINESS_PHONE || 'LoCall';
  
  const text = `Hi! Thank you for calling. Please use this link to schedule your appointment: ${calendly_link}
  
If you have any questions, feel free to call us back. We look forward to serving you!`;

  try {
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
        to: phone_number,
        from: FROM,
        text
      })
    });

    const result = await response.json();
    
    if (result.messages && result.messages[0]) {
      const message = result.messages[0];
      if (message.status === '0') {
        return { status: 'delivered', messageId: message['message-id'] };
      } else {
        return { status: 'failed', error: message['error-text'] || 'Unknown error' };
      }
    }
    
    return { status: 'failed', error: 'No response from Vonage' };
  } catch (error) {
    console.error('Vonage SMS error:', error);
    return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, calendly_link, call_id } = body;

    if (!phone_number || !calendly_link) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: phone_number and calendly_link' 
      }, { status: 400 });
    }

    // Send the SMS
    const smsResult = await sendVonageSMS(phone_number, calendly_link);
    
    // Store the SMS record
    const { data, error } = await supabase.from('sms_calendly').insert({
      phone_number,
      calendly_link,
      call_id,
      sms_status: smsResult.status,
      message_id: smsResult.messageId,
      error_message: smsResult.error
    }).select().single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to store SMS record' 
      }, { status: 500 });
    }

    // Send confirmation SMS if original was successful
    if (smsResult.status === 'delivered') {
      return NextResponse.json({ 
        success: true, 
        data: {
          ...data,
          message: 'Calendly link sent successfully'
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to send SMS: ${smsResult.error}`,
        data 
      }, { status: 500 });
    }

  } catch (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      message = JSON.stringify(error, null, 2);
    } else {
      message = String(error);
    }
    console.error('SMS send-calendly error:', message, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
