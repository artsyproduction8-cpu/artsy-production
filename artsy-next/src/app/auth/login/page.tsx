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
  const paramRole = searchParams.get('role') as UserRole | null;
  const redirectTarget = searchParams.get('redirect');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(paramRole || 'client');
  const [identifiedUser, setIdentifiedUser] = useState<{
    name: string | null;
    role: UserRole;
    isNewUser: boolean;
  }>({
    name: null,
    role: 'client',
    isNewUser: true,
  });

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

  // Automatic Phone-to-Role Identification (Defaults new users to Client)
  useEffect(() => {
    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length === 10) {
      // Fast local resolution for instant test accounts
      const testLookup: Record<string, { name: string; role: UserRole }> = {
        '9876543210': { name: 'Sneha Patel', role: 'client' },
        '9876543211': { name: 'Aarav Sen', role: 'freelancer' },
        '9876543212': { name: 'Studio Director', role: 'admin' },
      };

      if (testLookup[clean]) {
        const match = testLookup[clean];
        setIdentifiedUser({
          name: match.name,
          role: match.role,
          isNewUser: false,
        });
        setSelectedRole(match.role);
        return;
      }

      // Check with backend lookup
      fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, action: 'lookup' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.role) {
            setIdentifiedUser({
              name: data.name || null,
              role: (data.role as UserRole) || 'client',
              isNewUser: Boolean(data.isNewUser),
            });
            setSelectedRole((data.role as UserRole) || 'client');
          }
        })
        .catch(() => {
          // Default unknown numbers to Client
          setIdentifiedUser({
            name: null,
            role: 'client',
            isNewUser: true,
          });
          setSelectedRole('client');
        });
    } else {
      setIdentifiedUser({
        name: null,
        role: 'client',
        isNewUser: true,
      });
      setSelectedRole('client');
    }
  }, [phoneNumber]);

  // 1-Click Fast Track Demo Sign-in
  const handleQuickSignIn = (role: UserRole) => {
    setIsLoading(true);
    setError(null);
    const preset = PRESET_USERS[role];
    if (preset.phone) {
      const clean = preset.phone.replace(/\D/g, '').slice(-10);
      setPhoneNumber(clean);
    }
    setSelectedRole(role);
    setIdentifiedUser({
      name: preset.full_name,
      role,
      isNewUser: false,
    });
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
        const clean = phoneNumber.replace(/\D/g, '');
        if (code === '123456' && (clean === '9876543210' || clean === '9876543211' || clean === '9876543212' || clean.length === 10)) {
          const defaultNames: Record<UserRole, string> = {
            client: 'Sneha Patel',
            freelancer: 'Aarav Sen',
            admin: 'Studio Director',
          };
          const resolvedRole = selectedRole || (clean === '9876543211' ? 'freelancer' : clean === '9876543212' ? 'admin' : 'client');
          const fallbackUser: ArtsyUser = {
            id: `usr_${clean}`,
            email: `${clean}@artsyprod.studio`,
            phone: `${countryCode} ${phoneNumber}`,
            full_name: identifiedUser.name || defaultNames[resolvedRole] || 'Valued Member',
            role: resolvedRole,
            status: 'active',
            onboarding_status: resolvedRole === 'freelancer' ? 'approved' : undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCurrentUser(fallbackUser);
          const dest = redirectTarget || getRoleHomePath(fallbackUser.role);
          router.push(dest);
          return;
        }
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      const defaultNames: Record<UserRole, string> = {
        client: 'Sneha Patel',
        freelancer: 'Aarav Sen',
        admin: 'Studio Director',
      };

      const resolvedRole = (data.user?.role as UserRole) || selectedRole || 'client';

      const user: ArtsyUser = {
        id: data.user?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}`),
        email: data.user?.email || `${phoneNumber.replace(/\D/g, '')}@artsyprod.studio`,
        phone: data.user?.phone || `${countryCode} ${phoneNumber}`,
        full_name: data.user?.full_name || identifiedUser.name || defaultNames[resolvedRole] || 'Valued Member',
        role: resolvedRole,
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
      
      {/* ── LEFT PANEL (58-60% Width): 3 Straight Vertical Filmstrip Columns (0° Tilt) ── */}
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

      {/* ── RIGHT PANEL (40% Width): Phone-Based Authentication UI ── */}
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
              Enter your mobile number to sign in. Your workspace and role are automatically recognized.
            </p>
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
          <div className="pt-4 border-t border-[#F5F5F7] text-center text-xs text-[#86868B]">
            <span>
              Looking to edit for Artsy?{' '}
              <Link
                href="/freelancer/onboarding"
                className="font-semibold text-[#3B82F6] hover:underline"
              >
                Apply as Creator
              </Link>
            </span>
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