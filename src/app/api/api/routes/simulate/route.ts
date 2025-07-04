import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const simulationData = {
      userCount: body.userCount || 100,
      timeRange: {
        start: body.timeRange?.start ? new Date(body.timeRange.start) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: body.timeRange?.end ? new Date(body.timeRange.end) : new Date()
      },
      locations: body.locations || ['US', 'UK', 'DE', 'JP', 'AU'],
      userTypes: body.userTypes || ['premium', 'standard', 'trial', 'enterprise']
    };

    // Fetch routing rules from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: rules, error } = await supabase.from('routing_rules').select('*');
    if (error) throw error;

    // Example: filter rules by location or userType if provided
    let filteredRules = rules;
    if (simulationData.locations && simulationData.locations.length > 0) {
      filteredRules = filteredRules.filter(rule =>
        !rule.location || simulationData.locations.includes(rule.location)
      );
    }
    if (simulationData.userTypes && simulationData.userTypes.length > 0) {
      filteredRules = filteredRules.filter(rule =>
        !rule.user_type || simulationData.userTypes.includes(rule.user_type)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        simulation: true,
        input: simulationData,
        rules: filteredRules
      }
    });
  } catch (error) {
    console.error('Error simulating routing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to simulate routing' 
      },
      { status: 500 }
    );
  }
}
