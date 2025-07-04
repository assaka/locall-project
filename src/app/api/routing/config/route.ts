import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch routing configuration for a workspace
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

    const { data: config, error } = await supabase
      .from('routing_configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no configuration exists, return default configuration
    if (!config) {
      const defaultConfig = {
        workspace_id: workspaceId,
        routing_strategy: 'round-robin',
        business_hours: {
          monday: { open: true, start: 9, end: 17 },
          tuesday: { open: true, start: 9, end: 17 },
          wednesday: { open: true, start: 9, end: 17 },
          thursday: { open: true, start: 9, end: 17 },
          friday: { open: true, start: 9, end: 17 },
          saturday: { open: false, start: 9, end: 17 },
          sunday: { open: false, start: 9, end: 17 }
        },
        after_hours_strategy: 'voicemail',
        no_agents_strategy: 'queue',
        geographic_routing_enabled: false,
        skills_routing_enabled: false,
        queue_settings: {
          max_wait_time: 600, // 10 minutes
          max_queue_size: 50,
          priority_enabled: true
        },
        failover_settings: {
          enabled: true,
          escalation_time: 30, // seconds
          backup_strategy: 'supervisor'
        },
        active: true
      };

      return NextResponse.json({
        success: true,
        configuration: defaultConfig,
        isDefault: true
      });
    }

    return NextResponse.json({
      success: true,
      configuration: config,
      isDefault: false
    });

  } catch (error) {
    console.error('Error fetching routing configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routing configuration' },
      { status: 500 }
    );
  }
}

// POST - Create or update routing configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      routingStrategy,
      businessHours,
      afterHoursStrategy,
      noAgentsStrategy,
      geographicRoutingEnabled,
      skillsRoutingEnabled,
      queueSettings,
      failoverSettings,
      holidays
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Validate routing strategy
    const validStrategies = ['round-robin', 'skills-based', 'geographic', 'random', 'least-used'];
    if (routingStrategy && !validStrategies.includes(routingStrategy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid routing strategy' },
        { status: 400 }
      );
    }

    // Validate business hours format
    if (businessHours) {
      const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of requiredDays) {
        if (!businessHours[day]) {
          return NextResponse.json(
            { success: false, error: `Missing business hours for ${day}` },
            { status: 400 }
          );
        }
      }
    }

    const configData = {
      workspace_id: workspaceId,
      routing_strategy: routingStrategy || 'round-robin',
      business_hours: businessHours || {
        monday: { open: true, start: 9, end: 17 },
        tuesday: { open: true, start: 9, end: 17 },
        wednesday: { open: true, start: 9, end: 17 },
        thursday: { open: true, start: 9, end: 17 },
        friday: { open: true, start: 9, end: 17 },
        saturday: { open: false, start: 9, end: 17 },
        sunday: { open: false, start: 9, end: 17 }
      },
      after_hours_strategy: afterHoursStrategy || 'voicemail',
      no_agents_strategy: noAgentsStrategy || 'queue',
      geographic_routing_enabled: geographicRoutingEnabled || false,
      skills_routing_enabled: skillsRoutingEnabled || false,
      queue_settings: queueSettings || {
        max_wait_time: 600,
        max_queue_size: 50,
        priority_enabled: true
      },
      failover_settings: failoverSettings || {
        enabled: true,
        escalation_time: 30,
        backup_strategy: 'supervisor'
      },
      holidays: holidays || [],
      active: true,
      updated_at: new Date().toISOString()
    };

    // Check if configuration already exists
    const { data: existingConfig } = await supabase
      .from('routing_configurations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .single();

    let result;
    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('routing_configurations')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('routing_configurations')
        .insert([{ ...configData, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      configuration: result
    });

  } catch (error) {
    console.error('Error saving routing configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save routing configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update specific routing settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, settings } = body;

    if (!workspaceId || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId or settings' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('routing_configurations')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      configuration: data
    });

  } catch (error) {
    console.error('Error updating routing settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update routing settings' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate routing configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('routing_configurations')
      .update({ 
        active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Routing configuration deactivated'
    });

  } catch (error) {
    console.error('Error deactivating routing configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate routing configuration' },
      { status: 500 }
    );
  }
}
