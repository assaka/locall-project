import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get queue status and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const operation = searchParams.get('operation') || 'status';

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    switch (operation) {
      case 'status':
        return await getQueueStatus(workspaceId);
      case 'statistics':
        return await getQueueStatistics(workspaceId);
      case 'calls':
        return await getQueuedCalls(workspaceId);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in queue management:', error);
    return NextResponse.json(
      { success: false, error: 'Queue management failed' },
      { status: 500 }
    );
  }
}

// POST - Queue management operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workspaceId, callId, priority, agentId } = body;

    if (!workspaceId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'add_to_queue':
        return await addToQueue(workspaceId, callId, priority);
      case 'remove_from_queue':
        return await removeFromQueue(callId);
      case 'prioritize_call':
        return await prioritizeCall(callId, priority);
      case 'assign_agent':
        return await assignAgentToCall(callId, agentId);
      case 'get_next_call':
        return await getNextCallForAgent(workspaceId, agentId);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in queue operation:', error);
    return NextResponse.json(
      { success: false, error: 'Queue operation failed' },
      { status: 500 }
    );
  }
}

async function getQueueStatus(workspaceId: string) {
  // Get current queue count by priority
  const { data: queueCounts } = await supabase
    .from('call_queue')
    .select('priority')
    .eq('workspace_id', workspaceId)
    .eq('status', 'waiting');

  const priorityCounts = {
    urgent: 0,
    high: 0,
    normal: 0,
    low: 0
  };

  queueCounts?.forEach(call => {
    priorityCounts[call.priority as keyof typeof priorityCounts]++;
  });

  // Get available agents
  const { data: availableAgents } = await supabase
    .from('agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'available');

  // Get average wait time
  const { data: recentCalls } = await supabase
    .from('call_queue')
    .select('estimated_wait_time, actual_wait_time')
    .eq('workspace_id', workspaceId)
    .not('actual_wait_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const avgWaitTime = recentCalls?.length 
    ? recentCalls.reduce((sum, call) => sum + (call.actual_wait_time || 0), 0) / recentCalls.length
    : 0;

  return NextResponse.json({
    success: true,
    queue_status: {
      total_waiting: Object.values(priorityCounts).reduce((a, b) => a + b, 0),
      priority_breakdown: priorityCounts,
      available_agents: availableAgents?.length || 0,
      average_wait_time: Math.round(avgWaitTime),
      queue_health: calculateQueueHealth(priorityCounts, availableAgents?.length || 0)
    }
  });
}

async function getQueueStatistics(workspaceId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Today's statistics
  const { data: todayStats } = await supabase
    .from('call_queue')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', todayStart.toISOString());

  // This week's statistics
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  const { data: weekStats } = await supabase
    .from('call_queue')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', weekStart.toISOString());

  return NextResponse.json({
    success: true,
    statistics: {
      today: calculatePeriodStats(todayStats || []),
      this_week: calculatePeriodStats(weekStats || []),
      peak_hours: await getPeakHours(workspaceId),
      performance_metrics: await getPerformanceMetrics(workspaceId)
    }
  });
}

async function getQueuedCalls(workspaceId: string) {
  const { data: calls } = await supabase
    .from('call_queue')
    .select(`
      *,
      calls (
        caller_number,
        caller_name,
        created_at
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'waiting')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  return NextResponse.json({
    success: true,
    queued_calls: calls || []
  });
}

async function addToQueue(workspaceId: string, callId: string, priority: string = 'normal') {
  const queuePosition = await calculateQueuePosition(workspaceId, priority);
  const estimatedWaitTime = calculateEstimatedWaitTime(queuePosition, priority);

  const { data: queueEntry, error } = await supabase
    .from('call_queue')
    .insert([{
      workspace_id: workspaceId,
      call_id: callId,
      priority: priority,
      queue_position: queuePosition,
      estimated_wait_time: estimatedWaitTime,
      status: 'waiting',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return NextResponse.json({
    success: true,
    queue_entry: queueEntry
  });
}

async function removeFromQueue(callId: string) {
  const { error } = await supabase
    .from('call_queue')
    .update({ 
      status: 'removed',
      removed_at: new Date().toISOString()
    })
    .eq('call_id', callId);

  if (error) {
    throw error;
  }

  return NextResponse.json({
    success: true,
    message: 'Call removed from queue'
  });
}

async function prioritizeCall(callId: string, newPriority: string) {
  // Update priority and recalculate position
  const { data: call } = await supabase
    .from('call_queue')
    .select('workspace_id')
    .eq('call_id', callId)
    .single();

  if (!call) {
    throw new Error('Call not found in queue');
  }

  const newPosition = await calculateQueuePosition(call.workspace_id, newPriority);
  const newWaitTime = calculateEstimatedWaitTime(newPosition, newPriority);

  const { error } = await supabase
    .from('call_queue')
    .update({
      priority: newPriority,
      queue_position: newPosition,
      estimated_wait_time: newWaitTime,
      updated_at: new Date().toISOString()
    })
    .eq('call_id', callId);

  if (error) {
    throw error;
  }

  return NextResponse.json({
    success: true,
    message: 'Call priority updated'
  });
}

async function assignAgentToCall(callId: string, agentId: string) {
  const { error } = await supabase
    .from('call_queue')
    .update({
      assigned_agent_id: agentId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    })
    .eq('call_id', callId);

  if (error) {
    throw error;
  }

  return NextResponse.json({
    success: true,
    message: 'Agent assigned to call'
  });
}

async function getNextCallForAgent(workspaceId: string, agentId: string) {
  // Get highest priority call that the agent can handle
  const { data: nextCall } = await supabase
    .from('call_queue')
    .select(`
      *,
      calls (
        caller_number,
        caller_name,
        required_skill
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'waiting')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!nextCall) {
    return NextResponse.json({
      success: true,
      next_call: null
    });
  }

  // Assign the call to the agent
  await assignAgentToCall(nextCall.call_id, agentId);

  return NextResponse.json({
    success: true,
    next_call: nextCall
  });
}

// Helper functions
async function calculateQueuePosition(workspaceId: string, priority: string): Promise<number> {
  const { data: queuedCalls } = await supabase
    .from('call_queue')
    .select('priority')
    .eq('workspace_id', workspaceId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true });

  if (!queuedCalls) return 1;

  const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
  const currentPriorityLevel = priorityOrder[priority as keyof typeof priorityOrder] || 2;

  return queuedCalls.filter(call => 
    (priorityOrder[call.priority as keyof typeof priorityOrder] || 2) >= currentPriorityLevel
  ).length + 1;
}

function calculateEstimatedWaitTime(position: number, priority: string): number {
  const baseTimes = {
    'urgent': 60,
    'high': 90,
    'normal': 120,
    'low': 180
  };
  
  const baseTime = baseTimes[priority as keyof typeof baseTimes] || 120;
  return Math.max(position * baseTime, 30);
}

function calculateQueueHealth(priorityCounts: any, availableAgents: number): string {
  const totalCalls = Object.values(priorityCounts).reduce((a: number, b: number) => a + b, 0);
  const urgentCalls = priorityCounts.urgent + priorityCounts.high;
  
  if (availableAgents === 0 && totalCalls > 0) return 'critical';
  if (urgentCalls > availableAgents * 2) return 'poor';
  if (totalCalls > availableAgents * 3) return 'fair';
  return 'good';
}

function calculatePeriodStats(calls: any[]) {
  return {
    total_calls: calls.length,
    average_wait_time: calls.length ? 
      calls.reduce((sum, call) => sum + (call.actual_wait_time || call.estimated_wait_time || 0), 0) / calls.length : 0,
    max_wait_time: calls.length ? 
      Math.max(...calls.map(call => call.actual_wait_time || call.estimated_wait_time || 0)) : 0,
    abandoned_calls: calls.filter(call => call.status === 'abandoned').length,
    successful_connections: calls.filter(call => call.status === 'connected').length
  };
}

async function getPeakHours(workspaceId: string) {
  const { data: hourlyData } = await supabase
    .from('call_queue')
    .select('created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const hourCounts: { [key: number]: number } = {};
  
  hourlyData?.forEach(call => {
    const hour = new Date(call.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), calls: count }));

  return sortedHours;
}

async function getPerformanceMetrics(workspaceId: string) {
  const { data: metrics } = await supabase
    .from('call_queue')
    .select('estimated_wait_time, actual_wait_time, status')
    .eq('workspace_id', workspaceId)
    .not('actual_wait_time', 'is', null)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (!metrics || metrics.length === 0) {
    return {
      accuracy: 0,
      service_level: 0,
      abandonment_rate: 0
    };
  }

  const accurateEstimates = metrics.filter(m => 
    Math.abs((m.actual_wait_time || 0) - (m.estimated_wait_time || 0)) <= 60
  ).length;

  const serviceLevelMet = metrics.filter(m => 
    (m.actual_wait_time || 0) <= 300 // 5 minutes
  ).length;

  const abandonedCalls = metrics.filter(m => m.status === 'abandoned').length;

  return {
    accuracy: Math.round((accurateEstimates / metrics.length) * 100),
    service_level: Math.round((serviceLevelMet / metrics.length) * 100),
    abandonment_rate: Math.round((abandonedCalls / metrics.length) * 100)
  };
}
