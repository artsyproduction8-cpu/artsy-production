-- Migration 020: Purge duplicates and seed exact 27 canonical portfolio films
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)

-- 1. Ensure server auth function exists and RLS allows server updates
CREATE OR REPLACE FUNCTION public.is_server_authorized()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-artsy-server-auth',
    ''
  ) = 'ArtsyServerSubmissionAuth2026';
END;
$$;

DROP POLICY IF EXISTS "Admins full manage portfolio samples" ON public.portfolio_samples;
DROP POLICY IF EXISTS "Admins and server manage portfolio samples" ON public.portfolio_samples;

CREATE POLICY "Admins and server manage portfolio samples" ON public.portfolio_samples
  FOR ALL TO public
  USING (
    is_server_authorized() OR 
    (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')))
  )
  WITH CHECK (
    is_server_authorized() OR 
    (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')))
  );

-- 2. Purge all legacy and duplicate company portfolio rows
DELETE FROM public.portfolio_samples WHERE creator_id IS NULL;

-- 3. Insert the 27 canonical films cleanly with exact display_order (1 to 27)
INSERT INTO public.portfolio_samples (
  title,
  category,
  description,
  video_url,
  thumbnail_url,
  display_order,
  is_visible,
  approval_status,
  creator_id
) VALUES
  ('Chandni & Harihar — Grand Reception Film', 'Wedding Cinema', 'A lavish Bollywood-grade wedding reception celebration featuring dynamic choreography and Shreyas Iyer on the dance floor, color graded to perfection.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Wedding/Chandni%20%20Harihar%E2%80%99s%20Reception%20Film%20%E2%80%94%20Shreyas%20Iyer%20Steals%20the%20Dance%20Floor.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg', 1, true, 'approved', NULL),
  ('Akash & Mayuri — Mumbai Wedding Highlights', 'Wedding Cinema', 'An emotional, grand Mumbai wedding film capturing traditional rituals, intimate candid exchanges, and breathtaking golden-hour cinematography.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Wedding/Akash%20%20Mayuri%20Wedding%20Film%20%E2%80%94%20Cinematic%20Highlights%20%20Mumbai%20Wedding%20Videographer.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg', 2, true, 'approved', NULL),
  ('Juhi & Swapnil — Grand North Indian Wedding', 'Wedding Cinema', 'Vibrant royal North Indian wedding cinema celebrating regal bridal entrances, high-energy Baraat festivities, and rich ceremonial heritage.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Wedding/Juhi%20%20Swapnils%20Grand%20North%20Indian%20Wedding%20Film%20%E2%80%94%20Cinematic%20Highlights.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg', 3, true, 'approved', NULL),
  ('Rujuta & Abhyuday — Joy, Dance & Romance', 'Wedding Cinema', 'A joyful celebration of romance and high-spirited family dances, mastered with warm cinematic tones and pristine acoustic pacing.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Wedding/Rujuta%20%20Abhyudays%20North%20Indian%20Wedding%20Film%20%E2%80%94%20Joy,%20Dance%20%20Romance.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Wedding/Rujuta__Abhyudays_North_Indian_Wedding_Film___Joy__Dance__Romance_thumb.jpg', 4, true, 'approved', NULL),
  ('Rajat & Nimisha — South Indian Wedding Highlights', 'Wedding Cinema', 'Sacred South Indian temple rituals and vibrant Kanjeevaram silk colors captured with dignified pacing and authentic ceremonial beauty.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Wedding/Rajat%20%20Nimishas%20South%20Indian%20Wedding%20Film%20%E2%80%94%20Cinematic%20Highlights.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg', 5, true, 'approved', NULL),
  ('Hufriya & Danesh — 16 Years of Love Reception', 'Wedding Cinema', 'A deeply moving celebration honoring sixteen years of companionship, captured with timeless black-tie elegance and heartfelt speeches.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Wedding/Hufriya%20%20Danesh%20Reception%20Film%20%E2%80%94%2016%20Years%20of%20Love%20Finally%20Sealed.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Wedding/Hufriya__Danesh_Reception_Film___16_Years_of_Love_Finally_Sealed_thumb.jpg', 6, true, 'approved', NULL),
  ('Anoop & Ansa — Cinematic Pre-Wedding Film', 'Pre-Wedding Films', 'An evocative romance set against scenic mountain vistas and serene lakeside shores, edited with poetic cadence and filmic color science.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Pre%20wedding/ANOOP%20&%20ANSA%20pre%20wedding%20Low%20Res.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg', 7, true, 'approved', NULL),
  ('Akshay & Partner — Romantic Pre-Wedding Journey', 'Pre-Wedding Films', 'Intimate candid moments and playful laughter framed amidst dramatic natural landscapes, graded for lush warm highlights and soft shadow rolls.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Pre%20wedding/Akshay%20Pre%20wedding%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Pre_wedding/Akshay_Pre_wedding_Low_thumb.jpg', 8, true, 'approved', NULL),
  ('Matan & Lihi — Destination Pre-Wedding Story', 'Pre-Wedding Films', 'A global love story blending cosmopolitan charm with natural coastal warmth, cut with rhythmic sound design and cinematic depth of field.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Pre%20wedding/Matan%20&%20Lihi%20cine%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Pre_wedding/Matan___Lihi_cine_Low_thumb.jpg', 9, true, 'approved', NULL),
  ('Robin & Partner — Timeless Pre-Wedding Film', 'Pre-Wedding Films', 'Understated elegance meets natural chemistry in this sunset pre-wedding narrative, edited with seamless transitions and emotive pacing.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Pre%20wedding/Robin%20Pre%20wedding%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Pre_wedding/Robin_Pre_wedding_Low_thumb.jpg', 10, true, 'approved', NULL),
  ('Akshay & Jagruti — Wedding Teaser', 'Teasers & Trailers', 'Fast-paced, high-impact wedding teaser capturing the heart-thumping excitement, anticipation, and emotional peaks of the celebration.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Akshay%20&%20Jagruti%20%20Wedding%20Teaser%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_thumb.jpg', 11, true, 'approved', NULL),
  ('Jai & Aishwarya — Wedding Teaser', 'Teasers & Trailers', 'A love story worth the wait: breathtaking slow-motion portraits, soaring score, and cinematic glimpses of an unforgettable wedding week.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Jai%20&%20Aishwarya%20(Teaser)%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Jai___Aishwarya__Teaser__Low_thumb.jpg', 12, true, 'approved', NULL),
  ('Khushboo & Tejas — Wedding Teaser', 'Teasers & Trailers', 'Pure joy and infectious smiles woven into a high-energy teaser cut that perfectly sets the stage for the full wedding feature.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Khushboo%20&%20Tejas%20Teaser%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Khushboo___Tejas_Teaser_Low_thumb.jpg', 13, true, 'approved', NULL),
  ('Matan & Lihi — Cinematic Trailer', 'Teasers & Trailers', 'Trailer edit featuring theatrical dialogue snippets, sweeping cinematic establishing shots, and modern sound design.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Matan%20&%20Lihi%20Trailer%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Matan___Lihi_Trailer_Low_thumb.jpg', 14, true, 'approved', NULL),
  ('Mayuri & Swapnil — Wedding Teaser', 'Teasers & Trailers', 'Tender moments and high-octane celebration balanced in a masterfully paced trailer that leaves viewers breathless.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Mayuri%20&%20Swapni%20Teaser%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Mayuri___Swapni_Teaser_Low_thumb.jpg', 15, true, 'approved', NULL),
  ('Sanket & Rutuja — Wedding Teaser', 'Teasers & Trailers', 'A lavish sangeet and wedding teaser bursting with colors, synchronized choreography, and unforgettable candid joy.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Sanket%20&%20Rutuja%20%20Teaser%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Sanket___Rutuja__Teaser_Low_thumb.jpg', 16, true, 'approved', NULL),
  ('Shree & Shivani — Wedding Teaser', 'Teasers & Trailers', 'Romantic glances and euphoric dance beats distilled into an electric 60-second cinematic master trailer.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Teaser/Shree%20&%20Shivani%20Teaser%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Teaser/Shree___Shivani_Teaser_Low_thumb.jpg', 17, true, 'approved', NULL),
  ('Anoop & Ansa — Viral Wedding Reel', 'Cinematic Reels', 'Ultra-smooth 9:16 vertical reel optimized for high engagement, trending audio pacing, and crisp edge-to-edge color contrast.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/ANOOP%20&%20ANSA%20REEL%20low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/ANOOP___ANSA_REEL_low_thumb.jpg', 18, true, 'approved', NULL),
  ('Akash — Groom Entry & Celebration Reel', 'Cinematic Reels', 'High-energy groom entry with smoke flare aesthetics, beat-matched jump cuts, and punchy contrast.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Akash%20Reel%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Akash_Reel_Low_thumb.jpg', 19, true, 'approved', NULL),
  ('Akshay & Gauri — Romantic Wedding Reel', 'Cinematic Reels', 'Dreamy slow-motion couple portraits framed for mobile viewing with luminous skin tones and golden hour glow.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Akshay%20&%20Gauri%20Reel%20(2)%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Akshay___Gauri_Reel__2__Low_thumb.jpg', 20, true, 'approved', NULL),
  ('Anroop & Jeemol — Wedding Highlights Reel', 'Cinematic Reels', 'A whirlwind of emotions and laughter packed into a sleek 9:16 vertical cut built for social storytelling.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Anroop%20&%20Jeemol%20Reel%20low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Anroop___Jeemol_Reel_low_thumb.jpg', 21, true, 'approved', NULL),
  ('George & Sumi — Church Wedding Reel', 'Cinematic Reels', 'Classical church elegance reimagined for modern vertical feeds: veil movements, vows, and petal showers.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/George%20&%20Sumi%20Reel%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/George___Sumi_Reel_Low_thumb.jpg', 22, true, 'approved', NULL),
  ('Kuhu — Haldi Celebration Reel', 'Cinematic Reels', 'Explosive marigold yellows, water splashes, and unfiltered candid laughter in a dynamic high-frame-rate vertical cut.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Kuhu%20Haldi%20Reel%20low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg', 23, true, 'approved', NULL),
  ('Monish & Jisha — Cinematic Couple Reel', 'Cinematic Reels', 'Sultry, magazine-style bridal and couple portraits set to ambient beats with rich, moody film shadows.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Monish%20&%20Jisha%20Reel%20%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Monish___Jisha_Reel__Low_thumb.jpg', 24, true, 'approved', NULL),
  ('Sanket & Rutuja — Sangeet Night Reel', 'Cinematic Reels', 'Electrifying stage lighting, synchronized dance routines, and crowd cheers compressed into an adrenaline-filled reel.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Sanket%20&%20Rutuja%20-%20Sangeet%20Reel%20Low%20.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__thumb.jpg', 25, true, 'approved', NULL),
  ('Shweta — Bridal Solo Highlights Reel', 'Cinematic Reels', 'Breathtaking solo bridal portraits highlighting intricate lehenga embroidery, jewelry details, and radiant confidence.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Shweta%20Reel%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Shweta_Reel_Low_thumb.jpg', 26, true, 'approved', NULL),
  ('Sumit & Sonal — Wedding Celebration Reel', 'Cinematic Reels', 'Pure wedding joy distilled into a snappy, heartwarming vertical reel featuring timeless candid moments.', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/Reel%EF%80%A8/Sumit%20&%20Sonal%20Reel%20%20Low.mp4', 'https://pub-d00049c2ec14634e2e7faf05e08ba12f.r2.dev/thumbnails/Reel_/Sumit___Sonal_Reel__Low_thumb.jpg', 27, true, 'approved', NULL);
