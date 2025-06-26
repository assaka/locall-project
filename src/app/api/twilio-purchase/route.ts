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
  const { search, buy, workspace_id, user_id } = body;

  try {
    if (search) {
      const numbers = await client.availablePhoneNumbers('US').local.list({ areaCode: search });
      return NextResponse.json({ numbers });
    }
    if (buy) {
      if (!workspace_id || !user_id) {
        return NextResponse.json({ error: 'workspace_id and user_id are required' }, { status: 400 });
      }
      try {
        const purchased = await client.incomingPhoneNumbers.create({ phoneNumber: buy });
        const { error: dbError } = await supabase
          .from('numbers')
          .insert([{ 
            twilio_sid: purchased.sid,
            phone_number: buy,
            user_id,
            workspace_id,
            purchased_at: new Date().toISOString(),
            friendly_name: purchased.friendlyName,
            is_active: true
          }]);
        if (dbError) {
          return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ purchased });
      } catch (err: unknown) {
        console.error('Twilio Buy Error:', err);
        return NextResponse.json({ error: (err as Error)?.message || 'Failed to purchase number.' }, { status: 500 });
      }
    }
    return NextResponse.json({ error: 'Missing search or buy parameter' }, { status: 400 });
  } catch (err: unknown) {
    console.error("Twilio API Error:", err);
    return NextResponse.json({ error: (err as Error)?.message || 'An error occurred' }, { status: 500 });
  }
}
