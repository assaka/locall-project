import { NextRequest, NextResponse } from 'next/server';
import { DataSeeder } from '../../../../../utils/dataSeeder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'seed':
        await DataSeeder.seedAll();
        return NextResponse.json({
          success: true,
          message: 'Data seeded successfully'
        });
      
      case 'clear':
        await DataSeeder.clearAll();
        return NextResponse.json({
          success: true,
          message: 'Data cleared successfully'
        });
        
      case 'routing-rules':
        await DataSeeder.seedRoutingRules();
        return NextResponse.json({
          success: true,
          message: 'Routing rules seeded successfully'
        });
        
      case 'referrals':
        await DataSeeder.seedReferrals();
        return NextResponse.json({
          success: true,
          message: 'Referrals seeded successfully'
        });
        
      case 'simulate-analytics':
        await DataSeeder.simulateRoutingAnalytics();
        return NextResponse.json({
          success: true,
          message: 'Analytics simulated successfully'
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: seed, clear, routing-rules, referrals, or simulate-analytics'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute seeding operation'
    }, { status: 500 });
  }
}
