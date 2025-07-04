import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';
import { supabase } from '@/app/utils/supabaseClient';

// Initialize Vonage client
const credentials = new Auth({
  apiKey: process.env.VONAGE_API_KEY!,
  apiSecret: process.env.VONAGE_API_SECRET!,
  applicationId: process.env.VONAGE_APPLICATION_ID!,
  privateKey: Buffer.from(process.env.VONAGE_PRIVATE_KEY!, 'base64').toString('utf-8')
});

const vonage = new Vonage(credentials);

export interface CallRequest {
  to: string;
  from: string;
  answer_url: string;
  event_url: string;
  workspace_id?: string;
  user_id?: string;
  form_id?: string;
  campaign_id?: string;
  metadata?: any;
}

export interface CallResponse {
  uuid: string;
  status: string;
  direction: string;
  conversation_uuid: string;
}

export interface NCCOAction {
  action: string;
  text?: string;
  bargeIn?: boolean;
  loop?: number;
  level?: number;
  endpoint?: any[];
  from?: string;
  limit?: number;
  timeOut?: number;
  beep?: boolean;
  format?: string;
  split?: string;
  channels?: number;
  endOnSilence?: number;
  endOnKey?: string;
  transcription?: any;
}

export class VonageCallService {
  
  async makeCall(callRequest: CallRequest): Promise<CallResponse> {
    try {
      console.log('Making call with Vonage:', callRequest);

      const response = await vonage.voice.createOutboundCall({
        to: [{ type: 'phone', number: callRequest.to }],
        from: { type: 'phone', number: callRequest.from },
        answerUrl: [callRequest.answer_url],
        eventUrl: [callRequest.event_url]
      });

      console.log('Vonage call response:', response);

      // Store call record in database
      const callRecord = {
        vonage_uuid: response.uuid,
        to_number: callRequest.to,
        from_number: callRequest.from,
        status: 'initiated',
        direction: 'outbound',
        workspace_id: callRequest.workspace_id,
        user_id: callRequest.user_id,
        form_id: callRequest.form_id,
        campaign_id: callRequest.campaign_id,
        metadata: callRequest.metadata,
        created_at: new Date().toISOString()
      };

      const { data: savedCall, error: saveError } = await supabase
        .from('calls')
        .insert(callRecord)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving call record:', saveError);
        // Don't throw here as the call was initiated successfully
      }

      return {
        uuid: response.uuid,
        status: response.status,
        direction: response.direction,
        conversation_uuid: response.conversationUUID
      };

    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  }

  async hangupCall(uuid: string): Promise<void> {
    try {
      await vonage.voice.hangupCall(uuid);

      // Update call record
      await supabase
        .from('calls')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('vonage_uuid', uuid);

    } catch (error) {
      console.error('Error hanging up call:', error);
      throw error;
    }
  }

  async getCallDetails(uuid: string) {
    try {
      const callDetails = await vonage.voice.getCall(uuid);
      
      // Update call record with latest details
      await supabase
        .from('calls')
        .update({
          status: callDetails.status,
          duration: callDetails.duration,
          start_time: callDetails.startTime,
          end_time: callDetails.endTime,
          rate: callDetails.rate,
          price: callDetails.price,
          network: callDetails.network
        })
        .eq('vonage_uuid', uuid);

      return callDetails;
    } catch (error) {
      console.error('Error getting call details:', error);
      throw error;
    }
  }

  generateNCCO(actions: NCCOAction[]): any[] {
    return actions.map(action => {
      const nccoAction: any = { action: action.action };
      
      if (action.text) nccoAction.text = action.text;
      if (action.bargeIn !== undefined) nccoAction.bargeIn = action.bargeIn;
      if (action.loop) nccoAction.loop = action.loop;
      if (action.level) nccoAction.level = action.level;
      if (action.endpoint) nccoAction.endpoint = action.endpoint;
      if (action.from) nccoAction.from = action.from;
      if (action.limit) nccoAction.limit = action.limit;
      if (action.timeOut) nccoAction.timeOut = action.timeOut;
      if (action.beep !== undefined) nccoAction.beep = action.beep;
      if (action.format) nccoAction.format = action.format;
      if (action.split) nccoAction.split = action.split;
      if (action.channels) nccoAction.channels = action.channels;
      if (action.endOnSilence) nccoAction.endOnSilence = action.endOnSilence;
      if (action.endOnKey) nccoAction.endOnKey = action.endOnKey;
      if (action.transcription) nccoAction.transcription = action.transcription;

      return nccoAction;
    });
  }

