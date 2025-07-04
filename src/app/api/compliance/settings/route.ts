// app/api/compliance/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/compliance-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    const settings = await ComplianceService.getComplianceSettings(workspaceId);

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching compliance settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, ...settings } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WorkspaceId is required' },
        { status: 400 }
      );
    }

    const updatedSettings = await ComplianceService.updateComplianceSettings(
      workspaceId,
      settings
    );

    // Log audit event
    await ComplianceService.logAuditEvent(
      workspaceId,
      'user', // In production, get from auth
      'update',
      'compliance_settings',
      updatedSettings
    );

    return NextResponse.json({
      success: true,
      data: updatedSettings
    });

  } catch (error) {
    console.error('Error updating compliance settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
