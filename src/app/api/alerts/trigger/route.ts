import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
  const { data: alert } = await supabase.from('alerts').select('*').eq('user_id', userId).single();
  if (!alert) return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
  const { data: updatedAlert } = await supabase.from('alerts').update({ alert_status: true }).eq('user_id', userId).select().single();
  return NextResponse.json({ success: true, data: updatedAlert });
}
