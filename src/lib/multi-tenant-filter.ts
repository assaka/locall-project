import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TenantContext {
  userId: string;
  workspaceId: string | null;
  isAgency: boolean;
  agencyId?: string;
  clientIds?: string[];
  accessLevel: 'user' | 'admin' | 'agency' | 'super_admin';
}

export class MultiTenantFilter {
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext;
  }

  // Apply workspace filtering to queries
  applyWorkspaceFilter(query: any, tableName: string) {
    if (this.tenantContext.accessLevel === 'super_admin') {
      return query; // Super admins see everything
    }

    if (this.tenantContext.isAgency && this.tenantContext.clientIds) {
      // Agency can see all their clients' data
      const workspaceIds = this.tenantContext.clientIds;
      return query.in('workspace_id', workspaceIds);
    }

    if (this.tenantContext.workspaceId) {
      // Regular user/admin can only see their workspace
      return query.eq('workspace_id', this.tenantContext.workspaceId);
    }

    // No workspace access - return empty results
    return query.eq('workspace_id', 'no-access');
  }

  // Apply user-level filtering
  applyUserFilter(query: any) {
    if (this.tenantContext.accessLevel === 'super_admin') {
      return query;
    }

    if (this.tenantContext.isAgency) {
      // Agency sees their users and client users
      return query.or(`user_id.eq.${this.tenantContext.userId},workspace_id.in.(${this.tenantContext.clientIds?.join(',')})`);
    }

    // Regular user sees only their data
    return query.eq('user_id', this.tenantContext.userId);
  }

  // Get filtered phone numbers
  async getPhoneNumbers(filters: any = {}) {
    let query = supabase
      .from('phone_numbers')
      .select('*');

    query = this.applyWorkspaceFilter(query, 'phone_numbers');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.country) {
      query = query.eq('country', filters.country);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  // Get filtered calls
  async getCalls(filters: any = {}) {
    let query = supabase
      .from('calls')
      .select(`
        *,
        phone_numbers (number, friendly_name)
      `);

    query = this.applyWorkspaceFilter(query, 'calls');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  // Get filtered form submissions
  async getFormSubmissions(filters: any = {}) {
    let query = supabase
      .from('form_submissions')
      .select(`
        *,
        webforms (name, title)
      `);

    query = this.applyWorkspaceFilter(query, 'form_submissions');

    if (filters.formId) {
      query = query.eq('form_id', filters.formId);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  // Get filtered agents
  async getAgents(filters: any = {}) {
    let query = supabase
      .from('agents')
      .select(`
        *,
        agent_skills (
          skill_name,
          skill_level
        ),
        agent_stats (
          calls_handled_today,
          calls_handled_total,
          avg_call_duration,
          satisfaction_rating
        )
      `);

    query = this.applyWorkspaceFilter(query, 'agents');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  // Get filtered analytics
  async getAnalytics(dateFrom: string, dateTo: string) {
    const results: any = {};

    // Calls analytics
    const { data: callsData } = await this.getCalls({ dateFrom, dateTo });
    results.calls = this.calculateCallMetrics(callsData || []);

    // Forms analytics  
    const { data: formsData } = await this.getFormSubmissions({ dateFrom, dateTo });
    results.forms = this.calculateFormMetrics(formsData || []);

    // Phone numbers usage
    const { data: numbersData } = await this.getPhoneNumbers();
    results.numbers = this.calculateNumberMetrics(numbersData || []);

    return results;
  }

  // Calculate call metrics
  private calculateCallMetrics(calls: any[]) {
    return {
      total: calls.length,
      answered: calls.filter(c => c.status === 'completed').length,
      missed: calls.filter(c => c.status === 'missed').length,
      busy: calls.filter(c => c.status === 'busy').length,
      total_duration: calls.reduce((sum, c) => sum + (c.duration || 0), 0),
      avg_duration: calls.length ? calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length : 0,
      answer_rate: calls.length ? (calls.filter(c => c.status === 'completed').length / calls.length) * 100 : 0
    };
  }

  // Calculate form metrics
  private calculateFormMetrics(submissions: any[]) {
    const byForm = submissions.reduce((acc, sub) => {
      const formId = sub.form_id;
      if (!acc[formId]) {
        acc[formId] = {
          form_name: sub.webforms?.name || 'Unknown',
          count: 0,
          conversion_rate: 0
        };
      }
      acc[formId].count++;
      return acc;
    }, {});

    return {
      total_submissions: submissions.length,
      unique_forms: Object.keys(byForm).length,
      by_form: byForm,
      recent_submissions: submissions.slice(0, 10)
    };
  }

  // Calculate number metrics
  private calculateNumberMetrics(numbers: any[]) {
    return {
      total: numbers.length,
      active: numbers.filter(n => n.status === 'active').length,
      inactive: numbers.filter(n => n.status === 'inactive').length,
      by_country: numbers.reduce((acc, num) => {
        acc[num.country] = (acc[num.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Validate workspace access
  async validateWorkspaceAccess(workspaceId: string): Promise<boolean> {
    if (this.tenantContext.accessLevel === 'super_admin') {
      return true;
    }

    if (this.tenantContext.isAgency) {
      return this.tenantContext.clientIds?.includes(workspaceId) || false;
    }

    return this.tenantContext.workspaceId === workspaceId;
  }

  // Get accessible workspaces for user
  async getAccessibleWorkspaces() {
    if (this.tenantContext.accessLevel === 'super_admin') {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    }

    if (this.tenantContext.isAgency && this.tenantContext.clientIds) {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', this.tenantContext.clientIds)
        .order('created_at', { ascending: false });
      return { data, error };
    }

    if (this.tenantContext.workspaceId) {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', this.tenantContext.workspaceId)
        .single();
      return { data: data ? [data] : [], error };
    }

    return { data: [], error: null };
  }
}

// Factory function to create tenant context from request
export async function createTenantContext(request: NextRequest, userId?: string): Promise<TenantContext> {
  if (!userId) {
    // Extract from auth header, session, etc.
    userId = extractUserIdFromRequest(request);
  }

  // Get user's workspace memberships
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces (
        id,
        name,
        settings
      )
    `)
    .eq('user_id', userId);

  // Check if user is an agency
  const { data: agencyInfo } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();

  let clientIds: string[] = [];
  if (agencyInfo) {
    // Get all client workspace IDs for this agency
    const { data: clients } = await supabase
      .from('agency_clients')
      .select('workspace_id')
      .eq('agency_id', agencyInfo.id)
      .eq('status', 'active');
    
    clientIds = clients?.map(c => c.workspace_id) || [];
  }

  // Determine access level
  let accessLevel: TenantContext['accessLevel'] = 'user';
  const hasAdminRole = memberships?.some(m => m.role === 'admin');
  if (hasAdminRole) accessLevel = 'admin';
  if (agencyInfo) accessLevel = 'agency';
  
  // Check for super admin
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (superAdmin) accessLevel = 'super_admin';

  // Get primary workspace
  const primaryWorkspace = memberships?.[0]?.workspace_id || null;

  return {
    userId,
    workspaceId: primaryWorkspace,
    isAgency: !!agencyInfo,
    agencyId: agencyInfo?.id,
    clientIds: agencyInfo ? clientIds : [primaryWorkspace].filter(Boolean),
    accessLevel
  };
}

function extractUserIdFromRequest(request: NextRequest): string {
  // Implementation depends on your auth system
  // This is a placeholder - replace with your actual auth logic
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Decode JWT token or validate API key
    // Return extracted user ID
  }
  
  return 'demo-user-id'; // Fallback for demo
}

// Middleware helper to apply tenant filtering to API routes
export function withTenantFiltering(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      const tenantContext = await createTenantContext(request);
      const filter = new MultiTenantFilter(tenantContext);
      
      // Add filter to request context
      (request as any).tenantFilter = filter;
      (request as any).tenantContext = tenantContext;
      
      return await handler(request, context);
    } catch (error) {
      console.error('Tenant filtering error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
