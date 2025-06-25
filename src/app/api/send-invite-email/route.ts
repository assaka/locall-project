import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, workspaceName, inviteLink } = await req.json();
  if (!email || !inviteLink) {
    return NextResponse.json({ error: 'Missing email or invite link' }, { status: 400 });
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return NextResponse.json({ error: 'Missing SendGrid API key' }, { status: 500 });
  }

  const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email }],
          subject: `You've been invited to join ${workspaceName || 'a workspace'} on LoCall!`,
        },
      ],
      from: { email: 'noreply@yourdomain.com', name: 'LoCall' },
      content: [
        {
          type: 'text/plain',
          value: `You've been invited to join the workspace "${workspaceName || 'LoCall'}".\n\nClick here to join: ${inviteLink}`,
        },
      ],
    }),
  });

  if (!sgRes.ok) {
    const error = await sgRes.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
