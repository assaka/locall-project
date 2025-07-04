import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth-service';

export async function POST(request: NextRequest) {
  try {
    const { provider, workspaceId } = await request.json();

    if (!provider || !workspaceId) {
      return NextResponse.json(
        { error: 'Provider and workspaceId are required' },
        { status: 400 }
      );
    }

    const result = await OAuthService.disconnectIntegration(workspaceId, provider);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${provider} integration`
    });

  } catch (error) {
    console.error('OAuth disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
