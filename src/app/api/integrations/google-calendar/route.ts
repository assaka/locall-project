import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Google Calendar API configuration
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  status: string;
  htmlLink: string;
  location?: string;
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

interface CreateEventRequest {
  workspaceId: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendees?: string[];
  location?: string;
  reminders?: Array<{
    method: string;
    minutes: number;
  }>;
}

// GET - Sync events from Google Calendar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'sync_events';
    const calendarId = searchParams.get('calendarId') || 'primary';
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Get Google Calendar configuration for workspace
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Calendar integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    switch (action) {
      case 'sync_events':
        return await syncEventsFromGoogleCalendar(workspaceId, accessToken, calendarId, timeMin, timeMax);
      case 'list_calendars':
        return await listGoogleCalendars(accessToken);
      case 'get_event':
        const eventId = searchParams.get('eventId');
        if (!eventId) {
          return NextResponse.json(
            { success: false, error: 'Missing eventId' },
            { status: 400 }
          );
        }
        return await getGoogleCalendarEvent(accessToken, calendarId, eventId);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    );
  }
}

// POST - Create new Google Calendar event
export async function POST(request: NextRequest) {
  try {
    const body: CreateEventRequest = await request.json();
    const { workspaceId, summary, description, startDateTime, endDateTime, timeZone, attendees, location, reminders } = body;

    if (!workspaceId || !summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Calendar configuration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Calendar integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    // Create event data
    const eventData: Partial<GoogleCalendarEvent> = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: timeZone || 'UTC'
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone || 'UTC'
      }
    };

    if (attendees && attendees.length > 0) {
      eventData.attendees = attendees.map(email => ({ email }));
    }

    if (location) {
      eventData.location = location;
    }

    if (reminders) {
      eventData.reminders = {
        useDefault: false,
        overrides: reminders
      };
    }

    // Create event in Google Calendar
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Google Calendar event: ${error}`);
    }

    const createdEvent = await response.json();

    // Store event in local database
    await supabase
      .from('synced_appointments')
      .insert({
        workspace_id: workspaceId,
        provider: 'google',
        provider_event_id: createdEvent.id,
        title: createdEvent.summary,
        description: createdEvent.description,
        start_time: createdEvent.start.dateTime || createdEvent.start.date,
        end_time: createdEvent.end.dateTime || createdEvent.end.date,
        attendees: createdEvent.attendees?.map((a: any) => a.email) || [],
        status: createdEvent.status,
        location: createdEvent.location,
        raw_data: createdEvent,
        created_at: new Date(),
        updated_at: new Date()
      });

    return NextResponse.json({
      success: true,
      event: createdEvent
    });

  } catch (error) {
    console.error('Google Calendar create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT - Update existing Google Calendar event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, eventId, calendarId = 'primary', ...updateData } = body;

    if (!workspaceId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Calendar configuration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Calendar integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    // Update event in Google Calendar
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update Google Calendar event: ${error}`);
    }

    const updatedEvent = await response.json();

    // Update event in local database
    await supabase
      .from('synced_appointments')
      .update({
        title: updatedEvent.summary,
        description: updatedEvent.description,
        start_time: updatedEvent.start.dateTime || updatedEvent.start.date,
        end_time: updatedEvent.end.dateTime || updatedEvent.end.date,
        attendees: updatedEvent.attendees?.map((a: any) => a.email) || [],
        status: updatedEvent.status,
        location: updatedEvent.location,
        raw_data: updatedEvent,
        updated_at: new Date()
      })
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google')
      .eq('provider_event_id', eventId);

    return NextResponse.json({
      success: true,
      event: updatedEvent
    });

  } catch (error) {
    console.error('Google Calendar update event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Google Calendar event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const eventId = searchParams.get('eventId');
    const calendarId = searchParams.get('calendarId') || 'primary';

    if (!workspaceId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Calendar configuration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Calendar integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    // Delete event from Google Calendar
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 410) { // 410 = already deleted
      const error = await response.text();
      throw new Error(`Failed to delete Google Calendar event: ${error}`);
    }

    // Remove event from local database
    await supabase
      .from('synced_appointments')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google')
      .eq('provider_event_id', eventId);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Google Calendar delete event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// Helper function to sync events from Google Calendar
async function syncEventsFromGoogleCalendar(
  workspaceId: string, 
  accessToken: string, 
  calendarId: string = 'primary',
  timeMin?: string | null,
  timeMax?: string | null
) {
  try {
    const url = new URL(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events`);
    url.searchParams.set('maxResults', '250');
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    
    if (timeMin) {
      url.searchParams.set('timeMin', timeMin);
    } else {
      // Default to last 30 days
      url.searchParams.set('timeMin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }
    
    if (timeMax) {
      url.searchParams.set('timeMax', timeMax);
    } else {
      // Default to next 90 days
      url.searchParams.set('timeMax', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    let syncedCount = 0;
    const errors: string[] = [];

    for (const event of data.items || []) {
      if (event.status === 'cancelled') continue;

      try {
        await supabase
          .from('synced_appointments')
          .upsert({
            workspace_id: workspaceId,
            provider: 'google',
            provider_event_id: event.id,
            title: event.summary || 'Untitled Event',
            description: event.description,
            start_time: event.start.dateTime || event.start.date,
            end_time: event.end.dateTime || event.end.date,
            attendees: event.attendees?.map((a: any) => a.email) || [],
            status: event.status,
            location: event.location,
            raw_data: event,
            created_at: new Date(),
            updated_at: new Date()
          }, {
            onConflict: 'workspace_id,provider,provider_event_id'
          });
        syncedCount++;
      } catch (error) {
        console.error('Error syncing event:', error);
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
      .eq('provider', 'google_calendar');

    return NextResponse.json({
      success: true,
      events_synced: syncedCount,
      total_events: data.items?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      next_sync_token: data.nextSyncToken
    });

  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// Helper function to list Google Calendars
async function listGoogleCalendars(accessToken: string) {
  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendars: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      calendars: data.items || []
    });

  } catch (error) {
    console.error('Google Calendar list error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list calendars' },
      { status: 500 }
    );
  }
}

// Helper function to get a specific Google Calendar event
async function getGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendar event: ${response.statusText}`);
    }

    const event = await response.json();

    return NextResponse.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Google Calendar get event error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get event' },
      { status: 500 }
    );
  }
}
