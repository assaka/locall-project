import { supabase } from '../app/utils/supabaseClient';

export interface DashboardMetrics {
  totalCalls: number;
  totalCallMinutes: number;
  totalWebformSubmissions: number;
  totalWebformViews: number;
  activeUsers: number;
  revenue: number;
  conversionRate: number;
  averageCallDuration: number;
  callSuccessRate: number;
  topPerformingCampaigns: Array<{
    name: string;
    calls: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: 'call' | 'form' | 'conversion';
    description: string;
    timestamp: string;
    value?: number;
  }>;
  callsByHour: Array<{
    hour: string;
    calls: number;
  }>;
  formsBySource: Array<{
    source: string;
    submissions: number;
  }>;
}

export interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  services: {
    database: 'up' | 'down';
    api: 'up' | 'down';
    vonage: 'up' | 'down';
    brevo: 'up' | 'down';
    supabase: 'up' | 'down';
  };
  performance: {
    response_time: number;
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
  };
  alerts_count: number;
}

export class DashboardService {

  // Return mock dashboard metrics for development/demo
  static getMockDashboardMetrics(): DashboardMetrics {
    return {
      totalCalls: 1247,
      totalCallMinutes: 8934,
      totalWebformSubmissions: 456,
      totalWebformViews: 2890,
      activeUsers: 89,
      revenue: 23750.50,
      conversionRate: 15.8,
      averageCallDuration: 7.2,
      callSuccessRate: 92.4,
      topPerformingCampaigns: [
        { name: 'Summer Sale', calls: 234, revenue: 8950 },
        { name: 'Lead Generation', calls: 189, revenue: 6780 },
        { name: 'Product Demo', calls: 156, revenue: 5890 }
      ],
      recentActivity: [
        { type: 'call', description: 'New call from +1-555-0123', timestamp: new Date().toISOString(), value: 250 },
        { type: 'form', description: 'Contact form submitted', timestamp: new Date(Date.now() - 300000).toISOString() },
        { type: 'conversion', description: 'Lead converted to customer', timestamp: new Date(Date.now() - 600000).toISOString(), value: 1500 }
      ],
      callsByHour: [
        { hour: '09:00', calls: 23 },
        { hour: '10:00', calls: 45 },
        { hour: '11:00', calls: 67 },
        { hour: '12:00', calls: 34 },
        { hour: '13:00', calls: 56 },
        { hour: '14:00', calls: 78 },
        { hour: '15:00', calls: 45 },
        { hour: '16:00', calls: 32 }
      ],
      formsBySource: [
        { source: 'Website', submissions: 234 },
        { source: 'Social Media', submissions: 123 },
        { source: 'Email Campaign', submissions: 99 }
      ]
    };
  }

