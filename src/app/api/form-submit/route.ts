import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioNumber) {
  throw new Error('Twilio credentials or phone number are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { name, phone, message, workspace_id, from } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('form_submissions')
    .insert([{ name, phone, message, workspace_id }]);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  try {
    const sms = await client.messages.create({
      body: `From ${name || 'Unknown'}: ${message || ''}`,
      from,
      to: phone,
    });
    return NextResponse.json({ success: true, sid: sms.sid });
  } catch (error: any) {
    console.error('Twilio SMS Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS.' }, { status: 500 });
  }
}
