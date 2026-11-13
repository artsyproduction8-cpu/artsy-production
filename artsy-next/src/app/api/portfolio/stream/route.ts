import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2S3Client } from '@/lib/portfolio';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing video key' }, { status: 400 });
  }

  const s3 = getR2S3Client();
  if (!s3) {
    return NextResponse.json({ error: 'Storage credentials unconfigured' }, { status: 500 });
  }

  try {
    const cmd = new GetObjectCommand({
      Bucket: 'artsy-portfolio-videos',
      Key: key,
    });

    // 7-day presigned URL for direct, high-speed edge streaming
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 * 24 * 7 });

    return NextResponse.redirect(signedUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: unknown) {
    console.error('[Portfolio Stream Error]', err);
    return NextResponse.json({ error: 'Failed to generate video stream' }, { status: 500 });
  }
}
