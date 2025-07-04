import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import axios from 'axios';

interface VonageNumber {
  msisdn: string;
  [key: string]: unknown;
}

function getVonageNumbers(): Promise<VonageNumber[]> {
  return axios.get('https://rest.nexmo.com/account/numbers', {
    params: {
      api_key: process.env.VONAGE_API_KEY,
      api_secret: process.env.VONAGE_API_SECRET,
    },
  }).then(res => res.data.numbers || []);
}

export async function GET() {
  let vonageNumbers: VonageNumber[] = [];
  try {
    vonageNumbers = await getVonageNumbers();
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error_text?: string } }, message?: string };
    return NextResponse.json({ error: 'Failed to fetch numbers from Vonage: ' + (error.response?.data?.error_text || error.message) }, { status: 500 });
  }

  const { data: assignedNumbers, error } = await supabase
    .from('numbers')
    .select('phone_number, user_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assignedSet = new Set(
    (assignedNumbers || [])
      .filter(n => n.user_id)
      .map(n => n.phone_number)
  );

  const availableNumbers = vonageNumbers.filter(
    n => !assignedSet.has(n.msisdn)
  ).map(n => ({
    ...n,
    phoneNumber: n.msisdn,
  }));

  return NextResponse.json({ numbers: availableNumbers });
}
