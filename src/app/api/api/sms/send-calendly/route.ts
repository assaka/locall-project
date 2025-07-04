import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sendVonageSMS(phone_number: string, calendly_link: string): Promise<string> {
  const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
  const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
  const FROM = process.env.VONAGE_FROM || 'Vonage';
  const text = `Schedule your appointment: ${calendly_link}`;
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
  return result.messages && result.messages[0] && result.messages[0].status === '0' ? 'delivered' : 'failed';
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // body should include: phone_number, calendly_link, call_id
  try {
    const { phone_number, calendly_link, call_id } = body;
    const sms_status = await sendVonageSMS(phone_number, calendly_link);
    const { data, error } = await supabase.from('sms_calendly').insert({
      phone_number,
      calendly_link,
      call_id,
      sms_status
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
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
