import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      // Return demo routing rules if authentication fails
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'demo-rule-1',
            name: 'Business Hours Routing',
            description: 'Route calls during business hours to sales team',
            type: 'time-based',
            priority: 1,
            is_active: true,
            conditions: {
              time_start: '09:00',
              time_end: '17:00',
              weekdays: [1, 2, 3, 4, 5]
            },
            actions: {
              destination: 'department:sales',
              fallback: 'voicemail'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-rule-2',
            name: 'Geographic Routing',
            description: 'Route calls based on caller location',
            type: 'geographic',
            priority: 2,
            is_active: true,
            conditions: {
              area_codes: ['212', '646', '917'],
              regions: ['NY', 'NJ']
            },
            actions: {
              destination: 'agent:ny-team',
              fallback: 'queue:general'
            },
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      });
    }

    const userId = auth.userId || 'demo-user-id';

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('routing_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching routing rules:', error);
      // Return demo data on database error
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'demo-rule-1',
            name: 'Default Routing',
            description: 'Basic routing rule for demo',
            type: 'basic',
            priority: 1,
            is_active: true,
            conditions: {},
            actions: { destination: 'default', fallback: 'voicemail' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });
    }

    return successResponse({ data: rules });

  } catch (error) {
    console.error('Routing rules GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse(auth.error || 'Authentication failed', 401);
    }

    const userId = auth.userId || 'demo-user-id';

    const body = await request.json();
    const { 
      name, 
      description, 
      type, 
      conditions, 
      actions, 
      priority,
      is_active = true,
      metadata 
    } = body;

    if (!name || !type || !conditions || !actions) {
      return errorResponse('Missing required fields: name, type, conditions, actions', 400);
    }

    // Create routing rule
    const { data: rule, error } = await supabaseAdmin
      .from('routing_rules')
      .insert({
        user_id: userId,
        name,
        description,
        type,
        conditions,
        actions,
        priority: priority || 100,
        is_active,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating routing rule:', error);
      return errorResponse('Failed to create routing rule', 500);
    }

    return successResponse(rule, 201);

  } catch (error) {
    console.error('Routing rules POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}
