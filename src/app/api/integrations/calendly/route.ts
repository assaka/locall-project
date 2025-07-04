import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Calendly API configuration
const CALENDLY_API_BASE = 'https://api.calendly.com';

interface CalendlyEvent {
  uri: string;
  name: string;
  meeting_notes_plain?: string;
  meeting_notes_html?: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location?: string;
    join_url?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
}

interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  status: string;
  timezone: string;
  text_reminder_number?: string;
  rescheduled: boolean;
  old_invitee?: string;
  new_invitee?: string;
  cancel_url: string;
  reschedule_url: string;
  created_at: string;
  updated_at: string;
  tracking: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    salesforce_uuid?: string;
  };
  questions_and_answers?: Array<{
    question: string;
    answer: string;
  }>;
  payment?: {
    external_id: string;
    provider: string;
    amount: number;
    currency: string;
    terms: string;
    successful: boolean;
  };
}

interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: string;
  pooling_type?: string;
  type: string;
  color: string;
  created_at: string;
  updated_at: string;
  internal_note?: string;
  description_plain?: string;
  description_html?: string;
  profile: {
    type: string;
    name: string;
    owner: string;
  };
  secret: boolean;
  booking_method: string;
}

// GET - Sync events and data from Calendly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'sync_events';
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const status = searchParams.get('status');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Get Calendly configuration for workspace
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'calendly')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Calendly integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    switch (action) {
      case 'sync_events':
        return await syncEventsFromCalendly(workspaceId, accessToken, startTime, endTime, status);
      case 'get_user':
        return await getCalendlyUser(accessToken);
      case 'list_event_types':
        return await listCalendlyEventTypes(accessToken);
      case 'get_event':
        const eventUri = searchParams.get('eventUri');
        if (!eventUri) {
          return NextResponse.json(
            { success: false, error: 'Missing eventUri' },
            { status: 400 }
          );
        }
        return await getCalendlyEvent(accessToken, eventUri);
      case 'get_invitees':
        const eventUriForInvitees = searchParams.get('eventUri');
        if (!eventUriForInvitees) {
          return NextResponse.json(
            { success: false, error: 'Missing eventUri' },
            { status: 400 }
          );
        }
        return await getCalendlyEventInvitees(accessToken, eventUriForInvitees);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Calendly sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    );
  }
}

// POST - Create webhook subscription or trigger actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, action, ...data } = body;

    if (!workspaceId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Calendly configuration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'calendly')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Calendly integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    switch (action) {
      case 'create_webhook':
        return await createCalendlyWebhook(accessToken, data);
      case 'cancel_event':
        return await cancelCalendlyEvent(accessToken, data.inviteeUri, data.reason);
      case 'reschedule_event':
        return await rescheduleCalendlyEvent(accessToken, data.inviteeUri, data.newEventUri);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Calendly action error:', error);
    return NextResponse.json(
      { success: false, error: 'Action failed' },
      { status: 500 }
    );
  }
}

