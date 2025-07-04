import { NextResponse } from 'next/server';
import { fraudDetectionService } from '../../../lib/advanced-fraud-detection';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sessionId, action, context } = body;

    // Validate required fields
    if (!userId || !sessionId || !action || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, action, context' },
        { status: 400 }
      );
    }

    // Validate action structure
    if (!action.type || !action.timestamp || typeof action.success !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid action structure. Required: type, timestamp, success' },
        { status: 400 }
      );
    }

    // Validate context structure
    if (!context.ipAddress || !context.userAgent) {
      return NextResponse.json(
        { error: 'Invalid context structure. Required: ipAddress, userAgent' },
        { status: 400 }
      );
    }

    // Analyze fraud risk
    const fraudScore = await fraudDetectionService.analyzeFraudRisk(
      userId,
      sessionId,
      {
        type: action.type,
        timestamp: new Date(action.timestamp),
        details: action.details || {},
        success: action.success,
      },
      {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint,
        location: context.location,
      }
    );

    // Take action based on risk level
    const shouldBlock = fraudScore.level === 'critical';
    const shouldReview = fraudScore.level === 'high';
    const shouldFlag = fraudScore.score >= 50;

    const response = {
      fraudScore,
      actions: {
        block: shouldBlock,
        review: shouldReview,
        flag: shouldFlag,
        requireAdditionalAuth: fraudScore.level === 'high' || fraudScore.level === 'critical',
        increasedMonitoring: fraudScore.level !== 'low',
      },
      timestamp: new Date().toISOString(),
    };

    // If critical risk, also block the IP
    if (shouldBlock && fraudScore.factors.some(f => f.type === 'identity')) {
      await fraudDetectionService.blockIP(
        context.ipAddress,
        `Automatic block due to critical fraud risk (score: ${fraudScore.score})`
      );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in fraud detection API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' | 'month' || 'day';

    // Get fraud statistics
    const statistics = await fraudDetectionService.getFraudStatistics(timeframe);

    return NextResponse.json({
      statistics,
      timeframe,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error getting fraud statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'blockIP':
        if (!data.ipAddress || !data.reason) {
          return NextResponse.json(
            { error: 'Missing required fields: ipAddress, reason' },
            { status: 400 }
          );
        }
        await fraudDetectionService.blockIP(data.ipAddress, data.reason);
        return NextResponse.json({ success: true, message: 'IP blocked successfully' });

      case 'allowlistIP':
        if (!data.ipAddress) {
          return NextResponse.json(
            { error: 'Missing required field: ipAddress' },
            { status: 400 }
          );
        }
        await fraudDetectionService.allowlistIP(data.ipAddress);
        return NextResponse.json({ success: true, message: 'IP allowlisted successfully' });

      case 'updateRule':
        if (!data.ruleId || !data.updates) {
          return NextResponse.json(
            { error: 'Missing required fields: ruleId, updates' },
            { status: 400 }
          );
        }
        await fraudDetectionService.updateFraudRule(data.ruleId, data.updates);
        return NextResponse.json({ success: true, message: 'Rule updated successfully' });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: blockIP, allowlistIP, updateRule' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in fraud detection update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
