import { NextRequest, NextResponse } from 'next/server';
import { WebformService } from '@/lib/webform-service';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

// Get webform configurations
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

    const configs = await WebformService.getWebformConfigs(workspaceId);

    return successResponse({ configs });

  } catch (error) {
    console.error('Error fetching webform configs:', error);
    return errorResponse('Failed to fetch webform configs', 500);
  }
}

// Create webform configuration
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const {
      workspaceId = 'default-workspace',
      name,
      form_id,
      domains = [],
      utm_tracking = true,
      user_journey_tracking = true,
      spam_protection = true,
      conversion_goals = [],
      is_active = true
    } = body;

    if (!name || !form_id) {
      return errorResponse('Name and form_id are required', 400);
    }

    const config = await WebformService.createWebformConfig({
      workspace_id: workspaceId,
      name,
      form_id,
      domains,
      utm_tracking,
      user_journey_tracking,
      spam_protection,
      conversion_goals,
      is_active
    });

    return successResponse(config, 201);

  } catch (error) {
    console.error('Error creating webform config:', error);
    return errorResponse('Failed to create webform config', 500);
  }
}

// Update webform configuration
export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse('Config ID is required', 400);
    }

    const config = await WebformService.updateWebformConfig(id, updateData);

    return successResponse(config);

  } catch (error) {
    console.error('Error updating webform config:', error);
    return errorResponse('Failed to update webform config', 500);
  }
}
