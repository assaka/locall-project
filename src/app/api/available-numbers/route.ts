import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function GET() {
  const twilioNumbers = await client.incomingPhoneNumbers.list();

  const { data: assignedNumbers, error } = await supabase
    .from('numbers')
    .select('phone_number, user_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assignedSet = new Set(
    (assignedNumbers || [])
      .filter(n => n.user_id)
      .map(n => n.phone_number)
  );

  const availableNumbers = twilioNumbers.filter(
    n => !assignedSet.has(n.phoneNumber)
  );

  return NextResponse.json({ numbers: availableNumbers });
}
