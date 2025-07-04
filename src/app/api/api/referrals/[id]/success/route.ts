import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const referralId = params.id;
    const body = await request.json();
    
    if (!body.referredUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'referredUserId is required' 
        },
        { status: 400 }
      );
    }

    // Update referral as successful
    const { data, error } = await supabase
      .from('referrals')
      .update({
        referred_user_id: body.referredUserId,
        status: 'successful',
        completed_at: new Date().toISOString()
      })
      .eq('id', referralId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Referral not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Referral marked as successful'
    });
  } catch (error) {
    console.error('Error marking referral as successful:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark referral as successful' 
      },
      { status: 500 }
    );
  }
}
