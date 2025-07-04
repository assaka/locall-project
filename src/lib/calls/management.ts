/**
 * Advanced Call Management System
 * Features: Conferencing, Transfer, Multi-level IVR, Queuing, Scripting
 */

import { supabase } from '../../app/utils/supabaseClient';

export interface CallQueue {
  id: string;
  name: string;
  workspace_id: string;
  max_wait_time: number;
  max_queue_size: number;
  priority: number;
  skill_requirements?: string[];
  announcement_url?: string;
  hold_music_url?: string;
  overflow_destination?: string;
  is_active: boolean;
}

export interface CallAgent {
  id: string;
  user_id: string;
  workspace_id: string;
  extension: string;
  skills: string[];
  status: 'available' | 'busy' | 'away' | 'offline';
  max_concurrent_calls: number;
  current_calls: number;
  priority: number;
}

export interface Conference {
  id: string;
  name: string;
  workspace_id: string;
  host_user_id: string;
  pin?: string;
  max_participants: number;
  start_time?: string;
  end_time?: string;
  is_recording: boolean;
  recording_url?: string;
  status: 'scheduled' | 'active' | 'ended';
  participants: ConferenceParticipant[];
}

export interface ConferenceParticipant {
  id: string;
  conference_id: string;
  call_sid?: string;
  phone_number?: string;
  user_id?: string;
  joined_at: string;
  left_at?: string;
  is_muted: boolean;
  is_host: boolean;
}

export interface IVRMenu {
  id: string;
  name: string;
  workspace_id: string;
  level: number;
  parent_id?: string;
  welcome_message: string;
  timeout_message?: string;
  invalid_message?: string;
  timeout_seconds: number;
  max_retries: number;
  options: IVROption[];
}

export interface IVROption {
  id: string;
  menu_id: string;
  digit: string;
  action_type: 'transfer' | 'queue' | 'submenu' | 'hangup' | 'voicemail' | 'webhook';
  action_value: string;
  message?: string;
}

export interface CallScript {
  id: string;
  name: string;
  workspace_id: string;
  type: 'inbound' | 'outbound' | 'callback';
  steps: CallScriptStep[];
  variables: Record<string, any>;
  is_active: boolean;
}

export interface CallScriptStep {
  id: string;
  script_id: string;
  step_number: number;
  type: 'message' | 'question' | 'data_collection' | 'condition' | 'action';
  content: string;
  expected_response?: 'yes_no' | 'text' | 'number' | 'option_select';
  options?: string[];
  next_step_id?: string;
  condition?: string;
  action?: string;
}

export interface QueuedCall {
  id: string;
  call_sid: string;
  queue_id: string;
  caller_number: string;
  priority: number;
  queued_at: string;
  estimated_wait_time: number;
  position: number;
}

class CallManagementService {
  private static instance: CallManagementService;

  static getInstance(): CallManagementService {
    if (!CallManagementService.instance) {
      CallManagementService.instance = new CallManagementService();
    }
    return CallManagementService.instance;
  }

  // =====================
  // QUEUE MANAGEMENT
  // =====================

  /**
   * Create a call queue
   */
  async createQueue(queue: Omit<CallQueue, 'id'>): Promise<CallQueue> {
    const { data, error } = await supabase
      .from('call_queues')
      .insert(queue)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add call to queue
   */
  async addToQueue(
    callSid: string, 
    queueId: string, 
    callerNumber: string, 
    priority: number = 1
  ): Promise<QueuedCall> {
    // Get current queue position
    const { count } = await supabase
      .from('queued_calls')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queueId);

    const position = (count || 0) + 1;
    const estimatedWaitTime = await this.calculateWaitTime(queueId);

    const queuedCall: Omit<QueuedCall, 'id'> = {
      call_sid: callSid,
      queue_id: queueId,
      caller_number: callerNumber,
      priority,
      queued_at: new Date().toISOString(),
      estimated_wait_time: estimatedWaitTime,
      position
    };

    const { data, error } = await supabase
      .from('queued_calls')
      .insert(queuedCall)
      .select()
      .single();

    if (error) throw error;

    // Trigger queue processing
    await this.processQueue(queueId);

    return data;
  }

  /**
   * Process queue and assign calls to available agents
   */
  async processQueue(queueId: string): Promise<void> {
    // Get next call in queue
    const { data: nextCall } = await supabase
      .from('queued_calls')
      .select('*')
      .eq('queue_id', queueId)
      .order('priority', { ascending: false })
      .order('queued_at', { ascending: true })
      .limit(1)
      .single();

    if (!nextCall) return;

    // Find available agent
    const availableAgent = await this.findAvailableAgent(queueId);
    
    if (availableAgent) {
      await this.assignCallToAgent(nextCall, availableAgent);
    }
  }

