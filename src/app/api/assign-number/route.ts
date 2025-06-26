import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { phone_number, user_id, workspace_id } = await request.json();
  if (!phone_number || !user_id || !workspace_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('numbers')
    .select('*')
    .eq('phone_number', phone_number)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existing && existing.user_id) {
    return NextResponse.json({ error: 'Number is already assigned' }, { status: 400 });
  }

  if (!existing) {
    const twilioNumbers = await client.incomingPhoneNumbers.list();
    const twilioNum = twilioNumbers.find(n => n.phoneNumber === phone_number);
    if (!twilioNum) {
      return NextResponse.json({ error: 'Number not found in Twilio account' }, { status: 404 });
    }
    const { error: insertError } = await supabase
      .from('numbers')
      .insert([{
        twilio_sid: twilioNum.sid,
        phone_number: twilioNum.phoneNumber,
        user_id,
        workspace_id,
        purchased_at: new Date().toISOString(),
        friendly_name: twilioNum.friendlyName,
        is_active: true
      }]);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } else {
    const { error } = await supabase
      .from('numbers')
      .update({ user_id })
      .eq('phone_number', phone_number);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }
}
