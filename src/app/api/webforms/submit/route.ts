import { NextRequest, NextResponse } from 'next/server';
import { WebformService } from '@/lib/webform-service';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

// Process webform submission
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const body = await request.json();
    const {
      tracking_id,
      visitor_id,
      session_id,
      form_data,
      utm_data,
      user_journey,
      spam_score,
      url,
      referrer,
      user_agent
    } = body;

    if (!tracking_id || !visitor_id || !session_id || !form_data) {
      return errorResponse('Missing required fields', 400);
    }

    const submission = await WebformService.processSubmission({
      tracking_id,
      visitor_id,
      session_id,
      form_data,
      utm_data,
      user_journey,
      spam_score: parseFloat(spam_score) || 0,
      url,
      referrer,
      user_agent,
      ip_address: clientIP
    });

    return successResponse({
      id: submission.id,
      is_spam: submission.is_spam,
      spam_score: submission.spam_score
    }, 201);

  } catch (error) {
    console.error('Webform submission error:', error);
    
    // Don't expose internal errors to tracking script
    return NextResponse.json({ 
      success: false,
      error: 'Processing failed' 
    }, { status: 500 });
  }
}
