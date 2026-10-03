'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, getCurrentUser, setCurrentUser, PRESET_USERS } from '@/lib/auth';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';

export default function FreelancerProfilePage() {
  const { user } = useAuth();

  // Profile data states
  const [alias, setAlias] = useState('Aarav Sen');
  const [showreelUrl, setShowreelUrl] = useState('https://vimeo.com/aaravsen/cuts2025');
  const [philosophy, setPhilosophy] = useState(
    'Rhythm-driven micro-cutting, naturalistic audio soundscapes, color grading with Kodak 2383 film density emulations, and narrative arc pacing tailored for commercial impact.'
  );

  // Contact details
  const [email, setEmail] = useState(user?.email || 'editor@artsyprod.studio');
  const [phone, setPhone] = useState(user?.phone || '+91 9876543211');

  // Change contact modals
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState('');

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');

  // Software toolchain
  const [software, setSoftware] = useState<string[]>([
    'DAVINCI RESOLVE STUDIO',
    'ADOBE PREMIERE PRO',
    'AFTER EFFECTS',
  ]);
  const [experience, setExperience] = useState('2 - 4 Years (Mid-Level Independent)');
  const [capacity, setCapacity] = useState('20 - 30 Hours / Week (2 Commercial Projects)');
  const [languages, setLanguages] = useState<string[]>(['HINDI', 'ENGLISH', 'PUNJABI']);

  // Hardware and gear specs
  const [workstationRig, setWorkstationRig] = useState('Apple Mac Studio M2 Ultra (128GB Unified Memory)');
  const [monitoringSpec, setMonitoringSpec] = useState('Apple Studio Display 27" (P3-D65 Calibrated) + BenQ ColorVu');
  const [storageSpec, setStorageSpec] = useState('10GbE Synology RAID-0 Scratch + 4TB NVMe Internal Cache');
  const [audioSpec, setAudioSpec] = useState('Yamaha HS7 Studio Monitors + Beyerdynamic DT 990 Pro (250Ω)');

  // Reels
  const [reels, setReels] = useState([
    { type: 'COMMERCIAL / BRAND UGC', url: 'https://vimeo.com/aaravsen/commercial-cuts' },
    { type: 'LUXURY WEDDING FILM', url: 'https://vimeo.com/aaravsen/luxury-wedding-cinematic' },
    { type: 'PRODUCT MACRO CINEMATIC', url: 'https://vimeo.com/aaravsen/macro-product-reel' },
  ]);

  // Banking and compliance details
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccount, setBankAccount] = useState('50100482910481');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [pan, setPan] = useState('ABCDE1234F');
  const [legalName, setLegalName] = useState('Aarav Sen');
  const [showMaskedAccount, setShowMaskedAccount] = useState(true);

  // Change bank details modal/drawer
  const [isChangingBank, setIsChangingBank] = useState(false);
  const [tempBankName, setTempBankName] = useState('HDFC Bank');
  const [tempAccount, setTempAccount] = useState('50100482910481');
  const [tempIfsc, setTempIfsc] = useState('HDFC0001234');
  const [tempLegalName, setTempLegalName] = useState('Aarav Sen');
  const [tempPan, setTempPan] = useState('ABCDE1234F');

  // Save toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load from local storage or user on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('artsy_creator_profile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.alias) setAlias(parsed.alias);
          if (parsed.showreelUrl) setShowreelUrl(parsed.showreelUrl);
          if (parsed.philosophy) setPhilosophy(parsed.philosophy);
          if (parsed.software && Array.isArray(parsed.software)) setSoftware(parsed.software);
          if (parsed.experience) setExperience(parsed.experience);
          if (parsed.capacity) setCapacity(parsed.capacity);
          if (parsed.languages && Array.isArray(parsed.languages)) setLanguages(parsed.languages);
          if (parsed.reels && Array.isArray(parsed.reels)) setReels(parsed.reels);
          if (parsed.bankName) setBankName(parsed.bankName);
          if (parsed.bankAccount) setBankAccount(parsed.bankAccount);
          if (parsed.ifsc) setIfsc(parsed.ifsc);
          if (parsed.pan) setPan(parsed.pan);
          if (parsed.legalName) setLegalName(parsed.legalName);
          if (parsed.workstationRig) setWorkstationRig(parsed.workstationRig);
          if (parsed.monitoringSpec) setMonitoringSpec(parsed.monitoringSpec);
          if (parsed.storageSpec) setStorageSpec(parsed.storageSpec);
          if (parsed.audioSpec) setAudioSpec(parsed.audioSpec);
        } catch {}
      }

      const currentUser = getCurrentUser();
      if (currentUser?.email) setEmail(currentUser.email);
      if (currentUser?.phone) setPhone(currentUser.phone);
      if (currentUser?.full_name && !stored) setAlias(currentUser.full_name);
    }
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

  const handleSaveAll = () => {
    setIsSaving(true);

    const payload = {
      alias,
      showreelUrl,
      philosophy,
      email,
      phone,
      software,
      experience,
      capacity,
      languages,
      workstationRig,
      monitoringSpec,
      storageSpec,
      audioSpec,
      reels,
      bankName,
      bankAccount,
      ifsc,
      pan,
      legalName,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_creator_profile', JSON.stringify(payload));

      const currentUser = getCurrentUser() || PRESET_USERS.freelancer;
      const updatedUser = {
        ...currentUser,
        full_name: alias || currentUser.full_name,
        email: email || currentUser.email,
        phone: phone || currentUser.phone,
      };
      setCurrentUser(updatedUser);
    }

    setTimeout(() => {
      setIsSaving(false);
      setToastMessage('✓ Software & Gear Profile, contact information, and bank details updated successfully.');
      setTimeout(() => setToastMessage(null), 4000);
    }, 400);
  };

  // Change phone flow
  const handleStartChangePhone = () => {
    setNewPhone('');
    setPhoneOtpStep(false);
    setPhoneOtp('');
    setPhoneOtpError('');
    setIsChangingPhone(true);
  };

  const handleSendPhoneOtp = () => {
    if (!newPhone || newPhone.trim().length < 10) {
      setPhoneOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneOtpError('');
    setPhoneOtpStep(true);
  };

  const handleVerifyPhoneOtp = () => {
    if (phoneOtp.trim() !== '123456' && phoneOtp.trim().length !== 6) {
      setPhoneOtpError('Invalid OTP. For demonstration, use code 123456');
      return;
    }
    setPhone(newPhone.trim().startsWith('+91') ? newPhone.trim() : `+91 ${newPhone.trim()}`);
    setIsChangingPhone(false);
    setToastMessage('✓ Mobile number updated and verified successfully.');
    setTimeout(() => setToastMessage(null), 4000);

    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUser({ ...currentUser, phone: newPhone.trim() });
    }
  };

  // Change email flow
  const handleStartChangeEmail = () => {
    setNewEmail('');
    setEmailOtpStep(false);
    setEmailOtp('');
    setEmailOtpError('');
    setIsChangingEmail(true);
  };

  const handleSendEmailOtp = () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailOtpError('Please enter a valid email address');
      return;
    }
    setEmailOtpError('');
    setEmailOtpStep(true);
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtp.trim() !== '123456' && emailOtp.trim().length !== 6) {
      setEmailOtpError('Invalid code. For demonstration, use code 123456');
      return;
    }
    setEmail(newEmail.trim());
    setIsChangingEmail(false);
    setToastMessage('✓ Email address updated and verified successfully.');
    setTimeout(() => setToastMessage(null), 4000);

    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUser({ ...currentUser, email: newEmail.trim() });
    }
  };

  // Change bank flow
  const handleStartChangeBank = () => {
    setTempBankName(bankName);
    setTempAccount(bankAccount);
    setTempIfsc(ifsc);
    setTempLegalName(legalName);
    setTempPan(pan);
    setIsChangingBank(true);
  };

  const handleSaveBankChanges = () => {
    if (!tempAccount || !tempIfsc || !tempLegalName || !tempPan) {
      alert('Please fill in all mandatory bank settlement fields.');
      return;
    }
    setBankName(tempBankName);
    setBankAccount(tempAccount);
    setIfsc(tempIfsc.toUpperCase());
    setLegalName(tempLegalName);
    setPan(tempPan.toUpperCase());
    setIsChangingBank(false);

    setToastMessage('✓ Direct NEFT Bank settlement credentials updated and verified.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Live Success Toast */}
            {toastMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 shadow-sm animate-in fade-in duration-200">
                <span className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {toastMessage}
                </span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#86868B] font-bold">
                  CREATOR WORKSTATION • ROSTER PROFILE
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-1">
                  Software &amp; Gear Profile
                </h1>
                <p className="text-xs text-[#86868B] mt-1">
                  Manage your authenticated creator identity, contact credentials, editing toolchains, hardware specs, and direct NEFT settlement banking.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#1D1D1F] text-white hover:bg-black font-semibold text-xs tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>

            {/* Form & Profile Cards */}
            <div className="space-y-6">
              
              {/* CARD 1: Identity & Contact Credentials (Change Mobile & Email) */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                  <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    Identity &amp; Contact Credentials
                  </span>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                    Senior Cutter • Vetted
                  </span>
                </div>

                {/* Contact Details with Change Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                  {/* Email Channel */}
                  <div className="flex flex-col justify-between gap-2 p-3 bg-white rounded-lg border border-[#E5E5E7]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
                        Registered Email
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Verified
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#1D1D1F] font-mono truncate">
                      {email}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartChangeEmail}
                      className="self-start text-[11px] font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                    >
                      Change Email Address →
                    </button>
                  </div>

                  {/* Mobile Channel */}
                  <div className="flex flex-col justify-between gap-2 p-3 bg-white rounded-lg border border-[#E5E5E7]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
                        Registered Mobile Number
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Verified
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#1D1D1F] font-mono">
                      {phone}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartChangePhone}
                      className="self-start text-[11px] font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                    >
                      Change Mobile Number →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      CREATOR ALIAS *
                    </label>
                    <input
                      type="text"
                      required
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="e.g. Kinetik Cuts / Aarav Sen"
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      SHOWREEL / MASTER PORTFOLIO URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={showreelUrl}
                      onChange={(e) => setShowreelUrl(e.target.value)}
                      placeholder="https://vimeo.com/... or Behance / YouTube"
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    EDITING PHILOSOPHY &amp; SIGNATURE PACING *
                  </label>
                  <textarea
                    rows={3}
                    value={philosophy}
                    onChange={(e) => setPhilosophy(e.target.value)}
                    placeholder="Detail your approach to micro-pacing, sound design integration, narrative arc retention, and color palette discipline..."
                    className="bg-[#F5F5F7] p-3.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* CARD 2: Software Suites & Production Toolchain */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                  <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    Software Suites &amp; Production Capacity
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    PRIMARY SUITE &amp; COLOR ENGINES (SELECT ALL APPLICABLE)
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      'DAVINCI RESOLVE STUDIO',
                      'ADOBE PREMIERE PRO',
                      'AFTER EFFECTS',
                      'FINAL CUT PRO',
                      'BLENDER (3D/VFX)',
                      'CAPCUT PRO (FAST-TURNAROUND SOCIAL)',
                      'AVID MEDIA COMPOSER',
                    ].map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleSoftware(item)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          software.includes(item)
                            ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      COMMERCIAL POST EXPERIENCE
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none"
                    >
                      <option>1 - 2 Years (Junior / Fast Turnaround)</option>
                      <option>2 - 4 Years (Mid-Level Independent)</option>
                      <option>5 - 8 Years (Senior Commercial Lead)</option>
                      <option>8+ Years (Post Supervisor / Master)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      WEEKLY RESERVED SLATE CAPACITY
                    </label>
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none"
                    >
                      <option>10 - 15 Hours / Week (1 Commercial Project)</option>
                      <option>20 - 30 Hours / Week (2 Commercial Projects)</option>
                      <option>35 - 40 Hours / Week (Full-Time Dedicated)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    SPOKEN / DIALOGUE CUT LANGUAGES
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      'HINDI',
                      'ENGLISH',
                      'PUNJABI',
                      'TAMIL',
                      'BENGALI',
                      'TELUGU',
                      'MARATHI',
                      'MALAYALAM',
                    ].map((lang) => (
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
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 3: Hardware & Workstation Gear Specs */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                  <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    Hardware &amp; Workstation Rig Specifications
                  </span>
                  <span className="text-xs text-[#86868B] uppercase font-semibold">Render Pipeline</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      PRIMARY WORKSTATION RIG
                    </label>
                    <input
                      type="text"
                      value={workstationRig}
                      onChange={(e) => setWorkstationRig(e.target.value)}
                      placeholder="e.g. Apple Mac Studio M2 Ultra (128GB Unified Memory)"
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      COLOR-CALIBRATED MONITORING
                    </label>
                    <input
                      type="text"
                      value={monitoringSpec}
                      onChange={(e) => setMonitoringSpec(e.target.value)}
                      placeholder="e.g. Apple Studio Display 27 (P3-D65 Calibrated)"
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      HIGH-SPEED SCRATCH &amp; STORAGE
                    </label>
                    <input
                      type="text"
                      value={storageSpec}
                      onChange={(e) => setStorageSpec(e.target.value)}
                      placeholder="e.g. 10GbE Synology RAID-0 Scratch + 4TB NVMe Internal Cache"
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      AUDIO MONITORING SYSTEM
                    </label>
                    <input
                      type="text"
                      value={audioSpec}
                      onChange={(e) => setAudioSpec(e.target.value)}
                      placeholder="e.g. Yamaha HS7 Studio Monitors + Beyerdynamic DT 990 Pro"
                      className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 4: Categorical Cut Samples & Verification Reels */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                  <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    Categorical Cut Samples
                  </span>
                  <span className="text-xs text-[#86868B] uppercase font-semibold">Min 2 • Max 4 Reels</span>
                </div>

                <div className="space-y-3">
                  {reels.map((reel, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] flex flex-col md:flex-row gap-3 items-center"
                    >
                      <span className="text-xs font-bold text-[#1D1D1F] bg-white px-2.5 py-1 rounded-md border border-[#E5E5E7] shrink-0">
                        REEL 0{idx + 1}
                      </span>
                      <div className="w-full md:w-1/3">
                        <select
                          value={reel.type}
                          onChange={(e) => {
                            const next = [...reels];
                            next[idx].type = e.target.value;
                            setReels(next);
                          }}
                          className="w-full bg-white px-3 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E7] outline-none"
                        >
                          <option>COMMERCIAL / BRAND UGC</option>
                          <option>LUXURY WEDDING FILM</option>
                          <option>PRODUCT MACRO CINEMATIC</option>
                          <option>CORPORATE NARRATIVE / TECH</option>
                        </select>
                      </div>
                      <div className="w-full md:w-2/3">
                        <input
                          type="url"
                          value={reel.url}
                          onChange={(e) => {
                            const next = [...reels];
                            next[idx].url = e.target.value;
                            setReels(next);
                          }}
                          placeholder="https://vimeo.com/... or Google Drive public link"
                          className="w-full bg-white px-3.5 py-2 text-xs text-[#1D1D1F] rounded-lg border border-[#E5E5E7] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 5: Compliance, Direct Payouts & Bank Details (With Change Bank Option) */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                  <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                      5
                    </span>
                    Compliance &amp; Direct Bank Settlement
                  </span>
                  <button
                    type="button"
                    onClick={handleStartChangeBank}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-all cursor-pointer"
                  >
                    Change Bank Details ✍️
                  </button>
                </div>

                {/* Current Active Bank Details Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                  <div className="p-3 bg-white rounded-lg border border-[#E5E5E7]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
                      Disbursement Bank
                    </span>
                    <span className="text-sm font-bold text-[#1D1D1F] mt-1 block">
                      {bankName}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">✓ Active NEFT Channel</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E5E5E7]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                        Account Number
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMaskedAccount(!showMaskedAccount)}
                        className="text-[10px] text-[#3B82F6] font-semibold cursor-pointer"
                      >
                        {showMaskedAccount ? 'Reveal' : 'Mask'}
                      </button>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#1D1D1F] mt-1 block">
                      {showMaskedAccount
                        ? `••••••••${bankAccount.slice(-4) || '5821'}`
                        : bankAccount}
                    </span>
                    <span className="text-[11px] text-[#86868B]">IFSC: {ifsc}</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E5E5E7]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
                      PAN &amp; Beneficiary
                    </span>
                    <span className="text-sm font-bold text-[#1D1D1F] mt-1 block truncate">
                      {legalName}
                    </span>
                    <span className="text-[11px] font-mono text-[#86868B]">PAN: {pan}</span>
                  </div>
                </div>

                {/* Direct Bank Fields with Toggle and Input */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        PERMANENT ACCOUNT NUMBER (PAN) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        BENEFICIARY LEGAL NAME (AS PER PAN) *
                      </label>
                      <input
                        type="text"
                        required
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Full Name Matching Bank Account"
                        className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>

                  {/* Bank Name Option / Toggle & Input */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        BANK NAME *
                      </label>
                    </div>

                    {/* Quick Selection Options / Toggle Pills */}
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

                    {/* Bank Name Text Input */}
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
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        NEFT BANK ACCOUNT NUMBER *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="••••••••••••"
                        className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">IFSC CODE *</label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                        placeholder="HDFC0001234"
                        className="uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'SAVING PROFILE...' : 'SAVE PROFILE & TOOLCHAIN CHANGES →'}
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* MODAL: Change Mobile Number with OTP Verification */}
      {isChangingPhone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Change Registered Mobile</h3>
                <p className="text-xs text-[#86868B] mt-0.5">We will send a one-time passcode to verify your new number</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPhone(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!phoneOtpStep ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">NEW MOBILE NUMBER</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2.5 bg-[#F5F5F7] rounded-xl text-xs font-semibold text-[#1D1D1F] border border-[#E5E5E7]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={newPhone.replace('+91', '').trim()}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="flex-1 bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                {phoneOtpError && (
                  <div className="text-xs text-red-500 font-semibold">{phoneOtpError}</div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPhone(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    className="px-4 py-2 rounded-xl bg-[#1D1D1F] text-white hover:bg-black text-xs font-semibold cursor-pointer"
                  >
                    Send OTP →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  OTP sent to <strong>+91 {newPhone}</strong>. (For demonstration, use: <strong>123456</strong>)
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">ENTER 6-DIGIT OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="bg-[#F5F5F7] px-4 py-2.5 text-center text-lg tracking-[0.3em] font-mono font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>

                {phoneOtpError && (
                  <div className="text-xs text-red-500 font-semibold">{phoneOtpError}</div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPhoneOtpStep(false)}
                    className="text-xs font-semibold text-[#86868B] hover:underline cursor-pointer"
                  >
                    ← Edit Number
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOtp}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Verify &amp; Update Mobile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Change Email with Verification Code */}
      {isChangingEmail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Change Registered Email</h3>
                <p className="text-xs text-[#86868B] mt-0.5">We will dispatch an authentication code to verify your new email</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingEmail(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!emailOtpStep ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">NEW EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="creator@studio.com"
                    className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>

                {emailOtpError && (
                  <div className="text-xs text-red-500 font-semibold">{emailOtpError}</div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingEmail(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="px-4 py-2 rounded-xl bg-[#1D1D1F] text-white hover:bg-black text-xs font-semibold cursor-pointer"
                  >
                    Send Verification Code →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  Verification code dispatched to <strong>{newEmail}</strong>. (For demonstration, use: <strong>123456</strong>)
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">ENTER 6-DIGIT CODE</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="bg-[#F5F5F7] px-4 py-2.5 text-center text-lg tracking-[0.3em] font-mono font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>

                {emailOtpError && (
                  <div className="text-xs text-red-500 font-semibold">{emailOtpError}</div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailOtpStep(false)}
                    className="text-xs font-semibold text-[#86868B] hover:underline cursor-pointer"
                  >
                    ← Edit Email
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Verify &amp; Update Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Change Bank Settlement Credentials */}
      {isChangingBank && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Update Direct Bank Settlement</h3>
                <p className="text-xs text-[#86868B] mt-0.5">256-Bit TLS Encrypted NEFT/RTGS Account Destination</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingBank(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Select Bank */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1D1D1F]">BANK NAME *</label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Other Bank'].map(
                    (b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          if (b === 'Other Bank') {
                            setTempBankName('');
                          } else {
                            setTempBankName(b);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          tempBankName === b
                            ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white'
                        }`}
                      >
                        {b}
                      </button>
                    )
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={tempBankName}
                  onChange={(e) => setTempBankName(e.target.value)}
                  placeholder="Bank Name"
                  className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">ACCOUNT NUMBER *</label>
                  <input
                    type="text"
                    required
                    value={tempAccount}
                    onChange={(e) => setTempAccount(e.target.value)}
                    placeholder="Bank Account Number"
                    className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">IFSC CODE *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={tempIfsc}
                    onChange={(e) => setTempIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">LEGAL NAME (PER PAN) *</label>
                  <input
                    type="text"
                    required
                    value={tempLegalName}
                    onChange={(e) => setTempLegalName(e.target.value)}
                    placeholder="Full Beneficiary Name"
                    className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F]">PAN NUMBER *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={tempPan}
                    onChange={(e) => setTempPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                Direct NEFT automated bank transfers will disburse to this validated account for all completed cuts.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingBank(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBankChanges}
                  className="px-5 py-2.5 rounded-xl bg-[#1D1D1F] text-white hover:bg-black text-xs font-semibold cursor-pointer"
                >
                  Confirm &amp; Update Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
