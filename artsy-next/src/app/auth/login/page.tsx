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

// Rotating Dynamic Words for Artsy headline
const ROTATING_WORDS = [
  'Cinematic Suite',
  'Frame Review',
  'Escrow Vault',
  'Creator Hub',
  'Active Projects',
];

function PortfolioMarqueeCard({ item }: { item: PortfolioWorkCard }) {
  return (
    <div className="w-[240px] sm:w-[280px] lg:w-[310px] h-[150px] sm:h-[175px] lg:h-[195px] relative rounded-2xl overflow-hidden border border-white/10 bg-[#141416] shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)] group/card select-none">
      {/* Background Image */}
      <Image
        src={item.image}
        alt={item.title}
        fill
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 310px"
        className="object-cover w-full h-full transform transition-transform duration-700 ease-out group-hover/card:scale-105 opacity-85 group-hover/card:opacity-100"
      />

      {/* Cinematic Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10">
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
          {item.genre}
        </span>
        <span className={`text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border backdrop-blur-md ${item.badgeColor}`}>
          {item.badge}
        </span>
      </div>

      {/* Bottom Information */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <h4 className="text-xs sm:text-[13px] font-bold text-white tracking-tight leading-snug truncate drop-shadow-md">
          {item.title}
        </h4>
        <div className="flex items-center justify-between mt-1 text-[10.5px] text-[#A1A1A6] font-medium">
          <span>{item.format}</span>
          <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.2 rounded text-[10px]">
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
  const paramRole = searchParams.get('role') as UserRole | null;
  const redirectTarget = searchParams.get('redirect');

  const [selectedRole, setSelectedRole] = useState<UserRole>(paramRole || 'client');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Word Index
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (paramRole && ['client', 'freelancer', 'admin'].includes(paramRole)) {
      setSelectedRole(paramRole);
    }
  }, [paramRole]);

  // 1-Click Fast Track Demo Sign-in
  const handleQuickSignIn = (role: UserRole) => {
    setIsLoading(true);
    setError(null);
    const preset = PRESET_USERS[role];
    setCurrentUser(preset);
    setTimeout(() => {
      setIsLoading(false);
      const dest = redirectTarget || getRoleHomePath(role);
      router.push(dest);
    }, 200);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to Artsy terms and privacy policy to continue.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          role: selectedRole,
          consentGiven: agreeTerms,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      if (data.devOtp) {
        setOtpDigits(data.devOtp.split(''));
      }

      setOtpStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the 6-digit code sent to your mobile.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          action: 'verify',
          code,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      const defaultNames: Record<UserRole, string> = {
        client: 'Sneha Patel',
        freelancer: 'Aarav Sen',
        admin: 'Studio Director',
      };

      const user: ArtsyUser = {
        id: data.user?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}`),
        email: data.user?.email || `${phoneNumber.replace(/\D/g, '')}@artsyprod.studio`,
        phone: data.user?.phone || `${countryCode} ${phoneNumber}`,
        full_name: data.user?.full_name || defaultNames[selectedRole],
        role: (data.user?.role as UserRole) || selectedRole,
        status: (data.user?.status as UserStatus) || 'active',
        created_at: data.user?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentUser(user);
      const dest = redirectTarget || getRoleHomePath(user.role);
      router.push(dest);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);
    if (clean && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col lg:flex-row w-full max-w-full overflow-hidden">
      
      {/* ── LEFT PANEL (60% Width): Cinematic Portfolio Showreel Animation ── */}
      <div className="relative pt-4 pb-2 lg:pt-0 lg:pb-0 lg:w-[58%] xl:w-[60%] lg:flex-none p-4 sm:p-6 lg:p-6 xl:p-8 flex items-center justify-center">
        <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[calc(100vh-4rem)] max-h-[860px] rounded-[24px] sm:rounded-[36px] bg-[#0A0A0A] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.35)] flex items-center overflow-hidden">
          
          {/* Top Floating Glassmorphism Badge */}
          <div className="absolute top-5 left-5 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span>ARTSY CINEMATIC PORTFOLIO • 4K HDR PROXIES</span>
          </div>

          {/* Tilted Marquee Matrix Canvas (Like unjob.ai rotated layout) */}
          <div className="w-full lg:rotate-[-8deg] lg:scale-115 origin-center overflow-hidden space-y-3 sm:space-y-4 py-4 select-none">
            
            {/* ROW 1: Scrolling Left */}
            <div className="overflow-hidden flex">
              <div className="animate-marquee-left-fast flex gap-3 sm:gap-4 marquee-pause-hover">
                {ROW_1_WORK.concat(ROW_1_WORK).map((item, idx) => (
                  <PortfolioMarqueeCard key={`r1-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            </div>

            {/* ROW 2: Scrolling Right */}
            <div className="overflow-hidden flex">
              <div className="animate-marquee-right-fast flex gap-3 sm:gap-4 marquee-pause-hover">
                {ROW_2_WORK.concat(ROW_2_WORK).map((item, idx) => (
                  <PortfolioMarqueeCard key={`r2-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            </div>

            {/* ROW 3: Scrolling Left */}
            <div className="overflow-hidden flex">
              <div className="animate-marquee-left-slow flex gap-3 sm:gap-4 marquee-pause-hover">
                {ROW_3_WORK.concat(ROW_3_WORK).map((item, idx) => (
                  <PortfolioMarqueeCard key={`r3-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            </div>

          </div>

          {/* Ambient Edge Gradient Masks for Seamless Floating Look */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-14 sm:w-28 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 sm:w-28 bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent z-10" />

        </div>
      </div>

      {/* ── RIGHT PANEL (40% Width): Artsy Authentication UI ── */}
      <div className="flex-1 flex justify-center items-center px-6 py-8 sm:py-12 lg:px-10 xl:px-14 lg:w-[42%] xl:w-[40%] lg:flex-none bg-white">
        <div className="w-full max-w-[430px] space-y-6">
          
          {/* Brand Header */}
          <div className="text-left">
            <Link href="/" className="inline-flex items-center gap-2 group mb-3">
              <span className="text-2xl font-extrabold tracking-[-0.04em] text-[#1D1D1F]">
                ARTSY
              </span>
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            </Link>

            <h1 className="text-2xl sm:text-[27px] font-extrabold tracking-[-0.03em] text-[#1D1D1F] leading-tight flex flex-wrap items-baseline gap-1.5">
              <span>Access</span>
              <span className="relative inline-block h-[1.3em] overflow-hidden align-bottom">
                <span
                  key={wordIdx}
                  className="inline-block text-[#3B82F6] animate-flip-in font-extrabold"
                >
                  {ROTATING_WORDS[wordIdx]}
                </span>
              </span>
              <span>in seconds</span>
            </h1>

            <p className="text-xs sm:text-[13px] text-[#86868B] mt-1.5 leading-relaxed">
              Sign in with your registered phone number or test credentials to enter your creative suite.
            </p>
          </div>

          {/* Quick Role Switcher Strip */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1D1D1F]">
                Select Workspace Role
              </label>
              <span className="text-[11px] text-[#86868B]">
                Role-based routing
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5E7]">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'client'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('freelancer')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'freelancer'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Creator
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Instant 1-Click Fast Track Testing Bar */}
          <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
              <span>Instant Test Entry</span>
              <span className="text-[#3B82F6]">1-Click Demo</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSignIn('client')}
                className="py-1.5 px-2 bg-white hover:bg-gray-100 rounded-lg text-[11px] font-semibold text-[#1D1D1F] border border-[#E5E5E7] text-center transition-colors cursor-pointer"
              >
                ⚡ Sneha (Client)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSignIn('freelancer')}
                className="py-1.5 px-2 bg-white hover:bg-gray-100 rounded-lg text-[11px] font-semibold text-[#1D1D1F] border border-[#E5E5E7] text-center transition-colors cursor-pointer"
              >
                ⚡ Aarav (Editor)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSignIn('admin')}
                className="py-1.5 px-2 bg-white hover:bg-gray-100 rounded-lg text-[11px] font-semibold text-[#1D1D1F] border border-[#E5E5E7] text-center transition-colors cursor-pointer"
              >
                ⚡ Director
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Phone Input Stage */}
          {otpStep === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex h-11 w-full items-stretch rounded-xl border border-[#E5E5E7] bg-white transition-colors focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
                  <div className="flex h-full items-center gap-1.5 rounded-l-xl border-r border-[#E5E5E7] px-3 text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className="h-full w-full rounded-r-xl bg-transparent px-3 text-xs sm:text-sm font-semibold text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#86868B] leading-snug cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <span>Continue with OTP →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Stage */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868B]">
                  Code sent to +91 {phoneNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setOtpStep('phone')}
                  className="text-[#3B82F6] font-semibold hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-input-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="h-12 text-center font-bold text-base rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 outline-none"
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleVerifyOtp}
                className="w-full h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <span>Verify &amp; Enter Workspace →</span>
                )}
              </button>
            </div>
          )}

          {/* Footer Assistance */}
          <div className="pt-4 border-t border-[#F5F5F7] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#86868B]">
            <span>
              Looking to edit for Artsy?{' '}
              <Link
                href="/freelancer/onboarding"
                className="font-semibold text-[#3B82F6] hover:underline"
              >
                Apply as Creator
              </Link>
            </span>
            <Link href="/" className="hover:text-[#1D1D1F] transition-colors">
              Back to Home
            </Link>
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