  /**
   * Find available agent for queue
   */
  private async findAvailableAgent(queueId: string): Promise<CallAgent | null> {
    // Get queue requirements
    const { data: queue } = await supabase
      .from('call_queues')
      .select('*')
      .eq('id', queueId)
      .single();

    if (!queue) return null;

    // Find agents with required skills
    let query = supabase
      .from('call_agents')
      .select('*')
      .eq('workspace_id', queue.workspace_id)
      .eq('status', 'available')
      .lt('current_calls', 'max_concurrent_calls');

    if (queue.skill_requirements?.length) {
      query = query.contains('skills', queue.skill_requirements);
    }

    const { data: agents } = await query
      .order('priority', { ascending: false })
      .limit(1);

    return agents?.[0] || null;
  }

  /**
   * Assign call to agent
   */
  private async assignCallToAgent(queuedCall: QueuedCall, agent: CallAgent): Promise<void> {
    // Transfer call to agent (Twilio API call would go here)
    await this.transferCall(queuedCall.call_sid, agent.extension);

    // Remove from queue
    await supabase
      .from('queued_calls')
      .delete()
      .eq('id', queuedCall.id);

    // Update agent status
    await supabase
      .from('call_agents')
      .update({ 
        current_calls: agent.current_calls + 1,
        status: agent.current_calls + 1 >= agent.max_concurrent_calls ? 'busy' : 'available'
      })
      .eq('id', agent.id);
  }

  /**
   * Calculate estimated wait time
   */
  private async calculateWaitTime(queueId: string): Promise<number> {
    // Get average call duration for this queue
    const { data: avgDuration } = await supabase
      .rpc('get_average_call_duration', { queue_id: queueId });

    // Get number of calls ahead in queue
    const { count: callsAhead } = await supabase
      .from('queued_calls')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queueId);

    // Get number of available agents
    const { count: availableAgents } = await supabase
      .from('call_agents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');

    const avgCallTime = avgDuration || 300; // Default 5 minutes
    const agentCount = Math.max(availableAgents || 1, 1);
    
