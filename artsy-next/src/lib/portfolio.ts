import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export interface PortfolioVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string;
  youtube_id: string;
  display_order: number;
  created_at: string;
  r2_key?: string;
}

export function getR2S3Client(): S3Client | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim().replace(/^["']|["']$/g, '');
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim().replace(/^["']|["']$/g, '');
  const endpoint = process.env.R2_ENDPOINT?.trim().replace(/^["']|["']$/g, '');

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function extractR2Key(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    if (pathname.startsWith('artsy-portfolio-videos/')) {
      pathname = pathname.replace(/^artsy-portfolio-videos\//, '');
    }
    return pathname || null;
  } catch {
    return decodeURIComponent(url.replace(/^\/+/, ''));
  }
}

export async function signR2VideoUrl(url: string, expiresIn = 60 * 60 * 24 * 7): Promise<string> {
  const key = extractR2Key(url);
  if (!key) return url;

  const s3 = getR2S3Client();
  if (s3) {
    try {
      const cmd = new GetObjectCommand({
        Bucket: 'artsy-portfolio-videos',
        Key: key,
      });
      return await getSignedUrl(s3, cmd, { expiresIn });
    } catch (err) {
      console.warn('[R2 Sign Warning]', err);
    }
  }

  return `/api/portfolio/stream?key=${encodeURIComponent(key)}`;
}

export async function getEnrichedPortfolioVideos(): Promise<PortfolioVideo[]> {
  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return [];
  }

  try {
    let { data: samples, error } = await dbClient
      .from('portfolio_samples')
      .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, approval_status, created_at')
      .is('creator_id', null)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error && dbClient !== anonSupabase && anonSupabase) {
      const fb = await anonSupabase
        .from('portfolio_samples')
        .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, approval_status, created_at')
        .is('creator_id', null)
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!fb.error && fb.data) {
        samples = fb.data;
        error = null;
      }
    }

    if (error || !samples) {
      console.error('[Portfolio Fetch Error]', error);
      return [];
    }

    const seenUrls = new Set<string>();
    const cleanSamples: any[] = [];

    for (const s of samples) {
      // 1. Strictly exclude legacy mock YouTube videos and test fixtures
      if (s.youtube_id || s.video_url?.includes('youtube.com') || s.video_url?.includes('youtu.be')) continue;
      if (s.video_url?.includes('test.com') || s.video_url?.includes('pub-test.r2.dev')) continue;
      if (s.approval_status && s.approval_status !== 'approved') continue;
      if (!s.video_url) continue;

      // 2. Normalize key for robust deduplication across runs
      const key = extractR2Key(s.video_url);
      if (!key) continue;
      if (seenUrls.has(key)) continue;

      seenUrls.add(key);
      cleanSamples.push({ ...s, r2_key: key });
    }

    const s3 = getR2S3Client();

    const enriched: PortfolioVideo[] = await Promise.all(
      cleanSamples.map(async (sample) => {
        const key = sample.r2_key;
        let signedUrl = `/api/portfolio/stream?key=${encodeURIComponent(key || '')}`;

        if (s3 && key) {
          try {
            const cmd = new GetObjectCommand({
              Bucket: 'artsy-portfolio-videos',
              Key: key,
            });
            // 7-day presigned URL for direct, unthrottled streaming from Cloudflare Edge
            signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 * 24 * 7 });
          } catch (signErr) {
            console.warn('[Portfolio URL Sign Warning]', signErr);
          }
        }

        // Clean and polish titles
        let cleanTitle = sample.title || 'Cinematic Film';
        cleanTitle = cleanTitle
          .replace(/\bLow Res\b/gi, '')
          .replace(/\bLow\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Normalize category
        let cleanCat = sample.category || 'Wedding Cinema';
        if (cleanCat.toLowerCase().includes('reel')) cleanCat = 'Reels';
        else if (cleanCat.toLowerCase().includes('pre-wedding') || cleanCat.toLowerCase().includes('pre wedding')) cleanCat = 'Pre-Wedding';
        else if (cleanCat.toLowerCase().includes('teaser') || cleanCat.toLowerCase().includes('trailer')) cleanCat = 'Wedding Teaser';
        else cleanCat = 'Wedding Cinema';

        return {
          id: sample.id,
          title: cleanTitle,
          description: sample.description || `Experience the cinematic mastery of ${cleanTitle} crafted by Artsy Production with deterministic color grading and acoustic precision.`,
          category: cleanCat,
          video_url: signedUrl,
          thumbnail_url: sample.thumbnail_url || '',
          youtube_id: '',
          display_order: sample.display_order ?? 0,
          created_at: sample.created_at,
          r2_key: key,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error('[Portfolio Fetch Exception]', err);
    return [];
  }
}
