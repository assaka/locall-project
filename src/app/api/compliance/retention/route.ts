// app/api/compliance/retention/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/compliance-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, dataType, retentionDays, autoDelete } = body;

    if (!workspaceId || !dataType || retentionDays === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const policy = await ComplianceService.setRetentionPolicy(
      workspaceId,
      dataType,
      retentionDays,
      autoDelete
    );

    // Log audit event
    await ComplianceService.logAuditEvent(
      workspaceId,
      'user', // In production, get from auth
      'create',
      'retention_policy',
      policy
    );

    return NextResponse.json({
      success: true,
      data: policy
    });

  } catch (error) {
    console.error('Error setting retention policy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    // Trigger cleanup process
    await ComplianceService.cleanupExpiredData(workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Cleanup process initiated'
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
