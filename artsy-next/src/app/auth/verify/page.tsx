'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setCurrentUser, ArtsyUser } from '@/lib/auth';

export default function VerifyPage() {
  const router = useRouter();

  // Contact identifier from sessionStorage
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [contactDisplay, setContactDisplay] = useState('');
  const [rawContact, setRawContact] = useState<{ phone?: string | null; email?: string | null }>({});

  // 6 separate digit boxes
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers: 5-minute live countdown & 30s resend timer
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes
  const [resendSeconds, setResendSeconds] = useState(30);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isVerifyingSuccess, setIsVerifyingSuccess] = useState(false);

  // Load pending auth data from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('artsy_pending_auth');
      if (stored) {
        const data = JSON.parse(stored);
        setChannel(data.channel || 'phone');
        setRawContact({ phone: data.phone, email: data.email });
        if (data.displayContact) {
          setContactDisplay(data.displayContact);
        } else if (data.phone) {
          const p = data.phone.replace(/\D/g, '');
          setContactDisplay(`+91 ${p.slice(0, 5)} ${p.slice(5)}`);
        } else if (data.email) {
          setContactDisplay(data.email);
        }
      } else {
        // Fallback demo contact if directly navigated
        setContactDisplay('+91 98765 43210');
      }
    } catch {
      setContactDisplay('+91 98765 43210');
    }

    // Auto-focus first box on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  // 5-minute expiry countdown timer (updates every second)
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  // 30s resend countdown timer (updates every second)
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const isExpired = expirySeconds <= 0;
  const isLocked = failedAttempts >= 5;
  const isInputDisabled = isLoading || isExpired || isLocked || isVerifyingSuccess;

  // Format 5-minute timer mm:ss
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Submit Verification Code
  const submitVerification = async (codeToVerify: string) => {
    if (isInputDisabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        code: codeToVerify,
        verify: true,
      };

      if (channel === 'phone') {
        payload.phone = rawContact.phone || contactDisplay.replace(/\D/g, '').slice(-10);
      } else {
        payload.email = rawContact.email || contactDisplay.trim().toLowerCase();
      }

      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 5 || res.status === 429) {
          setError('Too many attempts. Please request a new code.');
        } else if (res.status === 401 && data.error && data.error.includes('expired')) {
          setError('This code has expired. Request a new one.');
        } else {
          const remaining = Math.max(0, 5 - newAttempts);
          setError(`Incorrect code. ${remaining} attempts remaining.`);
        }

        // Clear boxes on error & refocus first box
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 50);
        return;
      }

      // Verification Success!
      setIsVerifyingSuccess(true);
      const user = data.user as ArtsyUser;
      setCurrentUser(user);

      // Route handling
      handlePostVerifyRouting(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Session & Role Redirect Logic
  const handlePostVerifyRouting = (user: ArtsyUser) => {
    let redirectTarget: string | null = null;
    let signupIntent: string | null = null;

    try {
      redirectTarget = sessionStorage.getItem('artsy_redirect');
      signupIntent = sessionStorage.getItem('artsy_signup_intent');
      if (redirectTarget) {
        sessionStorage.removeItem('artsy_redirect');
      }
    } catch {}

    // Priority 1: Check for artsy_signup_intent=freelancer in sessionStorage
    if (signupIntent === 'freelancer') {
      if (!user.onboarding_status || user.onboarding_status === 'incomplete' || user.onboarding_status === 'registered') {
        router.push('/freelancer/onboarding');
        return;
      }
      if (user.onboarding_status === 'pending' || user.onboarding_status === 'pending_review') {
        router.push('/freelancer/pending-approval');
        return;
      }
      if (user.onboarding_status === 'approved') {
        router.push('/freelancer');
        return;
      }
    }

    // Priority 2: Use stored redirectTarget if present and valid
    if (redirectTarget && redirectTarget !== '/auth/login' && redirectTarget !== '/auth/verify') {
      router.push(redirectTarget);
      return;
    }

    // Priority 3: Route by user role and onboarding status
    if (user.role === 'admin') {
      router.push('/admin');
    } else if (user.role === 'freelancer') {
      if (user.onboarding_status === 'approved') {
        router.push('/freelancer');
      } else if (user.onboarding_status === 'pending' || user.onboarding_status === 'pending_review') {
        router.push('/freelancer/pending-approval');
      } else if (user.onboarding_status === 'rejected') {
        router.push('/freelancer/rejected');
      } else {
        router.push('/freelancer/onboarding');
      }
    } else {
      // client or new user
      router.push('/client');
    }
  };

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    if (isInputDisabled) return;

    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (error) setError(null);

    // Auto-advance to next box on input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (char && index === 5 && newDigits.every((d) => d.length === 1)) {
      submitVerification(newDigits.join(''));
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Paste support: pasting a 6-digit code fills all boxes and auto-submits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isInputDisabled) return;

    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedText) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedText.length; i++) {
      newDigits[i] = pastedText[i];
    }
    setDigits(newDigits);

    if (pastedText.length === 6) {
      submitVerification(pastedText);
    } else if (pastedText.length < 6) {
      inputRefs.current[pastedText.length]?.focus();
    }
  };

  // Resend OTP Section
  const handleResend = async () => {
    if (resendSeconds > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {};
      if (channel === 'phone') {
        payload.phone = rawContact.phone || contactDisplay.replace(/\D/g, '').slice(-10);
      } else {
        payload.email = rawContact.email || contactDisplay.trim().toLowerCase();
      }

      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to resend code. Please try again.');
      }

      // Reset timers and attempts
      setResendSeconds(30);
      setExpirySeconds(300);
      setFailedAttempts(0);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4 font-sans text-[#1D1D1F]">
      {/* Centered card, max-width 480px, vertical layout */}
      <div className="w-full max-w-[480px] bg-white border border-[#E5E5E7] rounded-2xl p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
        
        {/* 1. ARTSY • wordmark at top */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-2xl font-extrabold tracking-[-0.04em] text-[#1D1D1F]">
              ARTSY
            </span>
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          </Link>
        </div>

        {/* 2. Heading & 3. Subtext */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
            Verify your identity
          </h1>
          <p className="text-xs sm:text-[13px] text-[#86868B] leading-relaxed">
            We sent a 6-digit code to{' '}
            <strong className="text-[#1D1D1F] font-semibold">{contactDisplay || 'your registered contact'}</strong>
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-200 text-center animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Success Status */}
        {isVerifyingSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Code verified! Opening your workspace...</span>
          </div>
        )}

        {/* 4. OTP input: 6 separate digit boxes */}
        <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              id={`otp-box-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isInputDisabled}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-11 sm:w-13 h-13 sm:h-14 text-center text-xl font-mono font-bold rounded-xl border transition-all outline-none ${
                isInputDisabled
                  ? 'bg-[#E5E5E7]/50 text-[#86868B] border-[#E5E5E7] cursor-not-allowed'
                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10'
              }`}
            />
          ))}
        </div>

        {/* 5. Expiry notice: "Code expires in 5 minutes" with live countdown */}
        <div className="text-center text-xs">
          {isExpired ? (
            <span className="text-red-500 font-semibold">
              This code has expired. Request a new one.
            </span>
          ) : (
            <span className="text-[#86868B]">
              Code expires in{' '}
              <strong className="text-[#1D1D1F] font-mono font-bold">
                {formatTimer(expirySeconds)}
              </strong>
            </span>
          )}
        </div>

        {/* 6. Resend section */}
        <div className="text-center text-xs">
          {resendSeconds > 0 ? (
            <span className="text-[#86868B]">
              Resend in <strong className="text-[#1D1D1F] font-mono">{resendSeconds}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-[#3B82F6] font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E5E7] pt-4 text-center">
          {/* 7. Change link */}
          <Link
            href="/auth/login"
            className="text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            Didn&apos;t receive it?{' '}
            <span className="font-semibold text-[#3B82F6] hover:underline">
              {channel === 'email' ? 'Change email →' : 'Change number →'}
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}