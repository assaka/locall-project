import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  DEFAULT_IVR_CONFIG, 
  isWithinBusinessHours, 
  getCurrentMenu,
  generateMenuNCCO,
  generateOptionNCCO,
  generateInvalidInputNCCO,
  type IVRConfig 
} from '@/lib/ivr/config';

interface IVRResponse {
  ncco: any[];
  meta?: Record<string, any>;
}

async function getWorkspaceIVRConfig(phoneNumber: string): Promise<IVRConfig> {
  try {
    // Get workspace configuration from database
    const { data: numberData } = await supabaseAdmin
      .from('numbers')
      .select(`
        workspace_id,
        workspaces (
          id,
          ivr_config
        )
      `)
      .eq('phone_number', phoneNumber)
      .single();

    if (numberData?.workspaces && (numberData.workspaces as any).ivr_config) {
      // Merge with default config
      return { ...DEFAULT_IVR_CONFIG, ...(numberData.workspaces as any).ivr_config };
    }
  } catch (error) {
    console.error('Error fetching workspace IVR config:', error);
  }

  // Return default config if no custom config found
  return DEFAULT_IVR_CONFIG;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  
  if (!from || !to) {
    return NextResponse.json({ error: 'Missing required parameters: from, to' }, { status: 400 });
  }

  try {
    // Get IVR configuration for this workspace
    const ivrConfig = await getWorkspaceIVRConfig(to);
    
    if (!ivrConfig.enabled) {
      // IVR is disabled, return direct transfer
      const ncco = [
        {
          action: 'talk',
          text: 'Please hold while we connect you.',
          voiceName: ivrConfig.voice_settings.voice_name
        },
        {
          action: 'connect',
          endpoint: [
            {
              type: 'phone',
              number: ivrConfig.transfer_numbers.operator
            }
          ]
        }
      ];
      return NextResponse.json(ncco);
    }

    const businessHours = isWithinBusinessHours(ivrConfig);
    const currentMenu = getCurrentMenu(ivrConfig);
    
    // Log the incoming call
    await supabaseAdmin.from('ivr_call_logs').insert({
      phone_number: from,
      call_status: 'started',
      is_after_hours: !businessHours,
      direction: 'inbound'
    });

    const ncco = generateMenuNCCO(currentMenu, ivrConfig);
    
    const response: IVRResponse = {
      ncco,
      meta: {
        businessHours,
        menu: currentMenu.id,
        from,
        to,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response.ncco);
  } catch (error) {
    console.error('IVR Route Error:', error);
    
    // Fallback NCCO in case of errors
    const fallbackNCCO = [
      {
        action: 'talk',
        text: 'We are experiencing technical difficulties. Please try calling again later or visit our website.',
        voiceName: 'Amy'
      }
    ];

    return NextResponse.json(fallbackNCCO);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, dtmf, conversation_uuid } = body;
    
    if (!from) {
      return NextResponse.json({ error: 'Missing required parameter: from' }, { status: 400 });
    }

    // Get IVR configuration for this workspace
    const ivrConfig = await getWorkspaceIVRConfig(to || from);
    const businessHours = isWithinBusinessHours(ivrConfig);
    const currentMenu = getCurrentMenu(ivrConfig);

    // Log the DTMF input
    if (dtmf) {
      await supabaseAdmin.from('ivr_call_logs').insert({
        phone_number: from,
        call_status: 'dtmf_received',
        dtmf_input: dtmf,
        is_after_hours: !businessHours,
        conversation_uuid
      });
    }

    // Find the matching menu option
    const selectedOption = currentMenu.options.find(option => option.digit === dtmf);
    
    if (!selectedOption) {
      // Invalid input - return error message and retry
      const ncco = generateInvalidInputNCCO(currentMenu, ivrConfig);
      return NextResponse.json(ncco);
    }

    // Generate NCCO based on the selected option
    let ncco = generateOptionNCCO(selectedOption, ivrConfig);

    // Handle special actions
    if (selectedOption.action === 'appointment') {
      // Trigger SMS sending for appointment scheduling
      if (ivrConfig.features.appointment_scheduling_enabled) {
        fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/sms/send-calendly`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: from,
            calendly_link: process.env.CALENDLY_LINK || 'https://calendly.com/your-business',
            call_id: conversation_uuid
          })
        }).catch(error => console.error('Failed to send Calendly SMS:', error));
      }
    }

    return NextResponse.json(ncco);
  } catch (error) {
    console.error('IVR Webhook Error:', error);
    
    // Fallback NCCO
    const fallbackNCCO = [
      {
        action: 'talk',
        text: 'We are experiencing technical difficulties. Please try calling again later.',
        voiceName: 'Amy'
      }
    ];

    return NextResponse.json(fallbackNCCO);
  }
}
