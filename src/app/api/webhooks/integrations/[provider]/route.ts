import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hubspot-signature-v2');
    
    // Verify HubSpot webhook signature
    if (params.provider === 'hubspot') {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.HUBSPOT_WEBHOOK_SECRET!)
        .update(body)
        .digest('base64');
      
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const webhookData = JSON.parse(body);
    
    // Process webhook based on provider
    switch (params.provider) {
      case 'hubspot':
        await processHubSpotWebhook(webhookData);
        break;
      case 'google':
        await processGoogleWebhook(webhookData);
        break;
      case 'calendly':
        await processCalendlyWebhook(webhookData);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(`Webhook error for ${params.provider}:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processHubSpotWebhook(data: any) {
  for (const event of data) {
    if (event.subscriptionType === 'contact.propertyChange') {
      // Find connections that should sync this contact
      const { data: connections } = await supabaseAdmin
        .from('oauth_connections')
        .select('*')
        .eq('provider', 'hubspot')
        .eq('status', 'active');

      for (const connection of connections || []) {
        // Update contact in our database
        try {
          const contactResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${event.objectId}`, {
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (contactResponse.ok) {
            const contact = await contactResponse.json();
            
            await supabaseAdmin
              .from('synced_contacts')
              .upsert({
                workspace_id: connection.workspace_id,
                provider: 'hubspot',
                provider_contact_id: contact.id,
                email: contact.properties.email,
                first_name: contact.properties.firstname,
                last_name: contact.properties.lastname,
                phone: contact.properties.phone,
                company: contact.properties.company,
                last_modified: contact.properties.lastmodifieddate,
                raw_data: contact,
                updated_at: new Date()
              }, {
                onConflict: 'workspace_id,provider,provider_contact_id'
              });
          }
        } catch (error) {
          console.error('Error updating contact from webhook:', error);
        }
      }
    }
  }
}

async function processGoogleWebhook(data: any) {
  // Google Calendar push notifications
  if (data.resourceId && data.resourceUri) {
    const { data: connections } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('provider', 'google')
      .eq('status', 'active');

    for (const connection of connections || []) {
      try {
        // Fetch updated calendar events
        const eventsResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          headers: {
            'Authorization': `Bearer ${connection.access_token}`
          }
        });

        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          
          for (const event of events.items || []) {
            if (event.status === 'cancelled') {
              // Remove cancelled events
              await supabaseAdmin
                .from('synced_appointments')
                .delete()
                .eq('workspace_id', connection.workspace_id)
                .eq('provider', 'google')
                .eq('provider_event_id', event.id);
            } else {
              // Update/insert event
              await supabaseAdmin
                .from('synced_appointments')
                .upsert({
                  workspace_id: connection.workspace_id,
                  provider: 'google',
                  provider_event_id: event.id,
                  title: event.summary,
                  description: event.description,
                  start_time: event.start.dateTime || event.start.date,
                  end_time: event.end.dateTime || event.end.date,
                  attendees: event.attendees?.map((a: any) => a.email) || [],
                  status: event.status,
                  raw_data: event,
                  updated_at: new Date()
                }, {
                  onConflict: 'workspace_id,provider,provider_event_id'
                });
            }
          }
        }
      } catch (error) {
        console.error('Error processing Google webhook:', error);
      }
    }
  }
}

