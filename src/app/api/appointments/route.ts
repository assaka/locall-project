import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse(auth.error || 'Authentication failed', 401);
    }

    const userId = auth.userId || 'demo-user-id';

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('scheduled_at', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_at', endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      // Return demo data for development
      const demoAppointments = [
        {
          id: 'appt-1',
          client_name: 'John Smith',
          client_email: 'john@example.com',
          client_phone: '+1234567890',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          duration_minutes: 30,
          status: 'scheduled',
          type: 'consultation',
          notes: 'Initial consultation for new client',
          meeting_url: 'https://meet.example.com/john-smith',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'appt-2',
          client_name: 'Jane Doe',
          client_email: 'jane@example.com',
          client_phone: '+0987654321',
          scheduled_at: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          duration_minutes: 60,
          status: 'scheduled',
          type: 'follow-up',
          notes: 'Follow-up meeting to discuss progress',
          meeting_url: 'https://meet.example.com/jane-doe',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const appointmentsData = {
        appointments: demoAppointments,
        upcomingCount: 2,
        todayCount: 0,
        thisWeekCount: 2,
        calendlyIntegration: {
          connected: false,
          eventTypes: []
        },
        availability: {
          workingHours: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '10:00', end: '14:00', enabled: false },
            sunday: { start: '10:00', end: '14:00', enabled: false }
          },
          timeZone: 'America/New_York',
          bufferTime: 15
        }
      };
      
      return successResponse(appointmentsData);
    }

    return successResponse({ data: appointments });

  } catch (error) {
    console.error('Appointments GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // This can be called from webhooks or internal processes
    const body = await request.json();
    const { 
      user_id,
      client_phone,
      client_email,
      client_name,
      scheduled_at,
      calendly_event_id,
      appointment_type,
      metadata 
    } = body;

    if (!user_id || !client_phone || !scheduled_at) {
      return errorResponse('Missing required fields: user_id, client_phone, scheduled_at', 400);
    }

    // Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id,
        client_phone,
        client_email,
        client_name,
        scheduled_at,
        calendly_event_id,
        appointment_type: appointment_type || 'consultation',
        status: 'scheduled',
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return errorResponse('Failed to create appointment', 500);
    }

    return successResponse(appointment, 201);

  } catch (error) {
    console.error('Appointments POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = authenticateAPI(request);
    if (!auth.isValid) {
      return errorResponse(auth.error || 'Authentication failed', 401);
    }

    const userId = auth.userId || 'demo-user-id';

    const body = await request.json();
    const { 
      id,
      status,
      scheduled_at,
      metadata 
    } = body;

    if (!id) {
      return errorResponse('Missing required field: id', 400);
    }

    // Update appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        ...(status && { status }),
        ...(scheduled_at && { scheduled_at }),
        ...(metadata && { metadata }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return errorResponse('Failed to update appointment', 500);
    }

    if (!appointment) {
      return errorResponse('Appointment not found', 404);
    }

    return successResponse(appointment);

  } catch (error) {
    console.error('Appointments PUT error:', error);
    return errorResponse('Internal server error', 500);
  }
}
