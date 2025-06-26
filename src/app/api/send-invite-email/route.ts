import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email, workspaceName, inviteLink } = await req.json();
  if (!email || !inviteLink) {
    return NextResponse.json({ error: 'Missing email or invite link' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS
    }
  });

  try {
    console.log('Attempting to send invite email...');
    const result = await transporter.sendMail({
      from: 'hamid@sprtags.io',
      to: email,
      subject: `You've been invited to join ${workspaceName || 'a workspace'} on LoCall!`,
      html: `<p>You've been invited to join the workspace "${workspaceName || 'LoCall'}".<br>Click <a href="${inviteLink}">here</a> to join.</p>`
    });
    console.log('SendMail result:', result);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite email error:', error);
    return NextResponse.json({ error: 'Failed to send invite email.' }, { status: 500 });
  }
}
