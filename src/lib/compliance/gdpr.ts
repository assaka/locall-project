/**
 * GDPR/CCPA Compliance Module
 * Handles data privacy, consent management, and user rights
 */

import { supabase } from '../../app/utils/supabaseClient';

export interface ConsentRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  consent_type: 'data_processing' | 'marketing' | 'analytics' | 'cookies' | 'call_recording';
  granted: boolean;
  granted_at: string;
  withdrawn_at?: string;
  ip_address: string;
  user_agent: string;
  legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  purpose: string;
  retention_period_days: number;
}

export interface DataRetentionPolicy {
  data_type: 'call_recordings' | 'form_submissions' | 'user_data' | 'analytics' | 'logs';
  retention_days: number;
  auto_delete: boolean;
  requires_consent: boolean;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data_types: string[];
  export_url?: string;
  expires_at?: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletion_type: 'partial' | 'complete';
  data_types: string[];
  completed_at?: string;
}

class GDPRComplianceService {
  private static instance: GDPRComplianceService;

  static getInstance(): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService();
    }
    return GDPRComplianceService.instance;
  }

  /**
   * Record user consent
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id' | 'granted_at'>): Promise<ConsentRecord> {
    const { data, error } = await supabase
      .from('consent_records')
      .insert({
        ...consent,
        granted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(userId: string, consentType: ConsentRecord['consent_type']): Promise<void> {
    const { error } = await supabase
      .from('consent_records')
      .update({
        granted: false,
        withdrawn_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .eq('granted', true);

    if (error) throw error;

    // Trigger data cleanup based on withdrawn consent
    await this.handleConsentWithdrawal(userId, consentType);
  }

  /**
   * Get user consent status
   */
  async getUserConsent(userId: string, consentType?: ConsentRecord['consent_type']): Promise<ConsentRecord[]> {
    let query = supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    if (consentType) {
      query = query.eq('consent_type', consentType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Handle data export request (Right to Data Portability)
   */
  async requestDataExport(userId: string, dataTypes: string[]): Promise<DataExportRequest> {
    const { data, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        requested_at: new Date().toISOString(),
        status: 'pending',
        data_types: dataTypes
      })
      .select()
      .single();

    if (error) throw error;

    // Queue export processing
    await this.processDataExport(data.id);

    return data;
  }

  /**
   * Handle data deletion request (Right to be Forgotten)
   */
  async requestDataDeletion(
    userId: string, 
    deletionType: 'partial' | 'complete', 
    dataTypes: string[] = []
  ): Promise<DataDeletionRequest> {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .insert({
        user_id: userId,
        requested_at: new Date().toISOString(),
        status: 'pending',
        deletion_type: deletionType,
        data_types: dataTypes
      })
      .select()
      .single();

    if (error) throw error;

    // Queue deletion processing
    await this.processDataDeletion(data.id);

    return data;
  }

  /**
   * Process data export request
   */
  private async processDataExport(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Get request details
      const { data: request } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Export request not found');

      const exportData: any = {};

      // Export user data
      if (request.data_types.includes('user_data')) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', request.user_id);
        exportData.user_data = userData;
      }

      // Export call data
      if (request.data_types.includes('calls')) {
        const { data: callData } = await supabase
          .from('calls')
          .select('*')
          .eq('user_id', request.user_id);
        exportData.calls = callData;
      }

      // Export form submissions
      if (request.data_types.includes('forms')) {
        const { data: formData } = await supabase
          .from('form_submissions')
          .select('*')
          .eq('user_id', request.user_id);
        exportData.forms = formData;
      }

      // Store export data (in real implementation, upload to secure storage)
      const exportUrl = await this.storeExportData(requestId, exportData);

      // Update request with completion
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          export_url: exportUrl,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('id', requestId);

    } catch (error) {
      console.error('Data export error:', error);
      await supabase
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  /**
   * Process data deletion request
   */
  private async processDataDeletion(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('data_deletion_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Get request details
      const { data: request } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Deletion request not found');

      if (request.deletion_type === 'complete') {
        // Complete account deletion
        await this.deleteAllUserData(request.user_id);
      } else {
        // Partial deletion based on data types
        for (const dataType of request.data_types) {
          await this.deleteUserDataByType(request.user_id, dataType);
        }
      }

      // Update request with completion
      await supabase
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    } catch (error) {
      console.error('Data deletion error:', error);
      await supabase
        .from('data_deletion_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  /**
   * Delete all user data (complete deletion)
   */
  private async deleteAllUserData(userId: string): Promise<void> {
    // Delete in order of dependencies
    await supabase.from('consent_records').delete().eq('user_id', userId);
    await supabase.from('audit_logs').delete().eq('user_id', userId);
    await supabase.from('form_submissions').delete().eq('user_id', userId);
    await supabase.from('calls').delete().eq('user_id', userId);
    await supabase.from('workspace_members').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
  }

  /**
   * Delete user data by type
   */
  private async deleteUserDataByType(userId: string, dataType: string): Promise<void> {
    switch (dataType) {
      case 'calls':
        await supabase.from('calls').delete().eq('user_id', userId);
        break;
      case 'forms':
        await supabase.from('form_submissions').delete().eq('user_id', userId);
        break;
      case 'analytics':
        // Delete analytics data (implement based on your analytics storage)
        break;
      default:
        console.warn(`Unknown data type for deletion: ${dataType}`);
    }
  }

  /**
   * Handle consent withdrawal cleanup
   */
  private async handleConsentWithdrawal(userId: string, consentType: ConsentRecord['consent_type']): Promise<void> {
    switch (consentType) {
      case 'call_recording':
        // Delete all call recordings
        await supabase
          .from('calls')
          .update({ recording_url: null })
          .eq('user_id', userId);
        break;
      case 'analytics':
        // Anonymize analytics data
        await this.anonymizeAnalyticsData(userId);
        break;
      case 'marketing':
        // Remove from marketing lists
        await this.removeFromMarketing(userId);
        break;
    }
  }

  /**
   * Store export data securely
   */
  private async storeExportData(requestId: string, data: any): Promise<string> {
    // In a real implementation, this would upload to secure cloud storage
    // For now, return a mock URL
    return `https://secure-storage.example.com/exports/${requestId}.json`;
  }

  /**
   * Anonymize analytics data
   */
  private async anonymizeAnalyticsData(userId: string): Promise<void> {
    // Implementation would depend on your analytics storage
    console.log(`Anonymizing analytics data for user ${userId}`);
  }

  /**
   * Remove user from marketing
   */
  private async removeFromMarketing(userId: string): Promise<void> {
    // Implementation would integrate with your marketing systems
    console.log(`Removing user ${userId} from marketing`);
  }

  /**
   * Check if data processing is compliant
   */
  async isProcessingCompliant(userId: string, purpose: string): Promise<boolean> {
    const consents = await this.getUserConsent(userId);
    
    // Check if we have valid consent for the purpose
    const relevantConsent = consents.find(c => 
      c.purpose === purpose && 
      c.granted && 
      !c.withdrawn_at
    );

    return !!relevantConsent;
  }

  /**
   * Get data retention policies
   */
  getRetentionPolicies(): DataRetentionPolicy[] {
    return [
      {
        data_type: 'call_recordings',
        retention_days: 365,
        auto_delete: true,
        requires_consent: true
      },
      {
        data_type: 'form_submissions',
        retention_days: 1095, // 3 years
        auto_delete: false,
        requires_consent: false
      },
      {
        data_type: 'user_data',
        retention_days: 2555, // 7 years for business records
        auto_delete: false,
        requires_consent: false
      },
      {
        data_type: 'analytics',
        retention_days: 730, // 2 years
        auto_delete: true,
        requires_consent: true
      }
    ];
  }

  /**
   * Run data retention cleanup
   */
  async runRetentionCleanup(): Promise<void> {
    const policies = this.getRetentionPolicies();
    
    for (const policy of policies) {
      if (policy.auto_delete) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);
        
        await this.deleteExpiredData(policy.data_type, cutoffDate);
      }
    }
  }

  /**
   * Delete expired data based on retention policy
   */
  private async deleteExpiredData(dataType: string, cutoffDate: Date): Promise<void> {
    const cutoffISOString = cutoffDate.toISOString();
    
    switch (dataType) {
      case 'call_recordings':
        await supabase
          .from('calls')
          .update({ recording_url: null })
          .lt('started_at', cutoffISOString);
        break;
      case 'analytics':
        // Delete old analytics data
        break;
      default:
        console.warn(`No cleanup implemented for data type: ${dataType}`);
    }
  }
}

export const gdprService = GDPRComplianceService.getInstance();
