import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateHeaderBytesServer } from '@/lib/storage/validator';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    // Security Fix #7: Authenticate user
    const authUser = getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, key, fileName, fileSize = 0, mimeType = 'video/mp4', headerHex } = body;

    if (!projectId || !key || !fileName) {
      return NextResponse.json(
        { error: 'projectId, key, and fileName are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Verify project ownership with fail-closed check
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    const projQuery = supabaseAdmin
      .from('projects')
      .select('client_id, assigned_creator_id');
    const { data: project } = isUUID
      ? await projQuery.eq('id', projectId).maybeSingle()
      : await projQuery.eq('project_number', projectId).maybeSingle();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isOwner =
      project.client_id === authUser.id ||
      project.assigned_creator_id === authUser.id ||
      authUser.role === 'admin';

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Security Fix #7: Mandatory headerHex pre-flight container validation
    if (!headerHex || typeof headerHex !== 'string') {
      return NextResponse.json(
        { error: 'headerHex is required for pre-flight integrity verification' },
        { status: 400 }
      );
    }

    const match = headerHex.match(/.{1,2}/g);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid headerHex byte string' },
        { status: 400 }
      );
    }

    const headerBytes = new Uint8Array(match.map((b: string) => parseInt(b, 16)));
    const val = validateHeaderBytesServer(headerBytes, fileName);
    if (!val.isValid) {
      return NextResponse.json(
        { error: val.error || 'Corrupt or disallowed video container header' },
        { status: 400 }
      );
    }

    let fileRecordId = `fl_${Date.now()}`;
    if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      const { data, error } = await supabaseAdmin
        .from('file_records')
        .insert([
          {
            project_id: projectId,
            file_category: 'raw_footage',
            file_name: fileName,
            storage_path: key,
            file_size_bytes: fileSize,
            mime_type: mimeType,
            is_deleted: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (!error && data) {
        fileRecordId = data.id;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File upload confirmed and registered in production catalog.',
      fileRecordId,
      key,
      projectId,
      format: val.format,
      confirmedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Storage confirm error:', err);
    return NextResponse.json(
      { error: 'Failed to confirm storage upload' },
      { status: 500 }
    );
  }
}
