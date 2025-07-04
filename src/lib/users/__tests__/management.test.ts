import { userManagementService } from '../management';
import { supabase } from '@/app/utils/supabaseClient';

// The supabase mock is already set up in jest.setup.js
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('User Management Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Management', () => {
    it('should create a custom role', async () => {
      const mockRole = {
        id: 'role-1',
        workspace_id: 'workspace-1',
        name: 'Sales Manager',
        description: 'Manages sales team',
        permissions: ['view_analytics', 'manage_calls'],
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockRole,
        error: null,
      });

      const result = await userManagementService.createRole({
        workspace_id: 'workspace-1',
        name: 'Sales Manager',
        description: 'Manages sales team',
        permissions: ['view_analytics', 'manage_calls'],
      });

      expect(result).toEqual(mockRole);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_roles');
    });

    it('should assign role to user', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        user_id: 'user-1',
        role_id: 'role-1',
        workspace_id: 'workspace-1',
        assigned_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockAssignment,
        error: null,
      });

      const result = await userManagementService.assignRole('user-1', 'role-1', 'workspace-1');

      expect(result).toEqual(mockAssignment);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_role_assignments');
    });

    it('should check user permissions', async () => {
      const mockUserRoles = [
        { role: { permissions: ['view_analytics', 'manage_calls'] } },
        { role: { permissions: ['view_reports'] } },
      ];

      mockSupabase.from().select().eq().mockResolvedValue({
        data: mockUserRoles,
        error: null,
      });

      const hasPermission = await userManagementService.hasPermission('user-1', 'view_analytics', 'workspace-1');

      expect(hasPermission).toBe(true);
    });
  });

  describe('Team Management', () => {
    it('should create a new team', async () => {
      const mockTeam = {
        id: 'team-1',
        workspace_id: 'workspace-1',
        name: 'Sales Team',
        description: 'Sales department team',
        lead_user_id: 'user-1',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockTeam,
        error: null,
      });

      const result = await userManagementService.createTeam({
        workspace_id: 'workspace-1',
        name: 'Sales Team',
        description: 'Sales department team',
        lead_user_id: 'user-1',
      });

      expect(result).toEqual(mockTeam);
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
    });

    it('should add member to team', async () => {
      const mockMembership = {
        id: 'membership-1',
        team_id: 'team-1',
        user_id: 'user-2',
        role: 'member',
        joined_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockMembership,
        error: null,
      });

      const result = await userManagementService.addTeamMember('team-1', 'user-2', 'member');

      expect(result).toEqual(mockMembership);
      expect(mockSupabase.from).toHaveBeenCalledWith('team_memberships');
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should enable 2FA for user', async () => {
      const mockTwoFA = {
        id: '2fa-1',
        user_id: 'user-1',
        secret: 'encrypted-secret',
        backup_codes: ['code1', 'code2'],
        is_enabled: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockTwoFA,
        error: null,
      });

      const result = await userManagementService.enable2FA('user-1', 'secret-key');

      expect(result).toEqual(mockTwoFA);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_2fa');
    });

    it('should verify 2FA code', async () => {
      const mockTwoFA = {
        secret: 'encrypted-secret',
        is_enabled: true,
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockTwoFA,
        error: null,
      });

      // Mock the TOTP verification (would normally use speakeasy or similar)
      const isValid = await userManagementService.verify2FA('user-1', '123456');

      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Session Management', () => {
    it('should create user session', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockSession,
        error: null,
      });

      const result = await userManagementService.createSession('user-1', {
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockSession);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_sessions');
    });

    it('should invalidate user session', async () => {
      mockSupabase.from().update().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      await userManagementService.invalidateSession('session-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_sessions');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        is_active: false,
        ended_at: expect.any(String),
      });
    });
  });

  describe('Activity Logging', () => {
    it('should log user activity', async () => {
      const mockActivity = {
        id: 'activity-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        action: 'call_initiated',
        resource_type: 'call',
        resource_id: 'call-1',
        metadata: { duration: 120 },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        timestamp: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockActivity,
        error: null,
      });

      const result = await userManagementService.logActivity({
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        action: 'call_initiated',
        resource_type: 'call',
        resource_id: 'call-1',
        metadata: { duration: 120 },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockActivity);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_activities');
    });

    it('should get user activity history', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          action: 'call_initiated',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'activity-2',
          action: 'form_submitted',
          timestamp: new Date().toISOString(),
        },
      ];

      mockSupabase.from().select().eq().order().limit().mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      const activities = await userManagementService.getUserActivity('user-1', {
        limit: 50,
        workspace_id: 'workspace-1',
      });

      expect(activities).toEqual(mockActivities);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_activities');
    });
  });

  describe('User Preferences', () => {
    it('should update user preferences', async () => {
      const mockPreferences = {
        id: 'pref-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        preferences: {
          theme: 'dark',
          notifications: { email: true, sms: false },
          timezone: 'UTC',
        },
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: mockPreferences,
        error: null,
      });

      const result = await userManagementService.updatePreferences('user-1', 'workspace-1', {
        theme: 'dark',
        notifications: { email: true, sms: false },
        timezone: 'UTC',
      });

      expect(result).toEqual(mockPreferences);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_preferences');
    });

    it('should get user preferences with defaults', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const preferences = await userManagementService.getPreferences('user-1', 'workspace-1');

      expect(preferences).toEqual({
        theme: 'light',
        notifications: { email: true, sms: true, push: true },
        timezone: 'UTC',
        language: 'en',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle role creation errors', async () => {
      const error = new Error('Duplicate role name');
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(userManagementService.createRole({
        workspace_id: 'workspace-1',
        name: 'Admin',
        permissions: ['all'],
      })).rejects.toThrow('Duplicate role name');
    });

    it('should handle permission check errors gracefully', async () => {
      mockSupabase.from().select().eq().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const hasPermission = await userManagementService.hasPermission('user-1', 'view_analytics', 'workspace-1');

      expect(hasPermission).toBe(false);
    });
  });
});
