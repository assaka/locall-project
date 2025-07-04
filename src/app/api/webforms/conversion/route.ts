import { NextRequest, NextResponse } from 'next/server';
import { WebformService } from '@/lib/webform-service';
import { successResponse } from '@/lib/api-utils';

// Process conversion event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tracking_id,
      visitor_id,
      session_id,
      goal_name,
      goal_value,
      trigger_data,
      manual
    } = body;

    if (!tracking_id || !visitor_id || !session_id || !goal_name) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    await WebformService.processConversion({
      tracking_id,
      visitor_id,
      session_id,
      goal_name,
      goal_value: parseFloat(goal_value) || 0,
      trigger_data,
      manual: manual || false
    });

    return successResponse({ success: true });

  } catch (error) {
    console.error('Conversion tracking error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Processing failed' 
    }, { status: 500 });
  }
}
