import { NextRequest, NextResponse } from 'next/server';
import { vonageCallService } from '@/lib/vonage-call-service';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Vonage answer webhook called:', body);

    const { uuid, conversation_uuid } = body;

    // Get call details to determine what NCCO to return
    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .eq('vonage_uuid', uuid)
      .single();

    if (error || !call) {
      console.error('Call not found in database:', uuid);
      // Return a default NCCO
      return NextResponse.json([
        {
          action: 'talk',
          text: 'Hello, thank you for calling. Please hold while we connect you.'
        }
      ]);
    }

    // Generate NCCO based on call metadata
    const metadata = call.metadata || {};
    let ncco;

    if (metadata.message && metadata.record) {
      // Call with custom message and recording
      ncco = await vonageCallService.createSimpleCallNCCO(
        metadata.message,
        true
      );
    } else if (metadata.message) {
      // Call with custom message only
      ncco = await vonageCallService.createSimpleCallNCCO(
        metadata.message,
        false
      );
    } else if (metadata.ivr_flow) {
      // IVR flow
      ncco = await vonageCallService.createIVRFlowNCCO(
        metadata.welcome_message || 'Welcome to our service.',
        metadata.options || []
      );
    } else {
      // Default call flow
      ncco = await vonageCallService.createSimpleCallNCCO(
        'Hello, thank you for calling. How can we help you today?',
        true
      );
    }

    return NextResponse.json(ncco);

  } catch (error) {
    console.error('Error handling Vonage answer webhook:', error);
    
    // Return a fallback NCCO
    return NextResponse.json([
      {
        action: 'talk',
        text: 'We are experiencing technical difficulties. Please try again later.'
      }
    ]);
  }
}

export async function GET(request: NextRequest) {
  // Return a simple NCCO for testing
  return NextResponse.json([
    {
      action: 'talk',
      text: 'This is a test call. Thank you for calling.'
    }
  ]);
}
