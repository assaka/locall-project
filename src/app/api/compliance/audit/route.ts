// app/api/compliance/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/compliance-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    const auditLogs = await ComplianceService.getAuditLogs(
      workspaceId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
