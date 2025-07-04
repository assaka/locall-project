/**
 * Audit Trail System
 * Comprehensive logging for security, compliance, and debugging
 */

import { supabase } from '../../app/utils/supabaseClient';

export interface AuditLog {
  id: string;
  user_id?: string;
  workspace_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'compliance';
  success: boolean;
  error_message?: string;
  session_id?: string;
  api_endpoint?: string;
  request_id?: string;
}

export interface SecurityEvent {
  id: string;
  event_type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address: string;
  user_agent?: string;
  details: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface ComplianceReport {
  id: string;
  report_type: 'gdpr' | 'ccpa' | 'security' | 'audit';
  generated_at: string;
  period_start: string;
  period_end: string;
  data: Record<string, any>;
  generated_by: string;
}

class AuditService {
  private static instance: AuditService;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        ...event,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditLog);

      if (error) {
        console.error('Failed to log audit event:', error);
        // Fallback to local logging in case of database issues
        this.fallbackLog(auditLog);
      }

      // Check if this is a security-critical event
      if (event.severity === 'critical' || event.category === 'authentication') {
        await this.checkForSecurityThreats(event);
      }

    } catch (error) {
      console.error('Audit logging error:', error);
      this.fallbackLog(event);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    action: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'password_change',
    userId?: string,
    success: boolean = true,
    details: Record<string, any> = {},
    request?: any
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action,
      entity_type: 'user',
      entity_id: userId,
      ip_address: this.getClientIP(request),
      user_agent: request?.headers?.['user-agent'],
      severity: success ? 'low' : 'high',
      category: 'authentication',
      success,
      new_values: details
    });

    // Log security event for failed logins
    if (!success && action === 'failed_login') {
      await this.logSecurityEvent({
        event_type: 'failed_login',
        severity: 'medium',
        user_id: userId,
        ip_address: this.getClientIP(request) || 'unknown',
        user_agent: request?.headers?.['user-agent'],
        details: {
          attempted_email: details.email,
          failure_reason: details.reason
        }
      });
    }
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'read' | 'export' | 'search',
    entityType: string,
    entityId?: string,
    userId?: string,
    workspaceId?: string,
    request?: any
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      workspace_id: workspaceId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      ip_address: this.getClientIP(request),
      user_agent: request?.headers?.['user-agent'],
      severity: 'low',
      category: 'data_access',
      success: true,
      api_endpoint: request?.url
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    action: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    userId?: string,
    workspaceId?: string,
    request?: any
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      workspace_id: workspaceId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: this.getClientIP(request),
      user_agent: request?.headers?.['user-agent'],
      severity: action === 'delete' ? 'medium' : 'low',
      category: 'data_modification',
      success: true,
      api_endpoint: request?.url
    });
  }

  /**
   * Log system events
   */
  async logSystemEvent(
    action: string,
    details: Record<string, any> = {},
    severity: AuditLog['severity'] = 'low',
    success: boolean = true
  ): Promise<void> {
    await this.logEvent({
      action,
      entity_type: 'system',
      severity,
      category: 'system',
      success,
      new_values: details
    });
  }

  /**
   * Log compliance events
   */
  async logComplianceEvent(
    action: string,
    entityType: string,
    entityId?: string,
    userId?: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      severity: 'medium',
      category: 'compliance',
      success: true,
      new_values: details
    });
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const securityEvent: Omit<SecurityEvent, 'id'> = {
        ...event,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      const { error } = await supabase
        .from('security_events')
        .insert(securityEvent);

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Alert for critical security events
      if (event.severity === 'critical') {
        await this.alertSecurityTeam(securityEvent);
      }

    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }

  /**
   * Check for security threats based on audit logs
   */
  private async checkForSecurityThreats(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (event.action === 'failed_login' && event.ip_address) {
      // Check for brute force attacks
      const recentFailures = await this.getRecentFailedLogins(event.ip_address);
      
      if (recentFailures >= 5) {
        await this.logSecurityEvent({
          event_type: 'suspicious_activity',
          severity: 'high',
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          details: {
            type: 'brute_force_attempt',
            failed_attempts: recentFailures
          }
        });
      }
    }
  }

  /**
   * Get recent failed login attempts from IP
   */
  private async getRecentFailedLogins(ipAddress: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'failed_login')
      .eq('ip_address', ipAddress)
      .gte('timestamp', oneHourAgo);

    return count || 0;
  }

  /**
   * Alert security team for critical events
   */
  private async alertSecurityTeam(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    // Implementation would send alerts via email, Slack, PagerDuty, etc.
    console.log('CRITICAL SECURITY ALERT:', event);
    
    // You could integrate with external alerting systems here
    // await sendSlackAlert(event);
    // await sendPagerDutyAlert(event);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    reportType: ComplianceReport['report_type'],
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    const periodStart = startDate.toISOString();
    const periodEnd = endDate.toISOString();

    let reportData: Record<string, any> = {};

    switch (reportType) {
      case 'gdpr':
        reportData = await this.generateGDPRReport(startDate, endDate);
        break;
      case 'security':
        reportData = await this.generateSecurityReport(startDate, endDate);
        break;
      case 'audit':
        reportData = await this.generateAuditReport(startDate, endDate);
        break;
    }

    const report: Omit<ComplianceReport, 'id'> = {
      report_type: reportType,
      generated_at: new Date().toISOString(),
      period_start: periodStart,
      period_end: periodEnd,
      data: reportData,
      generated_by: generatedBy
    };

    const { data, error } = await supabase
      .from('compliance_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generate GDPR compliance report
   */
  private async generateGDPRReport(startDate: Date, endDate: Date): Promise<Record<string, any>> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // Get consent records
    const { data: consents } = await supabase
      .from('consent_records')
      .select('*')
      .gte('granted_at', start)
      .lte('granted_at', end);

    // Get data export requests
    const { data: exports } = await supabase
      .from('data_export_requests')
      .select('*')
      .gte('requested_at', start)
      .lte('requested_at', end);

    // Get data deletion requests
    const { data: deletions } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .gte('requested_at', start)
      .lte('requested_at', end);

    return {
      consent_records: consents?.length || 0,
      consent_granted: consents?.filter(c => c.granted).length || 0,
      consent_withdrawn: consents?.filter(c => !c.granted).length || 0,
      data_export_requests: exports?.length || 0,
      data_deletion_requests: deletions?.length || 0,
      completed_deletions: deletions?.filter(d => d.status === 'completed').length || 0
    };
  }

  /**
   * Generate security report
   */
  private async generateSecurityReport(startDate: Date, endDate: Date): Promise<Record<string, any>> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // Get security events
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', start)
      .lte('timestamp', end);

    // Get failed logins
    const { data: failedLogins } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'failed_login')
      .gte('timestamp', start)
      .lte('timestamp', end);

    return {
      total_security_events: securityEvents?.length || 0,
      critical_events: securityEvents?.filter(e => e.severity === 'critical').length || 0,
      failed_login_attempts: failedLogins?.length || 0,
      unique_threat_ips: new Set(securityEvents?.map(e => e.ip_address)).size,
      resolved_events: securityEvents?.filter(e => e.resolved).length || 0
    };
  }

  /**
   * Generate audit report
   */
  private async generateAuditReport(startDate: Date, endDate: Date): Promise<Record<string, any>> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // Get all audit logs for the period
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('timestamp', start)
      .lte('timestamp', end);

    const categoryCounts = auditLogs?.reduce((acc: Record<string, number>, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      total_events: auditLogs?.length || 0,
      successful_events: auditLogs?.filter(l => l.success).length || 0,
      failed_events: auditLogs?.filter(l => !l.success).length || 0,
      by_category: categoryCounts,
      unique_users: new Set(auditLogs?.map(l => l.user_id).filter(Boolean)).size
    };
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(
    filters: {
      userId?: string;
      workspaceId?: string;
      action?: string;
      entityType?: string;
      category?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.workspaceId) query = query.eq('workspace_id', filters.workspaceId);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.startDate) query = query.gte('timestamp', filters.startDate.toISOString());
    if (filters.endDate) query = query.lte('timestamp', filters.endDate.toISOString());

    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request?: any): string | undefined {
    if (!request) return undefined;
    
    return request.ip || 
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           request.headers?.['x-forwarded-for']?.split(',')[0] ||
           request.headers?.['x-real-ip'];
  }

  /**
   * Fallback logging when database is unavailable
   */
  private fallbackLog(event: any): void {
    console.log('AUDIT LOG (FALLBACK):', JSON.stringify(event, null, 2));
    // In production, you might want to write to a file or send to a logging service
  }
}

export const auditService = AuditService.getInstance();
