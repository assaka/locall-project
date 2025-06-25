import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: Request) {
  const { name, phone, message, workspace_id, user_id, form_name, source, ip_address, user_agent, from } = await request.json();

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
