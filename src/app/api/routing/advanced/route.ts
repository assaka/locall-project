import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Advanced routing logic with time-based, failover, and skills-based routing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      phoneNumber, 
      callerInfo, 
      workspaceId, 
      routingType = 'default',
      priority = 'normal' 
    } = body;

    if (!phoneNumber || !workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get routing configuration for workspace
    const { data: routingConfig } = await supabase
      .from('routing_configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .single();

    if (!routingConfig) {
      return NextResponse.json(
        { success: false, error: 'No routing configuration found' },
        { status: 404 }
      );
    }

    // Determine routing strategy
    const routingStrategy = await determineRoutingStrategy(routingConfig, callerInfo);
    
    // Execute routing logic
    const routingResult = await executeAdvancedRouting({
      phoneNumber,
      callerInfo,
      workspaceId,
      strategy: routingStrategy,
      priority,
      config: routingConfig
    });

    // Log routing decision
    await logRoutingDecision({
      phoneNumber,
      workspaceId,
      strategy: routingStrategy,
      result: routingResult,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      routing: routingResult
    });

  } catch (error) {
    console.error('Advanced routing error:', error);
    return NextResponse.json(
      { success: false, error: 'Routing failed' },
      { status: 500 }
    );
  }
}

// Determine the best routing strategy based on current conditions
async function determineRoutingStrategy(config: any, callerInfo: any) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if it's business hours
  const isBusinessHours = isWithinBusinessHours(currentHour, currentDay, config.business_hours);
  
  // Check if it's a holiday
  const isHoliday = await checkIfHoliday(now, config.holidays);
  
  // Determine strategy priority
  if (isHoliday || !isBusinessHours) {
    return config.after_hours_strategy || 'voicemail';
  }
  
  // Check agent availability
  const availableAgents = await getAvailableAgents(config.workspace_id);
  
  if (availableAgents.length === 0) {
    return config.no_agents_strategy || 'queue';
  }
  
  // Skills-based routing for premium callers
  if (callerInfo?.tier === 'premium' || callerInfo?.priority === 'high') {
    return 'skills-based';
  }
  
  // Geographic routing
  if (config.geographic_routing_enabled && callerInfo?.location) {
    return 'geographic';
  }
  
  // Default round-robin
  return 'round-robin';
}

// Execute the determined routing strategy
async function executeAdvancedRouting(params: any) {
  const { phoneNumber, callerInfo, workspaceId, strategy, priority, config } = params;
  
  switch (strategy) {
    case 'skills-based':
      return await skillsBasedRouting(workspaceId, callerInfo, priority);
    
    case 'geographic':
      return await geographicRouting(workspaceId, callerInfo);
    
    case 'round-robin':
      return await roundRobinRouting(workspaceId);
    
    case 'queue':
      return await queueRouting(workspaceId, priority);
    
    case 'voicemail':
      return await voicemailRouting(workspaceId);
    
    case 'failover':
      return await failoverRouting(workspaceId, callerInfo);
    
    default:
      return await roundRobinRouting(workspaceId);
  }
}

