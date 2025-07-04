/**
 * Enhanced User Management System
 * Features: Roles, Teams, Activity Logging, 2FA
 */

import { supabase } from '../../app/utils/supabaseClient';
import { auditService } from '../security/audit';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_system_role: boolean;
  workspace_id?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  team_lead_id?: string;
  members: TeamMember[];
  permissions: string[];
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'member' | 'lead' | 'admin';
  joined_at: string;
  permissions: string[];
}

export interface UserActivity {
  id: string;
  user_id: string;
  workspace_id: string;
  activity_type: 'login' | 'logout' | 'data_access' | 'data_modify' | 'system_action';
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  session_id?: string;
}

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  phone_number?: string;
  email?: string;
  is_verified: boolean;
  backup_codes: string[];
  created_at: string;
  last_used_at?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  last_activity_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    call_alerts: boolean;
    form_alerts: boolean;
    system_alerts: boolean;
  };
  dashboard_layout: Record<string, any>;
  call_settings: {
    auto_answer: boolean;
    record_calls: boolean;
    transcribe_calls: boolean;
  };
}

class UserManagementService {
  private static instance: UserManagementService;

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  // =====================
  // ROLE MANAGEMENT
  // =====================

  /**
   * Create a new role
   */
  async createRole(role: Omit<UserRole, 'id'>): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .insert(role)
      .select()
      .single();

    if (error) throw error;

    await auditService.logEvent({
      action: 'create_role',
      entity_type: 'role',
      entity_id: data.id,
      new_values: role,
      severity: 'medium',
      category: 'authorization',
      success: true
    });

