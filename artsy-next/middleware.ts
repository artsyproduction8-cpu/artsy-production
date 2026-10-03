import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAndParseAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

// In-memory bucket for edge/local dev rate limiting (§5.8)
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Server-Side Edge Middleware for:
 * 1. Rate Limiting & Protection (§5.8, §9.5)
 * 2. Strict Role-Based Server Route Guards (SEC-02)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. API Route Rate Limiting
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Server-Side Page Route Guards (SEC-02)
  // ─────────────────────────────────────────────────────────────────────────────

  // Exempt public onboarding / login subroutes
  if (pathname === '/admin/login' || pathname === '/freelancer/onboarding') {
    return NextResponse.next();
  }

  // Role map for protected paths
  const protectedRoutes: Array<{ prefix: string; allowedRoles: string[] }> = [
    { prefix: '/admin', allowedRoles: ['admin'] },
    { prefix: '/client-dashboard', allowedRoles: ['client', 'admin'] },
    { prefix: '/client', allowedRoles: ['client', 'admin'] },
    { prefix: '/freelancer', allowedRoles: ['freelancer', 'admin'] },
  ];

  for (const route of protectedRoutes) {
    if (pathname === route.prefix || pathname.startsWith(route.prefix + '/')) {
      const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

      // Unauthenticated -> in dev mode allow seamless preview, in prod redirect to login
      if (!authCookie || !authCookie.value) {
        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.next();
        }
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // HMAC signature verification & role authorization check
      const user = verifyAndParseAuthCookie(authCookie.value);
      if (!user) {
        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.next();
        }
        // Invalid or tampered cookie -> treat as unauthenticated
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!user.role || !route.allowedRoles.includes(user.role)) {
        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.next();
        }
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