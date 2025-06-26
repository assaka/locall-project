import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(req: NextRequest) {
  const { email, workspaceName, workspace_id, invited_by } = await req.json();
  if (!email || !workspace_id) {
    return NextResponse.json({ error: 'Missing email or workspace_id' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Brevo API key not found in environment variables.' }, { status: 500 });
  }
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
  if (existingUser && existingUser.id) {
    const { data: existingMembership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', existingUser.id)
      .single();
    if (!existingMembership) {
      const { error } = await supabase.from('workspace_members').insert({
        user_id: existingUser.id,
        workspace_id,
        role: 'member',
        invited_by: invited_by || null,
      });
      if (error) {
        console.error('Failed to add member:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'LoCall', email: 'hamid@sprtags.io' },
        to: [{ email }],
        subject: `You've been added to ${workspaceName || 'a workspace'} on LoCall!`,
        htmlContent: `<p>You have been added to the workspace "${workspaceName || 'LoCall'}".<br>Log in to access it.</p>`
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Brevo API error:', data);
      return NextResponse.json({ error: data.message || 'Failed to send notification email.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, alreadyRegistered: true });
  }

  const { data: inviteInsert, error: dbError } = await supabase.from('invitations').insert([{
    email,
    workspace_id,
    invited_by: invited_by || null,
    status: 'pending',
    created_at: new Date().toISOString(),
  }]).select('id').single();
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth?invite_id=${inviteInsert.id}`;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'LoCall', email: 'hamid@sprtags.io' },
      to: [{ email }],
      subject: `You've been invited to join ${workspaceName || 'a workspace'} on LoCall!`,
      htmlContent: `<p>You've been invited to join the workspace "${workspaceName || 'LoCall'}".<br>Click <a href="${inviteLink}">here</a> to join.</p>`
    })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Brevo API error:', data);
    return NextResponse.json({ error: data.message || 'Failed to send invite email.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, inviteLink, data });
}
