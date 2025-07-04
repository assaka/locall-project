import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface NCCOAction {
  action: string;
  text?: string;
  bargeIn?: boolean;
  voice?: string;
  language?: string;
  style?: number;
  level?: string;
  eventUrl?: string[];
  endpoint?: Array<{ type: string; number: string; }> | string;
  from?: string;
  timeOut?: number;
  maxDigits?: number;
  submitOnHash?: boolean;
  beep?: boolean;
  timeout?: number;
  endOnSilence?: number;
  format?: string;
  split?: string;
  channels?: number;
  [key: string]: any;
}

export interface IVRFlow {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  ncco_actions: NCCOAction[];
  business_hours: {
    enabled: boolean;
    timezone: string;
    schedules: {
      day: string;
      start: string;
      end: string;
      enabled: boolean;
    }[];
    holidays: string[];
  };
  departments: {
    [key: string]: {
      name: string;
      number: string;
      enabled: boolean;
      voicemail?: boolean;
    };
  };
  voicemail_config: {
    enabled: boolean;
    max_duration: number;
    email_notifications: string[];
    sms_notifications: string[];
  };
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CallRouting {
  id: string;
  workspace_id: string;
  phone_number: string;
  ivr_flow_id: string;
  priority: number;
  conditions?: {
    caller_id_patterns?: string[];
    time_based?: boolean;
    geographic?: boolean;
  };
  is_active: boolean;
}

export class NCCOService {
  
  /**
   * Generate NCCO for a call based on workspace configuration
   */
  static async generateNCCO(
    phoneNumber: string, 
    workspaceId: string, 
    callUuid?: string,
    from?: string
  ): Promise<NCCOAction[]> {
    try {
      // Get routing configuration
      const routing = await this.getCallRouting(phoneNumber, workspaceId);
      
      if (!routing) {
        return this.getDefaultNCCO(workspaceId);
      }

      // Get IVR flow
      const ivrFlow = await this.getIVRFlow(routing.ivr_flow_id);
      
      if (!ivrFlow || !ivrFlow.is_active) {
        return this.getDefaultNCCO(workspaceId);
      }

      // Check business hours
      const isBusinessHours = this.isWithinBusinessHours(ivrFlow.business_hours);
      
      // Process NCCO actions based on current conditions
      const processedNCCO = await this.processNCCOActions(
        ivrFlow.ncco_actions,
        {
          workspace_id: workspaceId,
          phone_number: phoneNumber,
          call_uuid: callUuid,
          from_number: from,
          is_business_hours: isBusinessHours,
          departments: ivrFlow.departments,
          voicemail_config: ivrFlow.voicemail_config
        }
      );

      // Log NCCO generation for debugging
      await this.logNCCOGeneration(workspaceId, phoneNumber, processedNCCO, callUuid);

      return processedNCCO;

    } catch (error) {
      console.error('Error generating NCCO:', error);
      return this.getDefaultNCCO(workspaceId);
    }
  }

  /**
   * Process dynamic NCCO actions with variable substitution
   */
  private static async processNCCOActions(
    actions: NCCOAction[],
    context: {
      workspace_id: string;
      phone_number: string;
      call_uuid?: string;
      from_number?: string;
      is_business_hours: boolean;
      departments: any;
      voicemail_config: any;
    }
  ): Promise<NCCOAction[]> {
    const processedActions: NCCOAction[] = [];

    for (const action of actions) {
      // Skip actions based on business hours
      if (action.condition) {
        if (action.condition === 'business_hours_only' && !context.is_business_hours) {
          continue;
        }
        if (action.condition === 'after_hours_only' && context.is_business_hours) {
          continue;
        }
      }

      const processedAction = { ...action };

      // Variable substitution
      if (processedAction.text) {
        processedAction.text = this.replaceVariables(processedAction.text, context);
      }

      // Dynamic endpoint generation for transfers
      if (processedAction.action === 'connect' && processedAction.department) {
        const department = context.departments[processedAction.department];
        if (department && department.enabled) {
          processedAction.endpoint = [{
            type: 'phone',
            number: department.number
          }];
          processedAction.from = context.phone_number;
          processedAction.timeOut = 30;
        } else {
          // Department unavailable, redirect to voicemail
          processedActions.push({
            action: 'talk',
            text: `Sorry, ${department?.name || 'that department'} is currently unavailable. Please leave a message after the beep.`,
            voice: 'Amy',
            language: 'en-US'
          });
          processedActions.push(this.getVoicemailAction(context));
          continue;
        }
      }

      // Dynamic event URLs
      if (processedAction.eventUrl) {
        processedAction.eventUrl = processedAction.eventUrl.map(url => 
          this.replaceVariables(url, context)
        );
      }

      processedActions.push(processedAction);
    }

    return processedActions;
  }

