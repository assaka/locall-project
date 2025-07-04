import { NextRequest, NextResponse } from 'next/server';
import { WebformService } from '@/lib/webform-service';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

// Get webform analytics
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';
    const formId = searchParams.get('formId');
    const timeRange = searchParams.get('timeRange') || '30d';

    const analytics = await WebformService.getAnalytics(workspaceId, formId || undefined, timeRange);

    return successResponse({ analytics });

  } catch (error) {
    console.error('Error fetching webform analytics:', error);
    return errorResponse('Failed to fetch webform analytics', 500);
  }
}
