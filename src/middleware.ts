import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting (for development - use Redis/Upstash in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  auth: { requests: 5, window: 60 * 1000 }, // 5 requests per minute
  webhook: { requests: 1000, window: 60 * 1000 }, // 1000 requests per minute
  analytics: { requests: 50, window: 60 * 1000 }, // 50 requests per minute
  integration: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
};

function checkRateLimit(key: string, limit: { requests: number; window: number }): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Reset the rate limit window
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.window });
    return { success: true, remaining: limit.requests - 1, resetTime: now + limit.window };
  }

  if (entry.count >= limit.requests) {
    // Rate limit exceeded
    return { success: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Increment the count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return { success: true, remaining: limit.requests - entry.count, resetTime: entry.resetTime };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and internal Next.js routes
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/public/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get IP address from headers (for Vercel/Netlify deployment compatibility)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 
            '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  
  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP for enhanced security
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vutziwevapdxirtecelj.supabase.co';
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com ${supabaseUrl}; frame-src https://js.stripe.com;`
  );

  // Apply rate limiting based on endpoint
  let limit = RATE_LIMITS.default;
  
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/login')) {
    limit = RATE_LIMITS.auth;
  } else if (pathname.startsWith('/api/webhooks')) {
    limit = RATE_LIMITS.webhook;
  } else if (pathname.startsWith('/api/analytics')) {
    limit = RATE_LIMITS.analytics;
  } else if (pathname.startsWith('/api/integration') || pathname.startsWith('/api/oauth')) {
    limit = RATE_LIMITS.integration;
  }

  // Check rate limit
  const { success, remaining, resetTime } = checkRateLimit(`${ip}:${pathname}`, limit);
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.requests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

  if (!success) {
    // Log rate limit violation
    console.warn(`Rate limit exceeded for IP: ${ip}, Path: ${pathname}, User-Agent: ${userAgent}`);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        error_code: 'RATE_LIMIT_ERROR',
        retry_after: Math.round((resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.round((resetTime - Date.now()) / 1000).toString(),
          ...Object.fromEntries(response.headers.entries()),
        },
      }
    );
  }

  // Brute force protection for sensitive endpoints
  if (pathname.includes('/api/auth') || pathname.includes('/login')) {
    const bruteForceResult = checkRateLimit(`brute_force:${ip}`, { requests: 10, window: 60 * 1000 });
    
    if (!bruteForceResult.success) {
      console.error(`Potential brute force attack from IP: ${ip}, Path: ${pathname}`);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many authentication attempts',
          error_code: 'BRUTE_FORCE_PROTECTION',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(response.headers.entries()),
          },
        }
      );
    }
  }

  // Suspicious user agent detection
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /hack/i,
    /attack/i,
    /^python/i,
    /^curl/i,
    /^wget/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && pathname.startsWith('/api/')) {
    // Apply stricter rate limiting for suspicious user agents
    const suspiciousResult = checkRateLimit(`suspicious:${ip}`, { requests: 5, window: 60 * 1000 });
    
    if (!suspiciousResult.success) {
      console.warn(`Suspicious user agent blocked: ${userAgent} from IP: ${ip}`);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Access denied',
          error_code: 'SUSPICIOUS_ACTIVITY',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(response.headers.entries()),
          },
        }
      );
    }
  }

  // CORS handling for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-User-Id'
    );

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health checks should not be rate limited)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