  // Get main dashboard metrics
  static async getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics> {
    try {
      // If workspace ID is the default UUID, return mock data
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {
        return this.getMockDashboardMetrics();
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      // Get call metrics
      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString());

      if (callsError) throw callsError;

      // Get form submissions
      const { data: forms, error: formsError } = await supabase
        .from('webform_submissions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString());

      if (formsError) throw formsError;

      // Get form views (tracking events)
      const { data: views, error: viewsError } = await supabase
        .from('webform_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('event_type', 'page_view')
        .gte('created_at', startDate.toISOString());

      if (viewsError) throw viewsError;

      // Get active users
      const { count: activeUsers, error: usersError } = await supabase
        .from('workspace_users')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (usersError) throw usersError;

      // Calculate metrics
      const totalCalls = calls?.length || 0;
      const totalCallMinutes = calls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const totalWebformSubmissions = forms?.length || 0;
      const totalWebformViews = views?.length || 0;
      const averageCallDuration = totalCalls > 0 ? totalCallMinutes / totalCalls : 0;

      // Calculate revenue (from successful calls and conversions)
      const revenue = calls?.reduce((sum, call) => {
        if (call.status === 'completed') {
          return sum + (call.estimated_value || 0);
        }
        return sum;
      }, 0) || 0;

      // Calculate conversion rate
      const conversionRate = totalWebformViews > 0 ? (totalWebformSubmissions / totalWebformViews) * 100 : 0;

      // Calculate call success rate
      const successfulCalls = calls?.filter(call => call.status === 'completed').length || 0;
      const callSuccessRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      // Get top performing campaigns
      const campaignStats = calls?.reduce((acc, call) => {
        const campaign = call.utm_data?.campaign || 'Direct';
        if (!acc[campaign]) {
          acc[campaign] = { calls: 0, revenue: 0 };
        }
        acc[campaign].calls++;
        acc[campaign].revenue += call.estimated_value || 0;
        return acc;
      }, {} as Record<string, { calls: number; revenue: number }>) || {};

      const topPerformingCampaigns = Object.entries(campaignStats)
        .map(([name, stats]) => ({ 
          name, 
          calls: (stats as { calls: number; revenue: number }).calls, 
          revenue: (stats as { calls: number; revenue: number }).revenue 
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Get recent activity
      const recentActivity = [
        ...(calls?.slice(-5).map(call => ({
          type: 'call' as const,
          description: `Call to ${call.to_number}`,
          timestamp: call.created_at,
          value: call.estimated_value
        })) || []),
        ...(forms?.slice(-5).map(form => ({
          type: 'form' as const,
          description: `Form submission from ${form.data?.email || 'visitor'}`,
          timestamp: form.created_at
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Get calls by hour (last 24 hours)
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentCalls = calls?.filter(call => 
        new Date(call.created_at) >= last24Hours
      ) || [];

      const callsByHour = Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, '0') + ':00';
        const callsInHour = recentCalls.filter(call => {
          const callHour = new Date(call.created_at).getHours();
          return callHour === i;
        }).length;
        return { hour, calls: callsInHour };
      });

      // Get forms by source
      const sourceStats = forms?.reduce((acc, form) => {
        const source = form.utm_data?.source || 'Direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const formsBySource = Object.entries(sourceStats)
        .map(([source, submissions]) => ({ source, submissions: submissions as number }))
        .sort((a, b) => b.submissions - a.submissions);

      return {
        totalCalls,
        totalCallMinutes,
        totalWebformSubmissions,
        totalWebformViews,
        activeUsers: activeUsers || 0,
        revenue,
        conversionRate,
        averageCallDuration,
        callSuccessRate,
        topPerformingCampaigns,
        recentActivity,
        callsByHour,
        formsBySource
      };

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // Get system health status
  static async getSystemHealth(workspaceId: string): Promise<SystemHealth> {
    try {
      // If workspace ID is the default UUID, return mock data
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {
        return this.getMockSystemHealth();
      }

      // Check service availability
      const services = {
        database: 'up' as 'up' | 'down',
        api: 'up' as 'up' | 'down',
        vonage: 'up' as 'up' | 'down',
        brevo: 'up' as 'up' | 'down',
        supabase: 'up' as 'up' | 'down'
      };

      // Test database connection
      try {
        const { error } = await supabase
          .from('workspaces')
          .select('id')
          .eq('id', workspaceId)
          .limit(1);
        
        if (error) services.database = 'down';
      } catch {
        services.database = 'down';
      }

      // Get performance metrics from the last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data: perfData } = await supabase
        .from('system_performance')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', oneHourAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const performance = {
        response_time: perfData?.response_time_avg || 0,
        uptime: 99.9, // TODO: Calculate actual uptime
        cpu_usage: perfData?.cpu_usage || 0,
        memory_usage: perfData?.memory_usage || 0
      };

      // Get active alerts count
      const { count: alertsCount } = await supabase
        .from('performance_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('resolved', false);

      // Determine overall status
      let overall_status: SystemHealth['overall_status'] = 'healthy';
      
      if (Object.values(services).includes('down') || performance.cpu_usage > 90 || performance.memory_usage > 95) {
        overall_status = 'critical';
      } else if (performance.cpu_usage > 70 || performance.memory_usage > 80 || (alertsCount || 0) > 0) {
        overall_status = 'warning';
      }

      return {
        overall_status,
        services,
        performance,
        alerts_count: alertsCount || 0
      };

    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  // Return mock system health for development/demo
  static getMockSystemHealth(): SystemHealth {
    return {
      overall_status: 'healthy',
      services: {
        database: 'up',
        api: 'up',
        vonage: 'up',
        brevo: 'up',
        supabase: 'up'
      },
      performance: {
        response_time: 145,
        uptime: 99.9,
        cpu_usage: 23.4,
        memory_usage: 67.8
      },
      alerts_count: 0
    };
  }

  // Get recent activity for dashboard
  static async getRecentActivity(workspaceId: string, limit: number = 10): Promise<any[]> {
    try {
      // If workspace ID is the default UUID, return mock data
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {
        return this.getMockRecentActivity(limit);
      }

      // Get recent calls
      const { data: recentCalls, error: callsError } = await supabase
        .from('calls')
        .select(`
          id, status, created_at, from_number, to_number, duration,
          workspace_id
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 2));

      if (callsError) throw callsError;

      // Get recent form submissions
      const { data: recentForms, error: formsError } = await supabase
        .from('webform_submissions')
        .select(`
          id, form_name, created_at, data, workspace_id
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 2));

      if (formsError) throw formsError;

      // Combine and format activities
      const activities = [
        ...(recentCalls || []).map(call => ({
          id: call.id,
          type: 'call',
          title: `Call ${call.status}`,
          description: `From ${call.from_number} to ${call.to_number}`,
          timestamp: call.created_at,
          status: call.status === 'completed' ? 'success' : 
                 call.status === 'failed' ? 'error' : 'warning'
        })),
        ...(recentForms || []).map(form => ({
          id: form.id,
          type: 'form',
          title: 'Form Submission',
          description: `${form.form_name} form submitted`,
          timestamp: form.created_at,
          status: 'success'
        }))
      ];

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  // Return mock recent activity for development/demo
  static getMockRecentActivity(limit: number = 10): any[] {
    const activities = [
      {
        id: '1',
        type: 'call',
        title: 'Call completed',
        description: 'From +1-555-0123 to +1-555-0456',
        timestamp: new Date().toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'form',
        title: 'Form Submission',
        description: 'Contact form submitted',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'call',
        title: 'Call failed',
        description: 'From +1-555-0789 to +1-555-0321',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'error'
      },
      {
        id: '4',
        type: 'form',
        title: 'Form Submission',
        description: 'Lead generation form submitted',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        status: 'success'
      },
      {
        id: '5',
        type: 'call',
        title: 'Call in progress',
        description: 'From +1-555-0111 to +1-555-0222',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        status: 'warning'
      }
    ];

    return activities.slice(0, limit);
  }

  // Get realtime stats for dashboard
  static async getRealtimeStats(workspaceId: string): Promise<any> {
    try {
      // If workspace ID is the default UUID, return mock data
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {
        return this.getMockRealtimeStats();
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get today's metrics
      const [callsToday, formsToday, activeUsers] = await Promise.all([
        // Calls today
        supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('created_at', todayStart.toISOString()),
        
        // Forms today
        supabase
          .from('webform_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('created_at', todayStart.toISOString()),
        
        // Active users (last hour)
        supabase
          .from('workspace_users')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('last_activity', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
      ]);

      return {
        callsToday: callsToday.count || 0,
        formsToday: formsToday.count || 0,
        activeUsers: activeUsers.count || 0,
        timestamp: now.toISOString()
      };

    } catch (error) {
      console.error('Error fetching realtime stats:', error);
      throw error;
    }
  }

  // Return mock realtime stats for development/demo
  static getMockRealtimeStats(): any {
    return {
      callsToday: 45,
      formsToday: 23,
      activeUsers: 12,
      revenue: 3250.75,
      peakHour: '14:00',
      responseTime: 145
    };
  }

  // Subscribe to realtime updates for dashboard-time updates for dashboard
  static subscribeToRealtime(workspaceId: string, callback: (update: any) => void): () => void {ToRealtimeUpdates(workspaceId: string, callback: (data: any) => void) {
    try {
      // If workspace ID is the default UUID, use mock subscriptionbscribe to calls table changes
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {st callsSubscription = supabase
        const mockData = this.getMockRealtimeStats();hboard-calls')
        callback({ type: 'mock', data: mockData });        .on('postgres_changes', 
        return () => {}; // No-op unsubscribe
      }

      // Subscribe to call events
      const callsSubscription = supabasefilter: `workspace_id=eq.${workspaceId}`
        .channel('dashboard-calls')
        .on('postgres_changes', 
          { : payload });
            event: '*', 
            schema: 'public', 
            table: 'calls',
            filter: `workspace_id=eq.${workspaceId}`
          }, bscribe to form submissions
          (payload) => {st formsSubscription = supabase
            callback({ type: 'call', data: payload });hboard-forms')
          }        .on('postgres_changes', 
        )
        .subscribe();

      // Subscribe to form submissions    table: 'webform_submissions',
      const formsSubscription = supabase            filter: `workspace_id=eq.${workspaceId}`
        .channel('dashboard-forms')
        .on('postgres_changes', 
          { ck({ type: 'form', data: payload });
            event: '*',      }
            schema: 'public',      )
            table: 'webform_submissions',        .subscribe();
            filter: `workspace_id=eq.${workspaceId}`
          }, 
          (payload) => {allsSubscription.unsubscribe();
            callback({ type: 'form', data: payload });
          }};
        )
        .subscribe();{
altime subscriptions:', error);
      return () => {;
        callsSubscription.unsubscribe();
        formsSubscription.unsubscribe();
      };
 metrics cache (called periodically)
    } catch (error) {  static async updateMetricsCache(workspaceId: string): Promise<void> {
      console.error('Error setting up realtime subscriptions:', error);
      throw error;ceId);
    }
  } // Store in cache table
   await supabase
  // Update metrics cache (called periodically)       .from('dashboard_metrics_cache')
  static async updateMetricsCache(workspaceId: string): Promise<void> {        .upsert({



















}  }    }      throw error;      console.error('Error updating metrics cache:', error);    } catch (error) {        });          updated_at: new Date().toISOString()          metrics_data: metrics,          workspace_id: workspaceId,        .upsert({        .from('dashboard_metrics_cache')      await supabase      // Store in cache table            const metrics = await this.getDashboardMetrics(workspaceId);    try {          workspace_id: workspaceId,
          metrics_data: metrics,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error updating metrics cache:', error);
      throw error;
    }
  }
}
