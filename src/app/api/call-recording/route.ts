import { NextResponse } from 'next/server';
import { callRecordingService } from '../../../lib/call-recording-sentiment';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callId, workspaceId, metadata } = body;

    switch (action) {
      case 'start':
        if (!callId || !workspaceId || !metadata) {
          return NextResponse.json(
            { error: 'Missing required fields: callId, workspaceId, metadata' },
            { status: 400 }
          );
        }

        const recording = await callRecordingService.startRecording(callId, workspaceId, metadata);
        return NextResponse.json({
          success: true,
          recording,
          message: 'Recording started successfully',
        });

      case 'stop':
        if (!body.recordingId) {
          return NextResponse.json(
            { error: 'Missing required field: recordingId' },
            { status: 400 }
          );
        }

        const stoppedRecording = await callRecordingService.stopRecording(body.recordingId);
        return NextResponse.json({
          success: true,
          recording: stoppedRecording,
          message: 'Recording stopped successfully',
        });

      case 'process':
        if (!body.recordingId) {
          return NextResponse.json(
            { error: 'Missing required field: recordingId' },
            { status: 400 }
          );
        }

        // Start processing in background
        callRecordingService.processRecording(body.recordingId).catch(console.error);
        return NextResponse.json({
          success: true,
          message: 'Recording processing started',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: start, stop, process' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in call recording API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'week';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing required parameter: workspaceId' },
        { status: 400 }
      );
    }

    // Get call analytics
    const analytics = await callRecordingService.getCallAnalytics(workspaceId, timeframe);

    return NextResponse.json({
      success: true,
      analytics,
      timeframe,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error getting call analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
