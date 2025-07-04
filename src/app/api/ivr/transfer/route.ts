import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      conversation_uuid,
      from,
      to,
      status,
      direction,
      duration 
    } = body;

    if (!conversation_uuid || !from) {
      return NextResponse.json({ error: 'Missing required fields: conversation_uuid, from' }, { status: 400 });
    }

    // Log the transfer event
    const { error } = await supabaseAdmin
      .from('call_transfers')
      .insert({
        conversation_uuid,
        from_number: from,
        to_number: to,
        status: status || 'attempted',
        direction: direction || 'outbound',
        duration: duration ? parseInt(duration) : null,
        transferred_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging transfer:', error);
      return NextResponse.json({ error: 'Failed to log transfer' }, { status: 500 });
    }

    // Update the original call record
    await supabaseAdmin
      .from('calls')
      .update({
        status: status === 'answered' ? 'transferred' : 'transfer_failed',
        updated_at: new Date().toISOString()
      })
      .eq('vonage_call_id', conversation_uuid);

    return NextResponse.json({ 
      success: true,
      message: 'Transfer logged successfully' 
    });

  } catch (error) {
    console.error('Transfer webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
