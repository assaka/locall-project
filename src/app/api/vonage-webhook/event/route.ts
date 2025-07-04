import { NextRequest, NextResponse } from 'next/server';
import { vonageCallService } from '@/lib/vonage-call-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Vonage call event received:', body);

    // Handle the call event
    await vonageCallService.handleCallEvent(body);

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Error handling Vonage call event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Vonage sometimes sends GET requests for testing
  return NextResponse.json({ status: 'ok' });
}
