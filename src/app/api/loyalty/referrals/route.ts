import { NextRequest, NextResponse } from 'next/server';

// Process a referral (when someone uses a referral code)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referralCode,
      workspaceId = 'default-workspace',
      conversionEvent,
      conversionValue,
      metadata = {}
    } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Mock successful referral processing
    const referral = {
      id: `ref_${Date.now()}`,
      referrer_id: 'user-1',
      referee_id: 'user-2',
      referral_code: referralCode,
      workspace_id: workspaceId,
      conversion_event: conversionEvent,
      conversion_value: conversionValue,
      metadata,
      fraud_score: Math.random() * 0.5,
      status: 'processed',
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      referral,
      status: 'processed'
    });

  } catch (error) {
    console.error('Referral processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get referral statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Mock referral data
    const mockReferrals = [
      {
        id: '1',
        referrer_id: 'user-1',
        referee_id: 'user-2',
        status: 'credited',
        reward_amount: 100,
        fraud_score: 0.1,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        referrer_id: 'user-1',
        referee_id: 'user-3',
        status: 'pending',
        reward_amount: 100,
        fraud_score: 0.3,
        created_at: new Date().toISOString()
      }
    ];

    // Calculate statistics
    const stats = {
      total_referrals: mockReferrals.length,
      completed_referrals: mockReferrals.filter((r: any) => r.status === 'credited').length,
      pending_referrals: mockReferrals.filter((r: any) => r.status === 'pending').length,
      fraud_referrals: mockReferrals.filter((r: any) => r.status === 'fraud').length,
      total_rewards_paid: mockReferrals.filter((r: any) => r.status === 'credited')
        .reduce((sum: number, r: any) => sum + (r.reward_amount || 0), 0),
      conversion_rate: mockReferrals.length ? 
        (mockReferrals.filter((r: any) => r.status === 'credited').length / mockReferrals.length * 100).toFixed(2) : '0',
      avg_fraud_score: mockReferrals.length ?
        (mockReferrals.reduce((sum: number, r: any) => sum + (r.fraud_score || 0), 0) / mockReferrals.length).toFixed(1) : '0'
    };

    return NextResponse.json({
      success: true,
      referrals: mockReferrals,
      stats
    });

  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
