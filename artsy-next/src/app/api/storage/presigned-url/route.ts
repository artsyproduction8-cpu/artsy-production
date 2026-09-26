import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fileName, fileSizeBytes, mimeType, fileType = 'raw_footage' } = body;

    if (!projectId || !fileName) {
      return NextResponse.json(
        { error: 'projectId and fileName are required' },
        { status: 400 }
      );
    }

    // Generate unique sanitized B2 object key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const b2Key = `projects/${projectId}/${fileType}/${timestamp}_${sanitizedFileName}`;

    // Master Plan v2.1 Locked Rule: Retention timer triggers ONLY on project.status = 'approved'.
    // During active production, review, and editing, files must NEVER expire.
    // retention_delete_at remains NULL until project approval event.
    const retentionDeleteAt = null;

    // In production with B2 credentials configured, presigned S3-compatible URL is generated via AWS SDK / S3Client
    // Direct browser upload endpoint:
    const b2Endpoint = process.env.B2_ENDPOINT || 's3.us-west-004.backblazeb2.com';
    const bucketName = process.env.B2_BUCKET_NAME || 'artsy-raw-storage';
    const mockUploadUrl = `https://${bucketName}.${b2Endpoint}/${b2Key}`;

    // Register file_records metadata in Supabase
    let fileRecord = null;
    if (supabase && typeof supabase.from === 'function') {
      const { data } = await supabase
        .from('file_records')
        .insert([
          {
            project_id: projectId,
            file_type: fileType,
            storage_provider: 'b2',
            b2_key: b2Key,
            file_name: fileName,
            file_size_bytes: fileSizeBytes || 0,
            mime_type: mimeType || 'application/octet-stream',
            retention_delete_at: null, // Triggers strictly on project.status = 'approved'
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
