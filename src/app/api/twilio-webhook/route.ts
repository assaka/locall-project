import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const callSid = params.get('CallSid');
    const callStatus = params.get('CallStatus');
    const duration = params.get('CallDuration');
    const recordingUrl = params.get('RecordingUrl');

    if (!callSid) {
      return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
    }

    const { error } = await supabase
      .from('calls')
      .update({
        status: callStatus,
        duration: duration ? parseInt(duration) : null,
        recording_url: recordingUrl || null,
      })
      .eq('sid', callSid);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  } catch (err: any) {
    console.error('Twilio webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 