async function processCalendlyWebhook(data: any) {
  const { event, payload } = data;
  
  if (event && payload) {
    // Find relevant connections
    const { data: connections } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('provider', 'calendly')
      .eq('status', 'active');

    for (const connection of connections || []) {
      try {
        const eventId = payload.uri ? payload.uri.split('/').pop() : null;
        
        if (!eventId) {
          console.error('No event ID found in Calendly payload');
          continue;
        }
        
        switch (event) {
          case 'invitee.created':
            // Get detailed event information
            const eventDetailsResponse = await fetch(`https://api.calendly.com/scheduled_events/${eventId}`, {
              headers: {
                'Authorization': `Bearer ${connection.access_token}`
              }
            });

            let eventDetails = null;
            if (eventDetailsResponse.ok) {
              const eventData = await eventDetailsResponse.json();
              eventDetails = eventData.resource;
            }

            // Get invitee details
            const inviteeDetailsResponse = await fetch(`https://api.calendly.com/scheduled_events/${eventId}/invitees`, {
              headers: {
                'Authorization': `Bearer ${connection.access_token}`
              }
            });

            let attendees: string[] = [];
            if (inviteeDetailsResponse.ok) {
              const inviteeData = await inviteeDetailsResponse.json();
              attendees = inviteeData.collection?.map((invitee: any) => invitee.email) || [];
            }

            // Create/update appointment
            await supabaseAdmin
              .from('synced_appointments')
              .upsert({
                workspace_id: connection.workspace_id,
                provider: 'calendly',
                provider_event_id: eventId,
                title: eventDetails?.name || payload.event_type?.name || 'Calendly Meeting',
                description: eventDetails?.meeting_notes_plain,
                start_time: eventDetails?.start_time || payload.start_time,
                end_time: eventDetails?.end_time || payload.end_time,
                attendees,
                status: 'confirmed',
                location: eventDetails?.location?.location || eventDetails?.location?.join_url,
                raw_data: { event: eventDetails, payload, invitees: attendees },
                created_at: new Date(),
                updated_at: new Date()
              }, {
                onConflict: 'workspace_id,provider,provider_event_id'
              });

            // Log webhook event
            await supabaseAdmin
              .from('integration_events')
              .insert({
                workspace_id: connection.workspace_id,
                provider: 'calendly',
                event_type: 'invitee_created',
                metadata: {
                  event_id: eventId,
                  invitee_email: attendees[0] || 'unknown',
                  event_type: eventDetails?.name || payload.event_type?.name
                }
              });

            break;

          case 'invitee.canceled':
            // Remove cancelled appointment
            await supabaseAdmin
              .from('synced_appointments')
              .delete()
              .eq('workspace_id', connection.workspace_id)
              .eq('provider', 'calendly')
              .eq('provider_event_id', eventId);

            // Log cancellation
            await supabaseAdmin
              .from('integration_events')
              .insert({
                workspace_id: connection.workspace_id,
                provider: 'calendly',
                event_type: 'invitee_canceled',
                metadata: {
                  event_id: eventId,
                  canceled_at: new Date().toISOString()
                }
              });

            break;

          case 'invitee.rescheduled':
            // Handle rescheduling
            if (payload.old_invitee && payload.new_invitee) {
              const oldEventId = payload.old_invitee.split('/').pop();
              const newEventId = payload.new_invitee.split('/').pop();

              // Remove old appointment
              await supabaseAdmin
                .from('synced_appointments')
                .delete()
                .eq('workspace_id', connection.workspace_id)
                .eq('provider', 'calendly')
                .eq('provider_event_id', oldEventId);

              // The new appointment will be handled by a separate invitee.created webhook
              await supabaseAdmin
                .from('integration_events')
                .insert({
                  workspace_id: connection.workspace_id,
                  provider: 'calendly',
                  event_type: 'invitee_rescheduled',
                  metadata: {
                    old_event_id: oldEventId,
                    new_event_id: newEventId,
                    rescheduled_at: new Date().toISOString()
                  }
                });
            }
            break;

          default:
            console.log(`Unhandled Calendly webhook event: ${event}`);
        }

      } catch (error) {
        console.error('Error processing Calendly webhook:', error);
        
        // Log webhook error
        await supabaseAdmin
          .from('integration_events')
          .insert({
            workspace_id: connection.workspace_id,
            provider: 'calendly',
            event_type: 'webhook_error',
            metadata: {
              event_type: event,
              error: error instanceof Error ? error.message : 'Unknown error',
              payload_preview: JSON.stringify(payload).substring(0, 500)
            }
          });
      }
    }
  }
}
