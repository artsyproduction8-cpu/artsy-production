import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAndParseAuthCookie, verifyAndParseAuthCookieSync, AUTH_COOKIE_NAME } from '@/lib/auth-cookie-edge';

// In-memory bucket for edge rate limiting
const requestCounterMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Server-Side Edge Middleware for:
 * 1. Rate Limiting & Protection with Trusted IP extraction (§5.8)
 * 2. Strict Role-Based Server Route Guards (SEC-02)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 0. Defense-in-depth: Immediate block for dotfiles, git, env, and sensitive config paths
  if (
    pathname.includes('/.') ||
    pathname.startsWith('/.env') ||
    pathname.startsWith('/.git') ||
    pathname.startsWith('/.aws') ||
    pathname.startsWith('/.vercel') ||
    pathname.startsWith('/.ssh')
  ) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  }
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const isSameHost = Boolean(host && (origin === `https://${host}` || origin === `http://${host}`));
  const isVercelDomain = Boolean(origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app')));

  const allowedOrigins = [
    'https://artsyproduction.in',
    'https://www.artsyproduction.in',
    'https://artsyproduction.com',
    'https://www.artsyproduction.com',
    'https://artsy-web.vercel.app',
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001']
      : []),
  ];

  const isOriginAllowed = Boolean(
    origin && (allowedOrigins.includes(origin) || isSameHost || isVercelDomain)
  );

  const applySecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (isOriginAllowed && origin) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Correlation-ID, X-Requested-With'
      );
    }
    return res;
  };

  if (pathname.startsWith('/api')) {
    // Check #6: Reject unauthorized cross-origin requests (Disallow wildcard *)
    if (origin && !isOriginAllowed) {
      const forbiddenResp = new NextResponse(
        JSON.stringify({
          error: 'Cross-Origin Request Blocked',
          message: 'This API origin is not permitted.',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
      return forbiddenResp;
    }

    // 1.3 Payload Limit Protection
    const contentLength = Number(request.headers.get('content-length') || 0);
    const isStorageRoute = pathname.startsWith('/api/storage');
    const maxPayloadBytes = isStorageRoute ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB storage, 2MB other

    if (contentLength > maxPayloadBytes) {
      const payloadResp = new NextResponse(
        JSON.stringify({
          error: 'Payload Too Large',
          message: `Request entity exceeds maximum permitted limit (${Math.round(maxPayloadBytes / (1024 * 1024))}MB).`,
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
      return applySecurityHeaders(payloadResp);
    }

    // Input & Query Sanitization: Block prototype pollution and PostgREST/SQL injection patterns in URL
    const rawSearch = request.nextUrl.search || '';
    if (
      rawSearch.includes('__proto__') ||
      rawSearch.includes('constructor.prototype') ||
      /(?:;\s*DROP\s+TABLE|UNION\s+ALL\s+SELECT|UNION\s+SELECT|\/\*!\d+)/i.test(rawSearch)
    ) {
      const badReqResp = new NextResponse(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Malformed or disallowed query parameter detected.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
      return applySecurityHeaders(badReqResp);
    }

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      const preflight = new NextResponse(null, { status: 204 });
      return applySecurityHeaders(preflight);
    }

    // Public / allowed route exemption:
    // Exempt /api/auth/session from edge rate limiting and blocking to allow seamless cookie sync & heartbeats
    if (pathname === '/api/auth/session') {
      const sessionResp = NextResponse.next();
      return applySecurityHeaders(sessionResp);
    }

    // Exempt cron jobs from edge rate limiting (they use CRON_SECRET auth)
    if (pathname.startsWith('/api/cron')) {
      const cronResp = NextResponse.next();
      return applySecurityHeaders(cronResp);
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

    // Check #5: Authentication endpoints rate limiting
    // Minimum: 5 attempts per minute per IP on login/signup/OTP, 3 per hour on password reset
    const isAuthRoute = pathname.startsWith('/api/auth');
    const isPasswordReset = pathname.includes('password-reset') || pathname.includes('reset-password');

    let windowMs = 60 * 1000; // 1 minute default
    let maxRequests = 100;

    if (isPasswordReset) {
      windowMs = 60 * 60 * 1000; // 1 hour
      maxRequests = 3; // 3 per hour on password reset
    } else if (isAuthRoute) {
      windowMs = 60 * 1000; // 1 minute
      maxRequests = process.env.NODE_ENV !== 'production' ? 200 : 15; // Safe threshold allowing normal login/verify without blocking
    }

    // Key calculation: For auth routes, track strictly per IP to prevent brute-force attacks
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
    const authUser = authCookie?.value ? verifyAndParseAuthCookieSync(authCookie.value) : null;
    const rateLimitKey = isAuthRoute
      ? `auth_${isPasswordReset ? 'pwd' : 'login'}_${trustedEdgeIp}`
      : authUser?.id
      ? `usr_${authUser.id}_${pathname}`
      : `ip_${trustedEdgeIp}`;

    const now = Date.now();
    const record = requestCounterMap.get(rateLimitKey);

    // Periodic cleanup of stale rate-limit keys
    if (requestCounterMap.size > 2000) {
      for (const [k, v] of requestCounterMap.entries()) {
        if (now > v.resetTime) requestCounterMap.delete(k);
      }
    }

    if (!record || now > record.resetTime) {
      requestCounterMap.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
    } else {
      record.count += 1;
      if (record.count > maxRequests) {
        const rateLimitResp = new NextResponse(
          JSON.stringify({
            error: 'Too Many Requests',
            message: isAuthRoute
              ? 'Too many authentication attempts. Please wait before retrying.'
              : 'Rate limit exceeded. Please wait before submitting additional requests.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
        return applySecurityHeaders(rateLimitResp);
      }
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      Math.max(0, maxRequests - (record?.count || 1)).toString()
    );
    return applySecurityHeaders(response);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Server-Side Page Route Guards (SEC-02)
  // ─────────────────────────────────────────────────────────────────────────────

  // Exempt public routes from any server route blocking or cookie manipulation
  const publicRoutes = ['/', '/creators', '/work', '/services', '/pricing', '/about', '/contact', '/book'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/')));
  if (isPublicRoute) {
    return NextResponse.next();
  }

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
      if (process.env.NODE_ENV !== 'production' && request.cookies.get('artsy_dev_preview')?.value === 'true') {
        return NextResponse.next();
      }

      const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

      if (!authCookie || !authCookie.value) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // HMAC signature verification & role authorization check
      const user = await verifyAndParseAuthCookie(authCookie.value);
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
    '/freelancer',
    '/.env:path*',
    '/.git:path*',
    '/.aws:path*',
    '/.well-known:path*',
  ]
};
