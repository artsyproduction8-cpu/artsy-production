import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    // Security Fix #6: Require authenticated user
    const authUser = getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, fileName, fileSizeBytes, mimeType, fileType = 'raw_footage' } = body;

    if (!projectId || !fileName) {
      return NextResponse.json(
        { error: 'projectId and fileName are required' },
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

    // Generate unique sanitized B2 object key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const b2Key = `projects/${sanitizedProjectId}/${fileType}/${timestamp}_${sanitizedFileName}`;

    // Retention timer triggers strictly on project approval
    const retentionDeleteAt = null;

    const b2Endpoint = process.env.B2_ENDPOINT || 's3.us-west-004.backblazeb2.com';
    const bucketName = process.env.B2_BUCKET_NAME || 'artsy-raw-storage';
    const mockUploadUrl = `https://${bucketName}.${b2Endpoint}/${b2Key}`;

    // Register file_records metadata in Supabase
    let fileRecord = null;
    if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      const { data } = await supabaseAdmin
        .from('file_records')
        .insert([
          {
            project_id: projectId,
            file_type: fileType,
            storage_provider: 'b2',
            b2_key: b2Key,
            file_name: sanitizedFileName,
            file_size_bytes: fileSizeBytes || 0,
            mime_type: mimeType || 'application/octet-stream',
            retention_delete_at: null,
            is_soft_deleted: false,
            is_hard_deleted: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      fileRecord = data;
    }

    return NextResponse.json({
      success: true,
      uploadUrl: mockUploadUrl,
      b2Key,
      fileRecordId: fileRecord?.id || `fil_${timestamp}`,
      retentionDeleteAt,
    });
  } catch (err: unknown) {
    console.error('Presigned URL error:', err);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
