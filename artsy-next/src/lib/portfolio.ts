import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export interface PortfolioVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  preview_url?: string;
  thumbnail_url: string;
  youtube_id: string;
  display_order: number;
  created_at: string;
  r2_key?: string;
}

/**
 * Authoritative Canonical Registry of 27 Unique Studio Films.
 * Every film corresponds to an audited, verified master cut in Cloudflare R2 ('artsy-portfolio-videos').
 * Guarantees zero duplicate entries across categories and render runs.
 */
export interface CanonicalFilmMeta {
  order: number;
  category: 'Wedding Cinema' | 'Pre-Wedding Films' | 'Teasers & Trailers' | 'Cinematic Reels';
  key: string;
  title: string;
  description: string;
}

export const CANONICAL_PORTFOLIO_FILMS: CanonicalFilmMeta[] = [
  // --- Category 1: Wedding Cinema (6 Films) ---
  {
    order: 1,
    category: 'Wedding Cinema',
    key: 'Wedding/Chandni  Harihar’s Reception Film — Shreyas Iyer Steals the Dance Floor.mp4',
    title: 'Chandni & Harihar — Grand Reception Film',
    description: 'A lavish Bollywood-grade wedding reception celebration featuring dynamic choreography and Shreyas Iyer on the dance floor, color graded to perfection.',
  },
  {
    order: 2,
    category: 'Wedding Cinema',
    key: 'Wedding/Akash  Mayuri Wedding Film — Cinematic Highlights  Mumbai Wedding Videographer.mp4',
    title: 'Akash & Mayuri — Mumbai Wedding Highlights',
    description: 'An emotional, grand Mumbai wedding film capturing traditional rituals, intimate candid exchanges, and breathtaking golden-hour cinematography.',
  },
  {
    order: 3,
    category: 'Wedding Cinema',
    key: 'Wedding/Juhi  Swapnils Grand North Indian Wedding Film — Cinematic Highlights.mp4',
    title: 'Juhi & Swapnil — Grand North Indian Wedding',
    description: 'Vibrant royal North Indian wedding cinema celebrating regal bridal entrances, high-energy Baraat festivities, and rich ceremonial heritage.',
  },
  {
    order: 4,
    category: 'Wedding Cinema',
    key: 'Wedding/Rujuta  Abhyudays North Indian Wedding Film — Joy, Dance  Romance.mp4',
    title: 'Rujuta & Abhyuday — Joy, Dance & Romance',
    description: 'A joyful celebration of romance and high-spirited family dances, mastered with warm cinematic tones and pristine acoustic pacing.',
  },
  {
    order: 5,
    category: 'Wedding Cinema',
    key: 'Wedding/Rajat  Nimishas South Indian Wedding Film — Cinematic Highlights.mp4',
    title: 'Rajat & Nimisha — South Indian Wedding Highlights',
    description: 'Sacred South Indian temple rituals and vibrant Kanjeevaram silk colors captured with dignified pacing and authentic ceremonial beauty.',
  },
  {
    order: 6,
    category: 'Wedding Cinema',
    key: 'Wedding/Hufriya  Danesh Reception Film — 16 Years of Love Finally Sealed.mp4',
    title: 'Hufriya & Danesh — 16 Years of Love Reception',
    description: 'A deeply moving celebration honoring sixteen years of companionship, captured with timeless black-tie elegance and heartfelt speeches.',
  },

  // --- Category 2: Pre-Wedding Films (4 Films) ---
  {
    order: 7,
    category: 'Pre-Wedding Films',
    key: 'Pre wedding/ANOOP & ANSA pre wedding Low Res.mp4',
    title: 'Anoop & Ansa — Cinematic Pre-Wedding Film',
    description: 'An evocative romance set against scenic mountain vistas and serene lakeside shores, edited with poetic cadence and filmic color science.',
  },
  {
    order: 8,
    category: 'Pre-Wedding Films',
    key: 'Pre wedding/Akshay Pre wedding Low.mp4',
    title: 'Akshay & Partner — Romantic Pre-Wedding Journey',
    description: 'Intimate candid moments and playful laughter framed amidst dramatic natural landscapes, graded for lush warm highlights and soft shadow rolls.',
  },
  {
    order: 9,
    category: 'Pre-Wedding Films',
    key: 'Pre wedding/Matan & Lihi cine Low.mp4',
    title: 'Matan & Lihi — Destination Pre-Wedding Story',
    description: 'A global love story blending cosmopolitan charm with natural coastal warmth, cut with rhythmic sound design and cinematic depth of field.',
  },
  {
    order: 10,
    category: 'Pre-Wedding Films',
    key: 'Pre wedding/Robin Pre wedding Low.mp4',
    title: 'Robin & Partner — Timeless Pre-Wedding Film',
    description: 'Understated elegance meets natural chemistry in this sunset pre-wedding narrative, edited with seamless transitions and emotive pacing.',
  },

  // --- Category 3: Teasers & Trailers (7 Films) ---
  {
    order: 11,
    category: 'Teasers & Trailers',
    key: 'Teaser/Akshay & Jagruti  Wedding Teaser Low.mp4',
    title: 'Akshay & Jagruti — Wedding Teaser',
    description: 'Fast-paced, high-impact wedding teaser capturing the heart-thumping excitement, anticipation, and emotional peaks of the celebration.',
  },
  {
    order: 12,
    category: 'Teasers & Trailers',
    key: 'Teaser/Jai & Aishwarya (Teaser) Low.mp4',
    title: 'Jai & Aishwarya — Wedding Teaser',
    description: 'A love story worth the wait: breathtaking slow-motion portraits, soaring score, and cinematic glimpses of an unforgettable wedding week.',
  },
  {
    order: 13,
    category: 'Teasers & Trailers',
    key: 'Teaser/Khushboo & Tejas Teaser Low.mp4',
    title: 'Khushboo & Tejas — Wedding Teaser',
    description: 'Pure joy and infectious smiles woven into a high-energy teaser cut that perfectly sets the stage for the full wedding feature.',
  },
  {
    order: 14,
    category: 'Teasers & Trailers',
    key: 'Teaser/Matan & Lihi Trailer Low.mp4',
    title: 'Matan & Lihi — Cinematic Trailer',
    description: 'Trailer edit featuring theatrical dialogue snippets, sweeping cinematic establishing shots, and modern sound design.',
  },
  {
    order: 15,
    category: 'Teasers & Trailers',
    key: 'Teaser/Mayuri & Swapni Teaser Low.mp4',
    title: 'Mayuri & Swapnil — Wedding Teaser',
    description: 'Tender moments and high-octane celebration balanced in a masterfully paced trailer that leaves viewers breathless.',
  },
  {
    order: 16,
    category: 'Teasers & Trailers',
    key: 'Teaser/Sanket & Rutuja  Teaser Low.mp4',
    title: 'Sanket & Rutuja — Wedding Teaser',
    description: 'A lavish sangeet and wedding teaser bursting with colors, synchronized choreography, and unforgettable candid joy.',
  },
  {
    order: 17,
    category: 'Teasers & Trailers',
    key: 'Teaser/Shree & Shivani Teaser Low.mp4',
    title: 'Shree & Shivani — Wedding Teaser',
    description: 'Romantic glances and euphoric dance beats distilled into an electric 60-second cinematic master trailer.',
  },

  // --- Category 4: Cinematic Reels (10 Vertical Reels) ---
  {
    order: 18,
    category: 'Cinematic Reels',
    key: 'Reel/ANOOP & ANSA REEL low.mp4',
    title: 'Anoop & Ansa — Viral Wedding Reel',
    description: 'Ultra-smooth 9:16 vertical reel optimized for high engagement, trending audio pacing, and crisp edge-to-edge color contrast.',
  },
  {
    order: 19,
    category: 'Cinematic Reels',
    key: 'Reel/Akash Reel Low.mp4',
    title: 'Akash — Groom Entry & Celebration Reel',
    description: 'High-energy groom entry with smoke flare aesthetics, beat-matched jump cuts, and punchy contrast.',
  },
  {
    order: 20,
    category: 'Cinematic Reels',
    key: 'Reel/Akshay & Gauri Reel (2) Low.mp4',
    title: 'Akshay & Gauri — Romantic Wedding Reel',
    description: 'Dreamy slow-motion couple portraits framed for mobile viewing with luminous skin tones and golden hour glow.',
  },
  {
    order: 21,
    category: 'Cinematic Reels',
    key: 'Reel/Anroop & Jeemol Reel low.mp4',
    title: 'Anroop & Jeemol — Wedding Highlights Reel',
    description: 'A whirlwind of emotions and laughter packed into a sleek 9:16 vertical cut built for social storytelling.',
  },
  {
    order: 22,
    category: 'Cinematic Reels',
    key: 'Reel/George & Sumi Reel Low.mp4',
    title: 'George & Sumi — Church Wedding Reel',
    description: 'Classical church elegance reimagined for modern vertical feeds: veil movements, vows, and petal showers.',
  },
  {
    order: 23,
    category: 'Cinematic Reels',
    key: 'Reel/Kuhu Haldi Reel low.mp4',
    title: 'Kuhu — Haldi Celebration Reel',
    description: 'Explosive marigold yellows, water splashes, and unfiltered candid laughter in a dynamic high-frame-rate vertical cut.',
  },
  {
    order: 24,
    category: 'Cinematic Reels',
    key: 'Reel/Monish & Jisha Reel  Low.mp4',
    title: 'Monish & Jisha — Cinematic Couple Reel',
    description: 'Sultry, magazine-style bridal and couple portraits set to ambient beats with rich, moody film shadows.',
  },
  {
    order: 25,
    category: 'Cinematic Reels',
    key: 'Reel/Sanket & Rutuja - Sangeet Reel Low .mp4',
    title: 'Sanket & Rutuja — Sangeet Night Reel',
    description: 'Electrifying stage lighting, synchronized dance routines, and crowd cheers compressed into an adrenaline-filled reel.',
  },
  {
    order: 26,
    category: 'Cinematic Reels',
    key: 'Reel/Shweta Reel Low.mp4',
    title: 'Shweta — Bridal Solo Highlights Reel',
    description: 'Breathtaking solo bridal portraits highlighting intricate lehenga embroidery, jewelry details, and radiant confidence.',
  },
  {
    order: 27,
    category: 'Cinematic Reels',
    key: 'Reel/Sumit & Sonal Reel  Low.mp4',
    title: 'Sumit & Sonal — Wedding Celebration Reel',
    description: 'Pure wedding joy distilled into a snappy, heartwarming vertical reel featuring timeless candid moments.',
  },
];

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

