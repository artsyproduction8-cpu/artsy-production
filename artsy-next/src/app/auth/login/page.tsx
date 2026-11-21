'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { setCurrentUser, ArtsyUser } from '@/lib/auth';

// ── Cinematic Portfolio Work Data for Infinite Marquee Rows ──
interface PortfolioWorkCard {
  id: string;
  title: string;
  genre: string;
  image: string;
  videoUrl?: string;
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const ROW_1_WORK: PortfolioWorkCard[] = [
  {
    id: 'w1',
    title: 'Chandni & Harihar — Grand Reception',
    genre: 'Wedding Cinema',
    image: getStreamUrl('thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_preview.mp4'),
  },
  {
    id: 'w2',
    title: 'Anoop & Ansa — Viral Wedding Reel',
    genre: 'Cinematic Reel',
    image: getStreamUrl('thumbnails/Reel_/ANOOP___ANSA_REEL_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/ANOOP___ANSA_REEL_low_preview.mp4'),
  },
  {
    id: 'w3',
    title: 'Akash & Mayuri — Mumbai Wedding Film',
    genre: 'Wedding Cinema',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
  },
  {
    id: 'w4',
    title: 'Akshay & Jagruti — Wedding Teaser',
    genre: 'Teaser',
    image: getStreamUrl('thumbnails/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_preview.mp4'),
  },
  {
    id: 'w5',
    title: 'Juhi & Swapnil — Grand North Indian',
    genre: 'Wedding Cinema',
    image: getStreamUrl('thumbnails/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  {
    id: 'w6',
    title: 'Sanket & Rutuja — Sangeet Night Reel',
    genre: 'Cinematic Reel',
    image: getStreamUrl('thumbnails/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__preview.mp4'),
  },
];

const ROW_2_WORK: PortfolioWorkCard[] = [
  {
    id: 'w7',
    title: 'Anoop & Ansa — Pre-Wedding Film',
    genre: 'Pre-Wedding',
    image: getStreamUrl('thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_preview.mp4'),
  },
  {
    id: 'w8',
    title: 'Jai & Aishwarya — Wedding Teaser',
    genre: 'Teaser',
    image: getStreamUrl('thumbnails/Teaser/Jai___Aishwarya__Teaser__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Jai___Aishwarya__Teaser__Low_preview.mp4'),
  },
  {
    id: 'w9',
    title: 'Rujuta & Abhyuday — Joy & Romance',
    genre: 'Wedding Cinema',
    image: getStreamUrl('thumbnails/Wedding/Rujuta__Abhyudays_North_Indian_Wedding_Film___Joy__Dance__Romance_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Rujuta__Abhyudays_North_Indian_Wedding_Film___Joy__Dance__Romance_preview.mp4'),
  },
  {
    id: 'w10',
    title: 'Kuhu — Haldi Celebration Reel',
    genre: 'Cinematic Reel',
    image: getStreamUrl('thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Kuhu_Haldi_Reel_low_preview.mp4'),
  },
  {
    id: 'w11',
    title: 'Akshay & Partner — Pre-Wedding',
    genre: 'Pre-Wedding',
    image: getStreamUrl('thumbnails/Pre_wedding/Akshay_Pre_wedding_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Akshay_Pre_wedding_Low_preview.mp4'),
  },
  {
    id: 'w12',
    title: 'Khushboo & Tejas — Wedding Teaser',
    genre: 'Teaser',
    image: getStreamUrl('thumbnails/Teaser/Khushboo___Tejas_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Khushboo___Tejas_Teaser_Low_preview.mp4'),
  },
];

const ROW_3_WORK: PortfolioWorkCard[] = [
  {
    id: 'w13',
    title: 'Rajat & Nimisha — South Indian Wedding',
    genre: 'Wedding Cinema',
    image: getStreamUrl('thumbnails/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  {
    id: 'w14',
    title: 'Monish & Jisha — Couple Reel',
    genre: 'Cinematic Reel',
    image: getStreamUrl('thumbnails/Reel_/Monish___Jisha_Reel__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Monish___Jisha_Reel__Low_preview.mp4'),
  },
  {
    id: 'w15',
    title: 'Matan & Lihi — Pre-Wedding Story',
    genre: 'Pre-Wedding',
    image: getStreamUrl('thumbnails/Pre_wedding/Matan___Lihi_cine_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Matan___Lihi_cine_Low_preview.mp4'),
  },
  {
    id: 'w16',
    title: 'Matan & Lihi — Cinematic Trailer',
    genre: 'Teaser',
    image: getStreamUrl('thumbnails/Teaser/Matan___Lihi_Trailer_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Matan___Lihi_Trailer_Low_preview.mp4'),
  },
  {
    id: 'w17',
    title: 'Hufriya & Danesh — 16 Years of Love',
    genre: 'Wedding Cinema',
    image: getStreamUrl('thumbnails/Wedding/Hufriya__Danesh_Reception_Film___16_Years_of_Love_Finally_Sealed_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Hufriya__Danesh_Reception_Film___16_Years_of_Love_Finally_Sealed_preview.mp4'),
  },
  {
    id: 'w18',
    title: 'Shweta — Bridal Solo Reel',
    genre: 'Cinematic Reel',
    image: getStreamUrl('thumbnails/Reel_/Shweta_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Shweta_Reel_Low_preview.mp4'),
  },
];

function PortfolioMarqueeCard({ item }: { item: PortfolioWorkCard }) {
  return (
    <div className="w-full h-[145px] sm:h-[165px] lg:h-[185px] xl:h-[205px] relative rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A] shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)] group/card select-none">
      {/* Background Live Video / Poster */}
      {item.videoUrl ? (
        <video
          src={item.videoUrl}
          poster={item.image}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="object-cover w-full h-full transform transition-transform duration-700 ease-out group-hover/card:scale-105 opacity-85 group-hover/card:opacity-100 pointer-events-none"
        />
      ) : (
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 130px, (max-width: 1024px) 180px, 240px"
          className="object-cover w-full h-full transform transition-transform duration-700 ease-out group-hover/card:scale-105 opacity-85 group-hover/card:opacity-100"
        />
      )}

      {/* Cinematic Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

      {/* Clean Bottom Information */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3B82F6] block mb-0.5">
          {item.genre}
        </span>
        <h4 className="text-xs sm:text-[13px] font-bold text-white tracking-tight leading-snug truncate drop-shadow-sm">
          {item.title}
        </h4>
      </div>
    </div>
  );
}

/**
 * Strict internal URL sanitizer to prevent Open Redirect attacks (CWE-601).
 * Accepts only relative paths starting with a single '/' and rejects external,
 * protocol-relative ('//'), backslash ('/\'), data:, and javascript: URIs.
 */
function sanitizeInternalRedirect(target?: string | null): string {
  if (!target || typeof target !== 'string') return '/client';
  const clean = target.trim();
  if (
    clean.startsWith('/') &&
    !clean.startsWith('//') &&
    !clean.startsWith('/\\') &&
    !clean.includes('://') &&
    !clean.toLowerCase().startsWith('/javascript:') &&
    !clean.toLowerCase().startsWith('/data:')
  ) {
    return clean;
  }
  return '/client';
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step: 'credentials' | 'otp'
  const initialStep = searchParams.get('step') === 'otp' ? 'otp' : 'credentials';
  const [step, setStep] = useState<'credentials' | 'otp'>(initialStep);

  // Dual Credentials: BOTH phone and email are required
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Countdown timer for OTP
  const [countdown, setCountdown] = useState(initialStep === 'otp' ? 42 : 0);

  // Terms checkbox: UNCHECKED by default
  const [termsAccepted, setTermsAccepted] = useState(initialStep === 'otp');

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Freelancer Intent
  const [isFreelancerIntent, setIsFreelancerIntent] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Handle URL Query Params on Mount
  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      try {
        const safeRedirect = sanitizeInternalRedirect(redirectParam);
        if (safeRedirect !== '/client') {
          sessionStorage.setItem('artsy_redirect', safeRedirect);
        }
      } catch { }
    }

    const intentParam = searchParams.get('intent');
    const roleParam = searchParams.get('role');
    if (intentParam === 'freelancer' || roleParam === 'freelancer') {
      try {
        sessionStorage.setItem('artsy_signup_intent', 'freelancer');
      } catch { }
      setIsFreelancerIntent(true);
    } else {
      try {
        const storedIntent = sessionStorage.getItem('artsy_signup_intent');
        if (storedIntent === 'freelancer') {
          setIsFreelancerIntent(true);
        }
      } catch { }
    }

    // Pre-populate if returning
    try {
      const pendingStr = sessionStorage.getItem('artsy_pending_auth');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (pending.email) setEmailInput(pending.email);
        if (pending.phone) setPhoneInput(pending.phone.replace(/\D/g, '').slice(-10));
      }
    } catch { }
  }, [searchParams]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Toggle Creator Intent
  const handleToggleIntent = (intent: boolean) => {
    setIsFreelancerIntent(intent);
    setError(null);
    try {
      if (intent) {
        sessionStorage.setItem('artsy_signup_intent', 'freelancer');
        sessionStorage.setItem('artsy_redirect', '/freelancer/onboarding');
        router.replace('/auth/login?intent=freelancer&redirect=/freelancer/onboarding');
      } else {
        sessionStorage.removeItem('artsy_signup_intent');
        sessionStorage.removeItem('artsy_redirect');
        router.replace('/auth/login');
      }
    } catch { }
  };

