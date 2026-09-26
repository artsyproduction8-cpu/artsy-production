import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/lib/storage/b2-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType = 'video/mp4', projectId = 'unassigned' } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `projects/${projectId}/raw/${Date.now()}_${sanitizedName}`;

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Presigned URL error:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to generate presigned upload URL', details: errorMsg },
      { status: 500 }
    );
  }
}
