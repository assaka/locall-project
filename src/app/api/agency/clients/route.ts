import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get clients for agency/reseller
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const clientId = searchParams.get('clientId');

    if (clientId) {
      return await getClientDetails(clientId);
    }

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Missing agencyId' },
        { status: 400 }
      );
    }

    // Get all clients for this agency
    const { data: clients, error } = await supabase
      .from('agency_clients')
      .select(`
        *,
        workspaces (
          id,
          name,
          created_at,
          phone_numbers (count),
          calls (count),
          webforms (count)
        ),
        white_labels (
          id,
          subdomain,
          custom_domain,
          branding_config,
          is_active
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clients: clients || []
    });

  } catch (error) {
    console.error('Error in client management:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agencyId,
      clientName,
      contactEmail,
      contactPhone,
      companyName,
      industry,
      plan,
      subdomain,
      customDomain,
      brandingConfig
    } = body;

    if (!agencyId || !clientName || !contactEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Start transaction
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{
        name: `${clientName} Workspace`,
        created_by: agencyId,
        plan: plan || 'basic',
        settings: {
          agency_managed: true,
          parent_agency: agencyId
        }
      }])
      .select()
      .single();

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      return NextResponse.json(
        { success: false, error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('agency_clients')
      .insert([{
        agency_id: agencyId,
        workspace_id: workspace.id,
        client_name: clientName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        company_name: companyName,
        industry: industry,
        plan: plan || 'basic',
        status: 'active',
        billing_settings: {
          plan: plan || 'basic',
          billing_email: contactEmail,
          auto_billing: true
        }
      }])
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      // Cleanup workspace
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json(
        { success: false, error: 'Failed to create client' },
        { status: 500 }
      );
    }

    // Create white-label instance if subdomain provided
    let whiteLabel = null;
    if (subdomain) {
      const { data: wl, error: wlError } = await supabase
        .from('white_labels')
        .insert([{
          user_id: agencyId,
          client_id: client.id,
          workspace_id: workspace.id,
          client_name: clientName,
          subdomain: subdomain,
          custom_domain: customDomain,
          branding_config: brandingConfig || {
            logo_url: '',
            primary_color: '#3B82F6',
            secondary_color: '#1F2937',
            company_name: companyName || clientName
          },
          is_active: true
        }])
        .select()
        .single();

      if (!wlError) {
        whiteLabel = wl;
      }
    }

    return NextResponse.json({
      success: true,
      client: client,
      workspace: workspace,
      whiteLabel: whiteLabel
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update client
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      contactEmail,
      contactPhone,
      companyName,
      industry,
      plan,
      status,
      billingSettings
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing clientId' },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from('agency_clients')
      .update({
        ...(clientName && { client_name: clientName }),
        ...(contactEmail && { contact_email: contactEmail }),
        ...(contactPhone && { contact_phone: contactPhone }),
        ...(companyName && { company_name: companyName }),
        ...(industry && { industry }),
        ...(plan && { plan }),
        ...(status && { status }),
        ...(billingSettings && { billing_settings: billingSettings }),
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client: client
    });

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove client
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing clientId' },
        { status: 400 }
      );
    }

    // Get client info first
    const { data: client } = await supabase
      .from('agency_clients')
      .select('workspace_id')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive instead of actual deletion
    const { error } = await supabase
      .from('agency_clients')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete client' },
        { status: 500 }
      );
    }

    // Also deactivate white-label instance
    await supabase
      .from('white_labels')
      .update({ is_active: false })
      .eq('client_id', clientId);

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getClientDetails(clientId: string) {
  const { data: client, error } = await supabase
    .from('agency_clients')
    .select(`
      *,
      workspaces (
        id,
        name,
        created_at,
        settings,
        phone_numbers (
          id,
          number,
          status,
          created_at
        ),
        calls (
          id,
          caller_number,
          status,
          duration,
          created_at
        ),
        webforms (
          id,
          name,
          submissions:form_submissions(count)
        )
      ),
      white_labels (
        id,
        subdomain,
        custom_domain,
        branding_config,
        is_active
      )
    `)
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }

  // Get analytics for this client
  const analytics = await getClientAnalytics(client.workspace_id);

  return NextResponse.json({
    success: true,
    client: client,
    analytics: analytics
  });
}

async function getClientAnalytics(workspaceId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Call statistics
  const { data: callStats } = await supabase
    .from('calls')
    .select('id, status, duration, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Form submissions
  const { data: formStats } = await supabase
    .from('form_submissions')
    .select('id, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Billing data
  const { data: billingStats } = await supabase
    .from('billing_transactions')
    .select('amount, type, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', thisMonth.toISOString());

  return {
    calls: {
      total: callStats?.length || 0,
      answered: callStats?.filter(c => c.status === 'completed').length || 0,
      missed: callStats?.filter(c => c.status === 'missed').length || 0,
      total_duration: callStats?.reduce((sum, c) => sum + (c.duration || 0), 0) || 0
    },
    forms: {
      total_submissions: formStats?.length || 0
    },
    billing: {
      current_month_charges: billingStats?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0,
      transaction_count: billingStats?.length || 0
    }
  };
}