  // Step 1: Send Single OTP to both Phone and Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Phone Number
    const cleanDigits = phoneInput.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      phoneInputRef.current?.focus();
      return;
    }

    // Validate Email Address
    const cleanEmail = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    // Validate Terms
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const bodyPayload = {
        phone: cleanDigits,
        email: cleanEmail.toLowerCase(),
        role: isFreelancerIntent ? 'freelancer' : 'client',
        intent: isFreelancerIntent ? 'freelancer' : 'client',
        action: 'send',
      };

      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Unable to send verification code. Please try again.');
      }

      // Store pending auth in sessionStorage
      sessionStorage.setItem(
        'artsy_pending_auth',
        JSON.stringify({
          phone: cleanDigits,
          email: cleanEmail.toLowerCase(),
          role: isFreelancerIntent ? 'freelancer' : 'client',
        })
      );

      // Transition to single OTP input step
      setStep('otp');
      setCountdown(45);
      setOtpInput('');
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        const msg = err instanceof Error ? err.message : 'Unable to send verification code. Please try again.';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Single OTP and Proceed to Form Filling
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otpInput.trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code sent to both your phone and email.');
      otpInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const cleanDigits = phoneInput.replace(/\D/g, '');
      const cleanEmail = emailInput.trim().toLowerCase();

      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanDigits,
          email: cleanEmail,
          code: cleanOtp,
          action: 'verify',
          role: isFreelancerIntent ? 'freelancer' : 'client',
          intent: isFreelancerIntent ? 'freelancer' : 'client',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Incorrect verification code. Please verify and try again.');
      }

      // Initialize session using ONLY verified server response
      const serverRole = data.user?.role || (isFreelancerIntent ? 'freelancer' : 'client');
      const verifiedUser: ArtsyUser = {
        id: data.user?.id || (cleanEmail ? `usr-${cleanEmail.split('@')[0]}` : `usr-${Date.now().toString().slice(-6)}`),
        role: serverRole, // ← ALWAYS from server
        phone: data.user?.phone || `+91${cleanDigits}`,
        email: data.user?.email || cleanEmail,
        full_name: data.user?.full_name || '',
        display_name: data.user?.display_name || '',
        avatar_url: data.user?.avatar_url || '',
        onboarded: data.user?.onboarded ?? false,
        onboarding_status: data.user?.onboarding_status || null,
        tracking_id: data.user?.tracking_id || null,
        rejection_reason: data.user?.rejection_reason || null,
        rejected_at: data.user?.rejected_at || null,
        status: data.user?.status || 'active',
        created_at: data.user?.created_at || new Date().toISOString(),
        updated_at: data.user?.updated_at || new Date().toISOString(),
      };

      if (data.user?.studio_details) {
        (verifiedUser as any).studio_details = data.user.studio_details;
        try {
          if (serverRole === 'freelancer') {
            localStorage.setItem('artsy_creator_profile', JSON.stringify(data.user.studio_details));
          } else {
            localStorage.setItem('artsy_client_profile', JSON.stringify(data.user.studio_details));
          }
        } catch { }
      }

      setCurrentUser(verifiedUser);

      // Clear the signup intent
      try {
        sessionStorage.removeItem('artsy_signup_intent');
        localStorage.removeItem('artsy_signup_intent');
      } catch { }

      // Route strictly by REAL role:
      if (serverRole === 'admin' || serverRole === 'super_admin') {
        router.push('/admin');
      } else if (serverRole === 'freelancer') {
        const uStatus = data.user?.onboarding_status;
        const isOnboarded = Boolean(data.user?.onboarded);

        // Resolve redirect parameter for creator flow
        let redirectTarget = '/freelancer/onboarding';
        try {
          const stored = sessionStorage.getItem('artsy_redirect');
          const paramRedirect = searchParams.get('redirect');
          const target = paramRedirect || stored;
          if (target) {
            const sanitized = sanitizeInternalRedirect(target);
            if (sanitized && (sanitized.startsWith('/freelancer') || sanitized === '/freelancer')) {
              redirectTarget = sanitized;
            }
            sessionStorage.removeItem('artsy_redirect');
          }
        } catch { }

        // Strict state machine order for creators:
        if (uStatus === 'approved') {
          router.push('/freelancer');
        } else if (uStatus === 'pending' || uStatus === 'pending_review') {
          router.push('/freelancer/pending-approval');
        } else if (uStatus === 'rejected') {
          router.push('/freelancer/rejected');
        } else if (!isOnboarded || uStatus === null || uStatus === undefined) {
          router.push(redirectTarget || '/freelancer/onboarding');
        } else {
          router.push(redirectTarget || '/freelancer/onboarding');
        }
      } else {
        // Client
        if (!data.user?.onboarded) {
          router.push('/client/profile?setup=true');
        } else {
          let redirectTarget = '/client';
          try {
            const stored = sessionStorage.getItem('artsy_redirect');
            if (stored) {
              redirectTarget = sanitizeInternalRedirect(stored);
              sessionStorage.removeItem('artsy_redirect');
            }
          } catch { }
          router.push(redirectTarget);
        }
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const cleanDigits = phoneInput.replace(/\D/g, '');
      const cleanEmail = emailInput.trim().toLowerCase();

      await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanDigits,
          email: cleanEmail,
          role: isFreelancerIntent ? 'freelancer' : 'client',
          intent: isFreelancerIntent ? 'freelancer' : 'client',
          action: 'send',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      setCountdown(45);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Unable to resend verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormIncomplete = !phoneInput.trim() || !emailInput.trim() || !termsAccepted;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col lg:flex-row w-full max-w-full overflow-hidden">

      {/* ── LEFT PANEL (58-60% Width): 3 Straight Vertical Filmstrip Columns ── */}
      <div className="relative pt-4 pb-2 lg:pt-0 lg:pb-0 lg:w-[58%] xl:w-[60%] lg:flex-none p-4 sm:p-6 lg:p-6 xl:p-8 flex items-center justify-center">
        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[calc(100vh-4rem)] max-h-[860px] rounded-[24px] sm:rounded-[36px] bg-[#0A0A0A] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col justify-center">

          {/* Top Floating Subtle Studio Watermark */}
          <div className="absolute top-5 left-5 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/80 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            <span>Selected Studio Work</span>
          </div>

          {/* Top & Bottom Cinematic Fade Vignettes */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 sm:h-24 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/75 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/75 to-transparent z-20" />

          {/* 3 Straight Vertical Filmstrip Columns */}
          <div className="w-full h-full grid grid-cols-3 gap-2.5 sm:gap-3.5 xl:gap-4 p-2.5 sm:p-4 select-none overflow-hidden">

            {/* COLUMN 1: Scrolling Upward */}
            <div className="overflow-hidden h-full flex flex-col justify-center">
              <div className="animate-marquee-up-fast flex flex-col gap-2.5 sm:gap-3.5 xl:gap-4 marquee-pause-hover">
                {ROW_1_WORK.concat(ROW_1_WORK).map((item, idx) => (
                  <PortfolioMarqueeCard key={`c1-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            </div>

            {/* COLUMN 2: Scrolling Downward */}
            <div className="overflow-hidden h-full flex flex-col justify-center">
              <div className="animate-marquee-down-fast flex flex-col gap-2.5 sm:gap-3.5 xl:gap-4 marquee-pause-hover">
                {ROW_2_WORK.concat(ROW_2_WORK).map((item, idx) => (
                  <PortfolioMarqueeCard key={`c2-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            </div>

            {/* COLUMN 3: Scrolling Upward */}
            <div className="overflow-hidden h-full flex flex-col justify-center">
              <div className="animate-marquee-up-slow flex flex-col gap-2.5 sm:gap-3.5 xl:gap-4 marquee-pause-hover">
                {ROW_3_WORK.concat(ROW_3_WORK).map((item, idx) => (
                  <PortfolioMarqueeCard key={`c3-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL: Dual-Credential Login & Single OTP UI ── */}
      <div className="flex-1 flex justify-center items-center px-5 py-6 sm:py-10 lg:px-8 xl:px-12 lg:w-[42%] xl:w-[40%] lg:flex-none bg-white">
        <div className="w-full max-w-[360px] space-y-4.5">

          {/* 1. ARTSY Wordmark */}
          <div className="text-left">
            <Link href="/" className="inline-flex items-center group mb-2">
              <span className="text-xl sm:text-2xl font-black tracking-[-0.03em] text-[#1D1D1F]">
                ARTSY
              </span>
            </Link>

            {/* 2. Step 1: Heading */}
            {step === 'credentials' ? (
              <>
                {isFreelancerIntent ? (
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
                    Apply as <span className="text-[#3B82F6]">Creator</span>
                  </h1>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
                    Sign in to <span className="text-[#3B82F6]">Artsy</span>
                  </h1>
                )}
                <p className="text-xs text-[#86868B] mt-1 leading-normal">
                  {isFreelancerIntent
                    ? 'Enter your mobile number and email to begin your vetting application.'
                    : 'Enter your mobile number and email to access your studio portal.'}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
                  Verify <span className="text-[#3B82F6]">Passcode</span>
                </h1>
                <p className="text-xs text-[#86868B] mt-1 leading-normal">
                  Enter the 6-digit code sent to your credentials:
                </p>

                {/* Clean Credential Bar with direct Edit trigger */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E5E5E7] mt-2">
                  <div className="flex flex-col min-w-0 pr-2 text-left">
                    <span className="text-xs font-semibold text-[#1D1D1F] truncate">+91 {phoneInput}</span>
                    <span className="text-[11px] text-[#6E6E73] truncate">{emailInput}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setError(null);
                    }}
                    className="text-xs font-medium text-[#3B82F6] hover:text-[#2563EB] hover:underline shrink-0 cursor-pointer px-1 py-0.5"
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Inline Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium leading-relaxed animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* STEP 1: DUAL INPUT CREDENTIALS FORM */}
          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-3">

              {/* Mobile Number Input */}
              <div>
                <label htmlFor="login-phone-input" className="block text-[11px] font-medium text-[#1D1D1F] mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex h-9.5 sm:h-10 w-full items-stretch rounded-lg border border-[#E5E5E7] bg-white transition-all focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
                  <div className="flex h-full items-center gap-1 rounded-l-lg border-r border-[#E5E5E7] px-2.5 text-xs font-medium text-[#1D1D1F] bg-[#F8F8FA] select-none shrink-0">
                    <span className="text-xs">🇮🇳</span>
                    <span className="font-mono text-xs">+91</span>
                  </div>
                  <input
                    ref={phoneInputRef}
                    id="login-phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value.replace(/\D/g, ''));
                      if (error) setError(null);
                    }}
                    placeholder="98765 43210"
                    className="h-full w-full rounded-r-lg bg-transparent px-2.5 text-xs sm:text-[13px] font-medium text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div>
                <label htmlFor="login-email-input" className="block text-[11px] font-medium text-[#1D1D1F] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative flex h-9.5 sm:h-10 w-full items-stretch rounded-lg border border-[#E5E5E7] bg-white transition-all focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
                  <input
                    ref={emailInputRef}
                    id="login-email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="client@studio.com or creator@gmail.com"
                    className="h-full w-full rounded-lg bg-transparent px-3 text-xs sm:text-[13px] font-medium text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-[11px] text-[#86868B] leading-snug cursor-pointer select-none pt-0.5">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-0.5 h-3.5 w-3.5 accent-[#3B82F6] rounded border-[#E5E5E7] cursor-pointer"
                />
                <span>
                  I agree to Artsy&apos;s{' '}
                  <Link href="/terms" className="font-semibold text-[#1D1D1F] hover:text-[#3B82F6] underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-semibold text-[#1D1D1F] hover:text-[#3B82F6] underline">
                    Privacy Policy
                  </Link>.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isFormIncomplete}
                className="w-full h-9.5 sm:h-10 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  <span>CONTINUE WITH OTP →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: SINGLE UNIFIED OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in duration-200">
              <div>
                <label htmlFor="login-otp-input" className="block text-[11px] font-medium text-[#1D1D1F] mb-1">
                  Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="relative flex h-9.5 sm:h-10 w-full items-stretch rounded-lg border border-[#E5E5E7] bg-white transition-all focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
                  <input
                    ref={otpInputRef}
                    id="login-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      if (error) setError(null);
                    }}
                    placeholder="••••••"
                    className="h-full w-full rounded-lg bg-transparent px-3 text-center font-mono text-base font-bold tracking-[0.25em] text-[#1D1D1F] placeholder:font-sans placeholder:tracking-normal placeholder:text-xs placeholder:text-[#86868B]/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-[11px] text-[#86868B] pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError(null);
                  }}
                  className="hover:text-[#1D1D1F] hover:underline"
                >
                  &larr; Change details
                </button>

                {countdown > 0 ? (
                  <span>Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#3B82F6] hover:underline font-semibold cursor-pointer"
                  >
                    Resend code
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || otpInput.trim().length < 4}
                className="w-full h-9.5 sm:h-10 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <span>
                    {isFreelancerIntent ? 'VERIFY & COMPLETE APPLICATION →' : 'VERIFY & CONTINUE →'}
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Divider Line */}
          <div className="w-full border-t border-[#E5E5E7] my-3" />

          {/* Mode Switcher */}
          <div className="text-center text-xs">
            {isFreelancerIntent ? (
              <button
                type="button"
                onClick={() => {
                  handleToggleIntent(false);
                  setStep('credentials');
                }}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              >
                Just here to book or review a project?{' '}
                <span className="font-semibold text-[#3B82F6] hover:underline">
                  Sign in as client &rarr;
                </span>
              </button>
            ) : (
              <span className="text-[#86868B]">
                Looking to edit for Artsy?{' '}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleIntent(true);
                    setStep('credentials');
                  }}
                  className="font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                >
                  Apply as Creator &rarr;
                </button>
              </span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-xs text-[#86868B]">Loading Artsy Authentication...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}