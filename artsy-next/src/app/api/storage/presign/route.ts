import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/lib/storage/b2-client';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MIN_SIZE = 100 * 1024;              // 100 KB
const MAX_SIZE = 5 * 1024 * 1024 * 1024;  // 5 GB

export async function POST(request: NextRequest) {
  // Security Fix #6: Require authenticated session
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Rate Limiting: Max 20 presigned uploads per 10 minutes per user/IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anon';
  const rateKey = `presign_${authUser.id || ip}`;
  const limit = await checkRateLimit(rateKey, 'storage', 20, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many upload requests. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const { fileName, contentType, mimeType: inputMime, fileSizeBytes, projectId } = body;
    const mimeType = inputMime || contentType;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Fix M6: Enforce MIME allowlist
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid or missing MIME type' },
        { status: 400 }
      );
    }

    // Fix M6: Enforce file size boundaries (100KB - 5GB)
    if (typeof fileSizeBytes !== 'number' || fileSizeBytes < MIN_SIZE || fileSizeBytes > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must be between 100KB and 5GB' },
        { status: 400 }
      );
    }

    // Security Fix #1: Verify project ownership or assignment with fail-closed check
    const sanitizedProjectId = String(projectId).replace(/[^a-zA-Z0-9_-]/g, '_');

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    const query = supabaseAdmin
      .from('projects')
      .select('client_id, assigned_creator_id');
    const { data: project } = isUUID
      ? await query.eq('id', projectId).maybeSingle()
      : await query.eq('project_number', projectId).maybeSingle();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isOwner =
      project.client_id === authUser.id ||
      project.assigned_creator_id === authUser.id ||
      ['admin', 'super_admin'].includes(authUser.role);

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `projects/${sanitizedProjectId}/raw/${Date.now()}_${sanitizedName}`;

    const presigned = await generateUploadUrl(storageKey, contentType, 900);

    return NextResponse.json({
      success: true,
      uploadUrl: presigned.uploadUrl,
      key: presigned.key,
      expiresIn: presigned.expiresIn,
      bucket: presigned.bucket,
      isMock: presigned.isMock || false,
    });
  } catch (err: unknown) {
    console.error('Presigned URL error:', err);
    // M10: Do not leak error details
    return NextResponse.json(
      { error: 'Failed to generate presigned upload URL' },
      { status: 500 }
    );
  }
}
