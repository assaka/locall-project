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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('webform_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Error fetching webform submissions:', error);
      return errorResponse('Failed to fetch webform submissions', 500);
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('webform_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return successResponse({
      data: submissions,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Webforms GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint handles public form submissions
    // No authentication required for submissions
    
    const body = await request.json();
    const { 
      user_id,
      form_data, 
      source_url, 
      referrer, 
      utm_params,
      ip_address,
      user_agent 
    } = body;

    if (!user_id || !form_data) {
      return errorResponse('Missing required fields: user_id, form_data', 400);
    }

    // Basic spam protection
    const spamScore = calculateSpamScore(form_data, user_agent, ip_address);
    const isSpam = spamScore > 0.7;

    // Create webform submission
    const { data: submission, error } = await supabaseAdmin
      .from('webform_submissions')
      .insert({
        user_id,
        form_data,
        source_url,
        referrer,
        utm_params: utm_params || {},
        ip_address,
        user_agent,
        spam_score: spamScore,
        is_spam: isSpam,
        status: isSpam ? 'spam' : 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webform submission:', error);
      return errorResponse('Failed to create webform submission', 500);
    }

    return successResponse({ 
      id: submission.id, 
      status: submission.status,
      message: 'Form submitted successfully' 
    }, 201);

  } catch (error) {
    console.error('Webforms POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}

function calculateSpamScore(formData: any, userAgent?: string, ipAddress?: string): number {
  let score = 0;

  // Check for suspicious patterns in form data
  const text = JSON.stringify(formData).toLowerCase();
  
  // Spam keywords
  const spamKeywords = ['bitcoin', 'crypto', 'investment', 'loan', 'casino', 'viagra'];
  spamKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 0.3;
    }
  });

  // Check for excessive links
  const linkCount = (text.match(/http/g) || []).length;
  if (linkCount > 2) {
    score += 0.4;
  }

  // Check for suspicious user agent
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
    score += 0.2;
  }

  // Check for suspicious patterns in email
  if (formData.email) {
    const email = formData.email.toLowerCase();
    if (email.includes('temp') || email.includes('fake') || email.includes('test')) {
      score += 0.3;
    }
  }

  return Math.min(score, 1.0);
}
