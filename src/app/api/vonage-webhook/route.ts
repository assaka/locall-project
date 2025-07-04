import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callId = body.uuid;
    const callStatus = body.status;
    const duration = body.duration;
    const recordingUrl = body.recording_url;

    if (!callId) {
      return NextResponse.json({ error: 'Missing call UUID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('calls')
      .update({
        status: callStatus,
        duration: duration ? parseInt(duration) : null,
        recording_url: recordingUrl || null,
      })
      .eq('vonage_call_id', callId);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  } catch (err: unknown) {
    let message = 'Vonage webhook error';
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'object' && err && 'message' in err) {
      message = String((err as { message: unknown }).message);
    }
    console.error('Vonage webhook error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
