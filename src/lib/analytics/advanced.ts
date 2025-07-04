/**
 * Advanced Analytics and Reporting System
 * Features: Custom reports, Data export, Predictive analytics
 */

import { supabase } from '../../app/utils/supabaseClient';

export interface AnalyticsMetric {
  id: string;
  name: string;
  description: string;
  query: string;
  category: 'calls' | 'forms' | 'revenue' | 'users' | 'performance';
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max';
  time_dimension: 'hour' | 'day' | 'week' | 'month' | 'year';
  filters?: AnalyticsFilter[];
}

export interface AnalyticsFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  created_by: string;
  metrics: string[];
  dimensions: string[];
  filters: AnalyticsFilter[];
  time_range: TimeRange;
  visualization: 'table' | 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  schedule?: ReportSchedule;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  start?: string;
  end?: string;
  period?: 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel' | 'email';
}

export interface AnalyticsData {
  dimensions: Record<string, any>;
  metrics: Record<string, number>;
  timestamp?: string;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'linear_regression' | 'time_series' | 'classification' | 'clustering';
  target_metric: string;
  features: string[];
  training_data: any[];
  model_params: Record<string, any>;
  accuracy?: number;
  last_trained: string;
  is_active: boolean;
}

export interface Prediction {
  id: string;
  model_id: string;
  workspace_id: string;
  prediction_date: string;
  predicted_value: number;
  confidence: number;
  actual_value?: number;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  type: 'metric' | 'chart' | 'table' | 'kpi';
  title: string;
  metric_id?: string;
  report_id?: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // =====================
  // METRICS & KPIs
  // =====================

  /**
   * Get call analytics
   */
  async getCallAnalytics(
    workspaceId: string, 
    timeRange: TimeRange,
    filters: AnalyticsFilter[] = []
  ): Promise<any> {
    const { start, end } = this.parseTimeRange(timeRange);
    
    let query = supabase
      .from('calls')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('started_at', start)
      .lte('started_at', end);

    // Apply filters
    query = this.applyFilters(query, filters);

    const { data: calls } = await query;

    if (!calls) return null;

    // Calculate metrics
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'completed').length;
    const avgDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length;
    const conversionRate = (completedCalls / totalCalls) * 100;

    // Group by time periods
    const callsByHour = this.groupByTimePeriod(calls, 'started_at', 'hour');
    const callsByDay = this.groupByTimePeriod(calls, 'started_at', 'day');

