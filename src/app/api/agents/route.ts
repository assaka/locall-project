import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch agents for a workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status'); // available, busy, offline
    const role = searchParams.get('role'); // agent, supervisor, backup

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

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
          avg_call_duration,
          satisfaction_rating,
          last_updated
        )
      `)
      .eq('workspace_id', workspaceId);

    if (status) {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: agents, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate additional metrics for each agent
    const agentsWithMetrics = await Promise.all(
      (agents || []).map(async (agent) => {
        // Get recent call statistics
        const { data: recentCalls } = await supabase
          .from('calls')
          .select('duration, satisfaction_rating, created_at')
          .eq('assigned_agent_id', agent.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        const callsToday = recentCalls?.length || 0;
        const avgDuration = recentCalls?.length 
          ? recentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / recentCalls.length
          : 0;
        const avgSatisfaction = recentCalls?.filter(call => call.satisfaction_rating)?.length
          ? recentCalls
              .filter(call => call.satisfaction_rating)
              .reduce((sum, call) => sum + call.satisfaction_rating, 0) / 
            recentCalls.filter(call => call.satisfaction_rating).length
          : 0;

        return {
          ...agent,
          metrics: {
            calls_handled_today: callsToday,
            avg_call_duration: Math.round(avgDuration),
            avg_satisfaction_rating: Math.round(avgSatisfaction * 10) / 10,
            last_call_time: recentCalls?.[0]?.created_at || null
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentsWithMetrics
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST - Create new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      name,
      email,
      phoneNumber,
      role = 'agent',
      skills = [],
      location = 'US',
      timezone = 'UTC',
      maxConcurrentCalls = 1,
      workingHours
    } = body;

    if (!workspaceId || !name || !email || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['agent', 'supervisor', 'backup', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if agent with this email already exists in workspace
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email)
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { success: false, error: 'Agent with this email already exists' },
        { status: 409 }
      );
    }

    // Create agent
    const agentData = {
      workspace_id: workspaceId,
      name,
      email,
      phone_number: phoneNumber,
      role,
      location,
      timezone,
      max_concurrent_calls: maxConcurrentCalls,
      working_hours: workingHours || {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      },
      status: 'offline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: agent, error } = await supabase
      .from('agents')
      .insert([agentData])
      .select()
      .single();

    if (error) throw error;

    // Add agent skills if provided
    if (skills.length > 0) {
      const skillsData = skills.map((skill: any) => ({
        agent_id: agent.id,
        skill_name: skill.name,
        skill_level: skill.level || 1
      }));

      const { error: skillsError } = await supabase
        .from('agent_skills')
        .insert(skillsData);

      if (skillsError) {
        console.error('Error adding agent skills:', skillsError);
      }
    }

    // Initialize agent statistics
    await supabase
      .from('agent_stats')
      .insert([{
        agent_id: agent.id,
        calls_handled_today: 0,
        calls_handled_total: 0,
        avg_call_duration: 0,
        satisfaction_rating: 0,
        last_updated: new Date().toISOString()
      }]);

    return NextResponse.json({
      success: true,
      agent
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// PUT - Update agent
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentId,
      name,
      email,
      phoneNumber,
      role,
      skills,
      location,
      timezone,
      maxConcurrentCalls,
      workingHours,
      status
    } = body;

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing agentId' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phone_number = phoneNumber;
    if (role) updateData.role = role;
    if (location) updateData.location = location;
    if (timezone) updateData.timezone = timezone;
    if (maxConcurrentCalls !== undefined) updateData.max_concurrent_calls = maxConcurrentCalls;
    if (workingHours) updateData.working_hours = workingHours;
    if (status) updateData.status = status;

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;

    // Update skills if provided
    if (skills) {
      // Delete existing skills
      await supabase
        .from('agent_skills')
        .delete()
        .eq('agent_id', agentId);

      // Add new skills
      if (skills.length > 0) {
        const skillsData = skills.map((skill: any) => ({
          agent_id: agentId,
          skill_name: skill.name,
          skill_level: skill.level || 1
        }));

        await supabase
          .from('agent_skills')
          .insert(skillsData);
      }
    }

    return NextResponse.json({
      success: true,
      agent
    });

  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE - Remove agent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing agentId' },
        { status: 400 }
      );
    }

    // Check if agent has active calls
    const { data: activeCalls } = await supabase
      .from('calls')
      .select('id')
      .eq('assigned_agent_id', agentId)
      .eq('status', 'active');

    if (activeCalls && activeCalls.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete agent with active calls' },
        { status: 409 }
      );
    }

    // Delete agent skills first
    await supabase
      .from('agent_skills')
      .delete()
      .eq('agent_id', agentId);

    // Delete agent statistics
    await supabase
      .from('agent_stats')
      .delete()
      .eq('agent_id', agentId);

    // Soft delete agent (set status to deleted instead of actual deletion)
    const { data: agent, error } = await supabase
      .from('agents')
      .update({ 
        status: 'deleted', 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
