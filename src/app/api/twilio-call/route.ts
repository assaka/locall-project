import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/app/utils/supabaseClient';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { from, to, workspace_id, number_id } = await request.json();

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from,
      statusCallback: `${baseUrl}/api/twilio-webhook`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });

    const { error: dbError } = await supabase
      .from('calls')
      .insert([{ from, to, status: 'initiated', workspace_id, number_id, sid: call.sid }]);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ sid: call.sid });
  } catch (error: any) {
    console.error('Twilio Call Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