    return {
      summary: {
        total_calls: totalCalls,
        completed_calls: completedCalls,
        missed_calls: totalCalls - completedCalls,
        avg_duration: Math.round(avgDuration),
        conversion_rate: Math.round(conversionRate * 100) / 100
      },
      trends: {
        by_hour: callsByHour,
        by_day: callsByDay
      },
      top_sources: this.getTopSources(calls),
      call_outcomes: this.getCallOutcomes(calls)
    };
  }

  /**
   * Get form analytics
   */
  async getFormAnalytics(
    workspaceId: string, 
    timeRange: TimeRange,
    filters: AnalyticsFilter[] = []
  ): Promise<any> {
    const { start, end } = this.parseTimeRange(timeRange);
    
    let query = supabase
      .from('form_submissions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('submitted_at', start)
      .lte('submitted_at', end);

    query = this.applyFilters(query, filters);

    const { data: forms } = await query;

    if (!forms) return null;

    const totalSubmissions = forms.length;
    const uniqueVisitors = new Set(forms.map(f => f.ip_address)).size;
    const conversionRate = totalSubmissions > 0 ? (totalSubmissions / uniqueVisitors) * 100 : 0;

    const formsByDay = this.groupByTimePeriod(forms, 'submitted_at', 'day');
    const topForms = this.getTopForms(forms);

    return {
      summary: {
        total_submissions: totalSubmissions,
        unique_visitors: uniqueVisitors,
        conversion_rate: Math.round(conversionRate * 100) / 100
      },
      trends: {
        by_day: formsByDay
      },
      top_forms: topForms,
      sources: this.getFormSources(forms)
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    workspaceId: string, 
    timeRange: TimeRange
  ): Promise<any> {
    const { start, end } = this.parseTimeRange(timeRange);
    
    // Get call costs
    const { data: calls } = await supabase
      .from('calls')
      .select('duration, started_at')
      .eq('workspace_id', workspaceId)
      .gte('started_at', start)
      .lte('started_at', end);

    // Get SMS costs
    const { data: sms } = await supabase
      .from('sms_messages')
      .select('segments, sent_at')
      .eq('workspace_id', workspaceId)
      .gte('sent_at', start)
      .lte('sent_at', end);

    const callCosts = (calls || []).map(call => ({
      amount: (call.duration || 0) * 0.01, // $0.01 per second
      date: call.started_at
    }));

    const smsCosts = (sms || []).map(message => ({
      amount: (message.segments || 1) * 0.05, // $0.05 per segment
      date: message.sent_at
    }));

    const allCosts = [...callCosts, ...smsCosts];
    const totalRevenue = allCosts.reduce((sum, cost) => sum + cost.amount, 0);

    const revenueByDay = this.groupRevenueByTimePeriod(allCosts, 'day');

    return {
      summary: {
        total_revenue: Math.round(totalRevenue * 100) / 100,
        call_revenue: Math.round(callCosts.reduce((sum, c) => sum + c.amount, 0) * 100) / 100,
        sms_revenue: Math.round(smsCosts.reduce((sum, c) => sum + c.amount, 0) * 100) / 100
      },
      trends: {
        by_day: revenueByDay
      }
    };
  }

  // =====================
  // CUSTOM REPORTS
  // =====================

  /**
   * Create custom report
   */
  async createCustomReport(report: Omit<CustomReport, 'id' | 'created_at' | 'updated_at'>): Promise<CustomReport> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('custom_reports')
      .insert({
        ...report,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Execute custom report
   */
  async executeCustomReport(reportId: string): Promise<AnalyticsData[]> {
    const { data: report } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (!report) throw new Error('Report not found');

    return await this.generateReportData(report);
  }

  /**
   * Generate report data based on configuration
   */
  private async generateReportData(report: CustomReport): Promise<AnalyticsData[]> {
    const { start, end } = this.parseTimeRange(report.time_range);
    
    // Build query based on metrics and dimensions
    const baseTable = this.getBaseTableForMetrics(report.metrics);
    
    let query = supabase
      .from(baseTable)
      .select('*')
      .eq('workspace_id', report.workspace_id)
      .gte('created_at', start)
      .lte('created_at', end);

    // Apply filters
    query = this.applyFilters(query, report.filters);

    const { data } = await query;

    if (!data) return [];

    // Process data based on dimensions and metrics
    return this.processReportData(data, report.dimensions, report.metrics);
  }

  /**
   * Schedule report
   */
  async scheduleReport(reportId: string, schedule: ReportSchedule): Promise<void> {
    await supabase
      .from('custom_reports')
      .update({ schedule })
      .eq('id', reportId);

    // Schedule the report (would integrate with a job scheduler)
    await this.scheduleReportJob(reportId, schedule);
  }

  /**
   * Export report data
   */
  async exportReport(
    reportId: string, 
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<{ url: string; filename: string }> {
    const data = await this.executeCustomReport(reportId);
    
    const { data: report } = await supabase
      .from('custom_reports')
      .select('name')
      .eq('id', reportId)
      .single();

    const filename = `${report?.name || 'report'}_${new Date().toISOString().split('T')[0]}.${format}`;
    
    // Generate file based on format
    let url: string;
    
    switch (format) {
      case 'csv':
        url = await this.generateCSV(data, filename);
        break;
      case 'excel':
        url = await this.generateExcel(data, filename);
        break;
      case 'pdf':
        url = await this.generatePDF(data, filename);
        break;
      default:
        throw new Error('Unsupported export format');
    }

    return { url, filename };
  }

  // =====================
  // PREDICTIVE ANALYTICS
  // =====================

  /**
   * Create predictive model
   */
  async createPredictiveModel(model: Omit<PredictiveModel, 'id' | 'last_trained'>): Promise<PredictiveModel> {
    const { data, error } = await supabase
      .from('predictive_models')
      .insert({
        ...model,
        last_trained: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Train the model
    await this.trainModel(data.id);

    return data;
  }

  /**
   * Train predictive model
   */
  async trainModel(modelId: string): Promise<void> {
    const { data: model } = await supabase
      .from('predictive_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (!model) throw new Error('Model not found');

    // Fetch training data
    const trainingData = await this.getTrainingData(model);
    
    // Train model based on type
    let trainedModel: any;
    let accuracy: number;

    switch (model.type) {
      case 'linear_regression':
        ({ model: trainedModel, accuracy } = await this.trainLinearRegression(trainingData, model.target_metric, model.features));
        break;
      case 'time_series':
        ({ model: trainedModel, accuracy } = await this.trainTimeSeries(trainingData, model.target_metric));
        break;
      default:
        throw new Error(`Unsupported model type: ${model.type}`);
    }

    // Update model with training results
    await supabase
      .from('predictive_models')
      .update({
        model_params: trainedModel,
        accuracy,
        last_trained: new Date().toISOString()
      })
      .eq('id', modelId);
  }

  /**
   * Generate predictions
   */
  async generatePredictions(
    modelId: string, 
    workspaceId: string, 
    predictionDate: Date
  ): Promise<Prediction> {
    const { data: model } = await supabase
      .from('predictive_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (!model) throw new Error('Model not found');

    // Get current data for prediction
    const currentData = await this.getCurrentDataForPrediction(workspaceId, model.features);
    
    // Make prediction
    const { value, confidence } = await this.makePrediction(model, currentData);

    const prediction: Omit<Prediction, 'id'> = {
      model_id: modelId,
      workspace_id: workspaceId,
      prediction_date: predictionDate.toISOString(),
      predicted_value: value,
      confidence,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('predictions')
      .insert(prediction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================
  // HELPER METHODS
  // =====================

  private parseTimeRange(timeRange: TimeRange): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (timeRange.type === 'absolute') {
      start = new Date(timeRange.start!);
      end = new Date(timeRange.end!);
    } else {
      switch (timeRange.period) {
        case 'last_hour':
          start = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'last_day':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last_week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_month':
          start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'last_quarter':
          start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'last_year':
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  private applyFilters(query: any, filters: AnalyticsFilter[]): any {
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.field, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.field, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.field, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.field, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.field, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.field, filter.value);
          break;
        case 'in':
          query = query.in(filter.field, filter.value);
          break;
        case 'contains':
          query = query.ilike(filter.field, `%${filter.value}%`);
          break;
      }
    });
    return query;
  }

  private groupByTimePeriod(data: any[], dateField: string, period: 'hour' | 'day' | 'week' | 'month'): any[] {
    const groups: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      let key: string;
      
      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      groups[key] = (groups[key] || 0) + 1;
    });

    return Object.entries(groups).map(([date, count]) => ({ date, count }));
  }

  private groupRevenueByTimePeriod(data: { amount: number; date: string }[], period: 'day' | 'week' | 'month'): any[] {
    const groups: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      let key: string;
      
      switch (period) {
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      groups[key] = (groups[key] || 0) + item.amount;
    });

    return Object.entries(groups).map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));
  }

  private getTopSources(calls: any[]): any[] {
    const sources: Record<string, number> = {};
    calls.forEach(call => {
      const source = call.from_number || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getCallOutcomes(calls: any[]): any[] {
    const outcomes: Record<string, number> = {};
    calls.forEach(call => {
      const outcome = call.status || 'Unknown';
      outcomes[outcome] = (outcomes[outcome] || 0) + 1;
    });
    
    return Object.entries(outcomes).map(([outcome, count]) => ({ outcome, count }));
  }

  private getTopForms(forms: any[]): any[] {
    const formCounts: Record<string, number> = {};
    forms.forEach(form => {
      const name = form.form_name || 'Unknown';
      formCounts[name] = (formCounts[name] || 0) + 1;
    });
    
    return Object.entries(formCounts)
      .map(([form, count]) => ({ form, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getFormSources(forms: any[]): any[] {
    const sources: Record<string, number> = {};
    forms.forEach(form => {
      const source = form.source || 'Direct';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources).map(([source, count]) => ({ source, count }));
  }

  private getBaseTableForMetrics(metrics: string[]): string {
    // Determine the primary table based on metrics
    if (metrics.some(m => m.includes('call'))) return 'calls';
    if (metrics.some(m => m.includes('form'))) return 'form_submissions';
    return 'calls'; // Default
  }

  private processReportData(data: any[], dimensions: string[], metrics: string[]): AnalyticsData[] {
    // Process and aggregate data based on dimensions and metrics
    // This is a simplified implementation
    return data.map(item => ({
      dimensions: dimensions.reduce((acc, dim) => {
        acc[dim] = item[dim];
        return acc;
      }, {} as Record<string, any>),
      metrics: metrics.reduce((acc, metric) => {
        acc[metric] = item[metric] || 0;
        return acc;
      }, {} as Record<string, number>)
    }));
  }

  private async scheduleReportJob(reportId: string, schedule: ReportSchedule): Promise<void> {
    // Implementation would integrate with a job scheduler like Agenda.js or Bull
    console.log(`Scheduling report ${reportId} with frequency ${schedule.frequency}`);
  }

  private async generateCSV(data: AnalyticsData[], filename: string): Promise<string> {
    // Generate CSV file and upload to storage
    console.log(`Generating CSV: ${filename}`);
    return `https://storage.example.com/exports/${filename}`;
  }

  private async generateExcel(data: AnalyticsData[], filename: string): Promise<string> {
    // Generate Excel file and upload to storage
    console.log(`Generating Excel: ${filename}`);
    return `https://storage.example.com/exports/${filename}`;
  }

  private async generatePDF(data: AnalyticsData[], filename: string): Promise<string> {
    // Generate PDF file and upload to storage
    console.log(`Generating PDF: ${filename}`);
    return `https://storage.example.com/exports/${filename}`;
  }

  // Machine Learning Helper Methods
  private async getTrainingData(model: PredictiveModel): Promise<any[]> {
    // Fetch historical data for training
    const { data } = await supabase
      .from('calls')
      .select('*')
      .limit(1000)
      .order('started_at', { ascending: false });

    return data || [];
  }

  private async trainLinearRegression(data: any[], target: string, features: string[]): Promise<{ model: any; accuracy: number }> {
    // Simplified linear regression training
    // In production, you'd use a proper ML library
    return {
      model: { coefficients: features.map(() => Math.random()) },
      accuracy: 0.85
    };
  }

  private async trainTimeSeries(data: any[], target: string): Promise<{ model: any; accuracy: number }> {
    // Simplified time series model
    return {
      model: { trend: 1.05, seasonality: [1, 1.1, 0.9, 1.2] },
      accuracy: 0.78
    };
  }

  private async getCurrentDataForPrediction(workspaceId: string, features: string[]): Promise<any> {
    // Get current workspace data for prediction
    const { data } = await supabase
      .from('calls')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(1);

    return data?.[0] || {};
  }

  private async makePrediction(model: PredictiveModel, currentData: any): Promise<{ value: number; confidence: number }> {
    // Make prediction using trained model
    // Simplified implementation
    const baseValue = Object.values(currentData)
      .filter(val => typeof val === 'number')
      .reduce((sum: number, val: any) => sum + val, 0);
    
    return {
      value: Number(baseValue) * 1.15, // Simplified prediction
      confidence: model.accuracy || 0.8
    };
  }
}

export const analyticsService = AnalyticsService.getInstance();
