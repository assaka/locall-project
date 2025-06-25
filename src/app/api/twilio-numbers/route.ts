import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspace_id = searchParams.get('workspace_id');
  const user_id = searchParams.get('user_id');
  let query = supabase.from('numbers').select('*');
  if (workspace_id) query = query.eq('workspace_id', workspace_id);
  if (user_id) query = query.eq('user_id', user_id);
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ numbers: data });
} 