'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';
import { useAuth, setCurrentUser } from '@/lib/auth';

type AccountType = 'b2c' | 'b2b';

interface ClientProfileData {
  accountType: AccountType;
  displayName: string;
  legalName: string;
  gstin: string;
  phone: string;
  email: string;
  ingestProvider: string;
  ingestLink: string;
  brandLuts: string;
  collaborators: string;
}

const DEFAULT_PROFILE: ClientProfileData = {
  accountType: 'b2c',
  displayName: 'Sneha Patel Films',
  legalName: 'Sneha Patel',
  gstin: '',
  phone: '+91 9876543210',
  email: 'client@artsyprod.studio',
  ingestProvider: 'Google Drive Enterprise',
  ingestLink: 'https://drive.google.com/drive/folders/artsy-raw-ingest-8841',
  brandLuts: 'Kodak 2383 Film Print Emulation, Warm Sangeet Tones',
  collaborators: 'director@kapoorstudios.in, producer@kapoorstudios.in',
};

function ClientStudioSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams?.get('onboarding') === 'true';

  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfileData>(DEFAULT_PROFILE);
  const [savedNotice, setSavedNotice] = useState(false);

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    type: 'phone' | 'email';
    newValue: string;
    step: 'input' | 'verify';
    otpCode: string;
    countdown: number;
    error: string;
  }>({
    open: false,
    type: 'phone',
    newValue: '',
    step: 'input',
    otpCode: '',
    countdown: 0,
    error: '',
  });

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpModal.countdown > 0) {
      interval = setInterval(() => {
        setOtpModal((prev) => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpModal.countdown]);

  // Load existing profile from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile((prev) => ({ ...prev, ...parsed }));
        } else if (user) {
          setProfile((prev) => ({
            ...prev,
            displayName: user.full_name || prev.displayName,
            legalName: user.full_name || prev.legalName,
            phone: user.phone || prev.phone,
            email: user.email || prev.email,
          }));
        }
      } catch { }
    }
  }, [user]);

  // Save profile handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_client_profile', JSON.stringify(profile));
      if (user) {
        setCurrentUser({
          ...user,
          full_name: profile.displayName || user.full_name,
          phone: profile.phone,
          email: profile.email,
        });
      }
    }
    setSavedNotice(true);
    if (isOnboarding) {
      setTimeout(() => {
        const dest = sessionStorage.getItem('artsy_redirect') || '/client/projects';
        router.push(dest);
      }, 1200);
    } else {
      setTimeout(() => setSavedNotice(false), 3500);
    }
  };

  // Open OTP Change Modal
  const openChangeModal = (type: 'phone' | 'email') => {
    setOtpModal({
      open: true,
      type,
      newValue: type === 'phone' ? profile.phone : profile.email,
      step: 'input',
      otpCode: '',
      countdown: 0,
      error: '',
    });
  };

  // Send OTP
  const handleSendOtp = () => {
    if (otpModal.type === 'phone') {
      const cleanPhone = otpModal.newValue.trim();
      if (!/^\+?[0-9\s-]{10,15}$/.test(cleanPhone)) {
        setOtpModal((prev) => ({ ...prev, error: 'Please enter a valid 10-digit mobile number.' }));
        return;
      }
    } else {
      const cleanEmail = otpModal.newValue.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setOtpModal((prev) => ({ ...prev, error: 'Please enter a valid email address.' }));
        return;
      }
    }

    setOtpModal((prev) => ({
      ...prev,
      step: 'verify',
      countdown: 45,
      error: '',
    }));
  };

  // Verify OTP & Update
  const handleVerifyOtp = () => {
    if (otpModal.otpCode.trim().length < 4) {
      setOtpModal((prev) => ({ ...prev, error: 'Please enter the 4-digit verification code.' }));
      return;
    }

    // Success: Update state & user session
    const updated = {
      ...profile,
      [otpModal.type]: otpModal.newValue.trim(),
    };
    setProfile(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_client_profile', JSON.stringify(updated));
      if (user) {
        setCurrentUser({
          ...user,
          phone: otpModal.type === 'phone' ? otpModal.newValue.trim() : user.phone,
          email: otpModal.type === 'email' ? otpModal.newValue.trim() : user.email,
        });
      }
    }

    setOtpModal((prev) => ({ ...prev, open: false }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
            {/* Toast Notification */}
            {savedNotice && (
              <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
                <span>✓ Workspace settings and credentials updated successfully.</span>
                <button
                  type="button"
                  onClick={() => setSavedNotice(false)}
                  className="text-white/80 hover:text-white ml-2 text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Breadcrumb & Header */}
            <div>
              <div className="flex items-center gap-2">
                <Link href="/client/projects" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Projects
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs font-bold text-[#1D1D1F]">Workspace Setup</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
                Workspace Identity &amp; Ingest Setup
              </h1>
            </div>

            {/* Onboarding Welcome Banner */}
            {isOnboarding && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#1D1D1F] text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse shrink-0" />
                  <span className="font-semibold text-blue-950">
                    Step 2: Workspace &amp; Ingest Setup &mdash; Configure your operating model and shared footage link to activate your production dashboard.
                  </span>
                </div>
              </div>
            )}

            {/* Account Type Selector (B2C vs B2B) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E5E7] shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] mb-2">
                  Operating Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, accountType: 'b2c' })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${profile.accountType === 'b2c'
                        ? 'border-[#3B82F6] bg-blue-50/50 shadow-xs ring-1 ring-[#3B82F6]'
                        : 'border-[#E5E5E7] bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                        <span>👤</span> Individual / Freelancer
                      </span>
                      {profile.accountType === 'b2c' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#86868B] mt-1.5 leading-relaxed">
                      For solo videographers, creators, and photographers. No GST required; standard retail invoice issued.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, accountType: 'b2b' })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${profile.accountType === 'b2b'
                        ? 'border-[#3B82F6] bg-blue-50/50 shadow-xs ring-1 ring-[#3B82F6]'
                        : 'border-[#E5E5E7] bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                        <span>🏢</span> Registered Studio / Agency
                      </span>
                      {profile.accountType === 'b2b' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#86868B] mt-1.5 leading-relaxed">
                      For registered firms, LLPs &amp; Pvt Ltd agencies. Input Tax Credit (ITC) with statutory GSTIN.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-7">
              {/* Identity Block */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                  {profile.accountType === 'b2b' ? 'Corporate Identity' : 'Creator Identity'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                      {profile.accountType === 'b2b' ? 'Studio Brand Name' : 'Brand or Display Name'}
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      placeholder={profile.accountType === 'b2b' ? 'e.g. S. Kapoor Studios' : 'e.g. Sneha Patel Films'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                      {profile.accountType === 'b2b' ? 'Registered Company Name' : 'Full Legal Name (For Billing)'}
                    </label>
                    <input
                      type="text"
                      value={profile.legalName}
                      onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                      placeholder={profile.accountType === 'b2b' ? 'e.g. S. Kapoor Studios Private Limited' : 'e.g. Sneha Patel'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>
                </div>

                {profile.accountType === 'b2b' && (
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={profile.gstin}
                      onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                      placeholder="07AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full font-mono uppercase px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#86868B] mt-1">
                      Statutory 15-character GSTIN will be embedded on all tax invoices.
                    </p>
                  </div>
                )}
              </div>

              {/* Login Credentials & Phone/Email OTP Section */}
              <div className="pt-6 border-t border-[#F5F5F7] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                    Login Credentials &amp; Verification
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mobile Phone Card */}
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                        Login Mobile Number
                      </div>
                      <div className="font-mono text-sm font-bold text-[#1D1D1F] mt-1">
                        {profile.phone}
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#E5E5E7] flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => openChangeModal('phone')}
                        className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] hover:underline cursor-pointer"
                      >
                        Change Number &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Email Card */}
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                        Login Email Address
                      </div>
                      <div className="text-xs font-semibold text-[#1D1D1F] mt-1 truncate">
                        {profile.email}
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#E5E5E7] flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => openChangeModal('email')}
                        className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] hover:underline cursor-pointer"
                      >
                        Change Email &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingest Pipelines Block */}
              <div className="pt-6 border-t border-[#F5F5F7] space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                  Default Cloud Ingest Pipelines
                </h2>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    Shared Ingest Folder or Cloud URL
                  </label>
                  <input
                    type="url"
                    value={profile.ingestLink}
                    onChange={(e) => setProfile({ ...profile, ingestLink: e.target.value })}
                    placeholder="https://drive.google.com/... or any Dropbox, WeTransfer, Frame.io link"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#86868B] mt-1">
                    Accepts links from any platform (Google Drive, Dropbox, WeTransfer, Frame.io, OneDrive, etc.).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    Brand Color LUTs &amp; Look Directives
                  </label>
                  <input
                    type="text"
                    value={profile.brandLuts}
                    onChange={(e) => setProfile({ ...profile, brandLuts: e.target.value })}
                    placeholder="e.g. Kodak 2383 Film Print Emulation, Warm Sangeet Tones"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    Team Collaborator Emails (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.collaborators}
                    onChange={(e) => setProfile({ ...profile, collaborators: e.target.value })}
                    placeholder="e.g. director@studio.com, secondshooter@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#F5F5F7] flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isOnboarding ? 'Save Workspace & Continue to Projects →' : 'Save Workspace Configuration'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* OTP Verification Modal */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E5E5E7] shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F7]">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">
                  Update {otpModal.type === 'phone' ? 'Mobile Number' : 'Email Address'}
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  {otpModal.step === 'input'
                    ? `Enter your new ${otpModal.type === 'phone' ? 'phone number' : 'email'} to receive a one-time passcode.`
                    : `Enter the 4-digit code sent to ${otpModal.newValue}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtpModal((prev) => ({ ...prev, open: false }))}
                className="text-[#86868B] hover:text-[#1D1D1F] p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {otpModal.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {otpModal.error}
              </div>
            )}

            {otpModal.step === 'input' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    New {otpModal.type === 'phone' ? 'Mobile Number' : 'Email Address'}
                  </label>
                  <input
                    type={otpModal.type === 'phone' ? 'tel' : 'email'}
                    value={otpModal.newValue}
                    onChange={(e) => setOtpModal({ ...otpModal, newValue: e.target.value, error: '' })}
                    placeholder={otpModal.type === 'phone' ? '+91 98765 43210' : 'new.email@domain.com'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpModal((prev) => ({ ...prev, open: false }))}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Send OTP Verification &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    4-Digit One-Time Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otpModal.otpCode}
                    onChange={(e) => setOtpModal({ ...otpModal, otpCode: e.target.value, error: '' })}
                    placeholder="e.g. 4210"
                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-[#1D1D1F] focus:bg-white focus:border-[#3B82F6] focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#86868B] mt-2">
                    <span>Demo Test OTP: <strong className="text-[#1D1D1F]">4210</strong></span>
                    {otpModal.countdown > 0 ? (
                      <span>Resend in {otpModal.countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#3B82F6] font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpModal((prev) => ({ ...prev, step: 'input' }))}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:bg-slate-100 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Verify &amp; Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientStudioSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-xs text-[#86868B]">Loading Workspace Setup...</div>}>
      <ClientStudioSetupContent />
    </Suspense>
  );
}
