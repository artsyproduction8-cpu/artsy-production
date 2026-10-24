const fs = require('fs');
const path = require('path');

function patchFile(relPath, transformFn) {
  const fullPath = path.join(__dirname, '..', 'artsy-next', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error('File not found:', fullPath);
    process.exit(1);
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const isCrlf = original.includes('\r\n');
  const normalized = original.replace(/\r\n/g, '\n');
  const updated = transformFn(normalized);
  if (updated === normalized) {
    console.warn(`[NO CHANGE] in ${relPath}`);
  } else {
    const finalContent = isCrlf ? updated.replace(/\n/g, '\r\n') : updated;
    fs.writeFileSync(fullPath, finalContent, 'utf8');
    console.log(`[SUCCESS] Patched ${relPath}`);
  }
}

// 1. Patch src/lib/auth-cookie.ts
patchFile('src/lib/auth-cookie.ts', (content) => {
  return content.replace(
    /onboarded:\s*payload\.onboarded\s*!==\s*false,/,
    `onboarded: payload.onboarded !== undefined ? Boolean(payload.onboarded) : false,\n    onboarding_status: payload.onboarding_status || null,\n    tracking_id: payload.tracking_id || null,`
  );
});

// 2. Patch src/app/api/auth/otp/route.ts
patchFile('src/app/api/auth/otp/route.ts', (content) => {
  let c = content;
  // Creator profile status resolution
  const oldProfileCheck = `              const hasSubmittedApplication = Boolean(
                profile.onboarding_status === 'pending_review' ||
                profile.tracking_id ||
                profile.portfolio_url ||
                profile.public_specialty
              );

              if (profile.approval_status === 'approved' || profile.onboarding_status === 'approved') {
                onboarding_status = 'approved';
              } else if (profile.approval_status === 'rejected' || profile.onboarding_status === 'rejected') {
                onboarding_status = 'rejected';
                rejection_reason = profile.rejection_reason || null;
                rejected_at = profile.rejected_at || profile.updated_at || new Date().toISOString();
              } else if (hasSubmittedApplication && (profile.approval_status === 'pending' || profile.onboarding_status === 'pending_review')) {
                onboarding_status = 'pending_review';
              } else {
                // Application form has not been submitted yet
                onboarding_status = null;
              }`;

  const newProfileCheck = `              if (profile.approval_status === 'approved' || profile.onboarding_status === 'approved') {
                onboarding_status = 'approved';
              } else if (profile.approval_status === 'rejected' || profile.onboarding_status === 'rejected') {
                onboarding_status = 'rejected';
                rejection_reason = profile.rejection_reason || null;
                rejected_at = profile.rejected_at || profile.updated_at || new Date().toISOString();
              } else if (profile.onboarding_status === 'pending_review' || (profile.onboarding_status === 'pending' && profile.tracking_id)) {
                onboarding_status = 'pending_review';
              } else {
                // Application form has not been submitted yet
                onboarding_status = null;
              }`;

  if (c.includes(oldProfileCheck)) {
    c = c.replace(oldProfileCheck, newProfileCheck);
  }

  // Cookie generation in OTP verify
  const oldCookie = `      // Issue minimal JWT auth cookie containing ONLY id, role, token_version, and exp
      const signedCookie = signAuthCookieValue({
        id: String(resolvedUser.id),
        role: finalRole,
        token_version: Number(resolvedUser.token_version && Number(resolvedUser.token_version) >= 2 ? resolvedUser.token_version : 2),
      });`;

  const newCookie = `      // Issue HMAC auth cookie containing id, role, token_version, and state machine fields
      const signedCookie = signAuthCookieValue({
        id: String(resolvedUser.id),
        role: finalRole,
        token_version: Number(resolvedUser.token_version && Number(resolvedUser.token_version) >= 2 ? resolvedUser.token_version : 2),
        onboarded: Boolean(userPayload.onboarded),
        onboarding_status: userPayload.onboarding_status || null,
        tracking_id: userPayload.tracking_id || null,
        email: userPayload.email,
        phone: userPayload.phone,
        full_name: userPayload.full_name,
      });`;

  if (c.includes(oldCookie)) {
    c = c.replace(oldCookie, newCookie);
  }

  return c;
});

// 3. Patch src/app/api/auth/session/route.ts
patchFile('src/app/api/auth/session/route.ts', (content) => {
  let c = content;
  // Session cookie issue
  const oldSessionCookie = `    const cookieValue = signAuthCookieValue({
      id: user.id || (resolvedRole === 'super_admin' ? 'usr-superadmin-000' : 'usr-client-001'),
      role: resolvedRole,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      display_name: user.display_name,
      onboarded: user.onboarded !== false,
      token_version: effectiveTokenVersion,
    });`;

  const newSessionCookie = `    const cookieValue = signAuthCookieValue({
      id: user.id || (resolvedRole === 'super_admin' ? 'usr-superadmin-000' : 'usr-client-001'),
      role: resolvedRole,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      display_name: user.display_name,
      onboarded: Boolean(user.onboarded ?? dbUser?.onboarded),
      onboarding_status: user.onboarding_status || null,
      tracking_id: user.tracking_id || null,
      token_version: effectiveTokenVersion,
    });`;

  if (c.includes(oldSessionCookie)) {
    c = c.replace(oldSessionCookie, newSessionCookie);
  }

  // Session creator profile resolution
  const oldCreatorRes = `            const hasSubmitted = Boolean(
              creatorProfile.onboarding_status === 'pending_review' ||
              creatorProfile.tracking_id ||
              creatorProfile.portfolio_url ||
              creatorProfile.public_specialty
            );
            if (creatorProfile.onboarding_status === 'approved' || creatorProfile.approval_status === 'approved') {
              resolvedUser.onboarding_status = 'approved';
            } else if (creatorProfile.onboarding_status === 'rejected' || creatorProfile.approval_status === 'rejected') {
              resolvedUser.onboarding_status = 'rejected';
            } else if (hasSubmitted && (creatorProfile.onboarding_status === 'pending_review' || creatorProfile.approval_status === 'pending')) {
              resolvedUser.onboarding_status = 'pending_review';
            } else {
              resolvedUser.onboarding_status = null;
            }`;

  const newCreatorRes = `            if (creatorProfile.onboarding_status === 'approved' || creatorProfile.approval_status === 'approved') {
              resolvedUser.onboarding_status = 'approved';
            } else if (creatorProfile.onboarding_status === 'rejected' || creatorProfile.approval_status === 'rejected') {
              resolvedUser.onboarding_status = 'rejected';
            } else if (creatorProfile.onboarding_status === 'pending_review' || (creatorProfile.onboarding_status === 'pending' && creatorProfile.tracking_id)) {
              resolvedUser.onboarding_status = 'pending_review';
            } else {
              resolvedUser.onboarding_status = null;
            }`;

  if (c.includes(oldCreatorRes)) {
    c = c.replace(oldCreatorRes, newCreatorRes);
  }

  return c;
});

// 4. Patch src/app/api/user/me/route.ts
patchFile('src/app/api/user/me/route.ts', (content) => {
  let c = content;
  // Replace the cookie deletion block
  const oldMeBlock = `        if (!error && data) {
          dbUser = data;
        } else if (!error && !data && isUuid && !authUser.id.startsWith('usr-')) {
          const isPrivilegedAdmin = isSuperAdminAccount(authUser) || authUser.role === 'admin' || authUser.role === 'super_admin';
          if (isPrivilegedAdmin) {
            dbUser = {
              id: authUser.id,
              role: authUser.role || 'super_admin',
              status: 'active',
              full_name: authUser.full_name || 'Studio Owner (Super Admin)',
              email: authUser.email || CANONICAL_SUPER_ADMIN_EMAIL,
              phone: authUser.phone || \`+91\${CANONICAL_SUPER_ADMIN_PHONE}\`,
            };
          } else {
            // Account was purged from database. Cleanly invalidate cookie and session.
            const res = NextResponse.json(
              { authenticated: false, user: null, error: 'User account not found' },
              {
                status: 401,
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
              }
            );
            res.cookies.delete('artsy_auth_token');
            return res;
          }
        }`;

  const newMeBlock = `        const isPrivilegedAdmin = isSuperAdminAccount(authUser) || authUser.role === 'admin' || authUser.role === 'super_admin';
        if (!error && data) {
          dbUser = data;
        } else if (isPrivilegedAdmin) {
          dbUser = {
            id: authUser.id,
            role: authUser.role || 'super_admin',
            status: 'active',
            full_name: authUser.full_name || 'Studio Owner (Super Admin)',
            email: authUser.email || CANONICAL_SUPER_ADMIN_EMAIL,
            phone: authUser.phone || \`+91\${CANONICAL_SUPER_ADMIN_PHONE}\`,
          };
        }`;

  if (c.includes(oldMeBlock)) {
    c = c.replace(oldMeBlock, newMeBlock);
  }

  // Creator status resolution in user/me
  const oldMeCreator = `            const hasSubmitted = Boolean(
              creatorProfile.onboarding_status === 'pending_review' ||
              creatorProfile.tracking_id ||
              creatorProfile.portfolio_url ||
              creatorProfile.public_specialty
            );

            if (creatorProfile.approval_status === 'approved' || creatorProfile.onboarding_status === 'approved') {
              resolvedStatus = 'approved';
            } else if (creatorProfile.approval_status === 'rejected' || creatorProfile.onboarding_status === 'rejected') {
              resolvedStatus = 'rejected';
            } else if (hasSubmitted && (creatorProfile.approval_status === 'pending' || creatorProfile.onboarding_status === 'pending_review')) {
              resolvedStatus = 'pending_review';
            } else {
              resolvedStatus = null;
            }`;

  const newMeCreator = `            if (creatorProfile.approval_status === 'approved' || creatorProfile.onboarding_status === 'approved') {
              resolvedStatus = 'approved';
            } else if (creatorProfile.approval_status === 'rejected' || creatorProfile.onboarding_status === 'rejected') {
              resolvedStatus = 'rejected';
            } else if (creatorProfile.onboarding_status === 'pending_review' || (creatorProfile.onboarding_status === 'pending' && creatorProfile.tracking_id)) {
              resolvedStatus = 'pending_review';
            } else {
              resolvedStatus = null;
            }`;

  if (c.includes(oldMeCreator)) {
    c = c.replace(oldMeCreator, newMeCreator);
  }

  return c;
});

// 5. Patch lib/auth.ts (useAuth 401 preservation)
patchFile('lib/auth.ts', (content) => {
  let c = content;
  const oldUseAuth401 = `        if (res.status === 401) {
          // Explicitly 401 Unauthorized from server -> only then clear local session
          if (isMounted) {
            setUser(null);
          }
          try {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
          return;
        }`;

  const newUseAuth401 = `        if (res.status === 401) {
          const active = getCurrentUser();
          if (active && (active.role === 'admin' || active.role === 'super_admin' || isSuperAdminAccount(active))) {
            console.warn('[useAuth] Preserving admin session despite 401 from /api/user/me');
            return;
          }
          if (isMounted) {
            setUser(null);
          }
          try {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
          return;
        }`;

  if (c.includes(oldUseAuth401)) {
    c = c.replace(oldUseAuth401, newUseAuth401);
  }

  return c;
});

// 6. Patch src/app/auth/login/page.tsx
patchFile('src/app/auth/login/page.tsx', (content) => {
  return content.replace(
    /if\s*\(\s*data\.user\?\.onboarded\s*===\s*false\s*\)/g,
    'if (!data.user?.onboarded)'
  );
});

// 7. Patch src/app/api/freelancer/onboard/route.ts
patchFile('src/app/api/freelancer/onboard/route.ts', (content) => {
  let c = content;
  // Ensure imports
  if (!c.includes("import { checkRateLimit, getClientIp }")) {
    c = c.replace(
      "import { formatPublicCreatorName } from '@/lib/masking';",
      "import { formatPublicCreatorName } from '@/lib/masking';\nimport { checkRateLimit, getClientIp } from '@/lib/rateLimit';\nimport { signAuthCookieValue, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';"
    );
  }

  // Add rate limiting
  const rateLimitTarget = "  if (!authUser) {\n    return NextResponse.json({ error: 'Unauthorized: Please log in before submitting creator application.' }, { status: 401 });\n  }";
  const rateLimitAdd = `  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Please log in before submitting creator application.' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rateKey = authUser ? \`freelancer_onboard_\${authUser.id}\` : \`freelancer_onboard_ip_\${ip}\`;
  const limit = await checkRateLimit(rateKey, 'api', 10, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: \`Too many submissions. Please wait \${Math.ceil(limit.resetSeconds / 60)} minutes.\` },
      { status: 429 }
    );
  }`;

  if (c.includes(rateLimitTarget) && !c.includes('freelancer_onboard_')) {
    c = c.replace(rateLimitTarget, rateLimitAdd);
  }

  // Update return response to include signed cookie with pending_review status
  const oldReturn = `    return NextResponse.json({
      success: true,
      trackingId,
      userId: candidateUserId,
      status: 'pending_review',
      message: 'Creator application submitted to Studio Curation successfully.',
    });`;

  const newReturn = `    const response = NextResponse.json({
      success: true,
      trackingId,
      userId: candidateUserId,
      status: 'pending_review',
      message: 'Creator application submitted to Studio Curation successfully.',
    });

    const signedCookie = signAuthCookieValue({
      id: candidateUserId,
      role: 'freelancer',
      token_version: Number(authUser.token_version || 2),
      onboarded: true,
      onboarding_status: 'pending_review',
      tracking_id: trackingId,
      email: candidateEmail,
      phone: candidatePhone,
      full_name: publicDisplayName || authUser.full_name,
    });

    response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;`;

  if (c.includes(oldReturn)) {
    c = c.replace(oldReturn, newReturn);
  }

  return c;
});

console.log('Finished applying state machine & auth patches.');

