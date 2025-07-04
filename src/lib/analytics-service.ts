import { supabase } from '@/app/utils/supabaseClient';

export interface CallAnalytics {
  total_calls: number;
  total_duration: number;
  unique_callers: number;
  conversion_rate: number;
  average_call_duration: number;
  peak_hours: Array<{
    hour: number;
    call_count: number;
  }>;
  daily_calls: Array<{
    date: string;
    call_count: number;
    total_duration: number;
    unique_callers: number;
  }>;
  call_outcomes: Array<{
    outcome: string;
    count: number;
    percentage: number;
  }>;
  geographic_data: Array<{
    country: string;
    region: string;
    call_count: number;
  }>;
}

export interface FormAnalytics {
  total_submissions: number;
  unique_visitors: number;
  conversion_rate: number;
  average_completion_time: number;
  form_performance: Array<{
    form_id: string;
    form_name: string;
    submissions: number;
    views: number;
    conversion_rate: number;
  }>;
  field_analytics: Array<{
    field_name: string;
    completion_rate: number;
    average_time: number;
    drop_off_rate: number;
  }>;
  traffic_sources: Array<{
    source: string;
    submissions: number;
    percentage: number;
  }>;
}

export interface UserAnalytics {
  total_users: number;
  active_users_30d: number;
  new_users_30d: number;
  user_retention: Array<{
    period: string;
    retention_rate: number;
  }>;
  user_activity: Array<{
    date: string;
    active_users: number;
    new_users: number;
  }>;
  feature_usage: Array<{
    feature: string;
    usage_count: number;
    unique_users: number;
  }>;
}

export class AnalyticsService {
  
