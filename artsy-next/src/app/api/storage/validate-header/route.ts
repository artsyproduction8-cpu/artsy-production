import { NextRequest, NextResponse } from 'next/server';
import { validateHeaderBytesServer } from '@/lib/storage/validator';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  // Fix H: Require authenticated user
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const { fileRecordId, fileName, headerHex } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Fix H: Verify ownership before allowing mutation on fileRecordId
    if (fileRecordId && supabaseAdmin) {
      const { data: record, error: recErr } = await supabaseAdmin
        .from('file_records')
        .select('id, project_id, projects(client_id, assigned_creator_id)')
        .eq('id', fileRecordId)
        .maybeSingle();

      if (recErr || !record) {
        return NextResponse.json({ error: 'File record not found' }, { status: 404 });
      }

      const proj = record.projects as any;
      const isOwner =
        ['admin', 'super_admin'].includes(authUser.role) ||
        (proj && (proj.client_id === authUser.id || proj.assigned_creator_id === authUser.id));

      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden: You do not own this file record' }, { status: 403 });
      }
    }

    let headerBytes = new Uint8Array();
    if (headerHex) {
      const match = headerHex.match(/.{1,2}/g);
      if (match) {
        headerBytes = new Uint8Array(match.map((byte: string) => parseInt(byte, 16)));
      }
    }

    const validation = validateHeaderBytesServer(headerBytes, fileName);

    if (!validation.isValid) {
      // Mark file record as failed in database if record exists and authorized
      if (supabaseAdmin && fileRecordId) {
        await supabaseAdmin
          .from('file_records')
          .update({
            is_soft_deleted: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fileRecordId);
      }

      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid or corrupt video container header',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      format: validation.format,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Storage validation route error:', err);
    // M10: Do not leak raw error messages
    return NextResponse.json(
      { error: 'Header verification failed' },
      { status: 500 }
    );
  }
}