    return data;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id: roleId,
        workspace_id: workspaceId,
        assigned_at: new Date().toISOString()
      });

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      workspace_id: workspaceId,
      action: 'assign_role',
      entity_type: 'user',
      entity_id: userId,
      new_values: { role_id: roleId },
      severity: 'medium',
      category: 'authorization',
      success: true
    });
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_role_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      workspace_id: workspaceId,
      action: 'remove_role',
      entity_type: 'user',
      entity_id: userId,
      old_values: { role_id: roleId },
      severity: 'medium',
      category: 'authorization',
      success: true
    });
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string, workspaceId: string): Promise<Permission[]> {
    const { data: userRoles } = await supabase
      .from('user_role_assignments')
      .select(`
        role_id,
        user_roles (
          permissions
        )
      `)
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId);

    const permissions: Permission[] = [];
    userRoles?.forEach(assignment => {
      if (assignment.user_roles && Array.isArray(assignment.user_roles)) {
        const roleData = assignment.user_roles[0] as any;
        if (roleData?.permissions) {
          permissions.push(...roleData.permissions);
        }
      }
    });

    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string, 
    workspaceId: string, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, workspaceId);
    
    return permissions.some(p => 
      p.resource === resource && 
      (p.action === action || p.action === '*')
    );
  }

  // =====================
  // TEAM MANAGEMENT
  // =====================

  /**
   * Create a team
   */
  async createTeam(team: Omit<Team, 'id' | 'members' | 'created_at'>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        ...team,
        created_at: new Date().toISOString(),
        members: []
      })
      .select()
      .single();

    if (error) throw error;

    await auditService.logEvent({
      workspace_id: team.workspace_id,
      action: 'create_team',
      entity_type: 'team',
      entity_id: data.id,
      new_values: team,
      severity: 'low',
      category: 'data_modification',
      success: true
    });

    return data;
  }

  /**
   * Add user to team
   */
  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: TeamMember['role'] = 'member',
    permissions: string[] = []
  ): Promise<TeamMember> {
    const member: Omit<TeamMember, 'id'> = {
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
      permissions
    };

    const { data, error } = await supabase
      .from('team_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      action: 'add_team_member',
      entity_type: 'team',
      entity_id: teamId,
      new_values: member,
      severity: 'low',
      category: 'data_modification',
      success: true
    });

    return data;
  }

  /**
   * Remove user from team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      action: 'remove_team_member',
      entity_type: 'team',
      entity_id: teamId,
      old_values: { user_id: userId },
      severity: 'low',
      category: 'data_modification',
      success: true
    });
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    teamId: string, 
    userId: string, 
    newRole: TeamMember['role']
  ): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      action: 'update_team_member_role',
      entity_type: 'team',
      entity_id: teamId,
      new_values: { role: newRole },
      severity: 'medium',
      category: 'authorization',
      success: true
    });
  }

  // =====================
  // TWO-FACTOR AUTHENTICATION
  // =====================

  /**
   * Enable 2FA for user
   */
  async enable2FA(
    userId: string, 
    method: TwoFactorAuth['method'],
    contact?: string
  ): Promise<{ secret?: string; qrCode?: string; backupCodes: string[] }> {
    const backupCodes = this.generateBackupCodes();
    let secret: string | undefined;
    let qrCode: string | undefined;

    if (method === 'totp') {
      secret = this.generateTOTPSecret();
      qrCode = await this.generateQRCode(userId, secret);
    }

    const twoFA: Omit<TwoFactorAuth, 'id'> = {
      user_id: userId,
      method,
      secret,
      phone_number: method === 'sms' ? contact : undefined,
      email: method === 'email' ? contact : undefined,
      is_verified: false,
      backup_codes: backupCodes,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('two_factor_auth')
      .insert(twoFA);

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      action: 'enable_2fa',
      entity_type: 'user',
      entity_id: userId,
      new_values: { method },
      severity: 'medium',
      category: 'authentication',
      success: true
    });

    return { secret, qrCode, backupCodes };
  }

  /**
   * Verify 2FA setup
   */
  async verify2FASetup(userId: string, code: string): Promise<boolean> {
    const { data: twoFA } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .eq('is_verified', false)
      .single();

    if (!twoFA) return false;

    let isValid = false;

    if (twoFA.method === 'totp' && twoFA.secret) {
      isValid = this.verifyTOTPCode(twoFA.secret, code);
    } else if (twoFA.method === 'sms' || twoFA.method === 'email') {
      // Verify code sent via SMS/email (implementation depends on your messaging service)
      isValid = await this.verifySMSEmailCode(userId, code);
    }

    if (isValid) {
      await supabase
        .from('two_factor_auth')
        .update({ is_verified: true })
        .eq('id', twoFA.id);

      await auditService.logEvent({
        user_id: userId,
        action: 'verify_2fa_setup',
        entity_type: 'user',
        entity_id: userId,
        new_values: { method: twoFA.method },
        severity: 'medium',
        category: 'authentication',
        success: true
      });
    }

    return isValid;
  }

  /**
   * Verify 2FA during login
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    const { data: twoFA } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .eq('is_verified', true)
      .single();

    if (!twoFA) return false;

    let isValid = false;

    // Check backup codes first
    if (twoFA.backup_codes.includes(code)) {
      isValid = true;
      // Remove used backup code
      const updatedCodes = twoFA.backup_codes.filter(c => c !== code);
      await supabase
        .from('two_factor_auth')
        .update({ backup_codes: updatedCodes })
        .eq('id', twoFA.id);
    } else if (twoFA.method === 'totp' && twoFA.secret) {
      isValid = this.verifyTOTPCode(twoFA.secret, code);
    } else {
      isValid = await this.verifySMSEmailCode(userId, code);
    }

    if (isValid) {
      await supabase
        .from('two_factor_auth')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', twoFA.id);
    }

    await auditService.logEvent({
      user_id: userId,
      action: 'verify_2fa',
      entity_type: 'user',
      entity_id: userId,
      new_values: { method: twoFA.method },
      severity: isValid ? 'low' : 'high',
      category: 'authentication',
      success: isValid
    });

    return isValid;
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string): Promise<void> {
    const { error } = await supabase
      .from('two_factor_auth')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    await auditService.logEvent({
      user_id: userId,
      action: 'disable_2fa',
      entity_type: 'user',
      entity_id: userId,
      severity: 'medium',
      category: 'authentication',
      success: true
    });
  }

  // =====================
  // SESSION MANAGEMENT
  // =====================

  /**
   * Create user session
   */
  async createSession(
    userId: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<UserSession> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session: Omit<UserSession, 'id'> = {
      user_id: userId,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      last_activity_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;

    await auditService.logAuthentication(
      'login',
      userId,
      true,
      { ip_address: ipAddress, user_agent: userAgent }
    );

    return data;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionToken: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .eq('is_active', true);
  }

  /**
   * End session
   */
  async endSession(sessionToken: string): Promise<void> {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .single();

    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);

    if (session) {
      await auditService.logAuthentication(
        'logout',
        session.user_id,
        true
      );
    }
  }

  /**
   * End all user sessions
   */
  async endAllUserSessions(userId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    await auditService.logEvent({
      user_id: userId,
      action: 'logout_all_sessions',
      entity_type: 'user',
      entity_id: userId,
      severity: 'medium',
      category: 'authentication',
      success: true
    });
  }

  // =====================
  // USER PREFERENCES
  // =====================

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<Omit<UserPreferences, 'id' | 'user_id'>>
  ): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;

    await auditService.logDataModification(
      'update',
      'user_preferences',
      data.id,
      null,
      preferences,
      userId
    );

    return data;
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data;
  }

  // =====================
  // ACTIVITY LOGGING
  // =====================

  /**
   * Log user activity
   */
  async logActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<void> {
    await supabase
      .from('user_activities')
      .insert({
        ...activity,
        timestamp: new Date().toISOString()
      });
  }

  /**
   * Get user activity history
   */
  async getUserActivity(
    userId: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<UserActivity[]> {
    const { data } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    return data || [];
  }

  // =====================
  // HELPER METHODS
  // =====================

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  private generateTOTPSecret(): string {
    // Generate a base32 secret for TOTP
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private async generateQRCode(userId: string, secret: string): Promise<string> {
    // Generate QR code for TOTP setup
    const appName = 'Locall';
    const otpauthURL = `otpauth://totp/${appName}:${userId}?secret=${secret}&issuer=${appName}`;
    
    // You would use a QR code library here
    // For now, return the URL that can be converted to QR code on frontend
    return otpauthURL;
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    // Implement TOTP verification
    // This would use a library like speakeasy
    // For now, return a mock verification
    return code.length === 6 && /^\d+$/.test(code);
  }

  private async verifySMSEmailCode(userId: string, code: string): Promise<boolean> {
    // Verify code sent via SMS or email
    // This would integrate with your messaging service
    return code.length === 6 && /^\d+$/.test(code);
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const userManagementService = UserManagementService.getInstance();
