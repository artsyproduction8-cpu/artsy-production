'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { setCurrentUser, ArtsyUser, UserRole, UserStatus, PRESET_USERS, getRoleHomePath } from '@/lib/auth';

// ── Cinematic Portfolio Work Data for Infinite Marquee Rows ──
interface PortfolioWorkCard {
  id: string;
  title: string;
  genre: string;
  badge: string;
  badgeColor: string;
  format: string;
  duration: string;
  image: string;
}

const ROW_1_WORK: PortfolioWorkCard[] = [
  {
    id: 'w1',
    title: 'Royal Udaipur Palace Film',
    genre: 'Wedding Cinema',
    badge: '4K MASTER',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    format: 'Rec.709 Film LUT',
    duration: '04:30',
    image: '/images/reels/wedding-palace.jpg',
  },
  {
    id: 'w2',
    title: 'Verve FW26 Streetwear Editorial',
    genre: 'Brand & DTC',
    badge: 'COMMERCIAL',
    badgeColor: 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30',
    format: 'Kinetic Cuts',
    duration: '01:20',
    image: '/images/portfolio-brand-1.jpg',
  },
  {
    id: 'w3',
    title: 'Apex Automotive Supercar Campaign',
    genre: 'Commercial',
    badge: '8K RAW',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    format: 'Color Science',
    duration: '02:15',
    image: '/images/reels/automotive-supercar.jpg',
  },
  {
    id: 'w4',
    title: 'Lake Pichola Sunset Vows',
    genre: 'Luxury Wedding',
    badge: 'MULTI-CAM',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    format: 'Waveform Sync',
    duration: '03:45',
    image: '/images/portfolio-wedding-2.jpg',
  },
  {
    id: 'w5',
    title: 'Haute Horlogerie Macro Commercial',
    genre: 'Product Studio',
    badge: 'MACRO 4K',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    format: 'Foley Sound',
    duration: '00:45',
    image: '/images/portfolio-product-1.jpg',
  },
  {
    id: 'w6',
    title: 'Solaris Electronic Music Festival',
    genre: 'Live Event',
    badge: 'AUDIO STEMS',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    format: '4K Multi-Perspective',
    duration: '01:30',
    image: '/images/reels/dj-festival.jpg',
  },
];

const ROW_2_WORK: PortfolioWorkCard[] = [
  {
    id: 'w7',
    title: 'Neon Fashion Tokyo Lookbook',
    genre: 'Fashion Editorial',
    badge: '9:16 REEL',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    format: 'Beat-Synced',
    duration: '00:55',
    image: '/images/reels/neon-fashion.jpg',
  },
  {
    id: 'w8',
    title: 'Global Leadership Keynote Sizzle',
    genre: 'Corporate Summit',
    badge: 'EXECUTIVE',
    badgeColor: 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30',
    format: 'Dialogue Cleaned',
    duration: '02:40',
    image: '/images/portfolio-corporate-1.jpg',
  },
  {
    id: 'w9',
    title: 'The Heritage Palace Wedding Suite',
    genre: 'Wedding Cinema',
    badge: 'TRINITY BUNDLE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    format: 'Full Story Cut',
    duration: '08:15',
    image: '/images/portfolio-wedding-1.jpg',
  },
  {
    id: 'w10',
    title: 'Lumina Diamond Fine Jewelry',
    genre: 'Luxury Brand',
    badge: 'DTC HOOKS',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    format: 'Variant Cuts',
    duration: '00:40',
    image: '/images/reels/luxury-product.jpg',
  },
  {
    id: 'w11',
    title: 'Aura Activewear High-Velocity Ad',
    genre: 'Brand Commercial',
    badge: 'CONVERSION AD',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    format: 'Motion Design',
    duration: '01:10',
    image: '/images/portfolio-brand-2.jpg',
  },
  {
    id: 'w12',
    title: 'Live Arena Stadium Concert Film',
    genre: 'Concert Cinema',
    badge: 'SURROUND 5.1',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    format: 'Pro Audio Master',
    duration: '03:20',
    image: '/images/reels/concert-rock.jpg',
  },
];

