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
  const { name, phone, message, from, workspace_id, user_id, form_name, visitor_id } = await request.json();

  const { error } = await supabase
    .from('form_submissions')
    .insert([
      {
        name,
        phone,
        message,
        from,
        workspace_id,
        user_id,
        form_name,
        visitor_id,
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
