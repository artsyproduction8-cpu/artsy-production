import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAndParseAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

// In-memory bucket for edge rate limiting
const requestCounterMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Server-Side Edge Middleware for:
 * 1. Rate Limiting & Protection with Trusted IP extraction (§5.8)
 * 2. Strict Role-Based Server Route Guards (SEC-02)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. API Route Rate Limiting (Security Fix #8)
  // ─────────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api')) {
    // Exempt cron jobs from edge rate limiting (they use CRON_SECRET auth)
    if (pathname.startsWith('/api/cron')) {
      return NextResponse.next();
    }

    // Security Fix #8: Prevent X-Forwarded-For spoofing.
    // Use request.ip (Vercel Edge) -> x-real-ip -> rightmost IP appended by trusted edge proxy
    const xRealIp = request.headers.get('x-real-ip');
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const forwardedIps = forwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
    const trustedEdgeIp =
      (request as any).ip ||
      xRealIp ||
      (forwardedIps.length > 0 ? forwardedIps[forwardedIps.length - 1] : '127.0.0.1');

    // Use composite key: authenticated user ID if logged in, otherwise trusted IP
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
    const authUser = authCookie?.value ? verifyAndParseAuthCookie(authCookie.value) : null;
    const rateLimitKey = authUser?.id ? `usr_${authUser.id}_${pathname}` : `ip_${trustedEdgeIp}`;

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = pathname.startsWith('/api/auth') ? 30 : 100;

    const record = requestCounterMap.get(rateLimitKey);

    if (!record || now > record.resetTime) {
      requestCounterMap.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
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
    if (!pathname.startsWith('/api/auth')) {
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - (record?.count || 1)).toString());
    }
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Server-Side Page Route Guards (SEC-02)
  // ─────────────────────────────────────────────────────────────────────────────

  // Exempt public onboarding / login subroutes
  if (pathname === '/admin/login' || pathname === '/freelancer/onboarding') {
    return NextResponse.next();
  }

  // Role map for protected paths
  const protectedRoutes: Array<{ prefix: string; allowedRoles: string[] }> = [
    { prefix: '/admin', allowedRoles: ['admin', 'super_admin'] },
    { prefix: '/client-dashboard', allowedRoles: ['client', 'admin', 'super_admin'] },
    { prefix: '/client', allowedRoles: ['client', 'admin', 'super_admin'] },
    { prefix: '/freelancer', allowedRoles: ['freelancer', 'admin', 'super_admin'] },
  ];

  for (const route of protectedRoutes) {
    if (pathname === route.prefix || pathname.startsWith(route.prefix + '/')) {
      const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

      if (!authCookie || !authCookie.value) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // HMAC signature verification & role authorization check
      const user = verifyAndParseAuthCookie(authCookie.value);
      if (!user) {
        // Invalid or unsigned/tampered cookie -> always reject and redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!user.role || !route.allowedRoles.includes(user.role)) {
        // Unauthorized role -> redirect to login with error notice
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('unauthorized', 'true');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Valid session & authorized role
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/admin',
    '/client/:path*',
    '/client',
    '/client-dashboard/:path*',
    '/client-dashboard',
    '/freelancer/pending-approval',
    '/freelancer/rejected',
    '/freelancer/:path*',
    '/freelancer'
  ]
};
