import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// HubSpot API configuration
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

interface HubSpotContact {
  id?: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    website?: string;
    lifecycle_stage?: string;
    lead_source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

interface HubSpotDeal {
  id?: string;
  properties: {
    dealname: string;
    amount?: string;
    dealstage: string;
    pipeline: string;
    closedate?: string;
    hubspot_owner_id?: string;
    deal_source?: string;
  };
  associations?: {
    contacts?: string[];
    companies?: string[];
  };
}

// GET - Sync contacts and deals from HubSpot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'sync_all';

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Get HubSpot configuration for workspace
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single();

    if (!integration || !integration.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'HubSpot integration not configured' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'sync_contacts':
        return await syncContactsFromHubSpot(workspaceId, integration.credentials.access_token);
      case 'sync_deals':
        return await syncDealsFromHubSpot(workspaceId, integration.credentials.access_token);
      case 'sync_all':
        const contactsResult = await syncContactsFromHubSpot(workspaceId, integration.credentials.access_token);
        const dealsResult = await syncDealsFromHubSpot(workspaceId, integration.credentials.access_token);
        return NextResponse.json({
          success: true,
          contacts_synced: contactsResult.count,
          deals_synced: dealsResult.count
        });
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('HubSpot sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    );
  }
}

// POST - Create or update HubSpot records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, action, data } = body;

    if (!workspaceId || !action || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get HubSpot configuration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single();

    if (!integration?.credentials?.access_token) {
      return NextResponse.json(
        { success: false, error: 'HubSpot integration not configured' },
        { status: 400 }
      );
    }

    const accessToken = integration.credentials.access_token;

    switch (action) {
      case 'create_contact':
        return await createHubSpotContact(workspaceId, accessToken, data);
      case 'update_contact':
        return await updateHubSpotContact(workspaceId, accessToken, data);
      case 'create_deal':
        return await createHubSpotDeal(workspaceId, accessToken, data);
      case 'update_deal':
        return await updateHubSpotDeal(workspaceId, accessToken, data);
      case 'sync_call_to_contact':
        return await syncCallToHubSpotContact(workspaceId, accessToken, data);
      case 'sync_form_submission':
        return await syncFormSubmissionToHubSpot(workspaceId, accessToken, data);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('HubSpot operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Operation failed' },
      { status: 500 }
    );
  }
}

