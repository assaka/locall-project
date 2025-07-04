import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth-service';
import { authenticateAPI, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { provider, workspaceId } = await request.json();
    
    if (!provider || !workspaceId) {
      return errorResponse('Provider and workspaceId are required', 400);
    }

    const supportedProviders = ['hubspot', 'google', 'calendly'];
    if (!supportedProviders.includes(provider)) {
      return errorResponse('Unsupported provider', 400);
    }

    const authUrl = OAuthService.generateAuthUrl(
      provider,
      auth.userId!,
      workspaceId
    );

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('OAuth initiate error:', error);
    return errorResponse('Failed to initiate OAuth flow', 500);
  }
}
