import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/app/utils/supabaseClient';
import sgMail from '@sendgrid/mail';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in the environment variables.');
}

const client = twilio(accountSid, authToken);

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const adminEmail = process.env.ADMIN_EMAIL || '';

export async function POST(request: Request) {
  const { from, to, workspace_id, user_id, visitor_id } = await request.json();

  try {
    const call = await client.calls.create({
      url: `${baseUrl}/api/twilio-voice?to=${encodeURIComponent(to)}`,
      to,
      from,
      statusCallback: `${baseUrl}/api/twilio-webhook`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: true,
    });

    const { error: dbError } = await supabase
      .from('calls')
      .insert([{ 
        twilio_sid: call.sid,
        from_number: from,
        to_number: to,
        user_id,
        visitor_id: visitor_id || null,
        workspace_id,
        direction: 'outbound',
        status: 'initiated',
        started_at: new Date().toISOString()
      }]);

    if (!dbError && adminEmail && process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to: adminEmail,
          from: adminEmail,
          subject: 'New Call Initiated',
          text: `A new call was initiated.\nFrom: ${from}\nTo: ${to}\nWorkspace: ${workspace_id}\nUser: ${user_id}\nTime: ${new Date().toLocaleString()}`,
        });
      } catch (err) {
        console.error('SendGrid Email Error:', err);
      }
    }

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ sid: call.sid });
  } catch (error: unknown) {
    let message = 'Twilio Call Error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }
    console.error('Twilio Call Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