// PUT - Update integration settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, settings } = body;

    if (!workspaceId || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update integration settings
    const { data, error } = await supabase
      .from('integrations')
      .update({
        settings,
        updated_at: new Date()
      })
      .eq('workspace_id', workspaceId)
      .eq('provider', 'calendly')
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      integration: data
    });

  } catch (error) {
    console.error('Calendly settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Helper function to sync events from Calendly
async function syncEventsFromCalendly(
  workspaceId: string, 
  accessToken: string,
  startTime?: string | null,
  endTime?: string | null,
  status?: string | null
) {
  try {
    // First get user info to get organization URI
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch Calendly user: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const organizationUri = userData.resource.current_organization;

    // Build query parameters
    const url = new URL(`${CALENDLY_API_BASE}/scheduled_events`);
    url.searchParams.set('organization', organizationUri);
    url.searchParams.set('count', '100');
    
    if (startTime) {
      url.searchParams.set('min_start_time', startTime);
    } else {
      // Default to last 30 days
      url.searchParams.set('min_start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }
    
    if (endTime) {
      url.searchParams.set('max_start_time', endTime);
    } else {
      // Default to next 90 days
      url.searchParams.set('max_start_time', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());
    }

    if (status) {
      url.searchParams.set('status', status);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Calendly events: ${response.statusText}`);
    }

    const data = await response.json();
    let syncedCount = 0;
    const errors: string[] = [];

    for (const event of data.collection || []) {
      try {
        // Get event invitees for additional details
        const inviteesResponse = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${event.uri.split('/').pop()}/invitees`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        let attendees: string[] = [];
        if (inviteesResponse.ok) {
          const inviteesData = await inviteesResponse.json();
          attendees = inviteesData.collection?.map((invitee: CalendlyInvitee) => invitee.email) || [];
        }

        await supabase
          .from('synced_appointments')
          .upsert({
            workspace_id: workspaceId,
            provider: 'calendly',
            provider_event_id: event.uri.split('/').pop(),
            title: event.name,
            description: event.meeting_notes_plain,
            start_time: event.start_time,
            end_time: event.end_time,
            attendees,
            status: event.status,
            location: event.location?.location || event.location?.join_url,
            raw_data: event,
            created_at: new Date(),
            updated_at: new Date()
          }, {
            onConflict: 'workspace_id,provider,provider_event_id'
          });
        syncedCount++;
      } catch (error) {
        console.error('Error syncing Calendly event:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Update integration last sync time
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date(),
        sync_status: 'completed'
      })
      .eq('workspace_id', workspaceId)
      .eq('provider', 'calendly');

    return NextResponse.json({
      success: true,
      events_synced: syncedCount,
      total_events: data.collection?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      pagination: data.pagination
    });

  } catch (error) {
    console.error('Calendly sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// Helper function to get Calendly user info
async function getCalendlyUser(accessToken: string) {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Calendly user: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      user: data.resource
    });

  } catch (error) {
    console.error('Calendly user error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get user' },
      { status: 500 }
    );
  }
}

// Helper function to list Calendly event types
async function listCalendlyEventTypes(accessToken: string) {
  try {
    // First get user to get the user URI
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch Calendly user: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const userUri = userData.resource.uri;

    const response = await fetch(`${CALENDLY_API_BASE}/event_types?user=${userUri}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Calendly event types: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      event_types: data.collection || []
    });

  } catch (error) {
    console.error('Calendly event types error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list event types' },
      { status: 500 }
    );
  }
}

// Helper function to get a specific Calendly event
async function getCalendlyEvent(accessToken: string, eventUri: string) {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${eventUri.split('/').pop()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Calendly event: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      event: data.resource
    });

  } catch (error) {
    console.error('Calendly get event error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get event' },
      { status: 500 }
    );
  }
}

// Helper function to get Calendly event invitees
async function getCalendlyEventInvitees(accessToken: string, eventUri: string) {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${eventUri.split('/').pop()}/invitees`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Calendly invitees: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      invitees: data.collection || []
    });

  } catch (error) {
    console.error('Calendly get invitees error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get invitees' },
      { status: 500 }
    );
  }
}

// Helper function to create Calendly webhook
async function createCalendlyWebhook(accessToken: string, webhookData: any) {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/webhook_subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookData.url,
        events: webhookData.events || ['invitee.created', 'invitee.canceled'],
        organization: webhookData.organization,
        user: webhookData.user,
        scope: webhookData.scope || 'organization'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Calendly webhook: ${error}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      webhook: data.resource
    });

  } catch (error) {
    console.error('Calendly webhook creation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// Helper function to cancel Calendly event
async function cancelCalendlyEvent(accessToken: string, inviteeUri: string, reason?: string) {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${inviteeUri.split('/').pop()}/cancellation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason || 'Cancelled via API'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to cancel Calendly event: ${error}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      cancellation: data.resource
    });

  } catch (error) {
    console.error('Calendly cancel event error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to cancel event' },
      { status: 500 }
    );
  }
}

// Helper function to reschedule Calendly event (note: this creates a new booking)
async function rescheduleCalendlyEvent(accessToken: string, inviteeUri: string, newEventUri: string) {
  try {
    // Note: Calendly doesn't have a direct reschedule API, this would typically
    // involve cancelling the old event and creating a new one
    return NextResponse.json({
      success: false,
      error: 'Rescheduling requires cancelling and rebooking through Calendly interface'
    });

  } catch (error) {
    console.error('Calendly reschedule event error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to reschedule event' },
      { status: 500 }
    );
  }
}
