import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
  }
}

const accessKeyId = (env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID)?.trim().replace(/^["']|["']$/g, '');
const secretAccessKey = (env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY)?.trim().replace(/^["']|["']$/g, '');
const endpoint = (env.R2_ENDPOINT || process.env.R2_ENDPOINT)?.trim().replace(/^["']|["']$/g, '');
const bucket = (env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'artsy-portfolio-videos')?.trim().replace(/^["']|["']$/g, '');

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getSafeKeyForAsset(key) {
  return key
    .replace(/[^\w\d\-_./]/g, '_')
    .replace(/\.mp4$/i, '');
}

// Authoritative 27 canonical films
const CANONICAL_FILMS = [
  // Wedding Cinema (16:9)
  { key: 'Wedding/Chandni  Harihar’s Reception Film — Shreyas Iyer Steals the Dance Floor.mp4', start: 35, vertical: false },
  { key: 'Wedding/Akash  Mayuri Wedding Film — Cinematic Highlights  Mumbai Wedding Videographer.mp4', start: 45, vertical: false },
  { key: 'Wedding/Juhi  Swapnils Grand North Indian Wedding Film — Cinematic Highlights.mp4', start: 35, vertical: false },
  { key: 'Wedding/Rujuta  Abhyudays North Indian Wedding Film — Joy, Dance  Romance.mp4', start: 40, vertical: false },
  { key: 'Wedding/Rajat  Nimishas South Indian Wedding Film — Cinematic Highlights.mp4', start: 30, vertical: false },
  { key: 'Wedding/Hufriya  Danesh Reception Film — 16 Years of Love Finally Sealed.mp4', start: 45, vertical: false },

  // Pre-Wedding Films (16:9)
  { key: 'Pre wedding/ANOOP & ANSA pre wedding Low Res.mp4', start: 25, vertical: false },
  { key: 'Pre wedding/Akshay Pre wedding Low.mp4', start: 25, vertical: false },
  { key: 'Pre wedding/Matan & Lihi cine Low.mp4', start: 30, vertical: false },
  { key: 'Pre wedding/Robin Pre wedding Low.mp4', start: 30, vertical: false },

  // Teasers & Trailers (16:9)
  { key: 'Teaser/Akshay & Jagruti  Wedding Teaser Low.mp4', start: 20, vertical: false },
  { key: 'Teaser/Jai & Aishwarya (Teaser) Low.mp4', start: 20, vertical: false },
  { key: 'Teaser/Khushboo & Tejas Teaser Low.mp4', start: 20, vertical: false },
  { key: 'Teaser/Matan & Lihi Trailer Low.mp4', start: 30, vertical: false },
  { key: 'Teaser/Mayuri & Swapni Teaser Low.mp4', start: 20, vertical: false },
  { key: 'Teaser/Sanket & Rutuja  Teaser Low.mp4', start: 20, vertical: false },
  { key: 'Teaser/Shree & Shivani Teaser Low.mp4', start: 20, vertical: false },

  // Cinematic Reels (9:16)
  { key: 'Reel/ANOOP & ANSA REEL low.mp4', start: 8, vertical: true },
  { key: 'Reel/Akash Reel Low.mp4', start: 8, vertical: true },
  { key: 'Reel/Akshay & Gauri Reel (2) Low.mp4', start: 8, vertical: true },
  { key: 'Reel/Anroop & Jeemol Reel low.mp4', start: 8, vertical: true },
  { key: 'Reel/George & Sumi Reel Low.mp4', start: 10, vertical: true },
  { key: 'Reel/Kuhu Haldi Reel low.mp4', start: 8, vertical: true },
  { key: 'Reel/Monish & Jisha Reel  Low.mp4', start: 8, vertical: true },
  { key: 'Reel/Sanket & Rutuja - Sangeet Reel Low .mp4', start: 8, vertical: true },
  { key: 'Reel/Shweta Reel Low.mp4', start: 8, vertical: true },
  { key: 'Reel/Sumit & Sonal Reel  Low.mp4', start: 8, vertical: true },
];

const tempDir = path.resolve(__dirname, 'temp_cuts');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

async function uploadToR2(r2Key, filePath, contentType) {
  const fileBuffer = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
}

async function processFilm(film, index) {
  const safeKey = getSafeKeyForAsset(film.key);
  const previewR2Key = `previews/${safeKey}_preview.mp4`;
  const thumbR2Key = `thumbnails/${safeKey}_thumb.jpg`;

  console.log(`\n[${index + 1}/27] Cutting action clip for: ${film.key}`);
  console.log(`Target Preview: ${previewR2Key}`);
  console.log(`Target Thumbnail: ${thumbR2Key}`);

  // 1. Get pre-signed URL for the master film
  const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucket,
    Key: film.key,
  }), { expiresIn: 600 });

  const tempVideo = path.join(tempDir, `cut_${index}.mp4`);
  const tempThumb = path.join(tempDir, `thumb_${index}.jpg`);

  const scale = film.vertical ? 'scale=360:640' : 'scale=640:360';

  // 2. Cut 7 seconds of peak action directly from master using Range requests
  execSync(
    `ffmpeg -y -ss ${film.start} -i "${signedUrl}" -t 7.0 -vf "${scale}" ` +
    `-c:v libx264 -crf 27 -preset veryfast -b:v 350k -maxrate 500k -bufsize 800k ` +
    `-an -movflags +faststart "${tempVideo}"`,
    { stdio: 'pipe' }
  );

  const videoBytes = fs.statSync(tempVideo).size;
  console.log(`Video cut success! Size: ${(videoBytes / 1024).toFixed(1)} KB`);

  // 3. Extract frame 0 as the exact matching poster thumbnail
  execSync(`ffmpeg -y -i "${tempVideo}" -vframes 1 -q:v 2 "${tempThumb}"`, { stdio: 'pipe' });
  const thumbBytes = fs.statSync(tempThumb).size;
  console.log(`Thumbnail extracted! Size: ${(thumbBytes / 1024).toFixed(1)} KB`);

  // 4. Upload both to R2
  console.log(`Uploading preview to R2 (${previewR2Key})...`);
  await uploadToR2(previewR2Key, tempVideo, 'video/mp4');

  console.log(`Uploading thumbnail to R2 (${thumbR2Key})...`);
  await uploadToR2(thumbR2Key, tempThumb, 'image/jpeg');

  // 5. Clean local temp files
  try {
    fs.unlinkSync(tempVideo);
    fs.unlinkSync(tempThumb);
  } catch {}

  console.log(`✓ Completed: ${film.key}`);
}

async function main() {
  console.log(`Starting generation of 27 perfect action previews from master films...`);
  for (let i = 0; i < CANONICAL_FILMS.length; i++) {
    await processFilm(CANONICAL_FILMS[i], i);
  }

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  console.log(`\n🎉 ALL 27 ACTION PREVIEWS & THUMBNAILS CUT & UPLOADED PERFECTLY!`);
}

main().catch(console.error);
