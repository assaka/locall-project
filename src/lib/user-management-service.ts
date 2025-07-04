import { supabase } from '../app/utils/supabaseClient';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  updated_at?: string;
  workspace_id: string;
  avatar_url?: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  login_attempts: number;
  last_login_ip?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  workspace_id: string;
  invited_by: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_week: number;
  by_role: Record<string, number>;
  by_status: Record<string, number>;
}

export class UserManagementService {
  
  // Get all users for a workspace
  static async getUsers(workspaceId: string, filters?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      let query = supabase
        .from('workspace_users')
        .select(`
          *,
          user_profiles!inner(
            id,
            name,
            email,
            phone,
            avatar_url,
            email_verified,
            two_factor_enabled,
            created_at,
            updated_at
          )
        `)
        .eq('workspace_id', workspaceId);

      if (filters?.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`user_profiles.name.ilike.%${filters.search}%,user_profiles.email.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const users: User[] = data?.map(item => ({
        id: item.user_profiles.id,
        name: item.user_profiles.name,
        email: item.user_profiles.email,
        phone: item.user_profiles.phone,
        role: item.role,
        status: item.status,
        last_login: item.last_login,
        created_at: item.user_profiles.created_at,
        updated_at: item.user_profiles.updated_at,
        workspace_id: item.workspace_id,
        avatar_url: item.user_profiles.avatar_url,
        email_verified: item.user_profiles.email_verified,
        two_factor_enabled: item.user_profiles.two_factor_enabled,
        login_attempts: item.login_attempts || 0,
        last_login_ip: item.last_login_ip
      })) || [];

      return {
        users,
        total: count || 0
      };

    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('workspace_users')
        .select(`
          *,
          user_profiles!inner(
            id,
            name,
            email,
            phone,
            avatar_url,
            email_verified,
            two_factor_enabled,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.user_profiles.id,
        name: data.user_profiles.name,
        email: data.user_profiles.email,
        phone: data.user_profiles.phone,
        role: data.role,
        status: data.status,
        last_login: data.last_login,
        created_at: data.user_profiles.created_at,
        updated_at: data.user_profiles.updated_at,
        workspace_id: data.workspace_id,
        avatar_url: data.user_profiles.avatar_url,
        email_verified: data.user_profiles.email_verified,
        two_factor_enabled: data.user_profiles.two_factor_enabled,
        login_attempts: data.login_attempts || 0,
        last_login_ip: data.last_login_ip
      };

    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create a new user
  static async createUser(userData: {
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'moderator' | 'user';
    workspace_id: string;
    invited_by: string;
  }): Promise<User> {
    try {
      // First create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          email_verified: false
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Then add to workspace
      const { data: workspaceUserData, error: workspaceError } = await supabase
        .from('workspace_users')
        .insert({
          user_id: profileData.id,
          workspace_id: userData.workspace_id,
          role: userData.role,
          status: 'active',
          invited_by: userData.invited_by
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Log activity
      await this.logUserActivity(profileData.id, 'user_created', {
        workspace_id: userData.workspace_id,
        role: userData.role,
        invited_by: userData.invited_by
      });

      return {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        role: userData.role,
        status: 'active',
        created_at: profileData.created_at,
        workspace_id: userData.workspace_id,
        avatar_url: profileData.avatar_url,
        email_verified: false,
        two_factor_enabled: false,
        login_attempts: 0
      };

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Update profile data
      if (updates.name || updates.email || updates.phone || updates.avatar_url) {
        const profileUpdates: any = {};
        if (updates.name) profileUpdates.name = updates.name;
        if (updates.email) profileUpdates.email = updates.email;
        if (updates.phone) profileUpdates.phone = updates.phone;
        if (updates.avatar_url) profileUpdates.avatar_url = updates.avatar_url;

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Update workspace role/status
      if (updates.role || updates.status) {
        const workspaceUpdates: any = {};
        if (updates.role) workspaceUpdates.role = updates.role;
        if (updates.status) workspaceUpdates.status = updates.status;

        const { error: workspaceError } = await supabase
          .from('workspace_users')
          .update(workspaceUpdates)
          .eq('user_id', userId);

        if (workspaceError) throw workspaceError;
      }

      // Log activity
      await this.logUserActivity(userId, 'user_updated', updates);

      // Return updated user
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) throw new Error('User not found after update');

      return updatedUser;

    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user from workspace
  static async deleteUser(userId: string, workspaceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspace_users')
        .delete()
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Log activity
      await this.logUserActivity(userId, 'user_removed_from_workspace', {
        workspace_id: workspaceId
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user activity log
  static async getUserActivity(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  }

  // Log user activity
  static async logUserActivity(userId: string, action: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action,
          details,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw here as this shouldn't break the main flow
    }
  }

  // Get user statistics
  static async getUserStats(workspaceId: string): Promise<UserStats> {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('workspace_users')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (totalError) throw totalError;

      // Get active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers, error: activeError } = await supabase
        .from('workspace_users')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('last_login', thirtyDaysAgo.toISOString());

      if (activeError) throw activeError;

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: newUsersToday, error: todayError } = await supabase
        .from('workspace_users')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Get new users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: newUsersWeek, error: weekError } = await supabase
        .from('workspace_users')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      // Get users by role
      const { data: roleData, error: roleError } = await supabase
        .from('workspace_users')
        .select('role')
        .eq('workspace_id', workspaceId);

      if (roleError) throw roleError;

      // Get users by status
      const { data: statusData, error: statusError } = await supabase
        .from('workspace_users')
        .select('status')
        .eq('workspace_id', workspaceId);

      if (statusError) throw statusError;

      const byRole = roleData?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const byStatus = statusData?.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        new_users_today: newUsersToday || 0,
        new_users_this_week: newUsersWeek || 0,
        by_role: byRole,
        by_status: byStatus
      };

    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Send user invitation
  static async inviteUser(email: string, role: string, workspaceId: string, invitedBy: string): Promise<UserInvitation> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        // Check if already in workspace
        const { data: workspaceUser } = await supabase
          .from('workspace_users')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('workspace_id', workspaceId)
          .single();

        if (workspaceUser) {
          throw new Error('User already exists in this workspace');
        }
      }

      // Create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role,
          workspace_id: workspaceId,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send invitation email via Brevo service
      // await BrevoEmailService.sendInvitationEmail(email, invitationData);

      return data;

    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  // Accept invitation
  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      // Get invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;
      if (!invitation) throw new Error('Invitation not found');

      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer valid');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user to workspace
      const { error: workspaceError } = await supabase
        .from('workspace_users')
        .insert({
          user_id: userId,
          workspace_id: invitation.workspace_id,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.invited_by
        });

      if (workspaceError) throw workspaceError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Log activity
      await this.logUserActivity(userId, 'invitation_accepted', {
        workspace_id: invitation.workspace_id,
        role: invitation.role
      });

    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Update user login info
  static async updateLoginInfo(userId: string, ipAddress?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspace_users')
        .update({
          last_login: new Date().toISOString(),
          last_login_ip: ipAddress,
          login_attempts: 0
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log login activity
      await this.logUserActivity(userId, 'user_login', {
        ip_address: ipAddress
      }, ipAddress);

    } catch (error) {
      console.error('Error updating login info:', error);
      throw error;
    }
  }

  // Record failed login attempt
  static async recordFailedLogin(email: string, ipAddress?: string): Promise<void> {
    try {
      // Get user by email
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (user) {
        // Increment login attempts - use RPC function or separate query
        const { data: currentUser } = await supabase
          .from('workspace_users')
          .select('login_attempts')
          .eq('user_id', user.id)
          .single();

        const newAttempts = (currentUser?.login_attempts || 0) + 1;
        
        const { error } = await supabase
          .from('workspace_users')
          .update({
            login_attempts: newAttempts
          })
          .eq('user_id', user.id);

        if (error) throw error;

        // Log failed login
        await this.logUserActivity(user.id, 'failed_login', {
          email,
          ip_address: ipAddress
        }, ipAddress);
      }

    } catch (error) {
      console.error('Error recording failed login:', error);
      // Don't throw here as this shouldn't break authentication flow
    }
  }
}
