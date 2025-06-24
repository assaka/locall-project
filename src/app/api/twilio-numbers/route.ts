import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function GET() {
  try {
    const numbers = await client.incomingPhoneNumbers.list();
    const voiceNumbers = numbers.filter(num => num.capabilities.voice);
    return NextResponse.json({ numbers: voiceNumbers.map(num => ({
      sid: num.sid,
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
    })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 