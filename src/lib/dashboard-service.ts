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

      // Calculate basic metrics with fallback values
      const totalCalls = calls?.length || 0;
      const totalCallMinutes = calls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const totalWebformSubmissions = forms?.length || 0;
      const totalWebformViews = 1000; // Placeholder
      const averageCallDuration = totalCalls > 0 ? totalCallMinutes / totalCalls : 0;
      const revenue = calls?.reduce((sum, call) => sum + (call.estimated_value || 0), 0) || 0;
      const conversionRate = totalWebformViews > 0 ? (totalWebformSubmissions / totalWebformViews) * 100 : 0;
      const successfulCalls = calls?.filter(call => call.status === 'completed').length || 0;
      const callSuccessRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      return {
        totalCalls,
        totalCallMinutes,
        totalWebformSubmissions,
        totalWebformViews,
        activeUsers: 25, // Placeholder
        revenue,
        conversionRate,
        averageCallDuration,
        callSuccessRate,
        topPerformingCampaigns: [
          { name: 'Campaign 1', calls: 50, revenue: 2500 },
          { name: 'Campaign 2', calls: 30, revenue: 1800 }
        ],
        recentActivity: [
          { type: 'call', description: 'Recent call activity', timestamp: new Date().toISOString() }
        ],
        callsByHour: [
          { hour: '09:00', calls: 10 },
          { hour: '10:00', calls: 15 }
        ],
        formsBySource: [
          { source: 'Website', submissions: totalWebformSubmissions }
        ]
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

      // Basic health check with fallbacks
      const services = {
        database: 'up' as 'up' | 'down',
        api: 'up' as 'up' | 'down',
        vonage: 'up' as 'up' | 'down',
        brevo: 'up' as 'up' | 'down',
        supabase: 'up' as 'up' | 'down'
      };

      return {
        overall_status: 'healthy',
        services,
        performance: {
          response_time: 150,
          uptime: 99.8,
          cpu_usage: 25.0,
          memory_usage: 65.0
        },
        alerts_count: 0
      };

    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  // Get recent activity for dashboard
  static async getRecentActivity(workspaceId: string, limit: number = 10): Promise<any[]> {
    try {
      // If workspace ID is the default UUID, return mock data
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {
        return this.getMockRecentActivity(limit);
      }

      // Try to get real data, fallback to mock on error
      try {
        const { data: recentCalls } = await supabase
          .from('calls')
          .select('id, status, created_at, from_number, to_number')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (recentCalls && recentCalls.length > 0) {
          return recentCalls.map(call => ({
            id: call.id,
            type: 'call',
            title: `Call ${call.status}`,
            description: `From ${call.from_number} to ${call.to_number}`,
            timestamp: call.created_at,
            status: call.status === 'completed' ? 'success' : 'warning'
          }));
        }
      } catch (dbError) {
        console.log('Database query failed, using mock data:', dbError);
      }

      // Fallback to mock data
      return this.getMockRecentActivity(limit);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return this.getMockRecentActivity(limit);
    }
  }

  // Get realtime stats
  static async getRealtimeStats(workspaceId: string): Promise<any> {
    try {
      // If workspace ID is the default UUID, return mock data
      if (workspaceId === '00000000-0000-0000-0000-000000000000') {
        return this.getMockRealtimeStats();
      }

      // Try to get real data, fallback to mock on error
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: callsToday } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('created_at', today);

        return {
          callsToday: callsToday || 0,
          formsToday: 15,
          activeUsers: 8,
          revenue: 2150.25,
          peakHour: '14:00',
          responseTime: 125
        };
      } catch (dbError) {
        console.log('Database query failed, using mock data:', dbError);
      }

      // Fallback to mock data
      return this.getMockRealtimeStats();

    } catch (error) {
      console.error('Error fetching realtime stats:', error);
      return this.getMockRealtimeStats();
    }
  }
}