  async createSimpleCallNCCO(message: string, recordCall: boolean = false): Promise<any[]> {
    const actions: NCCOAction[] = [
      {
        action: 'talk',
        text: message,
        bargeIn: true
      }
    ];

    if (recordCall) {
      actions.push({
        action: 'record',
        format: 'mp3',
        split: 'conversation',
        channels: 2,
        endOnSilence: 3,
        endOnKey: '#',
        timeOut: 300,
        beep: true,
        transcription: {
          language: 'en-US',
          sentiment_analysis: true
        }
      });
    }

    return this.generateNCCO(actions);
  }

  async createIVRFlowNCCO(
    welcomeMessage: string,
    options: Array<{ key: string; action: string; destination?: string; message?: string }>
  ): Promise<any[]> {
    const actions: NCCOAction[] = [
      {
        action: 'talk',
        text: welcomeMessage,
        bargeIn: true
      }
    ];

    // Add input collection for IVR
    const inputs = options.map(option => ({
      dtmf: option.key,
      action: option.action,
      destination: option.destination,
      message: option.message
    }));

    actions.push({
      action: 'input',
      dtmf: {
        maxDigits: 1,
        timeOut: 10,
        submitOnHash: false
      },
      eventUrl: [`${process.env.BASE_URL}/api/vonage-webhook/input`]
    } as any);

    return this.generateNCCO(actions);
  }

  async handleCallEvent(eventData: any): Promise<void> {
    try {
      const { uuid, status, direction, conversation_uuid, timestamp } = eventData;

      // Update call record in database
      const updateData: any = {
        status,
        updated_at: new Date(timestamp || Date.now()).toISOString()
      };

      if (conversation_uuid) {
        updateData.conversation_uuid = conversation_uuid;
      }

      if (eventData.duration) {
        updateData.duration = parseInt(eventData.duration);
      }

      if (eventData.start_time) {
        updateData.start_time = new Date(eventData.start_time).toISOString();
      }

      if (eventData.end_time) {
        updateData.end_time = new Date(eventData.end_time).toISOString();
      }

      if (eventData.rate) {
        updateData.rate = parseFloat(eventData.rate);
      }

      if (eventData.price) {
        updateData.price = parseFloat(eventData.price);
      }

      if (eventData.network) {
        updateData.network = eventData.network;
      }

      await supabase
        .from('calls')
        .update(updateData)
        .eq('vonage_uuid', uuid);

      // Log call event for analytics
      await supabase
        .from('call_events')
        .insert({
          call_uuid: uuid,
          conversation_uuid,
          event_type: status,
          event_data: eventData,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error handling call event:', error);
      throw error;
    }
  }

  async sendSMS(to: string, from: string, text: string, workspaceId?: string): Promise<any> {
    try {
      const response = await vonage.sms.send({
        to,
        from,
        text
      });

      // Store SMS record
      const smsRecord = {
        to_number: to,
        from_number: from,
        message: text,
        status: response.messages[0].status,
        message_id: response.messages[0]['message-id'],
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('sms_messages')
        .insert(smsRecord);

      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async getAvailableNumbers(country: string = 'US'): Promise<any[]> {
    try {
      // Use REST API directly since SDK method might not be available
      const response = await fetch(
        `https://rest.nexmo.com/number/search?api_key=${process.env.VONAGE_API_KEY}&api_secret=${process.env.VONAGE_API_SECRET}&country=${country}&type=mobile-lvn&features=VOICE,SMS`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      return data.numbers || [];
    } catch (error) {
      console.error('Error getting available numbers:', error);
      throw error;
    }
  }

  async purchaseNumber(country: string, msisdn: string, workspaceId?: string): Promise<any> {
    try {
      // Use REST API directly
      const response = await fetch(
        `https://rest.nexmo.com/number/buy?api_key=${process.env.VONAGE_API_KEY}&api_secret=${process.env.VONAGE_API_SECRET}&country=${country}&msisdn=${msisdn}`,
        { method: 'POST' }
      );
      
      const data = await response.json();

      if (data['error-code'] === '200') {
        // Store purchased number
        const numberRecord = {
          msisdn,
          country,
          features: ['VOICE', 'SMS'],
          workspace_id: workspaceId,
          status: 'active',
          created_at: new Date().toISOString()
        };

        await supabase
          .from('phone_numbers')
          .insert(numberRecord);
      }

      return data;
    } catch (error) {
      console.error('Error purchasing number:', error);
      throw error;
    }
  }
}

export const vonageCallService = new VonageCallService();
