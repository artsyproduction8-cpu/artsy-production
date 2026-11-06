import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

// In-memory cache for resolved Google Drive download URLs and session cookies (10-minute TTL)
const streamUrlCache = new Map<string, { url: string; cookies?: string[]; expires: number }>();

async function resolveDriveStreamUrl(fileId: string): Promise<{ url: string; cookies?: string[] }> {
  const cached = streamUrlCache.get(fileId);
  if (cached && cached.expires > Date.now()) {
    return { url: cached.url, cookies: cached.cookies };
  }

  const initialUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  const result = await new Promise<{ url: string; cookies?: string[] }>((resolve) => {
    const req = https.get(initialUrl, (res) => {
      // 1. Direct redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve({ url: res.headers.location, cookies: res.headers['set-cookie'] });
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
        resolve({ url: resolved, cookies: res.headers['set-cookie'] });
      });
    });

    req.on('error', (err) => {
      console.warn('[Video Stream Resolver Error]:', err.message);
      resolve({ url: initialUrl });
    });

    req.setTimeout(6000, () => {
      req.destroy();
      resolve({ url: initialUrl });
    });
  });

  // Cache for 10 minutes
  streamUrlCache.set(fileId, {
    url: result.url,
    cookies: result.cookies,
    expires: Date.now() + 10 * 60 * 1000,
  });

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id') || searchParams.get('fileId');

    if (!rawId) {
      return NextResponse.json({ error: 'Missing file id parameter' }, { status: 400 });
    }

    const fileIdMatch = rawId.match(/([a-zA-Z0-9_-]{20,})/);
    if (!fileIdMatch) {
      return NextResponse.json({ error: 'Invalid Google Drive file ID format' }, { status: 400 });
    }

    const fileId = fileIdMatch[1];
    const { url: streamUrl, cookies } = await resolveDriveStreamUrl(fileId);

    // Forward client's Range header (or default to bytes=0-)
    const rangeHeader = request.headers.get('range') || 'bytes=0-';
    const cookieHeader = cookies ? cookies.map((c) => c.split(';')[0]).join('; ') : '';

    const streamResponse = await new Promise<{
      statusCode: number;
      headers: Record<string, string>;
      stream: any;
    }>((resolve, reject) => {
      const gReq = https.get(
        streamUrl,
        {
          headers: {
            Range: rangeHeader,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
        },
        (res) => {
          const respHeaders: Record<string, string> = {
            'Content-Type': res.headers['content-type'] || 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          };
          if (res.headers['content-range']) {
            respHeaders['Content-Range'] = res.headers['content-range'] as string;
          }
          if (res.headers['content-length']) {
            respHeaders['Content-Length'] = res.headers['content-length'] as string;
          }

          resolve({
            statusCode: res.statusCode || 200,
            headers: respHeaders,
            stream: res,
          });
        }
      );

      gReq.on('error', (err) => reject(err));
      gReq.setTimeout(10000, () => {
        gReq.destroy();
        reject(new Error('Google Drive stream request timeout'));
      });
    });

    const webStream = Readable.toWeb(streamResponse.stream);
    return new Response(webStream as any, {
      status: streamResponse.statusCode,
      headers: streamResponse.headers,
    });
  } catch (error: any) {
    console.error('[API /api/video/stream] Error:', error);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id') || searchParams.get('fileId');
    if (!rawId) return new Response(null, { status: 400 });
    const fileIdMatch = rawId.match(/([a-zA-Z0-9_-]{20,})/);
    if (!fileIdMatch) return new Response(null, { status: 400 });

    const fileId = fileIdMatch[1];
    const { url: streamUrl, cookies } = await resolveDriveStreamUrl(fileId);
    const cookieHeader = cookies ? cookies.map((c) => c.split(';')[0]).join('; ') : '';

    return new Promise<Response>((resolve) => {
      const req = https.request(
        streamUrl,
        {
          method: 'HEAD',
          headers: {
            Range: 'bytes=0-0',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
        },
        (res) => {
          const respHeaders: Record<string, string> = {
            'Content-Type': res.headers['content-type'] || 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          };
          if (res.headers['content-range']) respHeaders['Content-Range'] = res.headers['content-range'] as string;
          if (res.headers['content-length']) respHeaders['Content-Length'] = res.headers['content-length'] as string;
          resolve(new Response(null, { status: res.statusCode || 200, headers: respHeaders }));
        }
      );
      req.on('error', () => resolve(new Response(null, { status: 500 })));
      req.end();
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
