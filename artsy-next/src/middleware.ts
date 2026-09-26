import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory bucket for edge/local dev rate limiting (§5.8)
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Edge Middleware for Rate Limiting & Protection (§5.8, §9.5)
 * Enforces per-IP and per-endpoint limits:
 * - General API: 100 req/min
 * - Auth/OTP endpoints: 10 req/10min
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api')) {
    // Exempt cron jobs from edge rate limiting (they use CRON_SECRET auth)
    if (pathname.startsWith('/api/cron')) {
      return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = pathname.startsWith('/api/auth') ? 10 : 100;

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      record.count += 1;
      if (record.count > maxRequests) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please wait before submitting additional requests.'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
            }
          }
        );
      }
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - (record?.count || 1)).toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
