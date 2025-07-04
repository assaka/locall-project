/**
 * Integration tests for Compliance and Security features
 */

import { gdprService } from '../../lib/compliance/gdpr';
import { auditService } from '../../lib/security/audit';
import { supabase } from '../../app/utils/supabaseClient';

// Mock Supabase for testing
jest.mock('../../app/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn()
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    rpc: jest.fn()
  }
}));

describe('GDPR Compliance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Consent Management', () => {
    it('should record user consent', async () => {
      const mockConsent = {
        user_id: 'user-123',
        workspace_id: 'workspace-123',
        consent_type: 'data_processing' as const,
        granted: true,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        legal_basis: 'consent' as const,
        purpose: 'Call processing and analytics',
        retention_period_days: 365
      };

      const mockResult = { id: 'consent-123', ...mockConsent, granted_at: '2023-01-01T00:00:00Z' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockResult, error: null })
          })
        })
      });

      const result = await gdprService.recordConsent(mockConsent);

      expect(result).toEqual(mockResult);
      expect(supabase.from).toHaveBeenCalledWith('consent_records');
    });

    it('should withdraw user consent', async () => {
      const userId = 'user-123';
      const consentType = 'marketing';

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          })
        })
      });

      await gdprService.withdrawConsent(userId, consentType as any);

      expect(supabase.from).toHaveBeenCalledWith('consent_records');
    });

    it('should get user consent status', async () => {
      const userId = 'user-123';
      const mockConsents = [
        {
          id: 'consent-1',
          user_id: userId,
          consent_type: 'data_processing',
          granted: true,
          granted_at: '2023-01-01T00:00:00Z'
        }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockConsents, error: null })
          })
        })
      });

      const result = await gdprService.getUserConsent(userId);

      expect(result).toEqual(mockConsents);
      expect(supabase.from).toHaveBeenCalledWith('consent_records');
    });
  });

  describe('Data Export Requests', () => {
    it('should create data export request', async () => {
      const userId = 'user-123';
      const dataTypes = ['calls', 'forms', 'user_data'];

      const mockRequest = {
        id: 'export-123',
        user_id: userId,
        requested_at: '2023-01-01T00:00:00Z',
        status: 'pending',
        data_types: dataTypes
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRequest, error: null })
          })
        })
      });

      const result = await gdprService.requestDataExport(userId, dataTypes);

      expect(result).toEqual(mockRequest);
      expect(supabase.from).toHaveBeenCalledWith('data_export_requests');
    });
  });

  describe('Data Deletion Requests', () => {
    it('should create complete data deletion request', async () => {
      const userId = 'user-123';

      const mockRequest = {
        id: 'deletion-123',
        user_id: userId,
        requested_at: '2023-01-01T00:00:00Z',
        status: 'pending',
        deletion_type: 'complete',
        data_types: []
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRequest, error: null })
          })
        })
      });

      const result = await gdprService.requestDataDeletion(userId, 'complete');

      expect(result).toEqual(mockRequest);
      expect(supabase.from).toHaveBeenCalledWith('data_deletion_requests');
    });

    it('should create partial data deletion request', async () => {
      const userId = 'user-123';
      const dataTypes = ['calls', 'analytics'];

      const mockRequest = {
        id: 'deletion-123',
        user_id: userId,
        requested_at: '2023-01-01T00:00:00Z',
        status: 'pending',
        deletion_type: 'partial',
        data_types: dataTypes
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRequest, error: null })
          })
        })
      });

      const result = await gdprService.requestDataDeletion(userId, 'partial', dataTypes);

      expect(result).toEqual(mockRequest);
      expect(result.deletion_type).toBe('partial');
      expect(result.data_types).toEqual(dataTypes);
    });
  });

  describe('Compliance Checks', () => {
    it('should check if data processing is compliant', async () => {
      const userId = 'user-123';
      const purpose = 'Call analytics';

      const mockConsents = [
        {
          id: 'consent-1',
          user_id: userId,
          purpose: 'Call analytics',
          granted: true,
          withdrawn_at: null
        }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockConsents, error: null })
          })
        })
      });

      const result = await gdprService.isProcessingCompliant(userId, purpose);

      expect(result).toBe(true);
    });

    it('should return false for non-compliant processing', async () => {
      const userId = 'user-123';
      const purpose = 'Marketing';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      const result = await gdprService.isProcessingCompliant(userId, purpose);

      expect(result).toBe(false);
    });
  });
});

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Logging', () => {
    it('should log audit event successfully', async () => {
      const mockEvent = {
        user_id: 'user-123',
        action: 'login',
        entity_type: 'user',
        entity_id: 'user-123',
        severity: 'low' as const,
        category: 'authentication' as const,
        success: true
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await auditService.logEvent(mockEvent);

      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log authentication events', async () => {
      const userId = 'user-123';
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0...' },
        ip: '192.168.1.1'
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await auditService.logAuthentication('login', userId, true, {}, mockRequest);

      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log data access events', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await auditService.logDataAccess('read', 'calls', 'call-123', userId, workspaceId);

      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log data modification events', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';
      const oldValues = { status: 'pending' };
      const newValues = { status: 'completed' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await auditService.logDataModification(
        'update',
        'calls',
        'call-123',
        oldValues,
        newValues,
        userId,
        workspaceId
      );

      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('Security Events', () => {
    it('should log security event', async () => {
      const mockSecurityEvent = {
        event_type: 'failed_login' as const,
        severity: 'medium' as const,
        user_id: 'user-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        details: { attempted_email: 'user@example.com' }
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await auditService.logSecurityEvent(mockSecurityEvent);

      expect(supabase.from).toHaveBeenCalledWith('security_events');
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate GDPR compliance report', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const generatedBy = 'admin-123';

      const mockReport = {
        id: 'report-123',
        report_type: 'gdpr',
        generated_at: '2023-01-01T00:00:00Z',
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        data: {
          consent_records: 10,
          consent_granted: 8,
          consent_withdrawn: 2,
          data_export_requests: 3,
          data_deletion_requests: 1
        },
        generated_by: generatedBy
      };

      // Mock the database calls for generating the report
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'consent_records') {
          return {
            select: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockResolvedValue({ data: new Array(10).fill({}) })
              })
            })
          };
        }
        if (table === 'compliance_reports') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockReport, error: null })
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [] })
            })
          })
        };
      });

      const result = await auditService.generateComplianceReport(
        'gdpr',
        startDate,
        endDate,
        generatedBy
      );

      expect(result).toEqual(mockReport);
    });
  });

  describe('Audit Log Search', () => {
    it('should search audit logs with filters', async () => {
      const filters = {
        userId: 'user-123',
        action: 'login',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      };

      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-123',
          action: 'login',
          timestamp: '2023-06-01T00:00:00Z'
        }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockLogs,
                      error: null,
                      count: 1
                    })
                  })
                })
              })
            })
          })
        })
      });

      const result = await auditService.searchAuditLogs(filters, 50, 0);

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle consent withdrawal with audit logging', async () => {
    const userId = 'user-123';
    const consentType = 'call_recording';

    // Mock successful consent withdrawal
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'consent_records') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
              })
            })
          })
        };
      }
      if (table === 'audit_logs') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null })
        };
      }
      if (table === 'calls') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        };
      }
      return {};
    });

    // Withdraw consent should trigger audit logging and data cleanup
    await gdprService.withdrawConsent(userId, consentType as any);

    // Verify that audit logging was called
    expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    expect(supabase.from).toHaveBeenCalledWith('consent_records');
  });

  it('should handle failed login attempts with security monitoring', async () => {
    const ipAddress = '192.168.1.1';
    const userAgent = 'Mozilla/5.0...';

    // Mock audit log for failed login
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'audit_logs') {
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockResolvedValue({ count: 5 }) // Simulate 5 recent failures
                })
              })
            })
          };
        }
      }
      if (table === 'security_events') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null })
        };
      }
      return {};
    });

    const mockRequest = {
      headers: { 'user-agent': userAgent },
      ip: ipAddress
    };

    // Log failed login which should trigger security event due to multiple failures
    await auditService.logAuthentication(
      'failed_login',
      'user-123',
      false,
      { email: 'user@example.com', reason: 'Invalid password' },
      mockRequest
    );

    // Verify that both audit log and security event were created
    expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    expect(supabase.from).toHaveBeenCalledWith('security_events');
  });
});
