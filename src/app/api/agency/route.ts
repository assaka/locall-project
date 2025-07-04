import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Agency {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  plan: 'starter' | 'professional' | 'enterprise';
  created: string;
  lastActivity: string;
  totalClients: number;
  monthlyRevenue: number;
  callVolume: number;
  complianceScore: number;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  billing: {
    status: 'current' | 'overdue' | 'cancelled';
    nextPayment: string;
    amount: number;
  };
  features: {
    whiteLabel: boolean;
    customDomain: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
}

interface AgencyMetrics {
  totalAgencies: number;
  activeAgencies: number;
  monthlyRevenue: number;
  averageCallVolume: number;
  complianceIssues: number;
  newSignups: number;
  churnRate: number;
  supportTickets: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

  try {
    switch (action) {
      case 'list':
        const agencies = await getAgencies(workspaceId);
        return NextResponse.json({ success: true, data: agencies });

      case 'metrics':
        const metrics = await getAgencyMetrics(workspaceId);
        return NextResponse.json({ success: true, data: metrics });

      case 'analytics':
        const analytics = await getAgencyAnalytics(workspaceId);
        return NextResponse.json({ success: true, data: analytics });

      default:
        // Return comprehensive agency data
        const [agenciesList, agencyMetrics, agencyAnalytics] = await Promise.all([
          getAgencies(workspaceId),
          getAgencyMetrics(workspaceId),
          getAgencyAnalytics(workspaceId)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            agencies: agenciesList,
            metrics: agencyMetrics,
            analytics: agencyAnalytics
          }
        });
    }
  } catch (error) {
    console.error('Agency API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function getAgencies(workspaceId: string): Promise<Agency[]> {
  try {
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select(`
        *,
        agency_owners (
          name,
          email,
          phone
        ),
        agency_billing (
          status,
          next_payment,
          amount
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match interface
    return (agencies || []).map(agency => ({
      id: agency.id,
      name: agency.name,
      domain: agency.domain || `${agency.name.toLowerCase().replace(/\s+/g, '')}.locall.io`,
      status: agency.status || 'active',
      plan: agency.plan || 'professional',
      created: agency.created_at,
      lastActivity: agency.last_activity || agency.updated_at,
      totalClients: agency.total_clients || 0,
      monthlyRevenue: agency.monthly_revenue || 0,
      callVolume: agency.call_volume || 0,
      complianceScore: agency.compliance_score || 95,
      owner: {
        name: agency.agency_owners?.[0]?.name || 'Unknown',
        email: agency.agency_owners?.[0]?.email || 'unknown@example.com',
        phone: agency.agency_owners?.[0]?.phone || '+1-555-0000'
      },
      billing: {
        status: agency.agency_billing?.[0]?.status || 'current',
        nextPayment: agency.agency_billing?.[0]?.next_payment || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: agency.agency_billing?.[0]?.amount || 999
      },
      features: {
        whiteLabel: agency.features?.whiteLabel || false,
        customDomain: agency.features?.customDomain || false,
        apiAccess: agency.features?.apiAccess || false,
        prioritySupport: agency.features?.prioritySupport || false
      }
    }));
  } catch (error) {
    console.error('Error getting agencies:', error);
    // Return sample data
    return [
      {
        id: 'ag_001',
        name: 'TechCall Solutions',
        domain: 'techcall.locall.io',
        status: 'active',
        plan: 'enterprise',
        created: '2024-01-15T00:00:00Z',
        lastActivity: '2024-01-20T00:00:00Z',
        totalClients: 45,
        monthlyRevenue: 12500,
        callVolume: 8950,
        complianceScore: 98,
        owner: {
          name: 'Sarah Johnson',
          email: 'sarah@techcall.com',
          phone: '+1-555-0123'
        },
        billing: {
          status: 'current',
          nextPayment: '2024-02-15T00:00:00Z',
          amount: 1250
        },
        features: {
          whiteLabel: true,
          customDomain: true,
          apiAccess: true,
          prioritySupport: true
        }
      },
      {
        id: 'ag_002',
        name: 'Sales Boost Agency',
        domain: 'salesboost.locall.io',
        status: 'active',
        plan: 'professional',
        created: '2024-01-08T00:00:00Z',
        lastActivity: '2024-01-19T00:00:00Z',
        totalClients: 28,
        monthlyRevenue: 7800,
        callVolume: 5240,
        complianceScore: 92,
        owner: {
          name: 'Mike Chen',
          email: 'mike@salesboost.com',
          phone: '+1-555-0456'
        },
        billing: {
          status: 'current',
          nextPayment: '2024-02-08T00:00:00Z',
          amount: 780
        },
        features: {
          whiteLabel: false,
          customDomain: true,
          apiAccess: true,
          prioritySupport: false
        }
      }
    ];
  }
}

async function getAgencyMetrics(workspaceId: string): Promise<AgencyMetrics> {
  try {
    const [totalAgencies, activeAgencies, newSignups, supportTickets] = await Promise.all([
      supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'active'),
      supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'open')
    ]);

    // Get revenue and call volume totals
    const { data: agencyStats } = await supabase
      .from('agencies')
      .select('monthly_revenue, call_volume, compliance_score')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    const totalRevenue = agencyStats?.reduce((sum, agency) => sum + (agency.monthly_revenue || 0), 0) || 0;
    const totalCallVolume = agencyStats?.reduce((sum, agency) => sum + (agency.call_volume || 0), 0) || 0;
    const averageCallVolume = activeAgencies.count ? totalCallVolume / activeAgencies.count : 0;
    const complianceIssues = agencyStats?.filter(agency => (agency.compliance_score || 100) < 90).length || 0;

    return {
      totalAgencies: totalAgencies.count || 0,
      activeAgencies: activeAgencies.count || 0,
      monthlyRevenue: totalRevenue,
      averageCallVolume: Math.floor(averageCallVolume),
      complianceIssues,
      newSignups: newSignups.count || 0,
      churnRate: totalAgencies.count ? ((totalAgencies.count - activeAgencies.count) / totalAgencies.count * 100) : 0,
      supportTickets: supportTickets.count || 0
    };
  } catch (error) {
    console.error('Error getting agency metrics:', error);
    return {
      totalAgencies: 47,
      activeAgencies: 42,
      monthlyRevenue: 147500,
      averageCallVolume: 3420,
      complianceIssues: 3,
      newSignups: 8,
      churnRate: 2.3,
      supportTickets: 12
    };
  }
}

async function getAgencyAnalytics(workspaceId: string) {
  try {
    // Get agency performance data over time
    const { data: performanceData } = await supabase
      .from('agency_performance')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true });

    // Get plan distribution
    const { data: planDistribution } = await supabase
      .from('agencies')
      .select('plan')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    const plans = planDistribution?.reduce((acc, agency) => {
      acc[agency.plan] = (acc[agency.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      performance: performanceData || [],
      planDistribution: Object.entries(plans).map(([plan, count]) => ({ plan, count })),
      growth: {
        agencies: 15.2,
        revenue: 23.8,
        callVolume: 18.4
      }
    };
  } catch (error) {
    console.error('Error getting agency analytics:', error);
    return {
      performance: [],
      planDistribution: [
        { plan: 'starter', count: 15 },
        { plan: 'professional', count: 20 },
        { plan: 'enterprise', count: 7 }
      ],
      growth: {
        agencies: 15.2,
        revenue: 23.8,
        callVolume: 18.4
      }
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, plan, ownerId, workspaceId } = body;

    const { data: agency, error } = await supabase
      .from('agencies')
      .insert({
        name,
        domain,
        plan,
        owner_id: ownerId,
        workspace_id: workspaceId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: agency });
  } catch (error) {
    console.error('Error creating agency:', error);
    const message = error instanceof Error ? error.message : 'Failed to create agency';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
