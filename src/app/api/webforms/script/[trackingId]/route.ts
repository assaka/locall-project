import { NextRequest, NextResponse } from 'next/server';
import { WebformService } from '@/lib/webform-service';
import { authenticateAPI, errorResponse } from '@/lib/api-utils';

// Generate tracking script for webform
export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse('Authentication failed', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

    // Get webform config by tracking ID
    const configs = await WebformService.getWebformConfigs(workspaceId);
    const config = configs.find(c => c.tracking_script_id === params.trackingId);

    if (!config) {
      return NextResponse.json({ error: 'Tracking ID not found' }, { status: 404 });
    }

    const script = WebformService.generateTrackingScript(params.trackingId, config);

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error generating tracking script:', error);
    return NextResponse.json({ error: 'Script generation failed' }, { status: 500 });
  }
}
