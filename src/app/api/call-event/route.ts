import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: Request) {
  try {
    const { call_id, type, message } = await request.json();
    if (!call_id || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error: fetchError } = await supabase
      .from('calls')
      .select('events')
      .eq('id', call_id)
      .single();
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    const events = Array.isArray(data?.events) ? data.events : [];
    const newEvent = {
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    const updatedEvents = [...events, newEvent];
    const { error: updateError } = await supabase
      .from('calls')
      .update({ events: updatedEvents })
      .eq('id', call_id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, event: newEvent });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'object' && err && 'message' in err) {
      message = String((err as { message: unknown }).message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
