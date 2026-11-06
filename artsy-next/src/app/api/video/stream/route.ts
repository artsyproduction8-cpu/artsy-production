import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

// In-memory cache for resolved Google Drive stream URLs (5-minute TTL)
const streamUrlCache = new Map<string, { url: string; expires: number }>();

async function resolveDriveStreamUrl(fileId: string): Promise<string> {
  const cached = streamUrlCache.get(fileId);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }

  const initialUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  const finalUrl = await new Promise<string>((resolve) => {
    const req = https.get(initialUrl, (res) => {
      // 1. Direct redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(res.headers.location);
      }

      let body = '';
      res.on('data', (chunk) => {
        if (body.length < 50000) body += chunk.toString('utf8');
      });
      res.on('end', () => {
        // 2. Google Virus Scan Warning for files > 25MB
        const confirmMatch = body.match(/name="confirm" value="([^"]+)"/) || body.match(/confirm=([^"&]+)/);
        const uuidMatch = body.match(/name="uuid" value="([^"]+)"/);

        const confirmVal = confirmMatch ? confirmMatch[1] : 't';
        const uuidVal = uuidMatch ? `&uuid=${uuidMatch[1]}` : '';
        const resolved = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmVal}${uuidVal}`;
        resolve(resolved);
      });
    });

    req.on('error', (err) => {
      console.warn('[Video Stream Resolver Error]:', err.message);
      resolve(initialUrl);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(initialUrl);
    });
  });

  // Cache for 5 minutes
  streamUrlCache.set(fileId, {
    url: finalUrl,
    expires: Date.now() + 5 * 60 * 1000,
  });

  return finalUrl;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id') || searchParams.get('fileId');

    if (!rawId) {
      return NextResponse.json({ error: 'Missing file id parameter' }, { status: 400 });
    }

    // Sanitize file ID (Google Drive IDs are alphanumeric with hyphens and underscores)
    const fileIdMatch = rawId.match(/([a-zA-Z0-9_-]{20,})/);
    if (!fileIdMatch) {
      return NextResponse.json({ error: 'Invalid Google Drive file ID format' }, { status: 400 });
    }

    const fileId = fileIdMatch[1];
    const streamUrl = await resolveDriveStreamUrl(fileId);

    // 307 Temporary Redirect preserves Range headers and transfers playback directly to Google CDN
    return NextResponse.redirect(streamUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  } catch (error: any) {
    console.error('[API /api/video/stream] Error:', error);
    return NextResponse.json({ error: 'Failed to resolve video stream' }, { status: 500 });
  }
}