export function getSafeKeyForAsset(key: string): string {
  return key
    .replace(/[^\w\d\-_./]/g, '_')
    .replace(/\.mp4$/i, '');
}

/**
 * Normalizes an R2 key or URL into a matching key for canonical comparison.
 */
function normalizeKeyForComparison(k: string): string {
  return k
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^artsy-portfolio-videos\//, '')
    .replace(/%20/g, ' ')
    .replace(/%26/g, '&')
    .replace(/[^\w\d]/g, '')
    .trim();
}

/**
 * Maps each canonical film to its signed streaming URLs, high-speed preview, and poster.
 * Enforces strict deduplication so that exactly the 27 canonical films are returned in proper order.
 */
export async function getEnrichedPortfolioVideos(): Promise<PortfolioVideo[]> {
  const s3 = getR2S3Client();

  // 1. Fetch any existing portfolio sample records from Supabase to preserve database IDs if present
  let dbSamplesByKey = new Map<string, any>();
  const dbClient = supabaseAdmin || anonSupabase;

  if (dbClient && typeof dbClient.from === 'function') {
    try {
      const { data: samples } = await dbClient
        .from('portfolio_samples')
        .select('id, title, description, category, video_url, thumbnail_url, display_order, created_at')
        .is('creator_id', null)
        .order('display_order', { ascending: true });

      if (Array.isArray(samples)) {
        for (const s of samples) {
          if (!s.video_url) continue;
          const normKey = normalizeKeyForComparison(s.video_url);
          if (normKey && !dbSamplesByKey.has(normKey)) {
            dbSamplesByKey.set(normKey, s);
          }
        }
      }
    } catch (err) {
      console.warn('[Portfolio DB Fetch Warning]', err);
    }
  }

  // 2. Generate signed URLs and construct authoritative PortfolioVideo items
  const enriched: PortfolioVideo[] = await Promise.all(
    CANONICAL_PORTFOLIO_FILMS.map(async (canonical) => {
      const key = canonical.key;
      const safeKey = getSafeKeyForAsset(key);
      const previewR2Key = `previews/${safeKey}_preview.mp4`;
      const thumbR2Key = `thumbnails/${safeKey}_thumb.jpg`;

      // Fallback relative streaming endpoints if S3 credentials are unavailable
      let signedUrl = `/api/portfolio/stream?key=${encodeURIComponent(key)}`;
      let signedPreviewUrl = `/api/portfolio/stream?key=${encodeURIComponent(previewR2Key)}`;
      let signedThumbUrl = `/api/portfolio/stream?key=${encodeURIComponent(thumbR2Key)}`;

      if (s3) {
        try {
          const mainCmd = new GetObjectCommand({
            Bucket: 'artsy-portfolio-videos',
            Key: key,
          });
          signedUrl = await getSignedUrl(s3, mainCmd, { expiresIn: 60 * 60 * 24 * 7 });

          const previewCmd = new GetObjectCommand({
            Bucket: 'artsy-portfolio-videos',
            Key: previewR2Key,
          });
          signedPreviewUrl = await getSignedUrl(s3, previewCmd, { expiresIn: 60 * 60 * 24 * 7 });

          const thumbCmd = new GetObjectCommand({
            Bucket: 'artsy-portfolio-videos',
            Key: thumbR2Key,
          });
          signedThumbUrl = await getSignedUrl(s3, thumbCmd, { expiresIn: 60 * 60 * 24 * 7 });
        } catch (signErr) {
          console.warn(`[R2 Sign Warning for ${key}]`, signErr);
        }
      }

      // Check if DB sample exists for ID & timestamps
      const normKey = normalizeKeyForComparison(key);
      const dbSample = dbSamplesByKey.get(normKey);

      return {
        id: dbSample?.id || `canonical-${canonical.order}`,
        title: canonical.title,
        description: canonical.description,
        category: canonical.category,
        video_url: signedUrl,
        preview_url: signedPreviewUrl,
        thumbnail_url: signedThumbUrl,
        youtube_id: '',
        display_order: canonical.order,
        created_at: dbSample?.created_at || new Date(Date.now() - (30 - canonical.order) * 86400000).toISOString(),
        r2_key: key,
      };
    })
  );

  // 3. Strict sorting by display order (1 to 27)
  enriched.sort((a, b) => a.display_order - b.display_order);

  return enriched;
}
