import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import axios from 'axios';

const VONAGE_API_KEY = process.env.VONAGE_API_KEY!;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET!;

interface VonageSmsErrorResponse {
  messages: { 'error-text'?: string }[];
}

export async function POST(request: Request) {
  const { name, phone, message, workspace_id, user_id, form_name, source, ip_address, user_agent, from } = await request.json();

  try {
    const params = new URLSearchParams({
      api_key: VONAGE_API_KEY,
      api_secret: VONAGE_API_SECRET,
      to: phone,
      from: from || 'Vonage',
      text: message,
    });
    await axios.post('https://rest.nexmo.com/sms/json', params);
  } catch (err: unknown) {
    let errorMsg = 'Failed to send SMS';
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      Array.isArray((err.response.data as VonageSmsErrorResponse).messages)
    ) {
      const messages = (err.response.data as VonageSmsErrorResponse).messages;
      errorMsg = 'Failed to send SMS: ' + (messages?.[0]?.['error-text'] || 'Unknown error');
    } else if (err instanceof Error) {
      errorMsg = err.message;
    } else {
      errorMsg = String(err);
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }

  const { error } = await supabase
    .from('form_submissions')
    .insert([
      {
        workspace_id,
        user_id,
        form_name,
        data: { name, phone, message },
        source: source || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        from_number: from || null,
        to_number: phone || null
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
