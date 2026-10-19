'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';
import { useAuth, setCurrentUser, logout } from '@/lib/auth';

type AccountType = 'b2c' | 'b2b';

interface ClientFullProfile {
  accountType: AccountType;
  fullName: string;
  studioName: string;
  logoUrl: string;
  whatsapp: string;
  whatsappVerified: boolean;
  email: string;
  emailVerified: boolean;
  billingName: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  ingestProvider: string;
  ingestLink: string;
  brandLuts: string;
  aspectRatioPreset: string;
  collaborators: string;
  notifyWhatsApp: boolean;
  notifyEmail: boolean;
  notifyMilestones: boolean;
}

const INGEST_PROVIDERS = [
  'Google Drive Enterprise',
  'Dropbox Business',
  'Frame.io',
  'WeTransfer Pro',
  'OneDrive / SharePoint',
  'Backblaze B2 / AWS S3',
  'Aspera / Signiant High-Speed',
];

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 Vertical Reel', desc: 'Instagram Reels, YouTube Shorts, TikTok (1080x1920)' },
  { id: '16:9', label: '16:9 Cinema Landscape', desc: 'Commercial Master, YouTube Cinema 4K UHD' },
  { id: '4:5', label: '4:5 Social Feed', desc: 'Instagram Portrait Feed (1080x1350)' },
  { id: '2.39:1', label: '2.39:1 Anamorphic', desc: 'Widescreen Theatrical Scope' },
];