    return Math.round((callsAhead || 0) * avgCallTime / agentCount);
  }

  // =====================
  // CONFERENCE MANAGEMENT
  // =====================

  /**
   * Create a conference
   */
  async createConference(conference: Omit<Conference, 'id' | 'participants'>): Promise<Conference> {
    const { data, error } = await supabase
      .from('conferences')
      .insert({
        ...conference,
        participants: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Join conference
   */
  async joinConference(
    conferenceId: string, 
    phoneNumber: string, 
    userId?: string
  ): Promise<ConferenceParticipant> {
    const participant: Omit<ConferenceParticipant, 'id'> = {
      conference_id: conferenceId,
      phone_number: phoneNumber,
      user_id: userId,
      joined_at: new Date().toISOString(),
      is_muted: false,
      is_host: false
    };

    const { data, error } = await supabase
      .from('conference_participants')
      .insert(participant)
      .select()
      .single();

    if (error) throw error;

    // Add participant to Twilio conference (API call would go here)
    // await this.addToTwilioConference(conferenceId, phoneNumber);

    return data;
  }

  /**
   * Leave conference
   */
  async leaveConference(participantId: string): Promise<void> {
    await supabase
      .from('conference_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('id', participantId);

    // Remove from Twilio conference (API call would go here)
  }

  /**
   * Mute/unmute participant
   */
  async muteParticipant(participantId: string, muted: boolean): Promise<void> {
    await supabase
      .from('conference_participants')
      .update({ is_muted: muted })
      .eq('id', participantId);

    // Mute in Twilio conference (API call would go here)
  }

  // =====================
  // IVR MANAGEMENT
  // =====================

  /**
   * Create IVR menu
   */
  async createIVRMenu(menu: Omit<IVRMenu, 'id' | 'options'>): Promise<IVRMenu> {
    const { data, error } = await supabase
      .from('ivr_menus')
      .insert({
        ...menu,
        options: []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add IVR option
   */
  async addIVROption(option: Omit<IVROption, 'id'>): Promise<IVROption> {
    const { data, error } = await supabase
      .from('ivr_options')
      .insert(option)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Process IVR input
   */
  async processIVRInput(menuId: string, digit: string): Promise<IVROption | null> {
    const { data: option } = await supabase
      .from('ivr_options')
      .select('*')
      .eq('menu_id', menuId)
      .eq('digit', digit)
      .single();

    return option;
  }

  // =====================
  // CALL TRANSFER
  // =====================

  /**
   * Transfer call to extension
   */
  async transferCall(callSid: string, destination: string): Promise<void> {
    // Twilio API call to transfer
    console.log(`Transferring call ${callSid} to ${destination}`);
    
    // Log the transfer
    await supabase
      .from('call_transfers')
      .insert({
        call_sid: callSid,
        destination,
        transferred_at: new Date().toISOString(),
        type: 'extension'
      });
  }

  /**
   * Warm transfer (introduce before transfer)
   */
  async warmTransfer(
    callSid: string, 
    destination: string, 
    introduction?: string
  ): Promise<void> {
    // Implementation would:
    // 1. Call destination
    // 2. Play introduction
    // 3. Connect calls
    console.log(`Warm transferring call ${callSid} to ${destination}`);
  }

  /**
   * Conference transfer (3-way call)
   */
  async conferenceTransfer(callSid: string, destination: string): Promise<string> {
    // Create conference and add both parties
    const conference = await this.createConference({
      name: `Transfer Conference ${Date.now()}`,
      workspace_id: 'current_workspace',
      host_user_id: 'system',
      max_participants: 3,
      status: 'active',
      is_recording: false
    });

    return conference.id;
  }

  // =====================
  // CALL SCRIPTING
  // =====================

  /**
   * Create call script
   */
  async createCallScript(script: Omit<CallScript, 'id'>): Promise<CallScript> {
    const { data, error } = await supabase
      .from('call_scripts')
      .insert(script)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Execute script step
   */
  async executeScriptStep(
    scriptId: string, 
    stepNumber: number, 
    userResponse?: string
  ): Promise<CallScriptStep | null> {
    const { data: step } = await supabase
      .from('call_script_steps')
      .select('*')
      .eq('script_id', scriptId)
      .eq('step_number', stepNumber)
      .single();

    if (!step) return null;

    // Process user response and determine next step
    if (userResponse && step.condition) {
      return await this.evaluateScriptCondition(step, userResponse);
    }

    return step;
  }

  /**
   * Evaluate script condition to determine next step
   */
  private async evaluateScriptCondition(
    step: CallScriptStep, 
    userResponse: string
  ): Promise<CallScriptStep | null> {
    // Simple condition evaluation (could be more sophisticated)
    let nextStepId = step.next_step_id;

    if (step.condition) {
      // Parse condition (e.g., "response === 'yes'")
      const conditionMet = this.evaluateCondition(step.condition, userResponse);
      if (!conditionMet && step.next_step_id) {
        // Find alternative path
        nextStepId = await this.findAlternativeStep(step.script_id, step.step_number);
      }
    }

    if (nextStepId) {
      const { data: nextStep } = await supabase
        .from('call_script_steps')
        .select('*')
        .eq('id', nextStepId)
        .single();

      return nextStep;
    }

    return null;
  }

  /**
   * Simple condition evaluator
   */
  private evaluateCondition(condition: string, userResponse: string): boolean {
    // This is a simplified version - in production you'd want a more robust evaluator
    const normalizedResponse = userResponse.toLowerCase().trim();
    
    switch (condition) {
      case 'yes':
        return ['yes', 'y', '1', 'true'].includes(normalizedResponse);
      case 'no':
        return ['no', 'n', '0', 'false'].includes(normalizedResponse);
      default:
        return normalizedResponse === condition.toLowerCase();
    }
  }

  /**
   * Find alternative script step
   */
  private async findAlternativeStep(scriptId: string, currentStep: number): Promise<string | null> {
    const { data: step } = await supabase
      .from('call_script_steps')
      .select('id')
      .eq('script_id', scriptId)
      .eq('step_number', currentStep + 1)
      .single();

    return step?.id || null;
  }

  // =====================
  // AGENT MANAGEMENT
  // =====================

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: CallAgent['status']): Promise<void> {
    await supabase
      .from('call_agents')
      .update({ status })
      .eq('id', agentId);
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(agentId: string, startDate: Date, endDate: Date): Promise<any> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // Get call statistics for agent
    const { data: callStats } = await supabase
      .rpc('get_agent_call_stats', {
        agent_id: agentId,
        start_date: start,
        end_date: end
      });

    return callStats;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueId: string): Promise<any> {
    const { data: stats } = await supabase
      .rpc('get_queue_stats', { queue_id: queueId });

    return stats;
  }
}

export const callManagementService = CallManagementService.getInstance();
