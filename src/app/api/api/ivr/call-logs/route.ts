import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('ivr_call_logs').select('*');
    if (error) {
      return NextResponse.json({ success: false, error: JSON.stringify(error, null, 2) }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: JSON.stringify(error, null, 2) }, { status: 500 });
  }
}
