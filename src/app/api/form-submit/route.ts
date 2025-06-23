import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioNumber) {
  throw new Error('Twilio credentials or phone number are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { name, phone, message } = await request.json();

  if (!name || !phone || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const sms = await client.messages.create({
      body: `From ${name}: ${message}`,
      from: twilioNumber,
      to: phone,
    });
    return NextResponse.json({ success: true, sid: sms.sid });
  } catch (error: any) {
    console.error('Twilio SMS Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS.' }, { status: 500 });
  }
}