// PUT - Update integration settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, settings } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('integrations')
      .update({
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId)
      .eq('provider', 'hubspot');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Sync contacts from HubSpot
async function syncContactsFromHubSpot(workspaceId: string, accessToken: string) {
  const contacts = await fetchHubSpotContacts(accessToken);
  let syncedCount = 0;

  for (const contact of contacts) {
    try {
      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('hubspot_contacts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('hubspot_id', contact.id)
        .single();

      const contactData = {
        workspace_id: workspaceId,
        hubspot_id: contact.id,
        email: contact.properties.email,
        first_name: contact.properties.firstname || '',
        last_name: contact.properties.lastname || '',
        phone: contact.properties.phone || '',
        company: contact.properties.company || '',
        lifecycle_stage: contact.properties.lifecycle_stage || '',
        lead_source: contact.properties.lead_source || '',
        utm_source: contact.properties.utm_source || '',
        utm_medium: contact.properties.utm_medium || '',
        utm_campaign: contact.properties.utm_campaign || '',
        last_synced: new Date().toISOString()
      };

      if (existingContact) {
        await supabase
          .from('hubspot_contacts')
          .update(contactData)
          .eq('id', existingContact.id);
      } else {
        await supabase
          .from('hubspot_contacts')
          .insert([contactData]);
      }

      syncedCount++;
    } catch (error) {
      console.error('Error syncing contact:', contact.id, error);
    }
  }

  return { count: syncedCount };
}

// Sync deals from HubSpot
async function syncDealsFromHubSpot(workspaceId: string, accessToken: string) {
  const deals = await fetchHubSpotDeals(accessToken);
  let syncedCount = 0;

  for (const deal of deals) {
    try {
      const { data: existingDeal } = await supabase
        .from('hubspot_deals')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('hubspot_id', deal.id)
        .single();

      const dealData = {
        workspace_id: workspaceId,
        hubspot_id: deal.id,
        deal_name: deal.properties.dealname,
        amount: parseFloat(deal.properties.amount || '0'),
        deal_stage: deal.properties.dealstage,
        pipeline: deal.properties.pipeline,
        close_date: deal.properties.closedate || null,
        owner_id: deal.properties.hubspot_owner_id || '',
        deal_source: deal.properties.deal_source || '',
        last_synced: new Date().toISOString()
      };

      if (existingDeal) {
        await supabase
          .from('hubspot_deals')
          .update(dealData)
          .eq('id', existingDeal.id);
      } else {
        await supabase
          .from('hubspot_deals')
          .insert([dealData]);
      }

      syncedCount++;
    } catch (error) {
      console.error('Error syncing deal:', deal.id, error);
    }
  }

  return { count: syncedCount };
}

// Create HubSpot contact
async function createHubSpotContact(workspaceId: string, accessToken: string, contactData: any) {
  const hubspotContact: HubSpotContact = {
    properties: {
      email: contactData.email,
      firstname: contactData.first_name || '',
      lastname: contactData.last_name || '',
      phone: contactData.phone || '',
      company: contactData.company || '',
      lead_source: 'Locall',
      utm_source: contactData.utm_source || '',
      utm_medium: contactData.utm_medium || '',
      utm_campaign: contactData.utm_campaign || ''
    }
  };

  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hubspotContact)
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  const result = await response.json();

  // Store the mapping in our database
  await supabase
    .from('hubspot_contacts')
    .insert([{
      workspace_id: workspaceId,
      hubspot_id: result.id,
      email: contactData.email,
      first_name: contactData.first_name || '',
      last_name: contactData.last_name || '',
      phone: contactData.phone || '',
      company: contactData.company || '',
      last_synced: new Date().toISOString()
    }]);

  return NextResponse.json({
    success: true,
    hubspot_contact_id: result.id
  });
}

// Update HubSpot contact
async function updateHubSpotContact(workspaceId: string, accessToken: string, contactData: any) {
  if (!contactData.hubspot_id) {
    throw new Error('HubSpot contact ID is required for updates');
  }

  const hubspotContact: Partial<HubSpotContact> = {
    properties: {
      ...(contactData.email && { email: contactData.email }),
      ...(contactData.first_name && { firstname: contactData.first_name }),
      ...(contactData.last_name && { lastname: contactData.last_name }),
      ...(contactData.phone && { phone: contactData.phone }),
      ...(contactData.company && { company: contactData.company })
    }
  };

  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactData.hubspot_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hubspotContact)
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  // Update our local record
  await supabase
    .from('hubspot_contacts')
    .update({
      email: contactData.email,
      first_name: contactData.first_name || '',
      last_name: contactData.last_name || '',
      phone: contactData.phone || '',
      company: contactData.company || '',
      last_synced: new Date().toISOString()
    })
    .eq('workspace_id', workspaceId)
    .eq('hubspot_id', contactData.hubspot_id);

  return NextResponse.json({
    success: true,
    message: 'Contact updated successfully'
  });
}

// Create HubSpot deal
async function createHubSpotDeal(workspaceId: string, accessToken: string, dealData: any) {
  const hubspotDeal: HubSpotDeal = {
    properties: {
      dealname: dealData.deal_name,
      amount: dealData.amount?.toString() || '0',
      dealstage: dealData.deal_stage || 'prospecting',
      pipeline: dealData.pipeline || 'default',
      deal_source: 'Locall'
    }
  };

  if (dealData.contact_ids?.length > 0) {
    hubspotDeal.associations = {
      contacts: dealData.contact_ids
    };
  }

  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hubspotDeal)
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  const result = await response.json();

  // Store the mapping
  await supabase
    .from('hubspot_deals')
    .insert([{
      workspace_id: workspaceId,
      hubspot_id: result.id,
      deal_name: dealData.deal_name,
      amount: dealData.amount || 0,
      deal_stage: dealData.deal_stage || 'prospecting',
      pipeline: dealData.pipeline || 'default',
      last_synced: new Date().toISOString()
    }]);

  return NextResponse.json({
    success: true,
    hubspot_deal_id: result.id
  });
}

