import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import axios from 'axios';

interface VonageNumber {
  msisdn: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  const { phone_number, user_id, workspace_id } = await request.json();
  if (!phone_number || !user_id || !workspace_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('numbers')
    .select('*')
    .eq('phone_number', phone_number)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existing && existing.user_id) {
    return NextResponse.json({ error: 'Number is already assigned' }, { status: 400 });
  }

  if (!existing) {
    let vonageNumbers: VonageNumber[];
    try {
      const response = await axios.get('https://rest.nexmo.com/account/numbers', {
        params: {
          api_key: process.env.VONAGE_API_KEY,
          api_secret: process.env.VONAGE_API_SECRET,
        },
      });
      vonageNumbers = response.data.numbers || [];
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error_text?: string } }, message?: string };
      return NextResponse.json({ error: 'Failed to fetch numbers from Vonage: ' + (error.response?.data?.error_text || error.message) }, { status: 500 });
    }
    const vonageNum = vonageNumbers.find((n: VonageNumber) => n.msisdn === phone_number);
    if (!vonageNum) {
      return NextResponse.json({ error: 'Number not found in Vonage account' }, { status: 404 });
    }
    const { error: insertError } = await supabase
      .from('numbers')
      .insert([{
        vonage_number_id: vonageNum.msisdn,
        phone_number: vonageNum.msisdn,
        user_id,
        workspace_id,
        purchased_at: new Date().toISOString(),
        friendly_name: vonageNum.friendly_name || null,
        is_active: true
      }]);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } else {
    const { error } = await supabase
      .from('numbers')
      .update({ user_id })
      .eq('phone_number', phone_number);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }
}
