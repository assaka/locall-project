import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('list') === 'all') {
      // List all referral codes and their UUIDs
      const { data, error } = await supabase.from('referrals').select('id, referral_code');
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const referralCode = params.code;
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined;
    const referrerUrl = request.headers.get('referer') || undefined;

    // Track the referral click (insert into analytics table)
    await supabase.from('referral_analytics').insert({
      referral_code: referralCode,
      ip,
      user_agent: userAgent,
      referrer_url: referrerUrl,
      timestamp: new Date().toISOString()
    });

    // Get referral details
    const { data: referral, error } = await supabase.from('referrals').select('*').eq('referral_code', referralCode).maybeSingle();
    if (error) throw error;
    if (!referral) {
      return NextResponse.json({
        success: false,
        error: 'Referral not found'
      }, { status: 404 });
    }

    // Return referral landing page data
    return NextResponse.json({
      success: true,
      data: {
        referralCode,
        welcomeMessage: `Welcome! You've been referred by someone awesome!`,
        rewards: referral.rewards?.referredReward,
        expiryDate: referral.conditions?.expiryDate,
        landingPageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?ref=${referralCode}`
      }
    });

  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process referral'
    }, { status: 500 });
  }
}