// Update HubSpot deal
async function updateHubSpotDeal(workspaceId: string, accessToken: string, dealData: any) {
  if (!dealData.hubspot_id) {
    throw new Error('HubSpot deal ID is required for updates');
  }

  const hubspotDeal: Partial<HubSpotDeal> = {
    properties: {
      ...(dealData.deal_name && { dealname: dealData.deal_name }),
      ...(dealData.amount && { amount: dealData.amount.toString() }),
      ...(dealData.deal_stage && { dealstage: dealData.deal_stage }),
      ...(dealData.pipeline && { pipeline: dealData.pipeline })
    }
  };

  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealData.hubspot_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hubspotDeal)
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  // Update local record
  await supabase
    .from('hubspot_deals')
    .update({
      deal_name: dealData.deal_name,
      amount: dealData.amount || 0,
      deal_stage: dealData.deal_stage,
      pipeline: dealData.pipeline,
      last_synced: new Date().toISOString()
    })
    .eq('workspace_id', workspaceId)
    .eq('hubspot_id', dealData.hubspot_id);

  return NextResponse.json({
    success: true,
    message: 'Deal updated successfully'
  });
}

// Sync call data to HubSpot contact
async function syncCallToHubSpotContact(workspaceId: string, accessToken: string, callData: any) {
  // Find existing contact by phone number
  const { data: hubspotContact } = await supabase
    .from('hubspot_contacts')
    .select('hubspot_id')
    .eq('workspace_id', workspaceId)
    .eq('phone', callData.caller_number)
    .single();

  if (!hubspotContact) {
    // Create new contact if not found
    return await createHubSpotContact(workspaceId, accessToken, {
      phone: callData.caller_number,
      first_name: callData.caller_name || 'Unknown',
      lead_source: 'Phone Call'
    });
  }

  // Add call activity to existing contact
  const activity = {
    engagement: {
      type: 'CALL',
      timestamp: new Date(callData.created_at).getTime()
    },
    associations: {
      contactIds: [hubspotContact.hubspot_id]
    },
    metadata: {
      body: `Call Duration: ${callData.duration || 0} seconds\nStatus: ${callData.status}\nCaller: ${callData.caller_number}`,
      status: callData.status === 'completed' ? 'COMPLETED' : 'NO_ANSWER'
    }
  };

  const response = await fetch(`${HUBSPOT_API_BASE}/engagements/v1/engagements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(activity)
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  return NextResponse.json({
    success: true,
    message: 'Call synced to HubSpot'
  });
}

// Sync form submission to HubSpot
async function syncFormSubmissionToHubSpot(workspaceId: string, accessToken: string, submissionData: any) {
  // Create or update contact with form data
  const contactData = {
    email: submissionData.email,
    first_name: submissionData.first_name || submissionData.name || '',
    last_name: submissionData.last_name || '',
    phone: submissionData.phone || '',
    company: submissionData.company || '',
    utm_source: submissionData.utm_params?.utm_source || '',
    utm_medium: submissionData.utm_params?.utm_medium || '',
    utm_campaign: submissionData.utm_params?.utm_campaign || ''
  };

  // Try to find existing contact
  const { data: existingContact } = await supabase
    .from('hubspot_contacts')
    .select('hubspot_id')
    .eq('workspace_id', workspaceId)
    .eq('email', submissionData.email)
    .single();

  if (existingContact) {
    return await updateHubSpotContact(workspaceId, accessToken, {
      ...contactData,
      hubspot_id: existingContact.hubspot_id
    });
  } else {
    return await createHubSpotContact(workspaceId, accessToken, contactData);
  }
}

// Helper functions to fetch data from HubSpot
async function fetchHubSpotContacts(accessToken: string): Promise<any[]> {
  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,phone,company,lifecycle_stage,lead_source,utm_source,utm_medium,utm_campaign`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

async function fetchHubSpotDeals(accessToken: string): Promise<any[]> {
  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,hubspot_owner_id,deal_source`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}