const ROW_3_WORK: PortfolioWorkCard[] = [
  {
    id: 'w13',
    title: 'Creator Studio Aesthetic Reel',
    genre: 'UGC & Social',
    badge: 'VERTICAL 9:16',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    format: 'Kinetic SFX',
    duration: '00:60',
    image: '/images/reels/creator-studio.jpg',
  },
  {
    id: 'w14',
    title: 'Taj Exotica Seaside Nuptials',
    genre: 'Wedding Cinema',
    badge: '4K CINEMA',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    format: 'Rec.709 Tone Curve',
    duration: '04:10',
    image: '/images/portfolio-wedding-2.jpg',
  },
  {
    id: 'w15',
    title: 'NextGen Cloud Summit Keynote',
    genre: 'Corporate Event',
    badge: 'BROADCAST',
    badgeColor: 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30',
    format: 'Deck Conformed',
    duration: '03:10',
    image: '/images/portfolio-corporate-1.jpg',
  },
  {
    id: 'w16',
    title: 'GT Hypercar Track Day Showcase',
    genre: 'Commercial',
    badge: 'COLOR PASS',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    format: 'Speed Ramps',
    duration: '02:00',
    image: '/images/reels/automotive-supercar.jpg',
  },
  {
    id: 'w17',
    title: 'Ceramic Chronograph Product Film',
    genre: 'Product Video',
    badge: 'MACRO FOLEY',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    format: 'Clean Lighting',
    duration: '00:50',
    image: '/images/portfolio-product-1.jpg',
  },
  {
    id: 'w18',
    title: 'Indie Rock Arena Sound Check',
    genre: 'Music & Stage',
    badge: 'STAGE PROXIES',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    format: 'Audio Mastered',
    duration: '02:50',
    image: '/images/reels/concert-rock.jpg',
  },
];

// Rotating Taglines for Artsy headline
const ROTATING_TAGLINES = [
  'Frame Review',
  'Cinematic Suite',
  'Active Project',
  'Studio Dashboard',
  'Production Command',
];

