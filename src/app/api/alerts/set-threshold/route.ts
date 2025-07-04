import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  const { userId, threshold } = await request.json();
  if (!userId || threshold === undefined) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const { data: alert } = await supabase.from('alerts').select('*').eq('user_id', userId).single();
  let updatedAlert;
  if (alert) {
    const { data } = await supabase.from('alerts').update({ balance_threshold: threshold }).eq('user_id', userId).select().single();
    updatedAlert = data;
  } else {
    const { data } = await supabase.from('alerts').insert({ user_id: userId, balance_threshold: threshold, alert_status: false }).select().single();
    updatedAlert = data;
  }
  return NextResponse.json({ success: true, data: updatedAlert });
}
