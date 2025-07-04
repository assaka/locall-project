// lib/compliance-service.ts
import { supabaseAdmin } from './supabase';

export interface DataRetentionPolicy {
  id: string;
  workspace_id: string;
  data_type: 'calls' | 'recordings' | 'transcripts' | 'form_submissions' | 'analytics';
  retention_days: number;
  auto_delete: boolean;
  legal_hold: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceSettings {
  id: string;
  workspace_id: string;
  gdpr_enabled: boolean;
  call_recording_consent: boolean;
  data_processing_notice: boolean;
  retention_policies: DataRetentionPolicy[];
  export_requests_enabled: boolean;
  deletion_requests_enabled: boolean;
  audit_log_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DataExportRequest {
  id: string;
  workspace_id: string;
  user_id: string;
  data_types: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  expires_at?: Date;
  created_at: Date;
}

export interface AuditLogEntry {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

export class ComplianceService {

  // Get compliance settings for workspace
  static async getComplianceSettings(workspaceId: string): Promise<ComplianceSettings | null> {
    const { data, error } = await supabaseAdmin
      .from('compliance_settings')
      .select('*, retention_policies(*)')
      .eq('workspace_id', workspaceId)
      .single();

    if (error) return null;
    return data;
  }

  // Update compliance settings
  static async updateComplianceSettings(
    workspaceId: string, 
    settings: Partial<ComplianceSettings>
  ): Promise<ComplianceSettings> {
    const { data, error } = await supabaseAdmin
      .from('compliance_settings')
      .upsert({
        workspace_id: workspaceId,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workspace_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Set data retention policy
  static async setRetentionPolicy(
    workspaceId: string,
    dataType: string,
    retentionDays: number,
    autoDelete: boolean = true
  ): Promise<DataRetentionPolicy> {
    const { data, error } = await supabaseAdmin
      .from('data_retention_policies')
      .upsert({
        workspace_id: workspaceId,
        data_type: dataType,
        retention_days: retentionDays,
        auto_delete: autoDelete,
        legal_hold: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workspace_id,data_type'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Request data export
  static async requestDataExport(
    workspaceId: string,
    userId: string,
    dataTypes: string[]
  ): Promise<DataExportRequest> {
    const { data, error } = await supabaseAdmin
      .from('data_export_requests')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        data_types: dataTypes,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Start async export process
    this.processDataExport(data.id);
    
    return data;
  }

  // Process data export (async)
  static async processDataExport(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await supabaseAdmin
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', exportId);

      const { data: exportRequest } = await supabaseAdmin
        .from('data_export_requests')
        .select('*')
        .eq('id', exportId)
        .single();

      if (!exportRequest) return;

      const exportData: any = {};

      // Export calls data
      if (exportRequest.data_types.includes('calls')) {
        const { data: calls } = await supabaseAdmin
          .from('calls')
          .select('*')
          .eq('workspace_id', exportRequest.workspace_id);
        exportData.calls = calls;
      }

      // Export recordings data
      if (exportRequest.data_types.includes('recordings')) {
        const { data: recordings } = await supabaseAdmin
          .from('calls')
          .select('id, recording_url, duration, created_at')
          .eq('workspace_id', exportRequest.workspace_id)
          .not('recording_url', 'is', null);
        exportData.recordings = recordings;
      }

      // Export transcripts data
      if (exportRequest.data_types.includes('transcripts')) {
        const { data: transcripts } = await supabaseAdmin
          .from('call_transcripts')
          .select('*, calls!inner(workspace_id)')
          .eq('calls.workspace_id', exportRequest.workspace_id);
        exportData.transcripts = transcripts;
      }

      // Export form submissions
      if (exportRequest.data_types.includes('form_submissions')) {
        const { data: submissions } = await supabaseAdmin
          .from('form_submissions')
          .select('*')
          .eq('workspace_id', exportRequest.workspace_id);
        exportData.form_submissions = submissions;
      }

      // Create JSON file (in production, upload to cloud storage)
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `export_${exportRequest.workspace_id}_${Date.now()}.json`;
      
      // For demo purposes, store as base64 encoded string
      // In production, upload to S3/storage and get URL
      const fileUrl = `data:application/json;base64,${Buffer.from(jsonData).toString('base64')}`;

      // Update export request with file URL
      await supabaseAdmin
        .from('data_export_requests')
        .update({
          status: 'completed',
          file_url: fileUrl
        })
        .eq('id', exportId);

    } catch (error) {
      console.error('Data export error:', error);
      await supabaseAdmin
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', exportId);
    }
  }

  // Clean up expired data based on retention policies
  static async cleanupExpiredData(workspaceId: string): Promise<void> {
    const { data: policies } = await supabaseAdmin
      .from('data_retention_policies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('auto_delete', true)
      .eq('legal_hold', false);

    if (!policies) return;

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);
      const cutoffISO = cutoffDate.toISOString();

      switch (policy.data_type) {
        case 'calls':
          await this.deleteExpiredCalls(workspaceId, cutoffISO);
          break;
        case 'recordings':
          await this.deleteExpiredRecordings(workspaceId, cutoffISO);
          break;
        case 'transcripts':
          await this.deleteExpiredTranscripts(workspaceId, cutoffISO);
          break;
        case 'form_submissions':
          await this.deleteExpiredFormSubmissions(workspaceId, cutoffISO);
          break;
      }
    }
  }

  // Delete expired calls
  private static async deleteExpiredCalls(workspaceId: string, cutoffDate: string): Promise<void> {
    const { data: expiredCalls } = await supabaseAdmin
      .from('calls')
      .select('id')
      .eq('workspace_id', workspaceId)
      .lt('created_at', cutoffDate);

    if (expiredCalls && expiredCalls.length > 0) {
      const callIds = expiredCalls.map(call => call.id);
      
      // Delete related transcripts first
      await supabaseAdmin
        .from('call_transcripts')
        .delete()
        .in('call_id', callIds);

      // Delete calls
      await supabaseAdmin
        .from('calls')
        .delete()
        .in('id', callIds);

      this.logAuditEvent(workspaceId, 'system', 'bulk_delete', 'calls', 
        `Deleted ${callIds.length} expired calls`);
    }
  }

  // Delete expired recordings
  private static async deleteExpiredRecordings(workspaceId: string, cutoffDate: string): Promise<void> {
    const { data: expiredRecordings } = await supabaseAdmin
      .from('calls')
      .select('id, recording_url')
      .eq('workspace_id', workspaceId)
      .not('recording_url', 'is', null)
      .lt('created_at', cutoffDate);

    if (expiredRecordings && expiredRecordings.length > 0) {
      // Remove recording URLs (in production, also delete files from storage)
      const updates = expiredRecordings.map(async (recording) => {
        await supabaseAdmin
          .from('calls')
          .update({ recording_url: null })
          .eq('id', recording.id);
      });

      await Promise.all(updates);

      this.logAuditEvent(workspaceId, 'system', 'bulk_delete', 'recordings',
        `Deleted ${expiredRecordings.length} expired recordings`);
    }
  }

  // Delete expired transcripts
  private static async deleteExpiredTranscripts(workspaceId: string, cutoffDate: string): Promise<void> {
    const { data: expiredTranscripts } = await supabaseAdmin
      .from('call_transcripts')
      .select('id, calls!inner(workspace_id)')
      .eq('calls.workspace_id', workspaceId)
      .lt('created_at', cutoffDate);

    if (expiredTranscripts && expiredTranscripts.length > 0) {
      const transcriptIds = expiredTranscripts.map(t => t.id);
      
      await supabaseAdmin
        .from('call_transcripts')
        .delete()
        .in('id', transcriptIds);

      this.logAuditEvent(workspaceId, 'system', 'bulk_delete', 'transcripts',
        `Deleted ${transcriptIds.length} expired transcripts`);
    }
  }

  // Delete expired form submissions
  private static async deleteExpiredFormSubmissions(workspaceId: string, cutoffDate: string): Promise<void> {
    const { data: expiredSubmissions } = await supabaseAdmin
      .from('form_submissions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .lt('created_at', cutoffDate);

    if (expiredSubmissions && expiredSubmissions.length > 0) {
      const submissionIds = expiredSubmissions.map(s => s.id);
      
      await supabaseAdmin
        .from('form_submissions')
        .delete()
        .in('id', submissionIds);

      this.logAuditEvent(workspaceId, 'system', 'bulk_delete', 'form_submissions',
        `Deleted ${submissionIds.length} expired form submissions`);
    }
  }

  // Log audit event
  static async logAuditEvent(
    workspaceId: string,
    userId: string,
    action: string,
    resourceType: string,
    details: any,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<void> {
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: typeof details === 'object' ? details.id : null,
        details: typeof details === 'object' ? details : { message: details },
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      });
  }

  // Get audit logs
  static async getAuditLogs(
    workspaceId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get data export requests
  static async getDataExportRequests(workspaceId: string): Promise<DataExportRequest[]> {
    const { data, error } = await supabaseAdmin
      .from('data_export_requests')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Download export file
  static async downloadExport(exportId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('data_export_requests')
      .select('file_url, status')
      .eq('id', exportId)
      .single();

    if (error || data.status !== 'completed') return null;
    return data.file_url;
  }
}