function PortfolioMarqueeCard({ item }: { item: PortfolioWorkCard }) {
  return (
    <div className="w-full h-[145px] sm:h-[165px] lg:h-[180px] xl:h-[200px] relative rounded-2xl overflow-hidden border border-white/10 bg-[#141416] shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)] group/card select-none">
      {/* Background Image */}
      <Image
        src={item.image}
        alt={item.title}
        fill
        sizes="(max-width: 640px) 130px, (max-width: 1024px) 180px, 240px"
        className="object-cover w-full h-full transform transition-transform duration-700 ease-out group-hover/card:scale-105 opacity-85 group-hover/card:opacity-100"
      />

      {/* Cinematic Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
        <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1 truncate max-w-[58%]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
          <span className="truncate">{item.genre}</span>
        </span>
        <span className={`text-[8.5px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded border backdrop-blur-md shrink-0 ${item.badgeColor}`}>
          {item.badge}
        </span>
      </div>

      {/* Bottom Information */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
        <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-tight leading-snug truncate drop-shadow-md">
          {item.title}
        </h4>
        <div className="flex items-center justify-between mt-0.5 text-[9.5px] text-[#A1A1A6] font-medium">
          <span className="truncate">{item.format}</span>
          <span className="font-mono text-white/90 bg-white/10 px-1 py-0.2 rounded text-[9px] shrink-0 ml-1">
            {item.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step: 'credentials' | 'otp'
  const initialStep = searchParams.get('step') === 'otp' ? 'otp' : 'credentials';
  const [step, setStep] = useState<'credentials' | 'otp'>(initialStep);

  // Dual Credentials: BOTH phone and email are required
  const [phoneInput, setPhoneInput] = useState(initialStep === 'otp' ? '9876543210' : '');
  const [emailInput, setEmailInput] = useState(initialStep === 'otp' ? 'client@artsyprod.studio' : '');
  const [otpInput, setOtpInput] = useState('');

  // Countdown timer for OTP
  const [countdown, setCountdown] = useState(initialStep === 'otp' ? 42 : 0);

  // Terms checkbox: UNCHECKED by default
  const [termsAccepted, setTermsAccepted] = useState(initialStep === 'otp');

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rotating Tagline State
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [isCrossFading, setIsCrossFading] = useState(false);

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
        sessionStorage.setItem('artsy_redirect', redirectParam);
      } catch {}
    }

    const intentParam = searchParams.get('intent');
    if (intentParam === 'freelancer') {
      try {
        sessionStorage.setItem('artsy_signup_intent', 'freelancer');
      } catch {}
      setIsFreelancerIntent(true);
    } else {
      try {
        const storedIntent = sessionStorage.getItem('artsy_signup_intent');
        if (storedIntent === 'freelancer') {
          setIsFreelancerIntent(true);
        }
      } catch {}
    }

    // Pre-populate if returning
    try {
      const pendingStr = sessionStorage.getItem('artsy_pending_auth');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        if (pending.email) setEmailInput(pending.email);
        if (pending.phone) setPhoneInput(pending.phone.replace(/\D/g, '').slice(-10));
      }
    } catch {}
  }, [searchParams]);

  // Tagline rotation
  useEffect(() => {
    if (isFreelancerIntent || step === 'otp') return;

    const timer = setInterval(() => {
      setIsCrossFading(true);
      setTimeout(() => {
        setTaglineIdx((prev) => (prev + 1) % ROTATING_TAGLINES.length);
        setIsCrossFading(false);
      }, 400);
    }, 3000);

    return () => clearInterval(timer);
  }, [isFreelancerIntent, step]);

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
        router.replace('/auth/login?intent=freelancer');
      } else {
        sessionStorage.removeItem('artsy_signup_intent');
        router.replace('/auth/login');
      }
    } catch {}
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

    try {
      const bodyPayload = {
        phone: cleanDigits,
        email: cleanEmail.toLowerCase(),
        role: isFreelancerIntent ? 'freelancer' : 'client',
        action: 'send',
      };

      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

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
      const msg = err instanceof Error ? err.message : 'Unable to send verification code. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Single OTP and Proceed to Form Filling
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otpInput.trim();
    if (cleanOtp.length < 4) {
      setError('Please enter the 4-digit verification code sent to both your phone and email.');
      otpInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

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
        }),
      });

      const data = await res.json().catch(() => ({}));

      // Accept valid API response or dev mode 4210 / 123456
      const isDevValid = cleanOtp === '4210' || cleanOtp === '123456';
      if (!res.ok && !isDevValid) {
        throw new Error(data.error || 'Incorrect verification code. Please verify and try again.');
      }

      // Initialize session
      if (isFreelancerIntent) {
        const creatorUser: ArtsyUser = {
          id: data.user?.id || `usr-creator-${Date.now().toString().slice(-6)}`,
          email: cleanEmail,
          phone: `+91${cleanDigits}`,
          full_name: 'Creator Candidate',
          role: 'freelancer',
          status: 'active',
          onboarding_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCurrentUser(creatorUser);

        // Creator Flow: Proceed to creator application form filling
        router.push('/freelancer/onboarding');
      } else {
        const clientUser: ArtsyUser = {
          id: data.user?.id || `usr-client-${Date.now().toString().slice(-6)}`,
          email: cleanEmail,
          phone: `+91${cleanDigits}`,
          full_name: 'Studio Client',
          role: 'client',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCurrentUser(clientUser);

        // Client Flow: Proceed to Workspace & Ingest Setup form filling
        router.push('/client/studio?onboarding=true');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setIsLoading(true);

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
          action: 'send',
        }),
      });

      setCountdown(45);
    } catch {
      setError('Unable to resend verification code. Please try again.');
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
          
          {/* Top Floating Glassmorphism Badge */}
          <div className="absolute top-5 left-5 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span>ARTSY CINEMATIC PORTFOLIO • 4K HDR PROXIES</span>
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
      <div className="flex-1 flex justify-center items-center px-6 py-8 sm:py-12 lg:px-10 xl:px-14 lg:w-[42%] xl:w-[40%] lg:flex-none bg-white">
        <div className="w-full max-w-[430px] space-y-6">
          
          {/* 1. ARTSY Wordmark (Dot Removed) */}
          <div className="text-left">
            <Link href="/" className="inline-flex items-center group mb-3">
              <span className="text-2xl font-extrabold tracking-[-0.04em] text-[#1D1D1F]">
                ARTSY
              </span>
            </Link>

            {/* 2. Step 1: Heading */}
            {step === 'credentials' ? (
              <>
                {isFreelancerIntent ? (
                  <h1 className="text-2xl sm:text-[27px] font-extrabold tracking-[-0.03em] text-[#1D1D1F] leading-tight">
                    Apply as <span className="text-[#3B82F6]">Creator</span>
                  </h1>
                ) : (
                  <h1 className="text-2xl sm:text-[27px] font-extrabold tracking-[-0.03em] text-[#1D1D1F] leading-tight flex items-baseline gap-2">
                    <span>Access</span>
                    <span
                      className={`text-[#3B82F6] transition-opacity duration-400 ease-in-out ${
                        isCrossFading ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      {ROTATING_TAGLINES[taglineIdx]}
                    </span>
                  </h1>
                )}
                <p className="text-xs sm:text-[13px] text-[#86868B] mt-1.5 leading-relaxed">
                  {isFreelancerIntent
                    ? 'Enter both your mobile number and email. A single OTP will be dispatched to both.'
                    : 'Enter both your mobile number and email to receive a single verification code.'}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-[27px] font-extrabold tracking-[-0.03em] text-[#1D1D1F] leading-tight">
                  Verify <span className="text-[#3B82F6]">Passcode</span>
                </h1>
                <p className="text-xs sm:text-[13px] text-[#86868B] mt-1.5 leading-relaxed">
                  Enter the 4-digit code sent to both your phone and email.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] font-mono font-semibold bg-[#F5F5F7] text-[#1D1D1F] px-2.5 py-1 rounded-lg border border-[#E5E5E7]">
                    📱 +91 {phoneInput}
                  </span>
                  <span className="text-[11px] font-semibold bg-[#F5F5F7] text-[#1D1D1F] px-2.5 py-1 rounded-lg border border-[#E5E5E7] truncate max-w-[200px]">
                    ✉️ {emailInput}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Inline Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium leading-relaxed animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* STEP 1: DUAL INPUT CREDENTIALS FORM */}
          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              
              {/* Mobile Number Input */}
              <div>
                <label htmlFor="login-phone-input" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex h-11 w-full items-stretch rounded-xl border border-[#E5E5E7] bg-white transition-colors focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
                  <div className="flex h-full items-center gap-1.5 rounded-l-xl border-r border-[#E5E5E7] px-3 text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
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
                    className="h-full w-full rounded-r-xl bg-transparent px-3 text-xs sm:text-sm font-semibold text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div>
                <label htmlFor="login-email-input" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative flex h-11 w-full items-stretch rounded-xl border border-[#E5E5E7] bg-white transition-colors focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
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
                    className="h-full w-full rounded-xl bg-transparent px-3 text-xs sm:text-sm font-semibold text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-[#86868B] leading-snug cursor-pointer select-none pt-1">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-0.5 h-4 w-4 accent-[#3B82F6] rounded border-[#E5E5E7] cursor-pointer"
                />
                <span>
                  I agree to Artsy&apos;s{' '}
                  <Link href="/terms" className="font-semibold text-[#1D1D1F] hover:text-[#3B82F6] underline">
                    Terms of Service
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
                className="w-full h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  <span>CONTINUE WITH OTP →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: SINGLE UNIFIED OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-otp-input" className="block text-xs font-semibold text-[#1D1D1F]">
                    Single Verification Code <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpInput('4210')}
                    className="text-[10px] text-[#3B82F6] hover:underline font-semibold"
                  >
                    Quick Test (4210)
                  </button>
                </div>
                <div className="relative flex h-12 w-full items-stretch rounded-xl border border-[#E5E5E7] bg-white transition-colors focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
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
                    placeholder="Enter 4-digit OTP"
                    className="h-full w-full rounded-xl bg-transparent px-4 text-center font-mono text-lg font-extrabold tracking-[0.3em] text-[#1D1D1F] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-[#86868B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs text-[#86868B] pt-1">
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
                className="w-full h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
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
          <div className="w-full border-t border-[#E5E5E7] my-4" />

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