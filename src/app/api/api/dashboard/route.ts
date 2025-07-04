import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
  try {
    // Dashboard logic: fetch wallet, transactions, form submissions, referrals
    const [walletRes, transactionsRes, formSubmissionsRes, referralsRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', userId).single(),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('form_tracking').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('referrals').select('*').eq('user_id', userId)
    ]);
    return NextResponse.json({
      success: true,
      data: {
        wallet: walletRes.data,
        transactions: transactionsRes.data || [],
        formSubmissions: formSubmissionsRes.data || [],
        referrals: referralsRes.data || []
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