  /**
   * Replace variables in text and URLs
   */
  private static replaceVariables(text: string, context: any): string {
    return text
      .replace(/\{workspace_id\}/g, context.workspace_id)
      .replace(/\{phone_number\}/g, context.phone_number)
      .replace(/\{call_uuid\}/g, context.call_uuid || '')
      .replace(/\{from_number\}/g, context.from_number || '')
      .replace(/\{base_url\}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://app.locall.ai');
  }

  /**
   * Get call routing configuration
   */
  private static async getCallRouting(phoneNumber: string, workspaceId: string): Promise<CallRouting | null> {
    const { data, error } = await supabaseAdmin
      .from('call_routing')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching call routing:', error);
      return null;
    }

    return data;
  }

  /**
   * Get IVR flow configuration
   */
  private static async getIVRFlow(ivrFlowId: string): Promise<IVRFlow | null> {
    const { data, error } = await supabaseAdmin
      .from('ivr_flows')
      .select('*')
      .eq('id', ivrFlowId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching IVR flow:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if current time is within business hours
   */
  private static isWithinBusinessHours(businessHours: any): boolean {
    if (!businessHours.enabled) {
      return true; // Always business hours if not configured
    }

    const now = new Date();
    const timezone = businessHours.timezone || 'UTC';
    
    // Convert to business timezone
    const localTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    }).formatToParts(now);

    const currentDay = localTime.find(part => part.type === 'weekday')?.value.toLowerCase();
    const currentTime = `${localTime.find(part => part.type === 'hour')?.value}:${localTime.find(part => part.type === 'minute')?.value}`;

    // Check if today is a holiday
    const today = now.toISOString().split('T')[0];
    if (businessHours.holidays.includes(today)) {
      return false;
    }

    // Check schedule for current day
    const daySchedule = businessHours.schedules.find((schedule: any) => 
      schedule.day.toLowerCase() === currentDay && schedule.enabled
    );

    if (!daySchedule) {
      return false;
    }

    return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
  }

  /**
   * Get voicemail recording action
   */
  private static getVoicemailAction(context: any): NCCOAction {
    return {
      action: 'record',
      eventUrl: [`${process.env.NEXT_PUBLIC_APP_URL}/api/vonage-webhook/recording`],
      endOnSilence: 3,
      endOnKey: '#',
      timeOut: 60,
      beep: true,
      format: 'mp3',
      channels: 1
    };
  }

  /**
   * Get default NCCO for fallback
   */
  private static getDefaultNCCO(workspaceId: string): NCCOAction[] {
    return [
      {
        action: 'talk',
        text: 'Thank you for calling. Please hold while we connect you.',
        voice: 'Amy',
        language: 'en-US'
      },
      {
        action: 'connect',
        eventUrl: [`${process.env.NEXT_PUBLIC_APP_URL}/api/vonage-webhook/events`],
        timeOut: 30,
        endpoint: [{
          type: 'phone',
          number: process.env.DEFAULT_FORWARD_NUMBER || '+1234567890'
        }]
      }
    ];
  }