export default function ClientProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [accountType, setAccountType] = useState<AccountType>('b2b');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [studioName, setStudioName] = useState(user?.display_name || user?.full_name || 'Acme Studio');
  const [logoUrl, setLogoUrl] = useState(user?.avatar_url || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone || '+91 99000 00001');
  const [email, setEmail] = useState(user?.email || 'client@artsyproduction.com');

  // Verification & OTP States
  const [whatsappVerified, setWhatsappVerified] = useState<boolean>(true);
  const [verifiedWhatsappNumber, setVerifiedWhatsappNumber] = useState<string>('+91 99000 00001');
  const [whatsappOtpSent, setWhatsappOtpSent] = useState<boolean>(false);
  const [whatsappOtpInput, setWhatsappOtpInput] = useState<string>('');
  const [whatsappSending, setWhatsappSending] = useState<boolean>(false);
  const [whatsappVerifying, setWhatsappVerifying] = useState<boolean>(false);
  const [whatsappError, setWhatsappError] = useState<string>('');
  const [whatsappSuccess, setWhatsappSuccess] = useState<string>('');
  const [whatsappCountdown, setWhatsappCountdown] = useState<number>(0);
  const [whatsappDevOtp, setWhatsappDevOtp] = useState<string>('');

  const [emailVerified, setEmailVerified] = useState<boolean>(true);
  const [verifiedEmailAddress, setVerifiedEmailAddress] = useState<string>('client@artsyproduction.com');
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailOtpInput, setEmailOtpInput] = useState<string>('');
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailVerifying, setEmailVerifying] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSuccess, setEmailSuccess] = useState<string>('');
  const [emailCountdown, setEmailCountdown] = useState<number>(0);
  const [emailDevOtp, setEmailDevOtp] = useState<string>('');

  // Billing States
  const [billingName, setBillingName] = useState('Acme Studio Productions LLP');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Workspace & Ingest States
  const [ingestProvider, setIngestProvider] = useState('Google Drive Enterprise');
  const [ingestLink, setIngestLink] = useState('');
  const [brandLuts, setBrandLuts] = useState('Standard Rec.709 Master');
  const [aspectRatioPreset, setAspectRatioPreset] = useState('9:16');
  const [collaborators, setCollaborators] = useState('');

  // Notifications
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyMilestones, setNotifyMilestones] = useState(true);

  // UI state
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // DPDP Privacy & Account Deletion States
  const [isExportingData, setIsExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExportData = async () => {
    if (!user?.id) {
      alert('Authentication required to export data.');
      return;
    }
    setIsExportingData(true);
    try {
      const res = await fetch(`/api/user/data-export?userId=${encodeURIComponent(user.id)}`);
      if (!res.ok) throw new Error('Data export request failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artsy-data-portfolio-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Unable to generate data export portfolio at this time.');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleConfirmAccountDeletion = async () => {
    if (!user?.id) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm data erasure.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/user/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          reason: deleteReason.trim() || 'User requested erasure under DPDP Act',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to complete data deletion');
      }

      alert('Your account and personal data have been anonymized in accordance with the DPDP Act.');
      logout('/auth/login');
    } catch (err: any) {
      setDeleteError(err.message || 'Deletion failed. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  // Countdown timers for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (whatsappCountdown > 0) {
      timer = setTimeout(() => setWhatsappCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [whatsappCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // Load initial profile prioritizing live database data from useAuth()
  useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.display_name) setStudioName(user.display_name);
      if (user.phone) {
        setWhatsapp(user.phone);
        setVerifiedWhatsappNumber(user.phone);
      }
      if (user.email) {
        setEmail(user.email);
        setVerifiedEmailAddress(user.email);
      }
      if (user.avatar_url) setLogoUrl(user.avatar_url);

      const sd = (user as any).studio_details;
      if (sd && typeof sd === 'object') {
        if (sd.accountType) setAccountType(sd.accountType);
        if (sd.studioName) setStudioName(sd.studioName);
        if (sd.fullName) setFullName(sd.fullName);
        if (sd.logoUrl) setLogoUrl(sd.logoUrl);
        if (sd.billingName) setBillingName(sd.billingName);
        if (sd.gstin) setGstin(sd.gstin);
        if (sd.address) setAddress(sd.address);
        if (sd.city) setCity(sd.city);
        if (sd.state) setState(sd.state);
        if (sd.pincode) setPincode(sd.pincode);
        if (sd.ingestProvider) setIngestProvider(sd.ingestProvider);
        if (sd.ingestLink) setIngestLink(sd.ingestLink);
        if (sd.brandLuts) setBrandLuts(sd.brandLuts);
        if (sd.aspectRatioPreset) setAspectRatioPreset(sd.aspectRatioPreset);
        if (sd.collaborators) setCollaborators(sd.collaborators);
        if (typeof sd.notifyWhatsApp === 'boolean') setNotifyWhatsApp(sd.notifyWhatsApp);
        if (typeof sd.notifyEmail === 'boolean') setNotifyEmail(sd.notifyEmail);
        if (typeof sd.notifyMilestones === 'boolean') setNotifyMilestones(sd.notifyMilestones);
        return;
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        if (stored) {
          const p = JSON.parse(stored);
          if (p.accountType) setAccountType(p.accountType);
          if (p.fullName) setFullName(p.fullName);
          if (p.studioName) setStudioName(p.studioName);
          if (p.logoUrl) setLogoUrl(p.logoUrl);
          if (p.whatsapp || p.phone) {
            const num = p.whatsapp || p.phone;
            setWhatsapp(num);
            setVerifiedWhatsappNumber(num);
          }
          if (typeof p.whatsappVerified === 'boolean') {
            setWhatsappVerified(p.whatsappVerified);
          }
          if (p.email) {
            setEmail(p.email);
            setVerifiedEmailAddress(p.email);
          }
          if (typeof p.emailVerified === 'boolean') {
            setEmailVerified(p.emailVerified);
          }
          if (p.billingName) setBillingName(p.billingName);
          if (p.gstin) setGstin(p.gstin);
          if (p.address) setAddress(p.address);
          if (p.city) setCity(p.city);
          if (p.state) setState(p.state);
          if (p.pincode) setPincode(p.pincode);
          if (p.ingestProvider) setIngestProvider(p.ingestProvider);
          if (p.ingestLink) setIngestLink(p.ingestLink);
          if (p.brandLuts) setBrandLuts(p.brandLuts);
          if (p.aspectRatioPreset) setAspectRatioPreset(p.aspectRatioPreset);
          if (p.collaborators) setCollaborators(p.collaborators);
          if (typeof p.notifyWhatsApp === 'boolean') setNotifyWhatsApp(p.notifyWhatsApp);
          if (typeof p.notifyEmail === 'boolean') setNotifyEmail(p.notifyEmail);
          if (typeof p.notifyMilestones === 'boolean') setNotifyMilestones(p.notifyMilestones);
        }
      } catch {}
    }
  }, [user]);

  // Handle Logo Upload via FileReader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newLogo = reader.result;
        setLogoUrl(newLogo);

        // Immediately update localStorage and auth state so header & sidebar show logo in real time!
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('artsy_client_profile');
            const parsed = raw ? JSON.parse(raw) : {};
            parsed.logoUrl = newLogo;
            localStorage.setItem('artsy_client_profile', JSON.stringify(parsed));
          } catch {}

          if (user) {
            setCurrentUser({ ...user, avatar_url: newLogo });
          }
          window.dispatchEvent(new Event('artsy_profile_updated'));
          window.dispatchEvent(new Event('artsy_auth_change'));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('artsy_client_profile');
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.logoUrl = '';
        localStorage.setItem('artsy_client_profile', JSON.stringify(parsed));
      } catch {}

      if (user) {
        setCurrentUser({ ...user, avatar_url: '' });
      }
      window.dispatchEvent(new Event('artsy_profile_updated'));
      window.dispatchEvent(new Event('artsy_auth_change'));
    }
  };

  // WhatsApp OTP Send & Verify Handlers
  const handleSendWhatsappOtp = async () => {
    const rawDigits = whatsapp.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (cleanPhone.length !== 10) {
      setWhatsappError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setWhatsappSending(true);
    setWhatsappError('');
    setWhatsappSuccess('');
    setWhatsappDevOtp('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          action: 'send',
          role: 'client',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWhatsappError(data.error || 'Failed to send WhatsApp verification code.');
        setWhatsappSending(false);
        return;
      }

      setWhatsappOtpSent(true);
      setWhatsappSending(false);
      if (data.devOtp) {
        setWhatsappDevOtp(data.devOtp);
      }
      setWhatsappCountdown(30);
    } catch {
      setWhatsappError('Network error while requesting verification code.');
      setWhatsappSending(false);
    }
  };

  const handleVerifyWhatsappOtp = async () => {
    if (!whatsappOtpInput.trim()) {
      setWhatsappError('Please enter the 6-digit OTP code.');
      return;
    }

    setWhatsappVerifying(true);
    setWhatsappError('');

    try {
      const rawDigits = whatsapp.replace(/\D/g, '');
      const cleanPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;

      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: whatsappOtpInput.trim(),
          action: 'verify',
          purpose: 'verify_only',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setWhatsappError(data.error || 'Invalid OTP code. Please try again.');
        setWhatsappVerifying(false);
        return;
      }

      setWhatsappVerified(true);
      setVerifiedWhatsappNumber(whatsapp.trim());
      setWhatsappOtpSent(false);
      setWhatsappOtpInput('');
      setWhatsappVerifying(false);
      setWhatsappSuccess('WhatsApp number verified successfully!');
      setTimeout(() => setWhatsappSuccess(''), 4000);

      // Persist verification status
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        const p = stored ? JSON.parse(stored) : {};
        p.whatsapp = whatsapp.trim();
        p.whatsappVerified = true;
        localStorage.setItem('artsy_client_profile', JSON.stringify(p));
      } catch {}
    } catch {
      setWhatsappError('Network error verifying code.');
      setWhatsappVerifying(false);
    }
  };

  // Email OTP Send & Verify Handlers
  const handleSendEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailSending(true);
    setEmailError('');
    setEmailSuccess('');
    setEmailDevOtp('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          action: 'send',
          role: 'client',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || 'Failed to send email verification code.');
        setEmailSending(false);
        return;
      }

      setEmailOtpSent(true);
      setEmailSending(false);
      if (data.devOtp) {
        setEmailDevOtp(data.devOtp);
      }
      setEmailCountdown(30);
    } catch {
      setEmailError('Network error while requesting email code.');
      setEmailSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpInput.trim()) {
      setEmailError('Please enter the 6-digit OTP code.');
      return;
    }

    setEmailVerifying(true);
    setEmailError('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: emailOtpInput.trim(),
          action: 'verify',
          purpose: 'verify_only',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setEmailError(data.error || 'Invalid OTP code. Please try again.');
        setEmailVerifying(false);
        return;
      }

      setEmailVerified(true);
      setVerifiedEmailAddress(email.trim().toLowerCase());
      setEmailOtpSent(false);
      setEmailOtpInput('');
      setEmailVerifying(false);
      setEmailSuccess('Email address verified successfully!');
      setTimeout(() => setEmailSuccess(''), 4000);

      // Persist verification status
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        const p = stored ? JSON.parse(stored) : {};
        p.email = email.trim();
        p.emailVerified = true;
        localStorage.setItem('artsy_client_profile', JSON.stringify(p));
      } catch {}
    } catch {
      setEmailError('Network error verifying email code.');
      setEmailVerifying(false);
    }
  };

  // Full Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedFeedback(false);

    const updatedProfile: Partial<ClientFullProfile> = {
      accountType,
      fullName: fullName.trim(),
      studioName: studioName.trim(),
      logoUrl,
      whatsapp: whatsapp.trim(),
      whatsappVerified,
      email: email.trim(),
      emailVerified,
      billingName: billingName.trim(),
      gstin: gstin.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      ingestProvider,
      ingestLink: ingestLink.trim(),
      brandLuts: brandLuts.trim(),
      aspectRatioPreset,
      collaborators: collaborators.trim(),
      notifyWhatsApp,
      notifyEmail,
      notifyMilestones,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_client_profile', JSON.stringify(updatedProfile));
    }

    // Sync auth user session & header/sidebar avatar
    if (user) {
      const updatedUser = {
        ...user,
        full_name: fullName.trim() || user.full_name,
        display_name: studioName.trim() || user.display_name,
        phone: whatsapp.trim() || user.phone,
        email: email.trim() || user.email,
        avatar_url: logoUrl || user.avatar_url,
        studio_details: updatedProfile,
      };
      setCurrentUser(updatedUser);
    }

    window.dispatchEvent(new Event('artsy_profile_updated'));
    window.dispatchEvent(new Event('artsy_auth_change'));

    // Attempt server sync
    try {
      await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim() || studioName.trim(),
          display_name: studioName.trim(),
          studio_details: updatedProfile,
          avatar_url: logoUrl || undefined,
          onboarded: true,
        }),
      });
    } catch {
      // ignore in offline/local dev mode
    }

    setSaving(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 4000);
  };

  const initials = studioName
    ? studioName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AS';

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
            {/* Toast Feedback */}
            {savedFeedback && (
              <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-3 animate-fade-in">
                <span>✓ Profile, studio identity, billing, and workspace settings saved successfully.</span>
                <button
                  type="button"
                  onClick={() => setSavedFeedback(false)}
                  className="text-white/80 hover:text-white ml-2 text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Header Strip (without any breadcrumb sub-names) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                  Profile &amp; Workspace
                </h1>
                <p className="text-xs sm:text-sm text-[#86868B] mt-1">
                  Manage your contact details, company name, logo, billing info, and shared storage folders.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Section 1: Studio & Brand Identity (with Logo Upload) */}
              <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1D1D1F]">Studio Identity &amp; Logo</h2>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Your studio name and logo appear on video review rooms and in the top-right navigation bar
                    </p>
                  </div>
                </div>

                {/* Logo Upload Component */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
                  <div className="relative group shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Studio Logo"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm bg-white"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-extrabold text-xl tracking-wider shadow-sm select-none">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold text-[#1D1D1F]">
                      Company Logo
                    </div>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                      Upload your company logo or brand mark (PNG, JPG, WebP, SVG up to 5MB). When uploaded, it will automatically appear in the top-right header and sidebar.
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E5E5E7] hover:border-[#3B82F6] text-[#1D1D1F] text-xs font-semibold shadow-2xs hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>


                {/* Studio & Company Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. Acme Productions"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Direct Contact Details (WhatsApp & Email with OTP Confirmation) */}
              <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <h2 className="text-base font-bold text-[#1D1D1F]">Direct Contact &amp; OTP Verification</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    We send draft video links and tax invoices to these verified contact channels.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WhatsApp Field with OTP */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#FBFBFC] border border-[#E5E5E7]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        WhatsApp Number *
                      </label>
                      {whatsappVerified ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhatsapp(val);
                          if (val.trim() !== verifiedWhatsappNumber.trim()) {
                            setWhatsappVerified(false);
                            setWhatsappSuccess('');
                          } else {
                            setWhatsappVerified(true);
                          }
                        }}
                        placeholder="+91 99000 00001"
                        className="flex-1 bg-white border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#3B82F6]"
                        required
                      />

                      {!whatsappVerified && !whatsappOtpSent && (
                        <button
                          type="button"
                          onClick={handleSendWhatsappOtp}
                          disabled={whatsappSending}
                          className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {whatsappSending ? 'Sending...' : 'Verify OTP'}
                        </button>
                      )}
                    </div>

                    {whatsappSuccess && (
                      <p className="text-[11px] text-emerald-600 font-semibold">{whatsappSuccess}</p>
                    )}
                    {whatsappError && (
                      <p className="text-[11px] text-red-600 font-semibold">{whatsappError}</p>
                    )}

                    {/* Inline OTP Input Box for WhatsApp */}
                    {whatsappOtpSent && (
                      <div className="mt-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-900">Enter 6-digit WhatsApp OTP</span>
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsappOtpSent(false);
                              setWhatsappError('');
                            }}
                            className="text-[#86868B] hover:text-[#1D1D1F] text-xs"
                          >
                            Cancel
                          </button>
                        </div>

                        {whatsappDevOtp && (
                          <div className="text-[10px] bg-amber-100 text-amber-900 px-2 py-1 rounded font-mono">
                            Dev Mode OTP: <strong>{whatsappDevOtp}</strong>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={whatsappOtpInput}
                            onChange={(e) => setWhatsappOtpInput(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="flex-1 font-mono tracking-widest text-center text-sm font-bold bg-white border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyWhatsappOtp}
                            disabled={whatsappVerifying}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            {whatsappVerifying ? 'Checking...' : 'Confirm'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#86868B]">
                          <span>Code expires in 5 minutes</span>
                          {whatsappCountdown > 0 ? (
                            <span>Resend in {whatsappCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendWhatsappOtp}
                              className="text-blue-600 hover:underline font-semibold cursor-pointer"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-[#86868B] pt-0.5">
                      Receives automated WhatsApp pings when video drafts or revisions are ready.
                    </p>
                  </div>

                  {/* Email Field with OTP */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#FBFBFC] border border-[#E5E5E7]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        Email Address *
                      </label>
                      {emailVerified ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEmail(val);
                          if (val.trim().toLowerCase() !== verifiedEmailAddress.trim().toLowerCase()) {
                            setEmailVerified(false);
                            setEmailSuccess('');
                          } else {
                            setEmailVerified(true);
                          }
                        }}
                        placeholder="client@artsyproduction.com"
                        className="flex-1 bg-white border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#3B82F6]"
                        required
                      />

                      {!emailVerified && !emailOtpSent && (
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={emailSending}
                          className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {emailSending ? 'Sending...' : 'Verify OTP'}
                        </button>
                      )}
                    </div>

                    {emailSuccess && (
                      <p className="text-[11px] text-emerald-600 font-semibold">{emailSuccess}</p>
                    )}
                    {emailError && (
                      <p className="text-[11px] text-red-600 font-semibold">{emailError}</p>
                    )}

                    {/* Inline OTP Input Box for Email */}
                    {emailOtpSent && (
                      <div className="mt-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-900">Enter 6-digit Email OTP</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailOtpSent(false);
                              setEmailError('');
                            }}
                            className="text-[#86868B] hover:text-[#1D1D1F] text-xs"
                          >
                            Cancel
                          </button>
                        </div>

                        {emailDevOtp && (
                          <div className="text-[10px] bg-amber-100 text-amber-900 px-2 py-1 rounded font-mono">
                            Dev Mode OTP: <strong>{emailDevOtp}</strong>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={emailOtpInput}
                            onChange={(e) => setEmailOtpInput(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="flex-1 font-mono tracking-widest text-center text-sm font-bold bg-white border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyEmailOtp}
                            disabled={emailVerifying}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            {emailVerifying ? 'Checking...' : 'Confirm'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#86868B]">
                          <span>Code expires in 5 minutes</span>
                          {emailCountdown > 0 ? (
                            <span>Resend in {emailCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              className="text-blue-600 hover:underline font-semibold cursor-pointer"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-[#86868B] pt-0.5">
                      Receives official GST invoices, payment confirmations, and deliverables.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Invoicing & Billing Details */}
              <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <h2 className="text-base font-bold text-[#1D1D1F]">Billing &amp; Tax Invoice Details</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Information printed on official receipts and GST invoices
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      Billing Name (Company or Person) *
                    </label>
                    <input
                      type="text"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="e.g. Acme Studio Productions LLP"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      GSTIN (Optional / For Business Tax Credit)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="27AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full font-mono uppercase bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      Billing Street Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Studio / Registered office street address"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="400001"
                        maxLength={6}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Cloud Ingest & Workspace Setup */}
              <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1D1D1F]">Cloud Storage &amp; Video Preferences</h2>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Default cloud storage links and video editing preferences
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        Preferred Cloud Storage
                      </label>
                      <select
                        value={ingestProvider}
                        onChange={(e) => setIngestProvider(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                      >
                        {INGEST_PROVIDERS.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        Default Video Format / Size
                      </label>
                      <select
                        value={aspectRatioPreset}
                        onChange={(e) => setAspectRatioPreset(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                      >
                        {ASPECT_RATIOS.map((ratio) => (
                          <option key={ratio.id} value={ratio.id}>
                            {ratio.label} &mdash; {ratio.desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1D1D1F]">
                      Shared Cloud Storage Folder URL
                    </label>
                    <input
                      type="url"
                      value={ingestLink}
                      onChange={(e) => setIngestLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... or Dropbox link"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                    />
                    <p className="text-[10px] text-[#86868B]">
                      Your video editors will access raw video files and footage from this folder.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        Color Look &amp; Style Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={brandLuts}
                        onChange={(e) => setBrandLuts(e.target.value)}
                        placeholder="e.g. Warm natural skin tones, vibrant festive colors, cinematic mood"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F]">
                        Team Member Emails (Optional)
                      </label>
                      <input
                        type="text"
                        value={collaborators}
                        onChange={(e) => setCollaborators(e.target.value)}
                        placeholder="director@agency.com, assistant@studio.com"
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Notification Preferences */}
              <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <h2 className="text-base font-bold text-[#1D1D1F]">Notification Preferences</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Choose how you want to be notified about drafts and updates
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">WhatsApp Video Alerts</div>
                      <div className="text-[11px] text-[#86868B]">Get an instant WhatsApp message when a new video draft is ready for review</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyWhatsApp}
                      onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                      className="w-4 h-4 text-[#3B82F6] rounded-md focus:ring-0 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Email Invoices &amp; Receipts</div>
                      <div className="text-[11px] text-[#86868B]">Receive invoices and payment receipts by email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-4 h-4 text-[#3B82F6] rounded-md focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Data Privacy & Statutory Rights (DPDP Act Compliance) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F]">Data Privacy &amp; Statutory Rights</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023. You have the right to access, export, or permanently erase your personal data.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExportingData}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E5E7] hover:bg-slate-50 text-xs font-semibold text-[#1D1D1F] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExportingData ? (
                      'Preparing Export...'
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Personal Data (JSON)
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteConfirmText('');
                      setDeleteError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Account &amp; Erase Data
                  </button>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="pt-4 flex items-center justify-end">

                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>

            {/* DPDP Account Deletion Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-red-100 shadow-2xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-bold text-[#1D1D1F]">Permanently Erase Personal Data?</h3>
                    <p className="text-xs text-[#86868B] mt-1">
                      Under the DPDP Act, this will irrevocably anonymize your name, email, phone number, and billing details. Any active authentication sessions will be terminated immediately.
                    </p>
                  </div>

                  {deleteError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      {deleteError}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Reason for erasure (Optional):
                      </label>
                      <input
                        type="text"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="e.g. Closing agency, no longer needed"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-xs text-[#1D1D1F] focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      disabled={isDeletingAccount}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-[#E5E5E7] text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                      onClick={handleConfirmAccountDeletion}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-40 cursor-pointer"
                    >
                      {isDeletingAccount ? 'Erasing Data...' : 'Confirm Erasure'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