  async getCallAnalytics(
    startDate: string, 
    endDate: string, 
    workspaceId?: string
  ): Promise<CallAnalytics> {
    try {
      // Get call data from Supabase
      let query = supabase
        .from('calls')
        .select(`
          id,
          caller_number,
          duration,
          status,
          outcome,
          created_at,
          country,
          region,
          workspace_id
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: calls, error } = await query;

      if (error) {
        console.error('Error fetching call analytics:', error);
        throw error;
      }

      // Process the data
      const totalCalls = calls?.length || 0;
      const totalDuration = calls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const uniqueCallers = new Set(calls?.map(call => call.caller_number)).size;
      
      // Calculate conversion rate (calls that resulted in positive outcomes)
      const successfulCalls = calls?.filter(call => 
        call.outcome === 'converted' || 
        call.outcome === 'appointment_booked' ||
        call.outcome === 'sale_made'
      ).length || 0;
      
      const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
      const averageCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

      // Calculate peak hours
      const hourCounts: { [key: number]: number } = {};
      calls?.forEach(call => {
        const hour = new Date(call.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), call_count: count }))
        .sort((a, b) => b.call_count - a.call_count)
        .slice(0, 24);

      // Calculate daily calls
      const dailyCounts: { [key: string]: any } = {};
      calls?.forEach(call => {
        const date = new Date(call.created_at).toISOString().split('T')[0];
        if (!dailyCounts[date]) {
          dailyCounts[date] = {
            date,
            call_count: 0,
            total_duration: 0,
            unique_callers: new Set()
          };
        }
        dailyCounts[date].call_count++;
        dailyCounts[date].total_duration += call.duration || 0;
        dailyCounts[date].unique_callers.add(call.caller_number);
      });

      const dailyCalls = Object.values(dailyCounts).map((day: any) => ({
        date: day.date,
        call_count: day.call_count,
        total_duration: day.total_duration,
        unique_callers: day.unique_callers.size
      }));

      // Calculate call outcomes
      const outcomeCounts: { [key: string]: number } = {};
      calls?.forEach(call => {
        const outcome = call.outcome || 'unknown';
        outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
      });

      const callOutcomes = Object.entries(outcomeCounts).map(([outcome, count]) => ({
        outcome,
        count,
        percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0
      }));

      // Calculate geographic data
      const geoCounts: { [key: string]: any } = {};
      calls?.forEach(call => {
        const key = `${call.country}-${call.region}`;
        if (!geoCounts[key]) {
          geoCounts[key] = {
            country: call.country || 'Unknown',
            region: call.region || 'Unknown',
            call_count: 0
          };
        }
        geoCounts[key].call_count++;
      });

      const geographicData = Object.values(geoCounts);

      return {
        total_calls: totalCalls,
        total_duration: totalDuration,
        unique_callers: uniqueCallers,
        conversion_rate: conversionRate,
        average_call_duration: averageCallDuration,
        peak_hours: peakHours,
        daily_calls: dailyCalls,
        call_outcomes: callOutcomes,
        geographic_data: geographicData
      };

    } catch (error) {
      console.error('Error in getCallAnalytics:', error);
      throw error;
    }
  }

  async getFormAnalytics(
    startDate: string,
    endDate: string,
    workspaceId?: string
  ): Promise<FormAnalytics> {
    try {
      // Get form submissions from Supabase
      let query = supabase
        .from('form_submissions')
        .select(`
          id,
          form_id,
          visitor_id,
          completion_time,
          created_at,
          source,
          workspace_id,
          forms!inner(
            id,
            name,
            views
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: submissions, error } = await query;

      if (error) {
        console.error('Error fetching form analytics:', error);
        throw error;
      }

      // Get form views data
      let viewsQuery = supabase
        .from('form_views')
        .select(`
          form_id,
          visitor_id,
          created_at,
          workspace_id
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (workspaceId) {
        viewsQuery = viewsQuery.eq('workspace_id', workspaceId);
      }

      const { data: views, error: viewsError } = await viewsQuery;

      if (viewsError) {
        console.error('Error fetching form views:', error);
        throw viewsError;
      }

      const totalSubmissions = submissions?.length || 0;
      const uniqueVisitors = new Set(submissions?.map(s => s.visitor_id)).size;
      const totalViews = views?.length || 0;
      const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;

      // Calculate average completion time
      const completionTimes = submissions?.map(s => s.completion_time).filter(Boolean) || [];
      const averageCompletionTime = completionTimes.length > 0 ? 
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;

      // Calculate form performance
      const formStats: { [key: string]: any } = {};
      submissions?.forEach(submission => {
        const formId = submission.form_id;
        if (!formStats[formId]) {
          formStats[formId] = {
            form_id: formId,
            form_name: (submission.forms as any)?.name || 'Unknown Form',
            submissions: 0,
            views: 0
          };
        }
        formStats[formId].submissions++;
      });

      views?.forEach(view => {
        const formId = view.form_id;
        if (formStats[formId]) {
          formStats[formId].views++;
        }
      });

      const formPerformance = Object.values(formStats).map((form: any) => ({
        ...form,
        conversion_rate: form.views > 0 ? (form.submissions / form.views) * 100 : 0
      }));

      // Calculate traffic sources
      const sourceCounts: { [key: string]: number } = {};
      submissions?.forEach(submission => {
        const source = submission.source || 'direct';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });

      const trafficSources = Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        submissions: count,
        percentage: totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0
      }));

      return {
        total_submissions: totalSubmissions,
        unique_visitors: uniqueVisitors,
        conversion_rate: conversionRate,
        average_completion_time: averageCompletionTime,
        form_performance: formPerformance,
        field_analytics: [], // Will implement field-level analytics separately
        traffic_sources: trafficSources
      };

    } catch (error) {
      console.error('Error in getFormAnalytics:', error);
      throw error;
    }
  }

  async getUserAnalytics(
    startDate: string,
    endDate: string,
    workspaceId?: string
  ): Promise<UserAnalytics> {
    try {
      // Get user activity data
      let query = supabase
        .from('user_activity')
        .select(`
          user_id,
          activity_type,
          created_at,
          workspace_id
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching user analytics:', error);
        throw error;
      }

      // Get workspace members
      let membersQuery = supabase
        .from('workspace_members')
        .select(`
          user_id,
          created_at,
          last_active,
          workspace_id
        `);

      if (workspaceId) {
        membersQuery = membersQuery.eq('workspace_id', workspaceId);
      }

      const { data: members, error: membersError } = await membersQuery;

      if (membersError) {
        console.error('Error fetching workspace members:', error);
        throw membersError;
      }

      const totalUsers = members?.length || 0;
      
      // Calculate active users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers30d = members?.filter(member => 
        member.last_active && new Date(member.last_active) >= thirtyDaysAgo
      ).length || 0;

      // Calculate new users in last 30 days
      const newUsers30d = members?.filter(member => 
        new Date(member.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Calculate daily user activity
      const dailyActivity: { [key: string]: any } = {};
      activities?.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (!dailyActivity[date]) {
          dailyActivity[date] = {
            date,
            active_users: new Set(),
            new_users: new Set()
          };
        }
        dailyActivity[date].active_users.add(activity.user_id);
      });

      members?.forEach(member => {
        const date = new Date(member.created_at).toISOString().split('T')[0];
        if (dailyActivity[date]) {
          dailyActivity[date].new_users.add(member.user_id);
        }
      });

      const userActivity = Object.values(dailyActivity).map((day: any) => ({
        date: day.date,
        active_users: day.active_users.size,
        new_users: day.new_users.size
      }));

      // Calculate feature usage
      const featureUsage: { [key: string]: any } = {};
      activities?.forEach(activity => {
        const feature = activity.activity_type;
        if (!featureUsage[feature]) {
          featureUsage[feature] = {
            feature,
            usage_count: 0,
            unique_users: new Set()
          };
        }
        featureUsage[feature].usage_count++;
        featureUsage[feature].unique_users.add(activity.user_id);
      });

      const featureUsageStats = Object.values(featureUsage).map((feature: any) => ({
        feature: feature.feature,
        usage_count: feature.usage_count,
        unique_users: feature.unique_users.size
      }));

      return {
        total_users: totalUsers,
        active_users_30d: activeUsers30d,
        new_users_30d: newUsers30d,
        user_retention: [], // Will implement retention calculation separately
        user_activity: userActivity,
        feature_usage: featureUsageStats
      };

    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      throw error;
    }
  }

  async logUserActivity(
    userId: string,
    activityType: string,
    workspaceId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: userId,
          activity_type: activityType,
          workspace_id: workspaceId,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging user activity:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in logUserActivity:', error);
      throw error;
    }
  }

  async trackFormView(
    formId: string,
    visitorId: string,
    workspaceId?: string,
    source?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('form_views')
        .insert({
          form_id: formId,
          visitor_id: visitorId,
          workspace_id: workspaceId,
          source: source,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking form view:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in trackFormView:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
