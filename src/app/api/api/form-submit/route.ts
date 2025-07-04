import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const { form_id, user_id, form_data, utm_source, utm_medium, utm_campaign, page_url } = body;
    const { data, error } = await supabase.from('form_tracking').insert({
      form_id,
      user_id,
      form_data,
      utm_source,
      utm_medium,
      utm_campaign,
      page_url
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
  try {
    const { data, error } = await supabase.from('form_tracking').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
