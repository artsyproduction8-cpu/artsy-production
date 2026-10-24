'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { getCurrentUser, setCurrentUser, recordAgreementAcceptance, useAuth } from '@/lib/auth';
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

export default function FreelancerOnboarding() {
  const router = useRouter();
  const { user } = useAuth();

  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState(extractTenDigitPhone(user?.phone));
  const [specialty, setSpecialty] = useState('Commercial & Narrative Film Editor');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [showreelUrl, setShowreelUrl] = useState('');
  const [philosophy, setPhilosophy] = useState('');
  const [software, setSoftware] = useState<string[]>([
    'DaVinci Resolve Studio',
    'Adobe Premiere Pro'
  ]);
  const [customSoftwareInput, setCustomSoftwareInput] = useState('');
  const [showCustomSoftware, setShowCustomSoftware] = useState(false);
  const [experience, setExperience] = useState('2 - 4 Years (Intermediate)');
  const [capacity, setCapacity] = useState('20 - 30 Hours / Week (Part-Time, ~2 projects)');
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [reels, setReels] = useState([
    { type: 'Commercial & Brand Ads', url: '' },
    { type: 'Wedding Films & Teasers', url: '' },
    { type: 'Product Videos & Reels', url: '' }
  ]);
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
  const [sampleUrl1, setSampleUrl1] = useState('');
  const [sampleUrl2, setSampleUrl2] = useState('');
  const [sampleUrl3, setSampleUrl3] = useState('');
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [legalName, setLegalName] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [trackingId, setTrackingId] = useState('ART-2026-VET-982');

  // Strict Validation RegExes
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const bankAccountRegex = /^\d{9,18}$/;

  const isValidVideoUrl = (urlStr: string): boolean => {
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

  const isPanValid = pan.trim().length === 10 && panRegex.test(pan.trim());
  const isIfscValid = ifsc.trim().length === 11 && ifscRegex.test(ifsc.trim());
  const isBankAccountValid = bankAccountRegex.test(bankAccount.trim());
  const isHardwareValid = hardwareConfig.trim().length >= 5;
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
    ndaAccepted;

  // Pre-fill or redirect based on persistent server onboarding status
  useEffect(() => {
    if (user) {
      if (user.onboarding_status === 'approved') {
        router.replace('/freelancer');
        return;
      }
      if (user.onboarding_status === 'pending' || user.onboarding_status === 'pending_review') {
        router.replace('/freelancer/pending-approval');
        return;
      }
      if (user.onboarding_status === 'rejected') {
        router.replace('/freelancer/rejected');
        return;
      }
      if (user.full_name && !legalName && user.full_name !== 'Creator Partner' && user.full_name !== 'Creator') {
        setLegalName(user.full_name);
      }
      if (user.display_name && !alias && user.display_name !== 'Creator Partner' && user.display_name !== 'Creator') {
        setAlias(user.display_name);
      }
      if (user.tracking_id) {
        setTrackingId(user.tracking_id);
      }
      if (user.phone && !phone) {
        setPhone(extractTenDigitPhone(user.phone));
      }
    }
  }, [user, router, phone]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLegal = legalName.trim();
    const cleanAliasVal = alias.trim();
    if (!cleanLegal && !cleanAliasVal) {
      alert('Please enter your full legal name or creator alias before submitting.');
      return;
    }
    const lowerName = (cleanLegal || cleanAliasVal).toLowerCase();
    if (lowerName === 'creator partner' || lowerName === 'creator' || lowerName === 'artsy creator') {
      alert('Please enter your actual personal name or studio alias rather than a placeholder.');
      return;
    }
    if (!cleanLegal || cleanLegal.length < 2) {
      alert('Please enter your full legal name as your digital signature to execute the NDA.');
      return;
    }
    if (!ndaAccepted) {
      alert('Please accept the Creator Agreement & Confidentiality NDA');
      return;
    }
    if (!isHardwareValid) {
      alert('Please specify your Workstation & Hardware specs (CPU, GPU, RAM).');
      return;
    }
    if (!isSample1Valid || !isSample2Valid || !isSample3Valid) {
      alert('All 3 Portfolio Sample video links are mandatory and must be valid YouTube or Vimeo URLs.');
      return;
    }
    if (!isPanValid) {
      alert('Invalid PAN Card format. Must match standard Indian 10-character PAN format (e.g., ABCDE1234F).');
      return;
    }
    if (!isBankAccountValid) {
      alert('Invalid Bank Account number. Must be a numeric string between 9 and 18 digits.');
      return;
    }
    if (!isIfscValid) {
      alert('Invalid IFSC Code format. Must match standard 11-character Indian IFSC format (e.g., SBIN0001234).');
      return;
    }

    setSubmitting(true);
    // Record legal agreement acceptance
    recordAgreementAcceptance('both', '1.0');

    const currentUser = getCurrentUser();
    const candidateUserId = currentUser?.id || `usr-creator-${Date.now().toString().slice(-6)}`;
    const candidateEmail = currentUser?.email || '';
    const cleanTenPhone = extractTenDigitPhone(phone);
    const candidatePhone = cleanTenPhone ? `+91${cleanTenPhone}` : (currentUser?.phone || '');

    let agreementSignedAt = new Date().toISOString();

    try {
      const res = await fetch('/api/freelancer/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: candidateUserId,
          alias,
          legalName,
          specialty: specialty === 'Other' ? (customSpecialty.trim() || 'Commercial & Narrative Film Editor') : specialty,
          email: candidateEmail,
          phone: candidatePhone,
          showreelUrl: showreelUrl || sampleUrl1,
          philosophy,
          software,
          experience,
          capacity,
          languages,
          hardwareConfig,
          hardware: {
            primaryComputer,
            monitorDisplay,
            storageRig,
            audioSetup,
          },
          sampleUrl1,
          sampleUrl2,
          sampleUrl3,
          reels: [
            { type: 'Commercial & Brand Ads', url: sampleUrl1 },
            { type: 'Wedding Films & Teasers', url: sampleUrl2 },
            { type: 'Product Videos & Reels', url: sampleUrl3 }
          ],
          pan,
          bankName,
          bankAccount,
          ifsc,
          agreementAccepted: true,
          ndaAccepted: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit onboarding');
      }

      if (data.trackingId) {
        setTrackingId(data.trackingId);
        try {
          sessionStorage.setItem('artsy_tracking_id', data.trackingId);
        } catch {}
      }
      if (data.agreement_signed_at) {
        agreementSignedAt = data.agreement_signed_at;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit onboarding. Please verify all fields and retry.');
      setSubmitting(false);
      return;
    }

    // Safe display payload without sensitive financial PII for client-side state
    const creatorPayload = {
      alias,
      showreelUrl: showreelUrl || sampleUrl1,
      philosophy,
      software,
      experience,
      capacity,
      languages,
      hardwareConfig,
      hardware: {
        primaryComputer,
        monitorDisplay,
        storageRig,
        audioSetup,
      },
      sampleUrl1,
      sampleUrl2,
      sampleUrl3,
      agreementAccepted: true,
      agreement_signed_at: agreementSignedAt,
      agreementVersion: '1.0',
      status: 'pending_review',
      submittedAt: agreementSignedAt,
      trackingId: trackingId || 'ART-2026-VET-4115',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_creator_profile', JSON.stringify(creatorPayload));
      try {
        sessionStorage.setItem('artsy_tracking_id', creatorPayload.trackingId);
      } catch {}
    }

    // Update active user state to pending review (Do NOT auto-approve)
    const pendingUser = {
      ...(currentUser || {}),
      id: candidateUserId,
      email: candidateEmail,
      full_name: legalName || alias || null,
      phone: candidatePhone,
      role: 'freelancer' as const,
      status: 'active' as const,
      onboarding_status: 'pending_review' as const,
      tracking_id: trackingId || 'ART-2026-VET-4115',
      agreement_accepted: true,
      agreement_accepted_at: agreementSignedAt,
      agreement_signed_at: agreementSignedAt,
      agreement_version: '1.0',
      created_at: currentUser?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCurrentUser(pendingUser as any);

    setSubmitting(false);
    setShowModal(true);
  };

  return (
    <>
      <Navbar />
      <main className="w-full max-w-full pt-24 pb-16 bg-[#F5F5F7] min-h-screen text-[#1D1D1F] font-sans">
        {/* Top Header Strip */}
        <div className="max-w-[1200px] mx-auto px-6 mb-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Apply as a Creator
            </h1>
            <p className="text-sm text-[#86868B] mt-1">
              Join Artsy to get regular video editing work with fast, guaranteed bank payments.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column (8 cols) */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* 01 Identity */}
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
                        Appears on your public creator card. To protect privacy, full surnames are displayed as an initial only (e.g. Rahul S.).
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
                      <span className="text-[11px] text-[#86868B]">Link to your showreel or portfolio video (60 to 90 seconds is best).</span>
                    </div>
                  </div>

                  {/* Direct Contact: WhatsApp Number (+91 prefix) & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        WHATSAPP / MOBILE NUMBER *
                      </label>
                      <div className="flex items-center rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] focus-within:bg-white focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/10 overflow-hidden transition-all">
                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#E5E5E7]/70 border-r border-[#E5E5E7] text-xs font-bold text-[#1D1D1F] select-none shrink-0">
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
                          }}
                          placeholder="98765 43210"
                          className="w-full bg-transparent px-3 py-2 text-sm font-semibold text-[#1D1D1F] placeholder-[#86868B] focus:outline-none"
                          required
                        />
                      </div>
                      <span className="text-[11px] text-[#86868B]">
                        Used for urgent project claim alerts and direct studio communication.
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        REGISTERED EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={user?.email || ''}
                        placeholder="creator@gmail.com"
                        className="bg-[#E5E5E7]/50 px-4 py-2.5 text-sm text-[#86868B] rounded-xl border border-[#E5E5E7] outline-none cursor-not-allowed select-none"
                      />
                      <span className="text-[11px] text-[#86868B]">
                        Authenticated email tied to your verified creator profile.
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
                      This verified role will appear directly on your public creator card on the /creators page and in client project workrooms upon approval.
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
                      <span>Tell us what makes your edits unique</span>
                      <span>[{philosophy.length}/300]</span>
                    </div>
                  </div>
                </div>

                {/* 02 Toolchain & Bandwidth */}
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
                    <span className="text-xs text-red-600 uppercase font-semibold">Exactly 3 Required (YouTube / Vimeo)</span>
                  </div>

                  <p className="text-xs text-[#86868B] leading-relaxed">
                    To maintain premium quality standards on Artsy, all applicants must submit 3 separate links to completed video projects hosted on YouTube or Vimeo.
                  </p>

                  <div className="space-y-4">
                    {/* Sample 1 */}
                    <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1D1D1F]">
                          SAMPLE VIDEO 01 (YOUTUBE / VIMEO) *
                        </label>
                        {sampleUrl1 && (
                          isSample1Valid
                            ? <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">✓ Valid Video URL</span>
                            : <span className="text-xs text-red-500 font-semibold">Must be YouTube or Vimeo URL</span>
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
                          isSample2Valid
                            ? <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">✓ Valid Video URL</span>
                            : <span className="text-xs text-red-500 font-semibold">Must be YouTube or Vimeo URL</span>
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
                          isSample3Valid
                            ? <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">✓ Valid Video URL</span>
                            : <span className="text-xs text-red-500 font-semibold">Must be YouTube or Vimeo URL</span>
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

                {/* 05 Compliance & Direct Disbursement */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                    <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                        5
                      </span>
                      Bank Details for Direct Payouts
                    </span>
                    <span className="text-xs text-[#86868B] uppercase font-semibold">Safe &amp; Encrypted</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          PAN CARD NUMBER *
                        </label>
                        {pan && (
                          isPanValid
                            ? <span className="text-[11px] text-emerald-600 font-semibold">✓ Valid PAN</span>
                            : <span className="text-[11px] text-red-500 font-semibold">Format: ABCDE1234F</span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className={`uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border outline-none transition-all ${
                          pan && !isPanValid ? 'border-red-400 focus:border-red-500' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                        }`}
                      />
                      <span className="text-[11px] text-[#86868B]">10-character alphanumeric PAN required for statutory TDS deductions (Section 194J).</span>
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
                        Must match the name on your PAN card and bank account.
                      </span>
                    </div>
                  </div>

                  {/* Bank Name Option / Toggle & Input */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        YOUR BANK NAME *
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
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          BANK ACCOUNT NUMBER *
                        </label>
                        {bankAccount && (
                          isBankAccountValid
                            ? <span className="text-[11px] text-emerald-600 font-semibold">✓ Valid Account</span>
                            : <span className="text-[11px] text-red-500 font-semibold">9–18 digits required</span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 9 to 18 digit account number"
                        maxLength={18}
                        className={`bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono text-[#1D1D1F] rounded-xl border outline-none transition-all ${
                          bankAccount && !isBankAccountValid ? 'border-red-400 focus:border-red-500' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1D1D1F]">IFSC CODE *</label>
                        {ifsc && (
                          isIfscValid
                            ? <span className="text-[11px] text-emerald-600 font-semibold">✓ Valid IFSC</span>
                            : <span className="text-[11px] text-red-500 font-semibold">Format: SBIN0001234</span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className={`uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border outline-none transition-all ${
                          ifsc && !isIfscValid ? 'border-red-400 focus:border-red-500' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 06 Permanent NDA & Digital Signature */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                    <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                        6
                      </span>
                      Creator Agreement &amp; Non-Disclosure Agreement (NDA)
                    </span>
                    <span className="text-xs text-blue-600 uppercase font-semibold">Legally Binding</span>
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
                      4. <strong>Permanent Execution:</strong> Upon submission of this application with your digital signature, this agreement is permanently executed and registered on your creator ledger.
                    </p>
                  </div>

                  {/* Digital Signature Full Legal Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        DIGITAL SIGNATURE (FULL LEGAL NAME) *
                      </label>
                      {legalName && (
                        isLegalNameValid
                          ? <span className="text-[11px] text-emerald-600 font-semibold">✓ Signature Entered</span>
                          : <span className="text-[11px] text-red-500 font-semibold">Full legal name required</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Type your full legal name as digital signature (e.g., Rahul Sharma)"
                      className={`bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border outline-none transition-all ${
                        legalName && !isLegalNameValid ? 'border-red-400' : 'border-[#E5E5E7] focus:bg-white focus:border-[#3B82F6]'
                      }`}
                    />
                    <span className="text-[11px] text-[#86868B]">
                      Must match your government-issued ID and bank account name. Typing your legal name acts as a legally binding electronic signature.
                    </span>
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 flex flex-col gap-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={ndaAccepted}
                        onChange={(e) => setNdaAccepted(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#3B82F6] cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-[#1D1D1F] leading-relaxed">
                        <strong>I agree and digitally execute:</strong> I confirm that I have reviewed the Artsy Creator Services Agreement, NDA, and Non-Circumvention Policy. I affirm that all hardware specifications, portfolio sample links, and banking details submitted above are accurate and true.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !isFormValid}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>{submitting ? 'Submitting Application & Executing NDA...' : 'Submit Application & Sign Agreement'}</span>
                    <span>→</span>
                  </button>
                  {!isFormValid && (
                    <p className="text-center text-xs text-amber-700 font-medium">
                      * Please complete all mandatory fields with valid formats (Hardware specs, 3 Sample URLs, valid PAN, Bank Account, IFSC, Legal Name signature, and NDA agreement) to enable submission.
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
                  <span className="text-3xl font-extrabold tracking-tight text-white">DIRECT BANK TRANSFER</span>
                  <h2 className="text-base font-bold uppercase leading-tight text-white">
                    Get Paid Straight to Your Bank
                  </h2>
                  <p className="text-xs text-[#86868B] leading-relaxed">
                    Payment is transferred directly to your bank account via NEFT as soon as the client approves your video edit. No delays or hidden deductions.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[11px] font-medium text-emerald-400 border-t border-white/10 mt-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  SECURE BANK TRANSFERS
                </div>
              </div>

              {/* Anonymized Job Cards Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-[#1D1D1F] uppercase mb-2">Clear Project Instructions</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  No awkward price bargaining and no chasing clients for money. You get clear instructions, style references, organized footage links, and fixed payout rates upfront.
                </p>
                <div className="mt-4 bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E7] flex items-center justify-between text-xs font-semibold text-[#1D1D1F]">
                  <span>Client Communication</span>
                  <span className="text-[#3B82F6]">100% Handled by Artsy</span>
                </div>
              </div>

              {/* Quality Buffer Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#1D1D1F] uppercase mb-1">Helpful Team Review</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Our in-house post-production leads check your rough cut first to give constructive tips before sending it to the client. This saves you from repeated revisions.
                </p>
                <div className="w-full bg-[#F5F5F7] h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-[#3B82F6] h-full w-3/4 rounded-full"></div>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#86868B] mt-1">
                  <span>Creator Applications</span>
                  <span>Currently Open</span>
                </div>
              </div>

              {/* Vetting Protocol Box */}
              <div className="bg-[#F5F5F7] p-5 rounded-2xl border border-[#E5E5E7] flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#1D1D1F] uppercase">No Free Test Edits</span>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  We respect your time. We never ask editors to do free test cuts. We review your portfolio and sample video links, followed by a friendly 20-minute video chat. You will hear our decision within 24 to 48 hours.
                </p>
              </div>

              {/* Current Roster Slate */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1D1D1F] text-white flex flex-col items-center justify-center font-extrabold shrink-0">
                  <span className="text-base leading-none">142</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#86868B]">EDITORS</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#86868B] uppercase font-semibold">Active Community</span>
                  <span className="text-xs uppercase font-bold text-[#1D1D1F]">Delhi • Bengaluru • Mumbai &amp; Pan-India</span>
                  <span className="text-[11px] text-[#3B82F6] font-medium mt-0.5">Currently accepting new applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-2xl border border-[#E5E5E7] shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  ✓ APPLICATION SUBMITTED
                </span>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-[#86868B] hover:text-[#1D1D1F] cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Your Application is in Review</h4>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Thank you for applying to Artsy! Our team is reviewing your video portfolio and editing background. We will reach out to you within 24 to 48 hours.
                </p>
              </div>
              <div className="bg-[#F5F5F7] p-3.5 rounded-xl border border-[#E5E5E7] text-xs flex justify-between items-center">
                <span className="text-[#86868B] font-medium">APPLICATION REFERENCE ID</span>
                <span className="font-mono font-bold text-[#1D1D1F]">{trackingId}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    router.push('/freelancer/pending-approval');
                  }}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-center shadow-sm"
                >
                  View Application Status &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}