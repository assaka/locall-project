import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials or phone number are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const {
    name,
    phone,
    message,
    workspace_id,
    agency_id,
    user_id,
    form_name,
    source,
    ip_address,
    user_agent,
    from,
    visitor_id
  } = await request.json();

  if (!phone || !workspace_id || !form_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('form_submissions')
    .insert([
      {
        workspace_id,
        agency_id: agency_id || null,
        user_id: user_id || null,
        visitor_id: visitor_id || null,
        form_name,
        data: { name, phone, message },
        source: source || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
      }
    ]);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  try {
    const sms = await client.messages.create({
      body: `From ${name || 'Unknown'}: ${message || ''}`,
      from: from,
      to: phone,
    });
    return NextResponse.json({ success: true, sid: sms.sid });
  } catch (error: unknown) {
    let message = 'Failed to send SMS.';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }
    console.error('Twilio SMS Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
