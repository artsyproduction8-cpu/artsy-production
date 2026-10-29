'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, getCurrentUser, setCurrentUser, logout } from '@/lib/auth';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';
import HardwareSetupSection, {
  computeHardwareConfigString,
  parseHardwareConfig,
} from '@/components/freelancer/HardwareSetupSection';

const VERIFIED_ROLES = [
  'Commercial & Narrative Film Editor',
  'Color Grading & Sound Design Lead',
  'Wedding Film Specialist',
  'Documentary & Corporate Video Editor',
  'Social & UGC Lead Editor',
  'Motion Graphics & VFX Artist',
  'Other',
];

const extractTenDigitPhone = (raw?: string | null): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits.slice(-10);
};

export default function FreelancerProfilePage() {
  const { user } = useAuth();

  // Section 1: About You & Your Editing Style
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState(extractTenDigitPhone(user?.phone));
  const [email, setEmail] = useState(user?.email || '');
  const [specialty, setSpecialty] = useState('Commercial & Narrative Film Editor');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [showreelUrl, setShowreelUrl] = useState('');
  const [philosophy, setPhilosophy] = useState('');

  // Contact Channels & OTP Verification States
  const [phoneVerified, setPhoneVerified] = useState<boolean>(true);
  const [verifiedPhone, setVerifiedPhone] = useState<string>(extractTenDigitPhone(user?.phone));
  const [phoneOtpSent, setPhoneOtpSent] = useState<boolean>(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState<string>('');
  const [phoneSending, setPhoneSending] = useState<boolean>(false);
  const [phoneVerifying, setPhoneVerifying] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [phoneSuccess, setPhoneSuccess] = useState<string>('');
  const [phoneCountdown, setPhoneCountdown] = useState<number>(0);
  const [phoneDevOtp, setPhoneDevOtp] = useState<string>('');

  const [emailVerified, setEmailVerified] = useState<boolean>(true);
  const [verifiedEmail, setVerifiedEmail] = useState<string>(user?.email || '');
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailOtpInput, setEmailOtpInput] = useState<string>('');
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailVerifying, setEmailVerifying] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSuccess, setEmailSuccess] = useState<string>('');
  const [emailCountdown, setEmailCountdown] = useState<number>(0);
  const [emailDevOtp, setEmailDevOtp] = useState<string>('');

  // Loaded bank details refs for cancel edit restoration
  const loadedPanRef = useRef<string>('');
  const loadedAccountRef = useRef<string>('');
  const loadedIfscRef = useRef<string>('');

  // Section 2: Software & Weekly Availability
  const [software, setSoftware] = useState<string[]>([
    'DaVinci Resolve Studio',
    'Adobe Premiere Pro',
  ]);
  const [customSoftwareInput, setCustomSoftwareInput] = useState('');
  const [showCustomSoftware, setShowCustomSoftware] = useState(false);
  const [experience, setExperience] = useState('2 - 4 Years (Intermediate)');
  const [capacity, setCapacity] = useState('20 - 30 Hours / Week (Part-Time, ~2 projects)');
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);

  // Section 3: Computer & Hardware Setup
  const [primaryComputer, setPrimaryComputer] = useState('');
  const [monitorDisplay, setMonitorDisplay] = useState('');
  const [storageRig, setStorageRig] = useState('');
  const [audioSetup, setAudioSetup] = useState('');

  const hardwareConfig = computeHardwareConfigString(
    primaryComputer,
    monitorDisplay,
    storageRig,
    audioSetup
  );

  // Section 4: Portfolio Samples (3 Mandatory Videos)
  const [sampleUrl1, setSampleUrl1] = useState('');
  const [sampleUrl2, setSampleUrl2] = useState('');
  const [sampleUrl3, setSampleUrl3] = useState('');

  // Section 5: Bank Details for Direct Payouts
  const [pan, setPan] = useState('');
  const [legalName, setLegalName] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [isBankMasked, setIsBankMasked] = useState(false);
  const [editBankDetails, setEditBankDetails] = useState(false);

  // Section 6: Creator Agreement & NDA
  const [agreementSignedAt, setAgreementSignedAt] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState('');

  // Status & UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // DPDP Privacy States
  const [isExportingData, setIsExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Validation RegExes & Masking Checkers
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const bankAccountRegex = /^\d{9,18}$/;

  const isPanMasked = (val: string) =>
    /^[X•*]{5}[A-Z0-9]{5}$/i.test(val.trim()) ||
    /^[X•*]{10}$/.test(val.trim()) ||
    val.includes('•') ||
    val.includes('XXXXX');

  const isBankAccountMasked = (val: string) =>
    /^[X•*]{4,}\d{4}$/.test(val.trim()) ||
    /^[X•*]{9,18}$/.test(val.trim()) ||
    val.includes('•') ||
    val.includes('XXXX');

  const isIfscMasked = (val: string) =>
    /^[A-Z]{4}[•*X]{4}[A-Z0-9]{3}$/.test(val.trim()) ||
    /^[•*X]{11}$/.test(val.trim()) ||
    val.includes('•');

  const isValidVideoUrl = (urlStr: string): boolean => {
    if (!urlStr || urlStr.trim() === '') return false;
    try {
      const u = new URL(urlStr);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      const host = u.hostname.toLowerCase();
      return (
        host.includes('youtube.com') ||
        host.includes('youtu.be') ||
        host.includes('vimeo.com')
      );
    } catch {
      return false;
    }
  };

  const isPanValid = isPanMasked(pan) || (pan.trim().length === 10 && panRegex.test(pan.trim()));
  const isIfscValid = isIfscMasked(ifsc) || (ifsc.trim().length === 11 && ifscRegex.test(ifsc.trim()));
  const isBankAccountValid = isBankAccountMasked(bankAccount) || bankAccountRegex.test(bankAccount.trim());
  const isHardwareValid = primaryComputer.trim().length >= 3 || hardwareConfig.trim().length >= 5;
  const isSample1Valid = isValidVideoUrl(sampleUrl1.trim());
  const isSample2Valid = isValidVideoUrl(sampleUrl2.trim());
  const isSample3Valid = isValidVideoUrl(sampleUrl3.trim());
  const isLegalNameValid = legalName.trim().length >= 2;

  const isFormValid =
    isPanValid &&
    isIfscValid &&
    isBankAccountValid &&
    isHardwareValid &&
    isSample1Valid &&
    isSample2Valid &&
    isSample3Valid &&
    isLegalNameValid &&
    phoneVerified &&
    emailVerified;

  // Resend countdown timers for phone and email OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneCountdown > 0) {
      timer = setTimeout(() => setPhoneCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // WhatsApp / Mobile OTP Handlers
  const handleSendPhoneOtp = async () => {
    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setPhoneSending(true);
    setPhoneError('');
    setPhoneSuccess('');
    setPhoneDevOtp('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          action: 'send',
          purpose: 'verify_only',
          role: 'freelancer',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || 'Failed to send WhatsApp verification code.');
        setPhoneSending(false);
        return;
      }

      setPhoneOtpSent(true);
      setPhoneSending(false);
      if (data.devOtp) {
        setPhoneDevOtp(data.devOtp);
      }
      setPhoneCountdown(30);
    } catch {
      setPhoneError('Network error while requesting verification code.');
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpInput.trim()) {
      setPhoneError('Please enter the 6-digit OTP code.');
      return;
    }

    setPhoneVerifying(true);
    setPhoneError('');

    try {
      const cleanPhone = extractTenDigitPhone(phone);
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: phoneOtpInput.trim(),
          action: 'verify',
          purpose: 'verify_only',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setPhoneError(data.error || 'Invalid OTP code. Please try again.');
        setPhoneVerifying(false);
        return;
      }

      setPhoneVerified(true);
      setVerifiedPhone(cleanPhone);
      setPhoneOtpSent(false);
      setPhoneOtpInput('');
      setPhoneVerifying(false);

      // Immediately persist the verified phone to public.users and update session
      try {
        const updateRes = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${cleanPhone}` }),
        });
        const updateData = await updateRes.json();
        if (updateRes.ok && updateData.user) {
          setCurrentUser(updateData.user);
          setPhoneSuccess('Mobile number verified & saved to your account!');
        } else {
          setPhoneSuccess('Mobile number verified successfully!');
        }
      } catch {
        setPhoneSuccess('Mobile number verified successfully!');
      }
      setTimeout(() => setPhoneSuccess(''), 5000);
    } catch {
      setPhoneError('Network error verifying code.');
      setPhoneVerifying(false);
    }
  };

  // Email OTP Handlers
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
          purpose: 'verify_only',
          role: 'freelancer',
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

      const cleanEmail = email.trim().toLowerCase();
      setEmailVerified(true);
      setVerifiedEmail(cleanEmail);
      setEmailOtpSent(false);
      setEmailOtpInput('');
      setEmailVerifying(false);

      // Immediately persist the verified email to public.users and update session
      try {
        const updateRes = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const updateData = await updateRes.json();
        if (updateRes.ok && updateData.user) {
          setCurrentUser(updateData.user);
          setEmailSuccess('Email address verified & saved to your account!');
        } else {
          setEmailSuccess('Email address verified successfully!');
        }
      } catch {
        setEmailSuccess('Email address verified successfully!');
      }
      setTimeout(() => setEmailSuccess(''), 5000);
    } catch {
      setEmailError('Network error verifying email code.');
      setEmailVerifying(false);
    }
  };

  // Load creator data from local storage and server
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      // 1. Initial hydration from localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('artsy_creator_profile');
          if (stored) {
            const p = JSON.parse(stored);
            if (p.alias) setAlias(p.alias);
            if (p.legalName) setLegalName(p.legalName);
            if (p.specialty) {
              if (VERIFIED_ROLES.includes(p.specialty)) {
                setSpecialty(p.specialty);
              } else {
                setSpecialty('Other');
                setCustomSpecialty(p.specialty);
              }
            }
            if (p.showreelUrl) setShowreelUrl(p.showreelUrl);
            if (p.philosophy) setPhilosophy(p.philosophy);
            if (Array.isArray(p.software) && p.software.length) setSoftware(p.software);
            if (p.experience) setExperience(p.experience);
            if (p.capacity) setCapacity(p.capacity);
            if (Array.isArray(p.languages) && p.languages.length) setLanguages(p.languages);
            if (p.hardwareConfig) {
              const parsed = parseHardwareConfig(p.hardwareConfig);
              if (parsed.comp) setPrimaryComputer(parsed.comp);
              if (parsed.mon) setMonitorDisplay(parsed.mon);
              if (parsed.stor) setStorageRig(parsed.stor);
              if (parsed.aud) setAudioSetup(parsed.aud);
            }
            if (p.hardware) {
              if (p.hardware.primaryComputer) setPrimaryComputer(p.hardware.primaryComputer);
              if (p.hardware.monitorDisplay) setMonitorDisplay(p.hardware.monitorDisplay);
              if (p.hardware.storageRig) setStorageRig(p.hardware.storageRig);
              if (p.hardware.audioSetup) setAudioSetup(p.hardware.audioSetup);
            }
            if (p.sampleUrl1) setSampleUrl1(p.sampleUrl1);
            if (p.sampleUrl2) setSampleUrl2(p.sampleUrl2);
            if (p.sampleUrl3) setSampleUrl3(p.sampleUrl3);
            if (p.phone) setPhone(extractTenDigitPhone(p.phone));
            if (p.email) setEmail(p.email);
            if (p.bankName) setBankName(p.bankName);
            if (p.bankAccount) setBankAccount(p.bankAccount);
            if (p.ifsc) setIfsc(p.ifsc);
            if (p.pan) setPan(p.pan);
            if (p.agreement_signed_at) setAgreementSignedAt(p.agreement_signed_at);
            if (p.trackingId) setTrackingId(p.trackingId);
          }
        } catch {}
      }

      // 2. Authoritative server load from /api/user/me
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const u = data.user;
            const cp = u.creator_profile || {};
            const sd = u.studio_details || {};

            const loadedPhone = u.phone || sd.phone || '';
            if (loadedPhone) {
              const cleanTen = extractTenDigitPhone(loadedPhone);
              setPhone(cleanTen);
              setVerifiedPhone(cleanTen);
              setPhoneVerified(true);
            }

            const loadedEmail = u.email || sd.email || '';
            if (loadedEmail) {
              setEmail(loadedEmail);
              setVerifiedEmail(loadedEmail);
              setEmailVerified(true);
            }

            const loadedAlias = sd.alias || u.display_name || u.full_name || cp.public_display_name || '';
            if (loadedAlias) setAlias(loadedAlias);

            const loadedLegal = sd.legalName || cp.bank_account_name || u.full_name || '';
            if (loadedLegal) setLegalName(loadedLegal);

            const loadedSpecialty = cp.public_specialty || cp.specialty || sd.specialty;
            if (loadedSpecialty) {
              if (VERIFIED_ROLES.includes(loadedSpecialty)) {
                setSpecialty(loadedSpecialty);
              } else {
                setSpecialty('Other');
                setCustomSpecialty(loadedSpecialty);
              }
            }

            const loadedReel = cp.portfolio_url || sd.showreelUrl || '';
            if (loadedReel) setShowreelUrl(loadedReel);

            const loadedBio = cp.bio || sd.philosophy || '';
            if (loadedBio) setPhilosophy(loadedBio);

            const loadedSoftware = cp.software || sd.software;
            if (Array.isArray(loadedSoftware) && loadedSoftware.length) setSoftware(loadedSoftware);

            const loadedExp = sd.experience;
            if (loadedExp) setExperience(loadedExp);

            const loadedCap = sd.capacity;
            if (loadedCap) setCapacity(loadedCap);

            const loadedLangs = cp.languages || sd.languages;
            if (Array.isArray(loadedLangs) && loadedLangs.length) setLanguages(loadedLangs);

            const loadedHw = cp.hardware_config || sd.hardware_config || '';
            if (loadedHw) {
              const parsed = parseHardwareConfig(loadedHw);
              if (parsed.comp) setPrimaryComputer(parsed.comp);
              if (parsed.mon) setMonitorDisplay(parsed.mon);
              if (parsed.stor) setStorageRig(parsed.stor);
              if (parsed.aud) setAudioSetup(parsed.aud);
            }
            if (sd.hardware) {
              if (sd.hardware.primaryComputer) setPrimaryComputer(sd.hardware.primaryComputer);
              if (sd.hardware.monitorDisplay) setMonitorDisplay(sd.hardware.monitorDisplay);
              if (sd.hardware.storageRig) setStorageRig(sd.hardware.storageRig);
              if (sd.hardware.audioSetup) setAudioSetup(sd.hardware.audioSetup);
            }

            const loadedS1 = cp.sample_url_1 || sd.sample_url_1 || '';
            const loadedS2 = cp.sample_url_2 || sd.sample_url_2 || '';
            const loadedS3 = cp.sample_url_3 || sd.sample_url_3 || '';
            if (loadedS1) setSampleUrl1(loadedS1);
            if (loadedS2) setSampleUrl2(loadedS2);
            if (loadedS3) setSampleUrl3(loadedS3);

            const loadedPan = cp.pan_number || sd.pan || '';
            const loadedAccount = cp.bank_account_number || sd.bankAccount || '';
            const loadedIfsc = cp.bank_ifsc_code || sd.ifsc || '';
            const loadedBankName = cp.bank_name || sd.bankName || 'HDFC Bank';

            if (loadedPan) {
              setPan(loadedPan);
              loadedPanRef.current = loadedPan;
            }
            if (loadedAccount) {
              setBankAccount(loadedAccount);
              loadedAccountRef.current = loadedAccount;
            }
            if (loadedIfsc) {
              setIfsc(loadedIfsc);
              loadedIfscRef.current = loadedIfsc;
            }
            if (loadedBankName) setBankName(loadedBankName);

            if (
              isPanMasked(loadedPan) ||
              isBankAccountMasked(loadedAccount) ||
              isIfscMasked(loadedIfsc) ||
              Boolean(loadedPan && loadedAccount)
            ) {
              setIsBankMasked(true);
            }

            const loadedSignedAt = cp.agreement_signed_at || u.agreement_signed_at || null;
            if (loadedSignedAt) setAgreementSignedAt(loadedSignedAt);

            const loadedTracking = cp.tracking_id || u.tracking_id || '';
            if (loadedTracking) setTrackingId(loadedTracking);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const toggleSoftware = (item: string) => {
    setSoftware((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanLegal = legalName.trim();
    const cleanAlias = alias.trim();

    if (!cleanLegal && !cleanAlias) {
      showToast('Please enter your full legal name or creator alias.', 'error');
      return;
    }
    if (!cleanLegal || cleanLegal.length < 2) {
      showToast('Please enter your full legal name as per your PAN card.', 'error');
      return;
    }
    if (!isHardwareValid) {
      showToast('Please specify your Workstation & Hardware specs (CPU, GPU, RAM).', 'error');
      return;
    }
    if (!isSample1Valid || !isSample2Valid || !isSample3Valid) {
      showToast('All 3 Portfolio Sample video links must be valid YouTube or Vimeo URLs.', 'error');
      return;
    }
    if (!isPanValid) {
      showToast('Invalid PAN format (e.g., ABCDE1234F).', 'error');
      return;
    }
    if (!isBankAccountValid) {
      showToast('Invalid Bank Account number (must be 9 to 18 digits).', 'error');
      return;
    }
    if (!isIfscValid) {
      showToast('Invalid IFSC Code format (e.g., HDFC0001234).', 'error');
      return;
    }

    if (!phoneVerified) {
      showToast('Please verify your updated mobile number via OTP before saving.', 'error');
      return;
    }
    if (!emailVerified) {
      showToast('Please verify your updated email address via OTP before saving.', 'error');
      return;
    }

    setSaving(true);

    const cleanTenPhone = extractTenDigitPhone(phone);
    const formattedPhone = cleanTenPhone ? `+91${cleanTenPhone}` : '';
    const cleanEmail = email.trim().toLowerCase();

    const resolvedSpecialty = specialty === 'Other' ? (customSpecialty.trim() || 'Commercial & Narrative Film Editor') : specialty;

    const studioDetailsPayload: Record<string, any> = {
      alias: cleanAlias,
      legalName: cleanLegal,
      phone: formattedPhone,
      email: cleanEmail,
      specialty: resolvedSpecialty,
      showreelUrl: showreelUrl || sampleUrl1,
      philosophy,
      software,
      experience,
      capacity,
      languages,
      hardware_config: hardwareConfig,
      hardware: {
        primaryComputer,
        monitorDisplay,
        storageRig,
        audioSetup,
      },
      sample_url_1: sampleUrl1,
      sample_url_2: sampleUrl2,
      sample_url_3: sampleUrl3,
      bank_name: bankName,
      agreement_signed_at: agreementSignedAt,
    };

    const creatorProfilePayload: Record<string, any> = {
      public_display_name: cleanAlias,
      public_specialty: resolvedSpecialty,
      portfolio_url: showreelUrl || sampleUrl1,
      bio: philosophy,
      software,
      languages,
      hardware_config: hardwareConfig,
      hardware: {
        primaryComputer,
        monitorDisplay,
        storageRig,
        audioSetup,
      },
      sample_url_1: sampleUrl1,
      sample_url_2: sampleUrl2,
      sample_url_3: sampleUrl3,
      bank_name: bankName,
      bank_account_name: cleanLegal,
    };

    // Only update bank fields if user entered fresh, unmasked valid details
    if (!isPanMasked(pan) && pan.trim().length === 10 && panRegex.test(pan.trim())) {
      creatorProfilePayload.pan_number = pan.trim().toUpperCase();
    }
    if (!isBankAccountMasked(bankAccount) && bankAccountRegex.test(bankAccount.trim())) {
      creatorProfilePayload.bank_account_number = bankAccount.trim();
    }
    if (!isIfscMasked(ifsc) && ifscRegex.test(ifsc.trim())) {
      creatorProfilePayload.bank_ifsc_code = ifsc.trim().toUpperCase();
    }

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: cleanLegal,
          display_name: cleanAlias,
          phone: formattedPhone || undefined,
          email: cleanEmail || undefined,
          studio_details: studioDetailsPayload,
          creator_profile: creatorProfilePayload,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update creator profile');
      }

      // Update local storage
      if (typeof window !== 'undefined') {
        const localData = {
          alias: cleanAlias,
          legalName: cleanLegal,
          phone: cleanTenPhone,
          email: cleanEmail,
          specialty: resolvedSpecialty,
          showreelUrl: showreelUrl || sampleUrl1,
          philosophy,
          software,
          experience,
          capacity,
          languages,
          hardwareConfig,
          sampleUrl1,
          sampleUrl2,
          sampleUrl3,
          bankName,
          bankAccount,
          ifsc,
          pan,
          agreement_signed_at: agreementSignedAt,
          trackingId,
        };
        localStorage.setItem('artsy_creator_profile', JSON.stringify(localData));
      }

      const currentUser = getCurrentUser();
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          phone: formattedPhone || currentUser.phone,
          email: cleanEmail || currentUser.email,
          full_name: cleanLegal,
          display_name: cleanAlias,
          studio_details: studioDetailsPayload,
          creator_profile: {
            ...(currentUser.creator_profile || {}),
            ...creatorProfilePayload,
          },
        } as any);
        window.dispatchEvent(new Event('artsy_profile_updated'));
        window.dispatchEvent(new Event('artsy_auth_change'));
      }

      showToast('Creator profile and workstation credentials updated successfully!', 'success');
      setEditBankDetails(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // DPDP Handlers
  const handleExportData = async () => {
    if (!user?.id) {
      showToast('Authentication required to export data.', 'error');
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
      a.download = `artsy-creator-profile-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Data exported successfully!', 'success');
    } catch {
      showToast('Unable to export data at this time.', 'error');
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
          reason: deleteReason.trim() || 'Creator requested erasure under DPDP Act',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to complete data deletion');
      }

      alert('Your creator profile has been removed from the public roster. You have been safely logged out.');
      logout('/auth/login');
    } catch (err: any) {
      setDeleteError(err.message || 'Deletion failed. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
              <span>{toastMessage.type === 'success' ? '✓ ' : '⚠️ '}{toastMessage.text}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-white/60 hover:text-white ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
            {/* Top Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Creator Roster
                  </span>
                  {trackingId && (
                    <span className="text-[10px] font-mono text-[#86868B] bg-[#F5F5F7] px-2 py-0.5 rounded border border-[#E5E5E7]">
                      ID: {trackingId}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F] mt-1">
                  Creator Studio Profile
                </h1>
                <p className="text-sm text-[#86868B] mt-1">
                  Manage your verified editing identity, software stack, workstation specs, portfolio proof, and payout bank account.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/creators"
                  target="_blank"
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] border border-[#E5E5E7] transition-all"
                >
                  View Public Roster ↗
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-[#E5E5E7] text-center text-xs text-[#86868B]">
                Loading verified studio profile credentials...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column (8 cols) */}
                <div className="lg:col-span-8">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* 01 Identity & Style */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                            1
                          </span>
                          About You &amp; Your Editing Style
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            YOUR NAME OR EDITING ALIAS *
                          </label>
                          <input
                            type="text"
                            required
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            placeholder="e.g. Rahul S. or Rahul Edits"
                            className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                          />
                          <span className="text-[11px] text-[#86868B]">
                            Appears on your public creator card. To protect privacy, surnames are displayed as an initial only (e.g. Rahul S.).
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            SHOWREEL OR PORTFOLIO LINK *
                          </label>
                          <input
                            type="url"
                            required
                            value={showreelUrl}
                            onChange={(e) => setShowreelUrl(e.target.value)}
                            placeholder="https://youtube.com/... or Vimeo / Google Drive"
                            className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                          />
                          <span className="text-[11px] text-[#86868B]">Link to your main showreel or portfolio video (60 to 90 seconds is best).</span>
                        </div>
                      </div>

                      {/* Direct Contact & OTP Verification: WhatsApp & Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* WhatsApp / Mobile Number with OTP */}
                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#FBFBFC] border border-[#E5E5E7]">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#1D1D1F]">
                              WHATSAPP / MOBILE NUMBER *
                            </label>
                            {phoneVerified ? (
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
                            <div className="flex items-center rounded-xl border border-[#E5E5E7] bg-white focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10 overflow-hidden flex-1 transition-all">
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F5F7] border-r border-[#E5E5E7] text-xs font-bold text-[#1D1D1F] select-none shrink-0">
                                <span>🇮🇳</span>
                                <span>+91</span>
                              </div>
                              <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '');
                                  const val = (raw.length === 12 && raw.startsWith('91')) ? raw.slice(2) : raw.slice(0, 10);
                                  setPhone(val);
                                  if (val !== verifiedPhone) {
                                    setPhoneVerified(false);
                                    setPhoneSuccess('');
                                  } else {
                                    setPhoneVerified(true);
                                  }
                                }}
                                placeholder="98765 43210"
                                className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none placeholder:text-[#86868B]"
                                required
                              />
                            </div>

                            {!phoneVerified && !phoneOtpSent && (
                              <button
                                type="button"
                                onClick={handleSendPhoneOtp}
                                disabled={phoneSending}
                                className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                              >
                                {phoneSending ? 'Sending...' : 'Verify OTP'}
                              </button>
                            )}
                          </div>

                          {phoneSuccess && (
                            <p className="text-[11px] text-emerald-600 font-semibold">{phoneSuccess}</p>
                          )}
                          {phoneError && (
                            <p className="text-[11px] text-red-600 font-semibold">{phoneError}</p>
                          )}

                          {/* Inline OTP Input Box for WhatsApp / Phone */}
                          {phoneOtpSent && (
                            <div className="mt-2 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-fade-in">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-blue-900">Enter 6-digit WhatsApp OTP</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhoneOtpSent(false);
                                    setPhoneError('');
                                  }}
                                  className="text-[#86868B] hover:text-[#1D1D1F] text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>

                              {phoneDevOtp && (
                                <div className="text-[10px] bg-amber-100 text-amber-900 px-2 py-1 rounded font-mono">
                                  Dev Mode OTP: <strong>{phoneDevOtp}</strong>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={phoneOtpInput}
                                  onChange={(e) => setPhoneOtpInput(e.target.value)}
                                  placeholder="Enter 6-digit code"
                                  className="flex-1 font-mono tracking-widest text-center text-sm font-bold bg-white border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-600"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyPhoneOtp}
                                  disabled={phoneVerifying}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                                >
                                  {phoneVerifying ? 'Checking...' : 'Confirm'}
                                </button>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-[#86868B]">
                                <span>Code expires in 5 minutes</span>
                                {phoneCountdown > 0 ? (
                                  <span>Resend in {phoneCountdown}s</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleSendPhoneOtp}
                                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                                  >
                                    Resend Code
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <span className="text-[11px] text-[#86868B]">
                            Used for urgent project claim alerts and direct studio communication.
                          </span>
                        </div>

                        {/* Email Address with OTP */}
                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#FBFBFC] border border-[#E5E5E7]">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#1D1D1F]">
                              EMAIL ADDRESS *
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
                                if (val.trim().toLowerCase() !== verifiedEmail.trim().toLowerCase()) {
                                  setEmailVerified(false);
                                  setEmailSuccess('');
                                } else {
                                  setEmailVerified(true);
                                }
                              }}
                              placeholder="creator@artsyproduction.com"
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
                            <div className="mt-2 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-fade-in">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-blue-900">Enter 6-digit Email OTP</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEmailOtpSent(false);
                                    setEmailError('');
                                  }}
                                  className="text-[#86868B] hover:text-[#1D1D1F] text-xs cursor-pointer"
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

                          <span className="text-[11px] text-[#86868B]">
                            Primary authenticated email linked to your creator account and milestone notifications.
                          </span>
                        </div>
                      </div>

                      {/* Verified Role / Creative Discipline */}
                      <div className="flex flex-col gap-2 pt-1">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          PRIMARY CREATIVE ROLE &amp; VERIFIED SPECIALTY *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {VERIFIED_ROLES.map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                setSpecialty(role);
                                if (role !== 'Other') setCustomSpecialty('');
                              }}
                              className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                specialty === role
                                  ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs'
                                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white hover:border-[#3B82F6]'
                              }`}
                            >
                              <span className="truncate">{role}</span>
                              {specialty === role && <span className="text-blue-400 font-bold ml-1.5 shrink-0">✓</span>}
                            </button>
                          ))}
                        </div>
                        {specialty === 'Other' && (
                          <input
                            type="text"
                            required
                            value={customSpecialty}
                            onChange={(e) => setCustomSpecialty(e.target.value)}
                            placeholder="Specify your creative discipline (e.g. 3D VFX Generalist, Anime & Gaming Editor)..."
                            className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all mt-1"
                          />
                        )}
                        <span className="text-[11px] text-[#86868B]">
                          This verified role appears on your public creator card on the /creators page and in client project workrooms.
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          TELL US ABOUT YOUR EDITING STYLE *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={philosophy}
                          onChange={(e) => setPhilosophy(e.target.value)}
                          placeholder="How do you edit videos? Tell us about your storytelling, rhythm, music choice, sound effects, or color grading style..."
                          className="bg-[#F5F5F7] p-3.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all resize-none"
                        ></textarea>
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>What makes your edits unique</span>
                          <span>[{philosophy.length}/300]</span>
                        </div>
                      </div>
                    </div>

                    {/* 02 Toolchain & Availability */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                            2
                          </span>
                          Software &amp; Weekly Availability
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          EDITING SOFTWARE YOU USE (CHOOSE ALL THAT APPLY)
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            'DaVinci Resolve Studio',
                            'Adobe Premiere Pro',
                            'Adobe After Effects',
                            'Final Cut Pro',
                            'Blender (3D / VFX)',
                            'CapCut Pro',
                            'Avid Media Composer',
                            'Cinema 4D',
                            'Pro Tools',
                            'Unreal Engine 5',
                          ].map((tool) => (
                            <button
                              key={tool}
                              type="button"
                              onClick={() => toggleSoftware(tool)}
                              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                software.includes(tool)
                                  ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white'
                              }`}
                            >
                              {tool}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setShowCustomSoftware(!showCustomSoftware)}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              showCustomSoftware
                                ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]'
                                : 'bg-[#F5F5F7] text-[#3B82F6] border-[#E5E5E7] hover:bg-white'
                            }`}
                          >
                            + Other / Custom Tool
                          </button>
                        </div>
                        {showCustomSoftware && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={customSoftwareInput}
                              onChange={(e) => setCustomSoftwareInput(e.target.value)}
                              placeholder="e.g. Houdini, Fusion Studio, Logic Pro, Nuke..."
                              className="bg-[#F5F5F7] px-4 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = customSoftwareInput.trim();
                                  if (trimmed && !software.includes(trimmed)) {
                                    setSoftware((prev) => [...prev, trimmed]);
                                    setCustomSoftwareInput('');
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = customSoftwareInput.trim();
                                if (trimmed && !software.includes(trimmed)) {
                                  setSoftware((prev) => [...prev, trimmed]);
                                  setCustomSoftwareInput('');
                                }
                              }}
                              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1D1D1F] text-white cursor-pointer hover:bg-[#333]"
                            >
                              Add Tool
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            YEARS OF EDITING EXPERIENCE
                          </label>
                          <select
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6]"
                          >
                            <option>2 - 4 Years (Intermediate)</option>
                            <option>5 - 8 Years (Experienced Senior)</option>
                            <option>8+ Years (Lead / Director)</option>
                            <option>1 - 2 Years (Junior / Fast Learner)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            HOW MANY HOURS CAN YOU WORK PER WEEK?
                          </label>
                          <select
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6]"
                          >
                            <option>20 - 30 Hours / Week (Part-Time, ~2 projects)</option>
                            <option>35 - 45 Hours / Week (Full-Time)</option>
                            <option>10 - 15 Hours / Week (Weekends only)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          LANGUAGES YOU CAN EDIT IN
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {['Hindi', 'English', 'Punjabi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Malayalam'].map(
                            (lang) => (
                              <label
                                key={lang}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                                  languages.includes(lang)
                                    ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/40'
                                    : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={languages.includes(lang)}
                                  onChange={() => toggleLanguage(lang)}
                                  className="w-4 h-4 accent-[#3B82F6]"
                                />
                                <span>{lang}</span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 03 Computer & Hardware Setup */}
                    <HardwareSetupSection
                      primaryComputer={primaryComputer}
                      setPrimaryComputer={setPrimaryComputer}
                      monitorDisplay={monitorDisplay}
                      setMonitorDisplay={setMonitorDisplay}
                      storageRig={storageRig}
                      setStorageRig={setStorageRig}
                      audioSetup={audioSetup}
                      setAudioSetup={setAudioSetup}
                      stepNumber={3}
                      required={true}
                    />

                    {/* 04 Portfolio Samples */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                            4
                          </span>
                          Portfolio Samples (3 Mandatory Videos)
                        </span>
                      </div>

                      <p className="text-xs text-[#86868B] leading-relaxed">
                        To maintain premium standards on Artsy, all creators must provide 3 links to finished projects hosted on YouTube or Vimeo.
                      </p>

                      <div className="space-y-4">
                        {/* Sample 1 */}
                        <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1D1D1F]">
                              SAMPLE VIDEO 01 (YOUTUBE / VIMEO) *
                            </label>
                            {sampleUrl1 && (
                              isSample1Valid ? (
                                <a
                                  href={sampleUrl1}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                                >
                                  ✓ Valid Link (Open ↗)
                                </a>
                              ) : (
                                <span className="text-xs text-red-500 font-semibold">Must be YouTube or Vimeo URL</span>
                              )
                            )}
                          </div>
                          <input
                            type="url"
                            required
                            value={sampleUrl1}
                            onChange={(e) => setSampleUrl1(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                            className="w-full bg-white px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-lg border border-[#E5E5E7] outline-none focus:border-[#3B82F6] transition-all"
                          />
                        </div>

                        {/* Sample 2 */}
                        <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1D1D1F]">
                              SAMPLE VIDEO 02 (YOUTUBE / VIMEO) *
                            </label>
                            {sampleUrl2 && (
                              isSample2Valid ? (
                                <a
                                  href={sampleUrl2}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                                >
                                  ✓ Valid Link (Open ↗)
                                </a>
                              ) : (
                                <span className="text-xs text-red-500 font-semibold">Must be YouTube or Vimeo URL</span>
                              )
                            )}
                          </div>
                          <input
                            type="url"
                            required
                            value={sampleUrl2}
                            onChange={(e) => setSampleUrl2(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                            className="w-full bg-white px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-lg border border-[#E5E5E7] outline-none focus:border-[#3B82F6] transition-all"
                          />
                        </div>

                        {/* Sample 3 */}
                        <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1D1D1F]">
                              SAMPLE VIDEO 03 (YOUTUBE / VIMEO) *
                            </label>
                            {sampleUrl3 && (
                              isSample3Valid ? (
                                <a
                                  href={sampleUrl3}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                                >
                                  ✓ Valid Link (Open ↗)
                                </a>
                              ) : (
                                <span className="text-xs text-red-500 font-semibold">Must be YouTube or Vimeo URL</span>
                              )
                            )}
                          </div>
                          <input
                            type="url"
                            required
                            value={sampleUrl3}
                            onChange={(e) => setSampleUrl3(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                            className="w-full bg-white px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-lg border border-[#E5E5E7] outline-none focus:border-[#3B82F6] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 05 Compliance & Direct Bank Details */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                            5
                          </span>
                          Bank Details for Direct Payouts
                        </span>
                        {isBankMasked && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!editBankDetails) {
                                setEditBankDetails(true);
                                setPan('');
                                setBankAccount('');
                                setIfsc('');
                              } else {
                                setEditBankDetails(false);
                                setPan(loadedPanRef.current);
                                setBankAccount(loadedAccountRef.current);
                                setIfsc(loadedIfscRef.current);
                              }
                            }}
                            className="text-xs text-[#3B82F6] font-bold hover:underline cursor-pointer ml-2"
                          >
                            {editBankDetails ? 'Cancel Edit' : 'Edit Bank Details'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#1D1D1F]">
                              PAN CARD NUMBER *
                            </label>
                            {pan && (
                              isPanValid
                                ? <span className="text-[11px] text-emerald-600 font-semibold">{isPanMasked(pan) ? '✓ On File (Masked)' : '✓ Valid PAN'}</span>
                                : <span className="text-[11px] text-red-500 font-semibold">Format: ABCDE1234F</span>
                            )}
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            disabled={isBankMasked && !editBankDetails}
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase())}
                            placeholder="ABCDE1234F"
                            className={`uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border outline-none transition-all disabled:opacity-75 ${
                              pan && !isPanValid ? 'border-red-400 focus:border-red-500' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                            }`}
                          />
                          <span className="text-[11px] text-[#86868B]">10-character PAN required for statutory TDS deductions (Section 194J).</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            NAME AS PER PAN CARD *
                          </label>
                          <input
                            type="text"
                            required
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            placeholder="Name as printed on PAN card"
                            className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                          />
                          <span className="text-[11px] text-[#86868B]">
                            Must match your legal banking name for NEFT settlements.
                          </span>
                        </div>
                      </div>

                      {/* Bank Name Option & Toggle */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          YOUR BANK NAME *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Other Bank'].map(
                            (b) => {
                              const isSelected =
                                b === 'Other Bank'
                                  ? !['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].includes(bankName) && bankName !== ''
                                  : bankName === b;
                              return (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => {
                                    if (b === 'Other Bank') {
                                      if (['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].includes(bankName)) {
                                        setBankName('');
                                      }
                                    } else {
                                      setBankName(b);
                                    }
                                  }}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                      : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white'
                                  }`}
                                >
                                  {b}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                          className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#1D1D1F]">
                              BANK ACCOUNT NUMBER *
                            </label>
                            {bankAccount && (
                              isBankAccountValid
                                ? <span className="text-[11px] text-emerald-600 font-semibold">{isBankAccountMasked(bankAccount) ? '✓ On File (Masked)' : '✓ Valid Account'}</span>
                                : <span className="text-[11px] text-red-500 font-semibold">9–18 digits required</span>
                            )}
                          </div>
                          <input
                            type="text"
                            required
                            disabled={isBankMasked && !editBankDetails}
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 9 to 18 digit account number"
                            maxLength={18}
                            className={`bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono text-[#1D1D1F] rounded-xl border outline-none transition-all disabled:opacity-75 ${
                              bankAccount && !isBankAccountValid ? 'border-red-400 focus:border-red-500' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                            }`}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#1D1D1F]">IFSC CODE *</label>
                            {ifsc && (
                              isIfscValid
                                ? <span className="text-[11px] text-emerald-600 font-semibold">{isIfscMasked(ifsc) ? '✓ On File (Masked)' : '✓ Valid IFSC'}</span>
                                : <span className="text-[11px] text-red-500 font-semibold">Format: SBIN0001234</span>
                            )}
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={11}
                            disabled={isBankMasked && !editBankDetails}
                            value={ifsc}
                            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                            placeholder="e.g. HDFC0001234"
                            className={`uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border outline-none transition-all disabled:opacity-75 ${
                              ifsc && !isIfscValid ? 'border-red-400 focus:border-red-500' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 06 Permanent NDA & Execution Record */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                            6
                          </span>
                          Creator Agreement &amp; Non-Disclosure Agreement (NDA)
                        </span>
                      </div>

                      <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex flex-col gap-3 text-xs text-[#1D1D1F] leading-relaxed max-h-48 overflow-y-auto">
                        <p className="font-bold text-xs">CONFIDENTIALITY &amp; SERVICE AGREEMENT SUMMARY:</p>
                        <p>
                          1. <strong>Confidential Footage &amp; Project Assets:</strong> All raw camera footage, audio stems, client branding assets, scripts, and rough cuts delivered via Artsy are strictly confidential. You shall not upload, publicly stream, publish, or leak any materials without explicit prior written consent from Artsy.
                        </p>
                        <p>
                          2. <strong>Non-Circumvention:</strong> You agree not to solicit, contact, or accept direct private compensation from Artsy clients outside of the platform for 90 days following project completion.
                        </p>
                        <p>
                          3. <strong>Quality &amp; Hardware Standard:</strong> You represent that your declared workstation meets the technical threshold for 4K video editing, color grading, and lossless master rendering.
                        </p>
                        <p>
                          4. <strong>Permanent Execution:</strong> This agreement was permanently executed with your digital electronic signature and is permanently registered on your immutable creator ledger.
                        </p>
                      </div>

                      {/* Electronic Signature Record */}
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Digital Electronic Signature:
                          </span>
                          <div className="text-sm font-bold text-emerald-950">
                            {legalName || user?.full_name || 'Verified Creator'}
                          </div>
                          <div className="text-[11px] text-emerald-700">
                            {agreementSignedAt
                              ? `Executed on ${new Date(agreementSignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                              : 'Executed during onboarding vetting.'}
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shrink-0 text-center">
                          ✓ ACTIVE &amp; BINDING
                        </span>
                      </div>
                    </div>

                    {/* Bottom Save CTA Bar */}
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                      >
                        <span>{saving ? 'Updating Studio Profile...' : 'Save Profile Changes'}</span>
                        <span>→</span>
                      </button>
                      {!isFormValid && (
                        <p className="text-center text-xs text-amber-700 font-medium">
                          * Please ensure all required fields (Workstation specs, 3 Sample URLs, PAN, Bank Account, IFSC, and Legal Name) are filled.
                        </p>
                      )}
                    </div>
                  </form>
                </div>

                {/* Sidebar Column (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 self-start">
                  {/* Direct Payout Card */}
                  <div className="bg-[#1D1D1F] text-white p-6 sm:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between relative overflow-hidden">
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="bg-[#3B82F6] text-white px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full">
                          FAST PAYMENTS
                        </span>
                      </div>
                      <span className="text-2xl font-extrabold tracking-tight text-white">DIRECT BANK TRANSFER</span>
                      <h2 className="text-base font-bold uppercase leading-tight text-white">
                        Guaranteed Bank Payouts
                      </h2>
                      <p className="text-xs text-[#86868B] leading-relaxed">
                        Settlements are transferred directly to your bank account via NEFT as soon as the client approves your video edit. No delays or hidden deductions.
                      </p>
                    </div>
                    <div className="pt-4 flex items-center gap-2 text-[11px] font-medium text-emerald-400 border-t border-white/10 mt-6">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      SECURE 70% SPLIT SETTLEMENT
                    </div>
                  </div>

                  {/* Project Instructions Card */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <h3 className="text-sm font-bold text-[#1D1D1F] uppercase mb-2">Clear Project Briefs</h3>
                    <p className="text-xs text-[#86868B] leading-relaxed">
                      You receive organized camera footage links, audio stems, color LUTs, and fixed payout rates upfront. Zero price bargaining.
                    </p>
                    <div className="mt-4 bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E7] flex items-center justify-between text-xs font-semibold text-[#1D1D1F]">
                      <span>Client Communication</span>
                      <span className="text-[#3B82F6]">100% Handled by Artsy</span>
                    </div>
                  </div>

                  {/* Quality Buffer Card */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-[#1D1D1F] uppercase mb-1">In-House QA Buffer</h3>
                    <p className="text-xs text-[#86868B] leading-relaxed">
                      Our in-house post leads inspect your proxy cut first to provide constructive polish notes before client presentation.
                    </p>
                    <div className="w-full bg-[#F5F5F7] h-2 rounded-full overflow-hidden mt-3">
                      <div className="bg-[#3B82F6] h-full w-full rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-[#86868B] mt-1">
                      <span>Roster Status</span>
                      <span className="text-emerald-600 font-semibold">Active Member</span>
                    </div>
                  </div>

                  {/* DPDP Compliance & Data Rights Box */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] space-y-3">
                    <span className="text-xs font-bold text-[#1D1D1F] uppercase block">
                      Data Privacy &amp; Rights (DPDP Act)
                    </span>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                      Your banking and PAN credentials are encrypted at rest with AES-256-GCM. You have the statutory right to export or erase your creator data.
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleExportData}
                        disabled={isExportingData}
                        className="w-full py-2 px-3 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-xs font-semibold text-[#1D1D1F] border border-[#E5E5E7] transition-all cursor-pointer text-center"
                      >
                        {isExportingData ? 'Generating Export...' : 'Export My Creator Data (JSON)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-xs font-semibold text-red-600 border border-red-200 transition-all cursor-pointer text-center"
                      >
                        Request Account Erasure (DPDP)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E5E5E7] shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1D1D1F]">Request Creator Account Erasure</h3>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-[#86868B] leading-relaxed">
                  Under the Digital Personal Data Protection (DPDP) Act 2023, you may request the erasure of your personal data. Your creator profile, contact details, and bank credentials will be anonymized. Past immutable financial transaction ledgers are retained per statutory tax compliance.
                </p>

                {deleteError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {deleteError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#1D1D1F]">Reason for departure (Optional)</label>
                  <textarea
                    rows={2}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Tell us why you are requesting account closure..."
                    className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    Type <strong className="text-red-600">DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 text-xs font-mono font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-red-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-xs font-semibold text-[#1D1D1F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAccountDeletion}
                    disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer"
                  >
                    {isDeletingAccount ? 'Erasing...' : 'Confirm Erasure'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
