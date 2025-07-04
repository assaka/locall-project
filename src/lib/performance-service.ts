import { supabase } from '../app/utils/supabaseClient';

export interface PerformanceMetric {
  id: string;
  workspace_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  threshold_warning: number;
  threshold_critical: number;
  status: 'good' | 'warning' | 'critical';
  recorded_at: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface SystemLoad {
  id: string;
  workspace_id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
  active_connections: number;
  response_time_avg: number;
  error_rate: number;
}

export interface PerformanceAlert {
  id: string;
  workspace_id: string;
  metric_name: string;
  severity: 'warning' | 'critical';
  threshold_exceeded: number;
  current_value: number;
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface PerformanceStats {
  current_metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    response_time: number;
    error_rate: number;
    uptime: number;
  };
  trends: {
    cpu_trend: number;
    memory_trend: number;
    performance_score: number;
  };
  alerts: {
    active_alerts: number;
    critical_alerts: number;
    warning_alerts: number;
  };
  availability: {
    uptime_percentage: number;
    downtime_minutes: number;
    incident_count: number;
  };
}

export class PerformanceService {

  // Record performance metrics
  static async recordMetrics(workspaceId: string, metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_usage: number;
    active_connections: number;
    response_time_avg: number;
    error_rate: number;
  }): Promise<SystemLoad> {
    try {
      const { data, error } = await supabase
        .from('system_performance')
        .insert({
          workspace_id: workspaceId,
          timestamp: new Date().toISOString(),
          ...metrics
        })
        .select()
        .single();

      if (error) throw error;

      // Check for threshold violations
      await this.checkThresholds(workspaceId, metrics);

      return data;

    } catch (error) {
      console.error('Error recording performance metrics:', error);
      throw error;
    }
  }

