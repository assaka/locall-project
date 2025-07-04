import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      ruleType: searchParams.get('ruleType') || undefined,
      status: searchParams.get('status') || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };
    let query = supabase.from('routing_rules').select('*');
    if (filters.ruleType) query = query.eq('rule_type', filters.ruleType);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching routing rules:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch routing rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.ruleType) {
      return NextResponse.json({ success: false, error: 'Name and ruleType are required' }, { status: 400 });
    }
    const { data, error } = await supabase.from('routing_rules').insert({
      ...body,
      created_by: body.createdBy || 'api_user',
      rule_type: body.ruleType
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data, message: 'Routing rule created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating routing rule:', error);
    return NextResponse.json({ success: false, error: 'Failed to create routing rule' }, { status: 500 });
  }
}
