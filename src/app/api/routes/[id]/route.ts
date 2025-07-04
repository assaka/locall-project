import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const routeId = context.params.id;
    const { data: rule, error } = await supabase.from('routing_rules').select('*').eq('route_id', routeId).maybeSingle();
    if (error) throw error;
    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Routing rule not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error fetching routing rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routing rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const routeId = context.params.id;
    const body = await request.json();
    const { data: updatedRule, error } = await supabase.from('routing_rules').update(body).eq('route_id', routeId).select().single();
    if (error) throw error;
    if (!updatedRule) {
      return NextResponse.json(
        { success: false, error: 'Routing rule not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updatedRule, message: 'Routing rule updated successfully' });
  } catch (error) {
    console.error('Error updating routing rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update routing rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const routeId = context.params.id;
    const { error } = await supabase.from('routing_rules').delete().eq('route_id', routeId);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Routing rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting routing rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete routing rule' },
      { status: 500 }
    );
  }
}
