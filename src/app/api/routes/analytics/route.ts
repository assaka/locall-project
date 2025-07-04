import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    // Debug: Log which key is being used
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase env vars:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing'
      });
      return NextResponse.json({ success: false, error: 'Supabase environment variables are missing.' }, { status: 500 });
    }

    // Direct Supabase query for analytics
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    let query = supabase.from('routing_analytics').select('*');
    if (routeId) query = query.eq('route_id', routeId);
    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching routing analytics:', error);
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      message = JSON.stringify(error);
    } else {
      message = String(error);
    }
    return NextResponse.json(
      { 
        success: false, 
        error: message
      },
      { status: 500 }
    );
  }
}
