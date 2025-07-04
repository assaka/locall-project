// app/api/compliance/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/compliance-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const exportId = searchParams.get('exportId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    if (exportId) {
      // Download specific export
      const fileUrl = await ComplianceService.downloadExport(exportId);
      
      if (!fileUrl) {
        return NextResponse.json(
          { error: 'Export not found or not ready' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { fileUrl }
      });
    } else {
      // Get all export requests
      const exports = await ComplianceService.getDataExportRequests(workspaceId);
      
      return NextResponse.json({
        success: true,
        data: exports
      });
    }

  } catch (error) {
    console.error('Error handling export request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, dataTypes } = body;

    if (!workspaceId || !userId || !dataTypes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const exportRequest = await ComplianceService.requestDataExport(
      workspaceId,
      userId,
      dataTypes
    );

    // Log audit event
    await ComplianceService.logAuditEvent(
      workspaceId,
      userId,
      'create',
      'data_export_request',
      exportRequest
    );

    return NextResponse.json({
      success: true,
      data: exportRequest,
      message: 'Export request submitted. You will receive an email when ready.'
    });

  } catch (error) {
    console.error('Error creating export request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
