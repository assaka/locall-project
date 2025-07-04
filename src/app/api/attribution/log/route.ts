import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    // Parse and store attribution data from webhook or call
    // Expected fields: phone_number, ad_source, ad_id, keyword, campaign_id, utm_source, utm_medium, utm_campaign, click_to_call, cost_per_click, lead_metadata
    const { error } = await supabase.from('attribution_logs').insert(body);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      message = JSON.stringify(error, null, 2);
    } else {
      message = String(error);
    }
    // Also log the error to the server console for debugging
    console.error('Attribution log error:', message, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
