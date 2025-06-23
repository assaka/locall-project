import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { from, to } = await request.json();

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from,
    });
    return NextResponse.json({ sid: call.sid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