  /**
   * Create or update IVR flow
   */
  static async saveIVRFlow(ivrFlow: Partial<IVRFlow>): Promise<IVRFlow> {
    const now = new Date().toISOString();
    
    if (ivrFlow.id) {
      // Update existing flow
      const { data, error } = await supabaseAdmin
        .from('ivr_flows')
        .update({
          ...ivrFlow,
          updated_at: now,
          version: (ivrFlow.version || 1) + 1
        })
        .eq('id', ivrFlow.id)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate NCCO cache for this workspace
      await this.invalidateNCCOCache(ivrFlow.workspace_id!);
      
      return data;
    } else {
      // Create new flow
      const newFlow = {
        ...ivrFlow,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        version: 1
      };

      const { data, error } = await supabaseAdmin
        .from('ivr_flows')
        .insert(newFlow)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Handle DTMF input and return next NCCO
   */
  static async handleDTMF(
    callUuid: string,
    dtmf: string,
    workspaceId: string,
    currentStep?: string
  ): Promise<NCCOAction[]> {
    try {
      // Get call context
      const callContext = await this.getCallContext(callUuid);
      
      // Process DTMF input based on current IVR state
      const nextActions = await this.processDTMFInput(dtmf, callContext, workspaceId);
      
      // Update call state
      await this.updateCallState(callUuid, { 
        current_step: currentStep,
        last_dtmf: dtmf,
        updated_at: new Date().toISOString()
      });

      return nextActions;

    } catch (error) {
      console.error('Error handling DTMF:', error);
      return [
        {
          action: 'talk',
          text: 'Sorry, there was an error processing your selection. Please try again.',
          voice: 'Amy',
          language: 'en-US'
        }
      ];
    }
  }

  /**
   * Process DTMF input and determine next actions
   */
  private static async processDTMFInput(
    dtmf: string,
    callContext: any,
    workspaceId: string
  ): Promise<NCCOAction[]> {
    // This is where you'd implement your DTMF logic
    // For now, implementing a basic menu system
    
    switch (dtmf) {
      case '1': // Sales
        return [
          {
            action: 'talk',
            text: 'Connecting you to our sales team.',
            voice: 'Amy',
            language: 'en-US'
          },
          {
            action: 'connect',
            endpoint: [{
              type: 'phone',
              number: process.env.SALES_NUMBER || '+1234567890'
            }],
            timeOut: 30
          }
        ];
        
      case '2': // Support
        return [
          {
            action: 'talk',
            text: 'Connecting you to technical support.',
            voice: 'Amy',
            language: 'en-US'
          },
          {
            action: 'connect',
            endpoint: [{
              type: 'phone',
              number: process.env.SUPPORT_NUMBER || '+1234567891'
            }],
            timeOut: 30
          }
        ];
        
      case '3': // Billing
        return [
          {
            action: 'talk',
            text: 'Connecting you to our billing department.',
            voice: 'Amy',
            language: 'en-US'
          },
          {
            action: 'connect',
            endpoint: [{
              type: 'phone',
              number: process.env.BILLING_NUMBER || '+1234567892'
            }],
            timeOut: 30
          }
        ];
        
      case '9': // Voicemail
        return [
          {
            action: 'talk',
            text: 'Please leave your message after the beep.',
            voice: 'Amy',
            language: 'en-US'
          },
          this.getVoicemailAction({ workspace_id: workspaceId })
        ];
        
      default:
        return [
          {
            action: 'talk',
            text: 'Invalid selection. Please press 1 for sales, 2 for support, 3 for billing, or 9 to leave a voicemail.',
            voice: 'Amy',
            language: 'en-US'
          },
          {
            action: 'input',
            eventUrl: [`${process.env.NEXT_PUBLIC_APP_URL}/api/vonage-webhook/dtmf`],
            timeOut: 10,
            maxDigits: 1,
            submitOnHash: false
          }
        ];
    }
  }

  /**
   * Get call context from database
   */
  private static async getCallContext(callUuid: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('vonage_call_uuid', callUuid)
      .single();

    if (error) {
      console.error('Error fetching call context:', error);
      return null;
    }

    return data;
  }

  /**
   * Update call state in database
   */
  private static async updateCallState(callUuid: string, updates: any): Promise<void> {
    const { error } = await supabaseAdmin
      .from('calls')
      .update(updates)
      .eq('vonage_call_uuid', callUuid);

    if (error) {
      console.error('Error updating call state:', error);
    }
  }

  /**
   * Log NCCO generation for debugging and analytics
   */
  private static async logNCCOGeneration(
    workspaceId: string,
    phoneNumber: string,
    ncco: NCCOAction[],
    callUuid?: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('ncco_logs')
        .insert({
          workspace_id: workspaceId,
          phone_number: phoneNumber,
          call_uuid: callUuid,
          ncco_actions: ncco,
          generated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging NCCO generation:', error);
    }
  }

  /**
   * Invalidate NCCO cache for workspace
   */
  private static async invalidateNCCOCache(workspaceId: string): Promise<void> {
    // In a production environment, you might use Redis or another cache
    // For now, we'll just log the cache invalidation
    console.log(`NCCO cache invalidated for workspace: ${workspaceId}`);
  }

  /**
   * Validate NCCO actions
   */
  static validateNCCO(actions: NCCOAction[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(actions) || actions.length === 0) {
      errors.push('NCCO must be a non-empty array');
      return { valid: false, errors };
    }

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      if (!action.action) {
        errors.push(`Action ${i}: 'action' field is required`);
        continue;
      }

      // Validate specific action types
      switch (action.action) {
        case 'talk':
          if (!action.text) {
            errors.push(`Action ${i}: 'text' is required for talk action`);
          }
          break;
          
        case 'connect':
          if (!action.endpoint || !Array.isArray(action.endpoint) || action.endpoint.length === 0) {
            errors.push(`Action ${i}: 'endpoint' array is required for connect action`);
          }
          break;
          
        case 'input':
          if (!action.eventUrl || !Array.isArray(action.eventUrl) || action.eventUrl.length === 0) {
            errors.push(`Action ${i}: 'eventUrl' array is required for input action`);
          }
          break;
          
        case 'record':
          if (!action.eventUrl || !Array.isArray(action.eventUrl) || action.eventUrl.length === 0) {
            errors.push(`Action ${i}: 'eventUrl' array is required for record action`);
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
