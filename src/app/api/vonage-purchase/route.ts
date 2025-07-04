import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import { WalletService } from '@/lib/wallet-service';
import { calculateCost } from '@/lib/pricing';
import axios from 'axios';
import { COUNTRY_CODE_MAP } from '../../constant/countries';

const VONAGE_API_KEY = process.env.VONAGE_API_KEY!;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET!;
const TYPE_MAP: Record<string, string> = {
  'mobile': 'mobile-lvn',
  'landline': 'landline',
  'toll-free': 'landline-toll-free',
  'any': 'any',
};

interface VonageNumber {
  msisdn?: string;
  phoneNumber?: string;
  features?: string[] | string;
  cost?: string;
  monthlyCost?: string;
  currency?: string;
  setupCost?: string;
  setup_fee?: string;
  initialPrice?: string;
  [key: string]: unknown;
}

function formatFriendlyName(msisdn: string, country: string) {
  if (!msisdn) return '';
  if ((country === 'US' || country === 'CA') && msisdn.length === 11 && msisdn.startsWith('1')) {
    return `+1 ${msisdn.slice(1,4)}-${msisdn.slice(4,7)}-${msisdn.slice(7)}`;
  }
  if (country === 'GB' && msisdn.length === 12 && msisdn.startsWith('44')) {
    return `+44 ${msisdn.slice(2,6)} ${msisdn.slice(6)}`;
  }
  if (country === 'DE' && msisdn.length > 2 && msisdn.startsWith('49')) {
    return `+49 ${msisdn.slice(2,6)} ${msisdn.slice(6)}`;
  }
  if (country === 'FR' && msisdn.length === 11 && msisdn.startsWith('33')) {
    return `+33 ${msisdn.slice(2,3)} ${msisdn.slice(3,5)} ${msisdn.slice(5,7)} ${msisdn.slice(7,9)} ${msisdn.slice(9)}`;
  }
  const code = COUNTRY_CODE_MAP[country];
  if (code && msisdn.startsWith(code)) {
    return `+${code} ${msisdn.slice(code.length)}`;
  }
  return `+${msisdn}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    pattern = '',
    searchPattern = 'contains',
    country = 'US',
    type = 'any',
    features = ['SMS', 'VOICE', 'MMS'],
    msisdn,
    workspace_id,
    user_id,
  } = body;

  const searchPatternMap: Record<string, number> = { starts: 0, contains: 1, ends: 2 };
  let finalPattern = pattern;
  if (searchPattern === 'starts' && pattern) {
    const countryCode = COUNTRY_CODE_MAP[country] || '';
    finalPattern = countryCode + pattern;
  }
  const apiType = TYPE_MAP[type] || type;

  try {
    if (msisdn) {
      if (!workspace_id || !user_id) {
        return NextResponse.json({ error: 'workspace_id and user_id are required' }, { status: 400 });
      }
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user_id)
        .single();
      if (userError || !userData) {
        return NextResponse.json({ error: 'Could not fetch user balance' }, { status: 500 });
      }
      const numberCost = parseFloat(body.cost || '0');
      if (!numberCost || isNaN(numberCost)) {
        return NextResponse.json({ error: 'Number cost is required for purchase' }, { status: 400 });
      }
      if (userData.balance < numberCost) {
        return NextResponse.json({ error: 'Insufficient balance. Please top up your account.' }, { status: 402 });
      }
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: userData.balance - numberCost })
        .eq('id', user_id);
      if (updateError) {
        return NextResponse.json({ error: 'Failed to deduct balance' }, { status: 500 });
      }
      const params = {
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
        country,
        msisdn,
      };
      const response = await axios.post('https://rest.nexmo.com/number/buy', null, { params });
      const friendlyName = formatFriendlyName(msisdn, country);
      const { error: dbError } = await supabase
        .from('numbers')
        .insert([{ 
          vonage_number_id: msisdn,
          phone_number: msisdn,
          user_id,
          workspace_id,
          purchased_at: new Date().toISOString(),
          friendly_name: friendlyName,
          is_active: true
        }]);
      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
      if (userData.balance - numberCost < 5) {
        console.log(`User ${user_id} balance is low: ${userData.balance - numberCost}`);
      }
      return NextResponse.json({ success: true, data: response.data });
    }
    const params: Record<string, unknown> = {
      api_key: VONAGE_API_KEY,
      api_secret: VONAGE_API_SECRET,
      country,
      pattern: finalPattern,
      search_pattern: searchPatternMap[searchPattern] ?? 0,
      size: 20,
    };
    if (apiType !== 'any') params.type = apiType;
    if (features && features.length) params.features = Array.isArray(features) ? features.join(',') : features;
    const response = await axios.get('https://rest.nexmo.com/number/search', { params });
    const numbers = (response.data.numbers || []).map((n: VonageNumber) => ({
      ...n,
      cost: n.cost || n.monthlyCost || '',
      monthlyCost: n.monthlyCost || n.cost || '',
      currency: n.currency || '€',
      setupCost: n.setupCost || n.setup_fee || '',
    }));
    return NextResponse.json({ numbers });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
