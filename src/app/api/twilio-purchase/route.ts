import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error("CRITICAL: Twilio credentials are not set in the environment variables.");
  throw new Error('Twilio credentials are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const body = await request.json();
  const { search, buy } = body;

  try {
    if (search) {
      const numbers = await client.availablePhoneNumbers('US').local.list({ areaCode: search });
      return NextResponse.json({ numbers });
    }
    if (buy) {
      const purchased = await client.incomingPhoneNumbers.create({ phoneNumber: buy });
      return NextResponse.json({ purchased });
    }
    return NextResponse.json({ error: 'Missing search or buy parameter' }, { status: 400 });
  } catch (error: any) {
    console.error("Twilio API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 