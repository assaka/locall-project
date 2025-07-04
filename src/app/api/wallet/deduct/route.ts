import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  const { userId, amount } = await request.json();
  if (!userId || !amount) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
  if (!wallet || wallet.balance < amount) return NextResponse.json({ success: false, error: 'Insufficient balance or wallet not found' }, { status: 400 });
  const newBalance = wallet.balance - amount;
  const { data: updatedWallet } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId).select().single();
  await supabase.from('transactions').insert({ user_id: userId, transaction_type: 'deduct', amount, date: new Date().toISOString() });
  return NextResponse.json({ success: true, data: updatedWallet });
}
