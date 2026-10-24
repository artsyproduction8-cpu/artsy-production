const fs = require('fs');
const path = require('path');

function patch(relPath, fn) {
  const fullPath = path.join(__dirname, '..', 'artsy-next', relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const isCrlf = content.includes('\r\n');
  const normalized = content.replace(/\r\n/g, '\n');
  const updated = fn(normalized);
  const finalContent = isCrlf ? updated.replace(/\n/g, '\r\n') : updated;
  fs.writeFileSync(fullPath, finalContent, 'utf8');
  console.log('Fixed', relPath);
}

// 1. lib/auth.ts
patch('lib/auth.ts', (c) => {
  return c.replace(
    "import { getRoleHomePath, isAdminRole } from './auth-utils';",
    "import { getRoleHomePath, isAdminRole, isSuperAdminAccount } from './auth-utils';"
  );
});

// 2. src/app/api/admin/users/[id]/role/route.ts
patch('src/app/api/admin/users/[id]/role/route.ts', (c) => {
  return c.replace(
    `  const isCallerSuperAdmin = Boolean(authUser && (authUser.role === 'super_admin' || isSuperAdminAccount(authUser)));
  if (!isCallerSuperAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can manage user roles' }, { status: 403 });
  }

  const limit = await checkRateLimit(\`admin_role_patch_\${authUser.id}\`, 'admin', 10, 600);`,
    `  const isCallerSuperAdmin = Boolean(authUser && (authUser.role === 'super_admin' || isSuperAdminAccount(authUser)));
  if (!authUser || !isCallerSuperAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can manage user roles' }, { status: 403 });
  }

  const limit = await checkRateLimit(\`admin_role_patch_\${authUser.id}\`, 'admin', 10, 600);`
  );
});

// 3. src/app/api/auth/session/route.ts
patch('src/app/api/auth/session/route.ts', (c) => {
  return c.replace(
    'onboarded: Boolean(user.onboarded ?? dbUser?.onboarded),',
    'onboarded: Boolean(user.onboarded ?? (dbUser as any)?.onboarded),'
  );
});

// 4. src/app/api/freelancer/onboard/route.ts
patch('src/app/api/freelancer/onboard/route.ts', (c) => {
  let res = c;
  // Move publicDisplayName declaration before dbClient
  const scopeTarget = `    // Fix M: Encrypt PAN before saving to database
    const cleanPan = typeof pan === 'string' && pan.trim().length > 0 ? pan.trim().toUpperCase() : null;
    const encryptedPan = cleanPan ? encryptPII(cleanPan) : null;

    // 1. Ensure user and creator profile exist in Supabase with status = 'pending'`;

  const scopeReplacement = `    // Fix M: Encrypt PAN before saving to database
    const cleanPan = typeof pan === 'string' && pan.trim().length > 0 ? pan.trim().toUpperCase() : null;
    const encryptedPan = cleanPan ? encryptPII(cleanPan) : null;

    const publicDisplayName = cleanAlias
      ? formatPublicCreatorName(cleanAlias)
      : formatPublicCreatorName(cleanLegalName || resolvedName);

    // 1. Ensure user and creator profile exist in Supabase with status = 'pending'`;

  if (res.includes(scopeTarget)) {
    res = res.replace(scopeTarget, scopeReplacement);
    // Replace duplicate inner declaration
    res = res.replace(
      `        const publicDisplayName = cleanAlias
          ? formatPublicCreatorName(cleanAlias)
          : formatPublicCreatorName(cleanLegalName || resolvedName);`,
      ''
    );
  }
  return res;
});

