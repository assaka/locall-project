import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const alertId = pathname.split('/').slice(-2)[0]; // Extract alertId from path

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // For now, return a mock response
    const result = {
      success: true,
      message: 'Alert resolved successfully',
      alertId
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