// Skills-based routing for premium/high-priority calls
async function skillsBasedRouting(workspaceId: string, callerInfo: any, priority: string) {
  // Get agents with their skills
  const { data: agentSkills } = await supabase
    .from('agents')
    .select(`
      *,
      agent_skills (
        skill_name,
        skill_level
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'available')
    .order('created_at', { ascending: true });

  if (!agentSkills || agentSkills.length === 0) {
    return { action: 'queue', reason: 'No skilled agents available' };
  }

  const requiredSkill = callerInfo?.required_skill || 'general';
  const minSkillLevel = callerInfo?.min_skill_level || 1;

  // Find agents with matching skills
  let matchingAgents = agentSkills.filter(agent => {
    if (!agent.agent_skills || agent.agent_skills.length === 0) {
      // Agents without specific skills can handle general inquiries
      return requiredSkill === 'general';
    }
    
    return agent.agent_skills.some((skill: any) => 
      skill.skill_name === requiredSkill && 
      skill.skill_level >= minSkillLevel
    );
  });

  // If no exact skill match, try senior agents for escalation
  if (matchingAgents.length === 0 && priority === 'high') {
    matchingAgents = agentSkills.filter(agent => 
      agent.tier === 'senior' || agent.role === 'supervisor'
    );
  }

  // If still no match, fallback to any available agent
  if (matchingAgents.length === 0) {
    matchingAgents = agentSkills;
  }

  // Select best agent based on skill level and workload
  const bestAgent = matchingAgents.reduce((best, current) => {
    const bestSkillLevel = getHighestSkillLevel(best, requiredSkill);
    const currentSkillLevel = getHighestSkillLevel(current, requiredSkill);
    
    if (currentSkillLevel > bestSkillLevel) return current;
    if (currentSkillLevel === bestSkillLevel) {
      // Same skill level, prefer less busy agent
      return (current.calls_handled_today || 0) < (best.calls_handled_today || 0) ? current : best;
    }
    return best;
  });

  return {
    action: 'route',
    agent_id: bestAgent.id,
    agent_phone: bestAgent.phone_number,
    strategy: 'skills-based',
    skill_match: requiredSkill,
    agent_skill_level: getHighestSkillLevel(bestAgent, requiredSkill),
    estimated_wait_time: 0
  };
}

function getHighestSkillLevel(agent: any, skillName: string): number {
  if (!agent.agent_skills || agent.agent_skills.length === 0) return 1;
  
  const skill = agent.agent_skills.find((s: any) => s.skill_name === skillName);
  return skill ? skill.skill_level : 1;
}

// Geographic routing based on caller location
async function geographicRouting(workspaceId: string, callerInfo: any) {
  const callerLocation = callerInfo?.location || callerInfo?.country || 'US';
  const callerTimezone = callerInfo?.timezone;
  const callerCity = callerInfo?.city;
  
  // First try exact location match (city level)
  let { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'available')
    .eq('city', callerCity);

  // If no city match, try state/region level
  if (!agents || agents.length === 0) {
    ({ data: agents } = await supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'available')
      .eq('state', callerInfo?.state));
  }

  // If no state match, try country level
  if (!agents || agents.length === 0) {
    ({ data: agents } = await supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'available')
      .eq('country', callerLocation));
  }

  // If no country match, try timezone match for better availability
  if (!agents || agents.length === 0) {
    ({ data: agents } = await supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'available')
      .eq('timezone', callerTimezone));
  }

  // Final fallback to any available agent
  if (!agents || agents.length === 0) {
    return await roundRobinRouting(workspaceId);
  }

  // Select least recently used agent in the matched location
  const selectedAgent = agents.reduce((prev, current) => {
    const prevCallTime = new Date(prev.last_call_time || 0).getTime();
    const currentCallTime = new Date(current.last_call_time || 0).getTime();
    return prevCallTime < currentCallTime ? prev : current;
  });

  // Update agent's last call time
  await supabase
    .from('agents')
    .update({ last_call_time: new Date().toISOString() })
    .eq('id', selectedAgent.id);

  return {
    action: 'route',
    agent_id: selectedAgent.id,
    agent_phone: selectedAgent.phone_number,
    strategy: 'geographic',
    location_match: selectedAgent.city || selectedAgent.state || selectedAgent.country,
    estimated_wait_time: 0
  };
}

// Round-robin routing
async function roundRobinRouting(workspaceId: string) {
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'available')
    .order('last_call_time', { ascending: true });

  if (!agents || agents.length === 0) {
    return { action: 'queue', reason: 'No agents available' };
  }

  const nextAgent = agents[0];

  // Update agent's last call time
  await supabase
    .from('agents')
    .update({ last_call_time: new Date().toISOString() })
    .eq('id', nextAgent.id);

  return {
    action: 'route',
    agent_id: nextAgent.id,
    agent_phone: nextAgent.phone_number,
    strategy: 'round-robin',
    estimated_wait_time: 0
  };
}

// Queue routing with priority handling
async function queueRouting(workspaceId: string, priority: string) {
  const queuePosition = await calculateQueuePosition(workspaceId, priority);
  const estimatedWaitTime = calculateEstimatedWaitTime(queuePosition, priority);

  // Add call to queue
  const { data: queueEntry } = await supabase
    .from('call_queue')
    .insert([{
      workspace_id: workspaceId,
      priority: priority,
      queue_position: queuePosition,
      estimated_wait_time: estimatedWaitTime,
      status: 'waiting',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  // Check queue limits
  const { data: queueSettings } = await supabase
    .from('routing_configurations')
    .select('queue_settings')
    .eq('workspace_id', workspaceId)
    .single();

  const maxQueueSize = queueSettings?.queue_settings?.max_queue_size || 50;
  const maxWaitTime = queueSettings?.queue_settings?.max_wait_time || 600;

  if (queuePosition > maxQueueSize) {
    return {
      action: 'voicemail',
      reason: 'Queue full',
      message: 'We are experiencing high call volume. Please leave a message.',
      strategy: 'queue-overflow'
    };
  }

  if (estimatedWaitTime > maxWaitTime) {
    return {
      action: 'callback',
      reason: 'Wait time too long',
      message: 'Current wait time exceeds our service level. We will call you back.',
      estimated_callback_time: Math.min(estimatedWaitTime / 2, 300), // Max 5 minutes
      strategy: 'queue-callback'
    };
  }

  return {
    action: 'queue',
    queue_id: queueEntry?.id,
    queue_position: queuePosition,
    estimated_wait_time: estimatedWaitTime,
    priority_level: priority,
    strategy: 'queue'
  };
}

function calculateEstimatedWaitTime(position: number, priority: string): number {
  const baseTimes = {
    'urgent': 60,   // 1 minute per position
    'high': 90,     // 1.5 minutes per position
    'normal': 120,  // 2 minutes per position
    'low': 180      // 3 minutes per position
  };
  
  const baseTime = baseTimes[priority as keyof typeof baseTimes] || 120;
  return Math.max(position * baseTime, 30); // Minimum 30 seconds
}

// Voicemail routing for after-hours
async function voicemailRouting(workspaceId: string) {
  return {
    action: 'voicemail',
    message: 'Thank you for calling. Please leave a message and we will get back to you.',
    strategy: 'voicemail'
  };
}

// Failover routing when primary agents are unavailable
async function failoverRouting(workspaceId: string, callerInfo: any) {
  const failoverSteps = [
    'backup',      // Try backup agents
    'supervisor',  // Escalate to supervisors
    'queue',       // Add to priority queue
    'voicemail'    // Final fallback
  ];

  for (const step of failoverSteps) {
    const result = await executeFailoverStep(workspaceId, step, callerInfo);
    if (result.action !== 'continue') {
      return result;
    }
  }

  // Ultimate fallback
  return await voicemailRouting(workspaceId);
}

async function executeFailoverStep(workspaceId: string, step: string, callerInfo: any) {
  switch (step) {
    case 'backup':
      const { data: backupAgents } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('role', 'backup')
        .eq('status', 'available');

      if (backupAgents && backupAgents.length > 0) {
        return {
          action: 'route',
          agent_id: backupAgents[0].id,
          agent_phone: backupAgents[0].phone_number,
          strategy: 'failover-backup',
          escalation_level: 1
        };
      }
      break;

    case 'supervisor':
      const { data: supervisors } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('role', 'supervisor')
        .eq('status', 'available');

      if (supervisors && supervisors.length > 0) {
        return {
          action: 'route',
          agent_id: supervisors[0].id,
          agent_phone: supervisors[0].phone_number,
          strategy: 'failover-supervisor',
          escalation_level: 2
        };
      }
      break;

    case 'queue':
      // Try high-priority queue
      const queueResult = await queueRouting(workspaceId, 'high');
      if (queueResult.action === 'queue') {
        return {
          ...queueResult,
          strategy: 'failover-queue',
          escalation_level: 3
        };
      }
      break;

    case 'voicemail':
      return {
        action: 'voicemail',
        message: 'All agents are currently unavailable. Please leave a detailed message.',
        strategy: 'failover-voicemail',
        escalation_level: 4
      };
  }

  return { action: 'continue' };
}

// Helper functions
function isWithinBusinessHours(hour: number, day: number, businessHours: any) {
  if (!businessHours) return true;
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayConfig = businessHours[dayNames[day]];
  
  if (!dayConfig || !dayConfig.open) return false;
  
  return hour >= dayConfig.start && hour < dayConfig.end;
}

async function checkIfHoliday(date: Date, holidays: any[]) {
  if (!holidays || holidays.length === 0) return false;
  
  const dateStr = date.toISOString().split('T')[0];
  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();
  
  return holidays.some(holiday => {
    // Support different holiday formats
    if (holiday.date === dateStr) return true;
    if (holiday.month === currentMonth && holiday.day === currentDay) return true;
    
    // Support recurring holidays (same date every year)
    if (holiday.recurring && holiday.month === currentMonth && holiday.day === currentDay) return true;
    
    return false;
  });
}

async function getAvailableAgents(workspaceId: string) {
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'available');
    
  return agents || [];
}

async function calculateQueuePosition(workspaceId: string, priority: string) {
  const { data: queuedCalls } = await supabase
    .from('call_queue')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (!queuedCalls) return 1;

  // Count calls with same or higher priority ahead in queue
  const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
  const currentPriorityLevel = priorityOrder[priority as keyof typeof priorityOrder] || 2;

  return queuedCalls.filter(call => 
    (priorityOrder[call.priority as keyof typeof priorityOrder] || 2) >= currentPriorityLevel
  ).length + 1;
}

async function logRoutingDecision(decision: any) {
  await supabase
    .from('routing_logs')
    .insert([{
      phone_number: decision.phoneNumber,
      workspace_id: decision.workspaceId,
      routing_strategy: decision.strategy,
      routing_result: decision.result,
      timestamp: decision.timestamp
    }]);
}

// GET endpoint for retrieving routing configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const { data: routingConfigs } = await supabase
      .from('routing_configurations')
      .select('*')
      .eq('workspace_id', workspaceId);

    return NextResponse.json({
      success: true,
      configurations: routingConfigs || []
    });

  } catch (error) {
    console.error('Error fetching routing configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}
