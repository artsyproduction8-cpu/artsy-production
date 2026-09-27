'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyWhatsAppOtp } from '@/lib/supabase';
import { setCurrentUser, ArtsyUser } from '@/lib/auth';

export default function VerifyPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('client');
  const [otp, setOtp] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const storedData = typeof window !== 'undefined' ? localStorage.getItem('artsy_verify_data') : null;
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.countryCode) setCountryCode(data.countryCode);
        if (data.fullName) setFullName(data.fullName);
        if (data.role) setRole(data.role);
      } catch {
        // ignore
      }
    }
  }, []);

  const fullPhone = `${countryCode} ${phoneNumber || '9876543210'}`;

  const handleVerify = async () => {
    if (!otp.trim() || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await verifyWhatsAppOtp(fullPhone, otp, fullName, role);

      if (res.success) {
        setSuccess(true);
        let redirectUrl = '/client';
        if (res.user.role === 'admin') {
          redirectUrl = '/admin';
        } else if (res.user.role === 'freelancer') {
          const hasProfile = typeof window !== 'undefined' && localStorage.getItem('artsy_creator_profile');
          if (!hasProfile && res.user.onboarding_status !== 'approved' && res.user.onboarding_status !== 'pending_review' && res.user.id !== 'usr-editor-002') {
            redirectUrl = '/freelancer/onboarding';
          } else {
            redirectUrl = '/freelancer';
          }
        }

        setCurrentUser(res.user);

        setTimeout(() => {
          router.push(redirectUrl);
        }, 1200);
      } else {
        setError(res.error || 'Verification failed. Please check the code.');
      }
    } catch {
      // Offline fallback
      setSuccess(true);
      const hasProfile = typeof window !== 'undefined' && localStorage.getItem('artsy_creator_profile');
      let fallbackOnboardingStatus: any = 'incomplete';
      let redirectUrl = '/client';
      if (role === 'admin') {
        redirectUrl = '/admin';
      } else if (role === 'freelancer') {
        if (hasProfile) {
          fallbackOnboardingStatus = 'pending_review';
          redirectUrl = '/freelancer';
        } else if (phoneNumber === '9876543211' || fullName.includes('Aarav')) {
          fallbackOnboardingStatus = 'approved';
          redirectUrl = '/freelancer';
        } else {
          fallbackOnboardingStatus = 'incomplete';
          redirectUrl = '/freelancer/onboarding';
        }
      }

      const fallbackUser: ArtsyUser = {
        id: crypto.randomUUID(),
        email: `${(phoneNumber || '9876543210').replace(/\D/g, '')}@artsyprod.studio`,
        phone: fullPhone,
        full_name: fullName.trim() || (role === 'client' ? 'Sneha Patel' : role === 'freelancer' ? 'Aarav Sen' : 'Studio Director'),
        role,
        status: 'active',
        onboarding_status: fallbackOnboardingStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCurrentUser(fallbackUser);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4 font-sans text-[#1D1D1F]">
      <div className="w-full max-w-[420px] bg-white border border-[#E5E5E7] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E5E7]">
          <Link href="/" className="flex flex-col select-none">
            <span className="font-extrabold text-sm tracking-[0.16em] text-[#1D1D1F] uppercase">
              ARTSY
            </span>
            <span className="font-mono text-[7px] tracking-[0.24em] text-[#86868B] uppercase">
              PRODUCTION
            </span>
          </Link>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            OTP Security
          </span>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h1 className="text-lg font-bold text-[#1D1D1F]">Verification Successful</h1>
            <p className="text-xs text-[#86868B]">
              Redirecting you to your workspace...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-lg font-bold text-[#1D1D1F]">Verify Mobile Number</h1>
              <p className="text-xs text-[#86868B] mt-1">
                Enter the 6-digit code sent to <strong className="text-[#1D1D1F]">{fullPhone}</strong>
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 text-center">
              Demo Access Code: <strong className="font-mono">123456</strong>
            </div>

            <div className="flex justify-center gap-2 my-4">
              {['0', '1', '2', '3', '4', '5'].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={otp[index] || ''}
                  onChange={(e) => {
                    const char = e.target.value;
                    const newOtp = otp.split('');
                    newOtp[index] = char;
                    setOtp(newOtp.join(''));

                    if (char && index < 5) {
                      const next = document.getElementById(`otp-input-${index + 1}`);
                      if (next) next.focus();
                    }
                  }}
                  className="w-11 h-12 text-center text-lg font-mono font-bold border border-[#E5E5E7] rounded-xl bg-[#F5F5F7] focus:bg-white focus:border-blue-500 focus:outline-none"
                  id={`otp-input-${index}`}
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full py-3 bg-[#1D1D1F] hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {isLoading ? 'Verifying Code...' : 'Confirm & Open Portal'}
            </button>

            <div className="text-center pt-2">
              <Link href="/auth/login" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}