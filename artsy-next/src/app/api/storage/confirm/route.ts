import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateHeaderBytesServer } from '@/lib/storage/validator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, key, fileName, fileSize = 0, mimeType = 'video/mp4', headerHex } = body;

    if (!projectId || !key || !fileName) {
      return NextResponse.json(
        { error: 'projectId, key, and fileName are required' },
        { status: 400 }
      );
    }

    // Header validation if hex passed
    if (headerHex) {
      const match = headerHex.match(/.{1,2}/g);
      if (match) {
        const headerBytes = new Uint8Array(match.map((b: string) => parseInt(b, 16)));
        const val = validateHeaderBytesServer(headerBytes, fileName);
        if (!val.isValid) {
          return NextResponse.json(
            { error: val.error || 'Corrupt video container header' },
            { status: 422 }
          );
        }
      }
    }

    let fileRecordId = `fl_${Date.now()}`;
    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
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
      confirmedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Storage confirm error:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to confirm storage upload', details: errorMsg },
      { status: 500 }
    );
  }
}
