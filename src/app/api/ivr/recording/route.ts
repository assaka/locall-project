import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recording_url, 
      recording_uuid, 
      conversation_uuid,
      from,
      to,
      size,
      duration 
    } = body;

    if (!recording_url || !from) {
      return NextResponse.json({ error: 'Missing required fields: recording_url, from' }, { status: 400 });
    }

    // Store the voicemail recording
    const { data, error } = await supabaseAdmin
      .from('voicemails')
      .insert({
        phone_number: from,
        to_number: to,
        recording_url,
        recording_uuid,
        conversation_uuid,
        duration: duration ? parseInt(duration) : null,
        size: size ? parseInt(size) : null,
        status: 'received',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing voicemail:', error);
      return NextResponse.json({ error: 'Failed to store voicemail' }, { status: 500 });
    }

    // Send notification to business owner
    try {
      await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/notifications/voicemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voicemail_id: data.id,
          phone_number: from,
          recording_url,
          duration
        })
      });
    } catch (notificationError) {
      console.error('Failed to send voicemail notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      voicemail_id: data.id,
      message: 'Voicemail received successfully' 
    });

  } catch (error) {
    console.error('Voicemail recording error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
