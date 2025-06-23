import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/app/utils/supabaseClient';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error("CRITICAL: Twilio credentials are not set in the environment variables.");
  throw new Error('Twilio credentials are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const body = await request.json();
  const { search, buy, workspace_id } = body;

  try {
    if (search) {
      const numbers = await client.availablePhoneNumbers('US').local.list({ areaCode: search });
      return NextResponse.json({ numbers });
    }
    if (buy) {
      try {
        const purchased = await client.incomingPhoneNumbers.create({ phoneNumber: buy });
        const { error: dbError } = await supabase
          .from('numbers')
          .insert([{ phone_number: buy, workspace_id }]);
        if (dbError) {
          return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ purchased });
      } catch (buyError) {
        console.error('Twilio Buy Error:', buyError);
        return NextResponse.json({ error: (buyError as any).message || 'Failed to purchase number.' }, { status: 500 });
      }
    }
    return NextResponse.json({ error: 'Missing search or buy parameter' }, { status: 400 });
  } catch (error: any) {
    console.error("Twilio API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
