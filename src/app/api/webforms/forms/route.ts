import { NextRequest, NextResponse } from 'next/server';
import { WebformService } from '@/lib/webform-service';

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

    const forms = await WebformService.getWebforms(workspaceId);

    return NextResponse.json(forms);

  } catch (error) {
    console.error('Error fetching webforms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { workspaceId, name, config } = data;

    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: 'WorkspaceId and name are required' },
        { status: 400 }
      );
    }

    const form = await WebformService.createWebform(workspaceId, name, config);

    return NextResponse.json(form);

  } catch (error) {
    console.error('Error creating webform:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
