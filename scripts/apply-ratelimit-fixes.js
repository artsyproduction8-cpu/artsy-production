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

// 1. gstr1-export/route.ts
patchFile('src/app/api/financial/gstr1-export/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  const authCheck = `    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required for statutory GSTR-1 exports' },
        { status: 401 }
      );
    }`;
  const rateLimitCheck = `${authCheck}

    const exportLimit = await checkRateLimit(\`gstr1_export_\${authUser.id}\`, 'admin', 10, 3600);
    if (!exportLimit.allowed) {
      return NextResponse.json(
        { error: \`Export rate limit exceeded. Please wait \${Math.ceil(exportLimit.resetSeconds / 60)} minutes.\` },
        { status: 429 }
      );
    }`;
  if (c.includes(authCheck) && !c.includes('gstr1_export_')) {
    c = c.replace(authCheck, rateLimitCheck);
  }
  return c;
});

// 2. admin/payouts/batch-neft/route.ts
patchFile('src/app/api/admin/payouts/batch-neft/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  // GET
  const getAuthCheck = `    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }`;
  const getRateLimit = `${getAuthCheck}

    const limitGet = await checkRateLimit(\`admin_batch_neft_get_\${authUser.id}\`, 'admin', 10, 600);
    if (!limitGet.allowed) {
      return NextResponse.json(
        { error: \`Rate limit exceeded. Please wait \${Math.ceil(limitGet.resetSeconds / 60)} minutes.\` },
        { status: 429 }
      );
    }`;
  if (c.includes(getAuthCheck) && !c.includes('admin_batch_neft_get_')) {
    c = c.replace(getAuthCheck, getRateLimit);
  }

  // POST
  const postTarget = `export async function POST(request: NextRequest) {
  try {
    // Security Fix #4: Enforce admin authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }`;
  const postRate = `${postTarget}

    const limitPost = await checkRateLimit(\`admin_batch_neft_post_\${authUser.id}\`, 'admin', 10, 600);
    if (!limitPost.allowed) {
      return NextResponse.json(
        { error: \`Batch dispatch rate limit exceeded. Please wait \${Math.ceil(limitPost.resetSeconds / 60)} minutes.\` },
        { status: 429 }
      );
    }`;
  if (c.includes(postTarget) && !c.includes('admin_batch_neft_post_')) {
    c = c.replace(postTarget, postRate);
  }
  return c;
});

// 3. admin/creator/[id]/reveal-pan/route.ts
patchFile('src/app/api/admin/creator/[id]/reveal-pan/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  const authTarget = `    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }`;
  const authWithRate = `${authTarget}

    const limit = await checkRateLimit(\`admin_reveal_pan_\${authUser.id}\`, 'admin', 5, 600);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: \`PAN reveal limit exceeded. Please wait \${Math.ceil(limit.resetSeconds / 60)} minutes.\` },
        { status: 429 }
      );
    }`;
  if (c.includes(authTarget) && !c.includes('admin_reveal_pan_')) {
    c = c.replace(authTarget, authWithRate);
  }
  return c;
});

// 4. admin/creator-requests/route.ts
patchFile('src/app/api/admin/creator-requests/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  // GET
  const getTarget = `export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }`;
  const getWithRate = `${getTarget}

  const limitGet = await checkRateLimit(\`admin_cr_req_get_\${authUser.id}\`, 'admin', 30, 60);
  if (!limitGet.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
  }`;
  if (c.includes(getTarget) && !c.includes('admin_cr_req_get_')) {
    c = c.replace(getTarget, getWithRate);
  }

  // POST
  const postTarget = `export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }`;
  const postWithRate = `${postTarget}

  const limitPost = await checkRateLimit(\`admin_cr_req_post_\${authUser.id}\`, 'admin', 20, 60);
  if (!limitPost.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
  }`;
  if (c.includes(postTarget) && !c.includes('admin_cr_req_post_')) {
    c = c.replace(postTarget, postWithRate);
  }
  return c;
});

// 5. admin/users/[id]/role/route.ts
patchFile('src/app/api/admin/users/[id]/role/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  const superAdminCheck = `  if (!isCallerSuperAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can manage user roles' }, { status: 403 });
  }`;
  const checkWithRate = `${superAdminCheck}

  const limit = await checkRateLimit(\`admin_role_patch_\${authUser.id}\`, 'admin', 10, 600);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Role modification limit reached. Please wait.' }, { status: 429 });
  }`;
  if (c.includes(superAdminCheck) && !c.includes('admin_role_patch_')) {
    c = c.replace(superAdminCheck, checkWithRate);
  }
  return c;
});

// 6. admin/submissions/[id]/convert/route.ts
patchFile('src/app/api/admin/submissions/[id]/convert/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  const authCheck = `  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }`;
  const authWithRate = `${authCheck}

  const limit = await checkRateLimit(\`admin_sub_convert_\${authUser.id}\`, 'admin', 15, 600);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
  }`;
  if (c.includes(authCheck) && !c.includes('admin_sub_convert_')) {
    c = c.replace(authCheck, authWithRate);
  }
  return c;
});

// 7. admin/submissions/[id]/reject/route.ts
patchFile('src/app/api/admin/submissions/[id]/reject/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit } from '@/lib/rateLimit';"
    );
  }
  const authCheck = `  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }`;
  const authWithRate = `${authCheck}

  const limit = await checkRateLimit(\`admin_sub_reject_\${authUser.id}\`, 'admin', 15, 600);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
  }`;
  if (c.includes(authCheck) && !c.includes('admin_sub_reject_')) {
    c = c.replace(authCheck, authWithRate);
  }
  return c;
});

// 8. storage/confirm/route.ts
patchFile('src/app/api/storage/confirm/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit, getClientIp } from '@/lib/rateLimit';"
    );
  }
  const authCheck = `  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }`;
  const authWithRate = `${authCheck}

  const rateKey = authUser ? \`storage_confirm_\${authUser.id}\` : \`storage_confirm_ip_\${getClientIp(request)}\`;
  const limit = await checkRateLimit(rateKey, 'storage', 30, 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many upload confirmations. Please wait.' }, { status: 429 });
  }`;
  if (c.includes(authCheck) && !c.includes('storage_confirm_')) {
    c = c.replace(authCheck, authWithRate);
  }
  return c;
});

// 9. storage/validate-header/route.ts
patchFile('src/app/api/storage/validate-header/route.ts', (content) => {
  let c = content;
  if (!c.includes('checkRateLimit')) {
    c = c.replace(
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';",
      "import { getAuthenticatedUser } from '@/lib/auth-cookie';\nimport { checkRateLimit, getClientIp } from '@/lib/rateLimit';"
    );
  }
  const authCheck = `  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }`;
  const authWithRate = `${authCheck}

  const rateKey = authUser ? \`storage_val_\${authUser.id}\` : \`storage_val_ip_\${getClientIp(request)}\`;
  const limit = await checkRateLimit(rateKey, 'storage', 30, 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Validation rate limit exceeded. Please wait.' }, { status: 429 });
  }`;
  if (c.includes(authCheck) && !c.includes('storage_val_')) {
    c = c.replace(authCheck, authWithRate);
  }
  return c;
});

console.log('Finished applying rate limit patches.');

