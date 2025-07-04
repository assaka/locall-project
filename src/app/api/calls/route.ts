import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateAPI, errorResponse, successResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const direction = searchParams.get('direction');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    try {
      // Build query with filters - using workspace_id instead of user_id for now
      let query = supabaseAdmin
        .from('calls')
        .select(`
          id,
          direction,
          from_number,
          to_number,
          status,
          duration_seconds,
          cost,
          started_at,
          ended_at,
          metadata,
          created_at,
          call_recordings(recording_url),
          call_transcripts(transcript_text)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (direction) {
        query = query.eq('direction', direction);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`from_number.ilike.%${search}%,to_number.ilike.%${search}%`);
      }

      const { data: calls, error } = await query;

      if (error) {
        console.error('Database error fetching calls:', error);
        return errorResponse('Failed to fetch calls from database', 500);
      }

      // Get total count for pagination
      let countQuery = supabaseAdmin
        .from('calls')
        .select('id', { count: 'exact', head: true });

      // Apply same filters to count query
      if (startDate) countQuery = countQuery.gte('created_at', startDate);
      if (endDate) countQuery = countQuery.lte('created_at', endDate);
      if (direction) countQuery = countQuery.eq('direction', direction);
      if (status) countQuery = countQuery.eq('status', status);
      if (search) countQuery = countQuery.or(`from_number.ilike.%${search}%,to_number.ilike.%${search}%`);

      const { count } = await countQuery;

      return NextResponse.json({
        success: true,
        data: calls || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });

    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return errorResponse('Database connection failed', 500);
    }

  } catch (error) {
    console.error('Error in calls GET:', error);
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

    const body = await request.json();
    
    // Validate required fields
    const { workspace_id, from_number, to_number, direction } = body;
    if (!workspace_id || !from_number || !to_number || !direction) {
      return errorResponse('Missing required fields: workspace_id, from_number, to_number, direction', 400);
    }

    try {
      // Insert new call into database
      const { data: call, error } = await supabaseAdmin
        .from('calls')
        .insert({
          workspace_id,
          from_number,
          to_number,
          direction,
          status: 'ringing',
          cost: 0,
          started_at: new Date().toISOString(),
          metadata: body.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating call:', error);
        return errorResponse('Failed to create call', 500);
      }

      return successResponse({
        message: 'Call created successfully',
        call
      });

    } catch (dbError) {
      console.error('Database error creating call:', dbError);
      return errorResponse('Database error', 500);
    }

  } catch (error) {
    console.error('Error in calls POST:', error);
    return errorResponse('Internal server error', 500);
  }
}
