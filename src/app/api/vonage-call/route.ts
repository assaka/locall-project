import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/app/utils/supabaseClient';
import jwt from 'jsonwebtoken';
import { getVonagePrivateKey } from '@/app/utils/getVonagePrivateKey';

const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID!;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function generateVonageJwt() {
  const privateKey = getVonagePrivateKey();
  const payload = {
    application_id: VONAGE_APPLICATION_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: Math.random().toString(36).substring(2),
  };
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

export async function POST(request: Request) {
  const { from, to, workspace_id, user_id, visitor_id } = await request.json();

  try {
    const token = generateVonageJwt();
    const payload = {
      to: [{ type: 'phone', number: to }],
      from: { type: 'phone', number: from },
      ncco: [
        {
          action: 'connect',
          from,
          endpoint: [{ type: 'phone', number: to }],
          record: true,
        },
      ],
      event_url: [`${BASE_URL}/api/vonage-webhook`],
      event_method: 'POST',
    };

    const response = await axios.post(
      'https://api.nexmo.com/v1/calls',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const call = response.data;

    const { error: dbError } = await supabase
      .from('calls')
      .insert([{ 
        vonage_call_id: call.uuid,
        from_number: from,
        to_number: to,
        user_id,
        visitor_id: visitor_id || null,
        workspace_id,
        direction: 'outbound',
        status: 'started',
        started_at: new Date().toISOString()
      }]);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ uuid: call.uuid });
  } catch (error: unknown) {
    let message = 'Vonage Call Error';
    if (error instanceof Error && error.message) {
      message = error.message;
    } else if (typeof error === 'object' && error && 'data' in error && typeof error.data === 'string') {
      message = error.data;
    }
    console.error('Vonage Call Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