  // Get current performance metrics
  static async getCurrentMetrics(workspaceId: string): Promise<PerformanceStats> {
    try {
      // Get latest system load
      const { data: latestLoad, error: loadError } = await supabase
        .from('system_performance')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (loadError && loadError.code !== 'PGRST116') throw loadError;

      // Get metrics from last 24 hours for trends
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: historicalData, error: histError } = await supabase
        .from('system_performance')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', twentyFourHoursAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (histError) throw histError;

      // Get active alerts
      const { data: alerts, error: alertError } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('resolved', false);

      if (alertError) throw alertError;

      // Calculate trends
      const trends = this.calculateTrends(historicalData || []);
      
      // Calculate uptime
      const uptimeStats = await this.calculateUptime(workspaceId);

      return {
        current_metrics: {
          cpu: latestLoad?.cpu_usage || 0,
          memory: latestLoad?.memory_usage || 0,
          disk: latestLoad?.disk_usage || 0,
          network: latestLoad?.network_usage || 0,
          response_time: latestLoad?.response_time_avg || 0,
          error_rate: latestLoad?.error_rate || 0,
          uptime: uptimeStats.uptime_percentage
        },
        trends: {
          cpu_trend: trends.cpu_trend,
          memory_trend: trends.memory_trend,
          performance_score: trends.performance_score
        },
        alerts: {
          active_alerts: alerts?.length || 0,
          critical_alerts: alerts?.filter(a => a.severity === 'critical').length || 0,
          warning_alerts: alerts?.filter(a => a.severity === 'warning').length || 0
        },
        availability: uptimeStats
      };

    } catch (error) {
      console.error('Error getting current metrics:', error);
      throw error;
    }
  }

  // Get historical performance data
  static async getHistoricalData(workspaceId: string, hours: number = 24): Promise<SystemLoad[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from('system_performance')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting historical data:', error);
      throw error;
    }
  }

  // Get performance alerts
  static async getAlerts(workspaceId: string, includeResolved: boolean = false): Promise<PerformanceAlert[]> {
    try {
      let query = supabase
        .from('performance_alerts')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (!includeResolved) {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  // Acknowledge alert
  static async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  static async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Private helper methods
  private static calculateTrends(data: SystemLoad[]): {
    cpu_trend: number;
    memory_trend: number;
    performance_score: number;
  } {
    if (data.length < 2) {
      return { cpu_trend: 0, memory_trend: 0, performance_score: 100 };
    }

    const recent = data.slice(-10); // Last 10 measurements
    const earlier = data.slice(-20, -10); // Previous 10 measurements

    const recentAvgCpu = recent.reduce((sum, d) => sum + d.cpu_usage, 0) / recent.length;
    const earlierAvgCpu = earlier.length > 0 ? earlier.reduce((sum, d) => sum + d.cpu_usage, 0) / earlier.length : recentAvgCpu;

    const recentAvgMemory = recent.reduce((sum, d) => sum + d.memory_usage, 0) / recent.length;
    const earlierAvgMemory = earlier.length > 0 ? earlier.reduce((sum, d) => sum + d.memory_usage, 0) / earlier.length : recentAvgMemory;

    const cpu_trend = ((recentAvgCpu - earlierAvgCpu) / earlierAvgCpu) * 100;
    const memory_trend = ((recentAvgMemory - earlierAvgMemory) / earlierAvgMemory) * 100;

    // Calculate performance score (0-100)
    const avgResponseTime = recent.reduce((sum, d) => sum + d.response_time_avg, 0) / recent.length;
    const avgErrorRate = recent.reduce((sum, d) => sum + d.error_rate, 0) / recent.length;

    let performance_score = 100;
    performance_score -= Math.min(recentAvgCpu * 0.3, 30); // CPU impact
    performance_score -= Math.min(recentAvgMemory * 0.2, 20); // Memory impact
    performance_score -= Math.min(avgResponseTime * 0.01, 25); // Response time impact
    performance_score -= Math.min(avgErrorRate * 10, 25); // Error rate impact

    return {
      cpu_trend: isNaN(cpu_trend) ? 0 : cpu_trend,
      memory_trend: isNaN(memory_trend) ? 0 : memory_trend,
      performance_score: Math.max(0, Math.min(100, performance_score))
    };
  }

  private static async calculateUptime(workspaceId: string): Promise<{
    uptime_percentage: number;
    downtime_minutes: number;
    incident_count: number;
  }> {
    try {
      // Get data from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: incidents, error } = await supabase
        .from('service_incidents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const totalMinutesInPeriod = 30 * 24 * 60; // 30 days in minutes
      const downtime_minutes = incidents?.reduce((total, incident) => {
        if (incident.resolved_at) {
          const start = new Date(incident.created_at);
          const end = new Date(incident.resolved_at);
          return total + (end.getTime() - start.getTime()) / (1000 * 60);
        }
        return total;
      }, 0) || 0;

      const uptime_percentage = ((totalMinutesInPeriod - downtime_minutes) / totalMinutesInPeriod) * 100;

      return {
        uptime_percentage: Math.max(0, Math.min(100, uptime_percentage)),
        downtime_minutes,
        incident_count: incidents?.length || 0
      };

    } catch (error) {
      console.error('Error calculating uptime:', error);
      return {
        uptime_percentage: 99.9,
        downtime_minutes: 0,
        incident_count: 0
      };
    }
  }

  private static async checkThresholds(workspaceId: string, metrics: any): Promise<void> {
    try {
      // Define default thresholds
      const thresholds = {
        cpu_usage: { warning: 70, critical: 90 },
        memory_usage: { warning: 80, critical: 95 },
        disk_usage: { warning: 85, critical: 95 },
        response_time_avg: { warning: 2000, critical: 5000 }, // milliseconds
        error_rate: { warning: 0.05, critical: 0.1 } // 5% and 10%
      };

      for (const [metricName, value] of Object.entries(metrics)) {
        const threshold = thresholds[metricName as keyof typeof thresholds];
        if (!threshold) continue;

        let severity: 'warning' | 'critical' | null = null;
        if (value >= threshold.critical) {
          severity = 'critical';
        } else if (value >= threshold.warning) {
          severity = 'warning';
        }

        if (severity) {
          // Check if alert already exists for this metric
          const { data: existingAlert } = await supabase
            .from('performance_alerts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('metric_name', metricName)
            .eq('resolved', false)
            .single();

          if (!existingAlert) {
            // Create new alert
            await supabase
              .from('performance_alerts')
              .insert({
                workspace_id: workspaceId,
                metric_name: metricName,
                severity,
                threshold_exceeded: severity === 'critical' ? threshold.critical : threshold.warning,
                current_value: value,
                message: `${metricName} has exceeded ${severity} threshold: ${value}${this.getMetricUnit(metricName)}`,
                acknowledged: false,
                resolved: false
              });
          }
        } else {
          // Check if we should resolve any existing alerts for this metric
          const { data: existingAlerts } = await supabase
            .from('performance_alerts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('metric_name', metricName)
            .eq('resolved', false);

          if (existingAlerts && existingAlerts.length > 0) {
            // Resolve alerts if metric is back to normal
            await supabase
              .from('performance_alerts')
              .update({
                resolved: true,
                resolved_at: new Date().toISOString()
              })
              .eq('workspace_id', workspaceId)
              .eq('metric_name', metricName)
              .eq('resolved', false);
          }
        }
      }

    } catch (error) {
      console.error('Error checking thresholds:', error);
      // Don't throw here as this shouldn't break the main flow
    }
  }

  private static getMetricUnit(metricName: string): string {
    const units: Record<string, string> = {
      cpu_usage: '%',
      memory_usage: '%',
      disk_usage: '%',
      network_usage: '%',
      response_time_avg: 'ms',
      error_rate: '%'
    };
    return units[metricName] || '';
  }

  // Simulate system metrics for demo purposes (remove in production)
  static async simulateMetrics(workspaceId: string): Promise<SystemLoad> {
    const metrics = {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      network_usage: Math.random() * 100,
      active_connections: Math.floor(Math.random() * 1000),
      response_time_avg: Math.random() * 2000,
      error_rate: Math.random() * 0.1
    };

    return this.recordMetrics(workspaceId, metrics);
  }
}
