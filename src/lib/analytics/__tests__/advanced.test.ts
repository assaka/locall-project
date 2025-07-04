import { analyticsService } from '../advanced';
import { supabase } from '@/app/utils/supabaseClient';

// The supabase mock is already set up in jest.setup.js
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Advanced Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Report Generation', () => {
    it('should create a custom report', async () => {
      const mockReport = {
        id: 'report-1',
        workspace_id: 'workspace-1',
        name: 'Monthly Call Report',
        type: 'calls',
        config: {
          date_range: { start: '2024-01-01', end: '2024-01-31' },
          metrics: ['total_calls', 'conversion_rate'],
          filters: { status: 'completed' },
        },
        created_by: 'user-1',
        is_scheduled: false,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      const result = await advancedAnalyticsService.createReport({
        workspace_id: 'workspace-1',
        name: 'Monthly Call Report',
        type: 'calls',
        config: {
          date_range: { start: '2024-01-01', end: '2024-01-31' },
          metrics: ['total_calls', 'conversion_rate'],
          filters: { status: 'completed' },
        },
        created_by: 'user-1',
        is_scheduled: false,
      });

      expect(result).toEqual(mockReport);
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_reports');
    });

    it('should generate report data', async () => {
      const mockReportData = {
        total_calls: 150,
        answered_calls: 120,
        conversion_rate: 0.75,
        average_duration: 240,
        peak_hours: [9, 10, 14, 15],
        daily_breakdown: [
          { date: '2024-01-01', calls: 25, conversions: 18 },
          { date: '2024-01-02', calls: 30, conversions: 22 },
        ],
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockReportData,
        error: null,
      });

      const result = await advancedAnalyticsService.generateReportData('report-1');

      expect(result).toEqual(mockReportData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_analytics_report', {
        report_id: 'report-1',
      });
    });

    it('should export report data', async () => {
      const mockExportData = [
        { date: '2024-01-01', calls: 25, conversions: 18 },
        { date: '2024-01-02', calls: 30, conversions: 22 },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockExportData,
        error: null,
      });

      const result = await advancedAnalyticsService.exportReport('report-1', 'csv');

      expect(result).toEqual({
        data: mockExportData,
        format: 'csv',
        filename: expect.stringContaining('report-1'),
      });
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate call metrics', async () => {
      const mockMetrics = {
        total_calls: 500,
        answered_calls: 425,
        missed_calls: 75,
        average_duration: 180,
        total_duration: 76500,
        conversion_rate: 0.72,
        peak_hour: 14,
        busiest_day: 'Tuesday',
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockMetrics,
        error: null,
      });

      const result = await advancedAnalyticsService.calculateCallMetrics(
        'workspace-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual(mockMetrics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('calculate_call_metrics', {
        workspace_id: 'workspace-1',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
    });

    it('should calculate form metrics', async () => {
      const mockMetrics = {
        total_submissions: 120,
        unique_visitors: 95,
        conversion_rate: 0.15,
        average_completion_time: 45,
        abandonment_rate: 0.25,
        most_popular_form: 'contact-form',
        bounce_rate: 0.35,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockMetrics,
        error: null,
      });

      const result = await advancedAnalyticsService.calculateFormMetrics(
        'workspace-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual(mockMetrics);
    });

    it('should calculate revenue metrics', async () => {
      const mockMetrics = {
        total_revenue: 15000,
        monthly_recurring_revenue: 5000,
        average_order_value: 125,
        customer_lifetime_value: 850,
        churn_rate: 0.05,
        growth_rate: 0.12,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockMetrics,
        error: null,
      });

      const result = await advancedAnalyticsService.calculateRevenueMetrics(
        'workspace-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual(mockMetrics);
    });
  });

  describe('Predictive Analytics', () => {
    it('should generate call volume predictions', async () => {
      const mockPredictions = {
        next_7_days: [
          { date: '2024-02-01', predicted_calls: 25, confidence: 0.85 },
          { date: '2024-02-02', predicted_calls: 30, confidence: 0.82 },
        ],
        next_30_days: {
          total_predicted_calls: 850,
          trend: 'increasing',
          confidence: 0.78,
        },
        peak_prediction: {
          date: '2024-02-15',
          predicted_calls: 45,
          reason: 'marketing_campaign',
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockPredictions,
        error: null,
      });

      const result = await advancedAnalyticsService.predictCallVolume('workspace-1');

      expect(result).toEqual(mockPredictions);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('predict_call_volume', {
        workspace_id: 'workspace-1',
      });
    });

    it('should analyze conversion trends', async () => {
      const mockTrends = {
        current_rate: 0.75,
        trend_direction: 'upward',
        percentage_change: 0.05,
        factors: [
          { factor: 'call_duration', impact: 0.3, correlation: 'positive' },
          { factor: 'response_time', impact: -0.2, correlation: 'negative' },
        ],
        recommendations: [
          'Increase call duration by 15-20 seconds',
          'Reduce response time to under 3 rings',
        ],
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockTrends,
        error: null,
      });

      const result = await advancedAnalyticsService.analyzeConversionTrends('workspace-1');

      expect(result).toEqual(mockTrends);
    });
  });

  describe('Dashboard Management', () => {
    it('should create a custom dashboard', async () => {
      const mockDashboard = {
        id: 'dashboard-1',
        workspace_id: 'workspace-1',
        name: 'Sales Dashboard',
        layout: {
          widgets: [
            { type: 'metric', config: { metric: 'total_calls' }, position: { x: 0, y: 0 } },
            { type: 'chart', config: { chart_type: 'line', metric: 'conversion_rate' }, position: { x: 1, y: 0 } },
          ],
        },
        is_default: false,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockDashboard,
        error: null,
      });

      const result = await advancedAnalyticsService.createDashboard({
        workspace_id: 'workspace-1',
        name: 'Sales Dashboard',
        layout: {
          widgets: [
            { type: 'metric', config: { metric: 'total_calls' }, position: { x: 0, y: 0 } },
            { type: 'chart', config: { chart_type: 'line', metric: 'conversion_rate' }, position: { x: 1, y: 0 } },
          ],
        },
        is_default: false,
        created_by: 'user-1',
      });

      expect(result).toEqual(mockDashboard);
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_dashboards');
    });

    it('should get dashboard data', async () => {
      const mockDashboardData = {
        widgets: [
          {
            id: 'widget-1',
            type: 'metric',
            data: { value: 150, label: 'Total Calls', change: '+5%' },
          },
          {
            id: 'widget-2',
            type: 'chart',
            data: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              values: [25, 30, 28, 35, 32],
            },
          },
        ],
        last_updated: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockDashboardData,
        error: null,
      });

      const result = await advancedAnalyticsService.getDashboardData('dashboard-1');

      expect(result).toEqual(mockDashboardData);
    });
  });

  describe('Scheduled Reports', () => {
    it('should schedule a report', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        report_id: 'report-1',
        frequency: 'weekly',
        recipients: ['admin@example.com'],
        next_run: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockSchedule,
        error: null,
      });

      const result = await advancedAnalyticsService.scheduleReport({
        report_id: 'report-1',
        frequency: 'weekly',
        recipients: ['admin@example.com'],
        is_active: true,
      });

      expect(result).toEqual(mockSchedule);
      expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_reports');
    });

    it('should process scheduled reports', async () => {
      const mockScheduledReports = [
        {
          id: 'schedule-1',
          report_id: 'report-1',
          recipients: ['admin@example.com'],
          next_run: new Date().toISOString(),
        },
      ];

      mockSupabase.from().select().lte().eq().mockResolvedValue({
        data: mockScheduledReports,
        error: null,
      });

      // Mock report generation
      mockSupabase.rpc.mockResolvedValue({
        data: { total_calls: 150 },
        error: null,
      });

      // Mock update next run time
      mockSupabase.from().update().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      await advancedAnalyticsService.processScheduledReports();

      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
      expect(mockSupabase.rpc).toHaveBeenCalled();
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });
  });

  describe('Real-time Analytics', () => {
    it('should get real-time metrics', async () => {
      const mockRealTimeMetrics = {
        active_calls: 5,
        queued_calls: 2,
        available_agents: 8,
        current_conversion_rate: 0.78,
        calls_last_hour: 15,
        forms_last_hour: 8,
        response_time_avg: 2.5,
        system_health: 'good',
        timestamp: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockRealTimeMetrics,
        error: null,
      });

      const result = await advancedAnalyticsService.getRealTimeMetrics('workspace-1');

      expect(result).toEqual(mockRealTimeMetrics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_realtime_metrics', {
        workspace_id: 'workspace-1',
      });
    });
  });

  describe('Data Analysis', () => {
    it('should perform cohort analysis', async () => {
      const mockCohortData = {
        cohorts: [
          {
            period: '2024-01',
            users: 100,
            retention: {
              week_1: 0.85,
              week_2: 0.72,
              week_4: 0.64,
              week_8: 0.58,
            },
          },
        ],
        average_retention: {
          week_1: 0.82,
          week_2: 0.69,
          week_4: 0.61,
          week_8: 0.55,
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockCohortData,
        error: null,
      });

      const result = await advancedAnalyticsService.performCohortAnalysis('workspace-1', 'monthly');

      expect(result).toEqual(mockCohortData);
    });

    it('should analyze user behavior', async () => {
      const mockBehaviorData = {
        most_common_paths: [
          { path: 'homepage -> contact -> call', frequency: 45 },
          { path: 'pricing -> demo -> call', frequency: 32 },
        ],
        average_session_duration: 180,
        bounce_rate: 0.35,
        conversion_funnels: {
          visitor_to_lead: 0.15,
          lead_to_opportunity: 0.45,
          opportunity_to_customer: 0.75,
        },
        peak_activity_hours: [10, 11, 14, 15],
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockBehaviorData,
        error: null,
      });

      const result = await advancedAnalyticsService.analyzeUserBehavior('workspace-1');

      expect(result).toEqual(mockBehaviorData);
    });
  });

  describe('Error Handling', () => {
    it('should handle report creation errors', async () => {
      const error = new Error('Invalid report configuration');
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(advancedAnalyticsService.createReport({
        workspace_id: 'workspace-1',
        name: 'Invalid Report',
        type: 'calls',
        config: {},
        created_by: 'user-1',
        is_scheduled: false,
      })).rejects.toThrow('Invalid report configuration');
    });

    it('should handle metric calculation errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await advancedAnalyticsService.calculateCallMetrics(
        'workspace-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual({
        total_calls: 0,
        answered_calls: 0,
        missed_calls: 0,
        average_duration: 0,
        total_duration: 0,
        conversion_rate: 0,
      });
    });
  });
});
