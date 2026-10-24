const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../artsy-next/src/middleware.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update edge rate limits
const targetRate = `    if (isPasswordReset) {
      windowMs = 60 * 60 * 1000; // 1 hour
      maxRequests = 3; // 3 per hour on password reset
    } else if (isAuthRoute) {
      windowMs = 60 * 1000; // 1 minute
      maxRequests = process.env.NODE_ENV !== 'production' ? 200 : 15; // Safe threshold allowing normal login/verify without blocking
    }`;

const replaceRate = `    if (isPasswordReset) {
      windowMs = 60 * 60 * 1000; // 1 hour
      maxRequests = 3; // 3 per hour on password reset
    } else if (isAuthRoute) {
      windowMs = 60 * 1000; // 1 minute
      maxRequests = process.env.NODE_ENV !== 'production' ? 200 : 15; // Safe threshold allowing normal login/verify without blocking
    } else if (pathname === '/api/orders/create') {
      windowMs = 60 * 1000;
      maxRequests = 10; // Max 10 orders per minute
    } else if (pathname.startsWith('/api/storage/presign')) {
      windowMs = 60 * 1000;
      maxRequests = 20; // Max 20 file presign requests per minute
    } else if (pathname === '/api/leads') {
      windowMs = 60 * 1000;
      maxRequests = 5; // Max 5 leads per minute
    } else if (
      pathname === '/api/user/update-profile' ||
      pathname === '/api/user/complete-onboarding' ||
      pathname === '/api/freelancer/onboard'
    ) {
      windowMs = 60 * 1000;
      maxRequests = 15; // Max 15 profile updates per minute
    } else if (pathname === '/api/user/data-export' || pathname === '/api/financial/gstr1-export') {
      windowMs = 60 * 1000;
      maxRequests = 5; // Max 5 data exports per minute
    } else if (pathname.startsWith('/api/admin/')) {
      windowMs = 60 * 1000;
      maxRequests = 30; // Max 30 sensitive admin actions per minute
    }`;

content = content.replace(targetRate.replace(/\r?\n/g, '\r\n'), replaceRate.replace(/\r?\n/g, '\r\n'));

// 2. Update rateLimitKey
content = content.replace(
  `: \`ip_\${trustedEdgeIp}\`;`,
  `: \`ip_\${trustedEdgeIp}_\${pathname}\`;`
);

// 3. Update unauth redirect
const targetUnauth = `      if (!authCookie || !authCookie.value) {
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
      }`;

const replaceUnauth = `      if (!authCookie || !authCookie.value) {
        const loginUrl = new URL(pathname.startsWith('/admin') ? '/admin/login' : '/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // HMAC signature verification & role authorization check
      const user = await verifyAndParseAuthCookie(authCookie.value);
      if (!user) {
        // Invalid or unsigned/tampered cookie -> always reject and redirect to login
        const loginUrl = new URL(pathname.startsWith('/admin') ? '/admin/login' : '/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }`;

content = content.replace(targetUnauth.replace(/\r?\n/g, '\r\n'), replaceUnauth.replace(/\r?\n/g, '\r\n'));

// 4. Update role check and add state machine guards
const targetRole = `      if (!user.role || !route.allowedRoles.includes(user.role)) {
        // Unauthorized role -> redirect to login with error notice
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('unauthorized', 'true');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Valid session & authorized role
      return NextResponse.next();`;

const replaceRole = `      if (!user.role || !route.allowedRoles.includes(user.role)) {
        // Unauthorized role -> redirect to login with error notice
        const loginUrl = new URL(pathname.startsWith('/admin') ? '/admin/login' : '/auth/login', request.url);
        loginUrl.searchParams.set('unauthorized', 'true');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 4. State Machine Guards for Creators (§4.2)
      if (user.role === 'freelancer') {
        const isFreelancerApproved = user.onboarding_status === 'approved';
        const isFreelancerPending = user.onboarding_status === 'pending' || user.onboarding_status === 'pending_review';
        const isFreelancerRejected = user.onboarding_status === 'rejected';
        const isFreelancerIncomplete = !user.onboarded || !user.onboarding_status;

        if (isFreelancerIncomplete && pathname !== '/freelancer/onboarding') {
          return NextResponse.redirect(new URL('/freelancer/onboarding', request.url));
        }
        if (isFreelancerPending && pathname !== '/freelancer/pending-approval') {
          return NextResponse.redirect(new URL('/freelancer/pending-approval', request.url));
        }
        if (isFreelancerRejected && pathname !== '/freelancer/rejected') {
          return NextResponse.redirect(new URL('/freelancer/rejected', request.url));
        }
        if (isFreelancerApproved && (pathname === '/freelancer/onboarding' || pathname === '/freelancer/pending-approval')) {
          return NextResponse.redirect(new URL('/freelancer', request.url));
        }
      }

      // 5. State Machine Guards for Clients (§4.1)
      if (user.role === 'client') {
        if (!user.onboarded) {
          if (pathname !== '/client/profile' && pathname !== '/client/studio') {
            return NextResponse.redirect(new URL('/client/profile?setup=true', request.url));
          }
        }
      }

      // Valid session & authorized role
      return NextResponse.next();`;

content = content.replace(targetRole.replace(/\r?\n/g, '\r\n'), replaceRole.replace(/\r?\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated middleware.ts');

