import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voicemail_id, phone_number, recording_url, duration } = body;

    if (!voicemail_id || !phone_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get workspace information based on the number
    const { data: numberData } = await supabaseAdmin
      .from('numbers')
      .select(`
        workspace_id,
        workspaces (
          id,
          name,
          notification_email
        )
      `)
      .eq('phone_number', phone_number)
      .single();

    if (!numberData?.workspaces) {
      console.warn(`No workspace found for number: ${phone_number}`);
      return NextResponse.json({ success: true, message: 'No workspace configured' });
    }

    const workspace = numberData.workspaces as any;
    
    // Get workspace users separately
    const { data: workspaceUsers } = await supabaseAdmin
      .from('workspace_users')
      .select(`
        users (
          email,
          phone
        )
      `)
      .eq('workspace_id', workspace.id);

    const notificationEmail = workspace.notification_email || (workspaceUsers?.[0]?.users as any)?.email;

    if (!notificationEmail) {
      console.warn(`No notification email configured for workspace: ${workspace.id}`);
      return NextResponse.json({ success: true, message: 'No notification email configured' });
    }

    // Send email notification
    const emailPayload = {
      to: notificationEmail,
      subject: `New Voicemail from ${phone_number}`,
      html: `
        <h2>New Voicemail Received</h2>
        <p><strong>From:</strong> ${phone_number}</p>
        <p><strong>Duration:</strong> ${duration ? `${duration} seconds` : 'Unknown'}</p>
        <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Recording:</strong> <a href="${recording_url}">Listen to voicemail</a></p>
        
        <hr>
        <p><small>This is an automated notification from ${workspace.name || 'LoCall'}. 
        You can manage your notification preferences in your dashboard.</small></p>
      `,
      text: `
        New Voicemail Received
        
        From: ${phone_number}
        Duration: ${duration ? `${duration} seconds` : 'Unknown'}
        Received: ${new Date().toLocaleString()}
        Recording: ${recording_url}
        
        This is an automated notification from ${workspace.name || 'LoCall'}.
      `
    };

    const emailResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload)
    });

    if (!emailResponse.ok) {
      console.error('Failed to send email notification');
    }

    // Send SMS notification if phone number is configured
    const notificationPhone = (workspaceUsers?.[0]?.users as any)?.phone;
    if (notificationPhone) {
      const smsPayload = {
        to: notificationPhone,
        message: `New voicemail from ${phone_number}. Duration: ${duration ? `${duration}s` : 'Unknown'}. Check your dashboard for details.`
      };

      const smsResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload)
      });

      if (!smsResponse.ok) {
        console.error('Failed to send SMS notification');
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notifications sent successfully' 
    });

  } catch (error) {
    console.error('Voicemail notification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
