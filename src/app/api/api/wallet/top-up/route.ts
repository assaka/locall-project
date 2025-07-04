import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  const { userId, amount, currency } = await request.json();
  if (!userId || !amount || !currency) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
  if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
  const newBalance = wallet.balance + amount;
  const { data: updatedWallet } = await supabase.from('wallets').update({ balance: newBalance, currency }).eq('user_id', userId).select().single();
  await supabase.from('transactions').insert({ user_id: userId, transaction_type: 'top-up', amount, date: new Date().toISOString() });
  return NextResponse.json({ success: true, data: updatedWallet });
}
