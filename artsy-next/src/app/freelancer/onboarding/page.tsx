'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { getCurrentUser, setCurrentUser, recordAgreementAcceptance, useAuth } from '@/lib/auth';

export default function FreelancerOnboarding() {
  const router = useRouter();
  const { user } = useAuth();

  const [alias, setAlias] = useState('');
  const [showreelUrl, setShowreelUrl] = useState('');
  const [philosophy, setPhilosophy] = useState('');
  const [software, setSoftware] = useState<string[]>([
    'DaVinci Resolve Studio',
    'Adobe Premiere Pro'
  ]);
  const [experience, setExperience] = useState('2 - 4 Years (Intermediate)');
  const [capacity, setCapacity] = useState('20 - 30 Hours / Week (Part-Time, ~2 projects)');
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [reels, setReels] = useState([
    { type: 'Commercial & Brand Ads', url: '' },
    { type: 'Wedding Films & Teasers', url: '' },
    { type: 'Product Videos & Reels', url: '' }
  ]);
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [legalName, setLegalName] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [trackingId, setTrackingId] = useState('ART-2026-VET-982');

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
    }
  }, [user, router]);

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
    if (!ndaAccepted) {
      alert('Please accept the Creator Agreement & Confidentiality NDA');
      return;
    }
    setSubmitting(true);
    // Record legal agreement acceptance
    recordAgreementAcceptance('both', '1.0');

    const currentUser = getCurrentUser();
    const candidateUserId = currentUser?.id || `usr-creator-${Date.now().toString().slice(-6)}`;
    const candidateEmail = currentUser?.email || '';
    const candidatePhone = currentUser?.phone || '';

    try {
      const res = await fetch('/api/freelancer/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: candidateUserId,
          alias,
          legalName,
          email: candidateEmail,
          phone: candidatePhone,
          showreelUrl,
          philosophy,
          software,
          experience,
          capacity,
          languages,
          reels,
          pan,
          bankName,
          bankAccount,
          ifsc,
          agreementAccepted: true,
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
    } catch (err) {
      console.warn('Onboarding dispatch non-fatal fallback:', err);
    }

    // Safe display payload without sensitive financial PII for client-side state
    const creatorPayload = {
      alias,
      showreelUrl,
      philosophy,
      software,
      experience,
      capacity,
      languages,
      reels,
      agreementAccepted: true,
      agreementVersion: '1.0',
      status: 'approved',
      submittedAt: new Date().toISOString(),
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
      agreement_accepted_at: new Date().toISOString(),
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
                        'CapCut Pro'
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
                    </div>
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

                {/* 03 Categorical Cut Samples */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                    <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      Sample Videos You Have Edited
                    </span>
                    <span className="text-xs text-[#86868B] uppercase font-semibold">Min 2 • Max 4 Videos</span>
                  </div>

                  <div className="space-y-3">
                    {reels.map((reel, idx) => (
                      <div
                        key={idx}
                        className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] flex flex-col md:flex-row gap-3 items-center"
                      >
                        <span className="text-xs font-bold text-[#1D1D1F] bg-white px-2.5 py-1 rounded-md border border-[#E5E5E7] shrink-0">
                          VIDEO 0{idx + 1}
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
                            <option>Commercial &amp; Brand Ads</option>
                            <option>Wedding Films &amp; Teasers</option>
                            <option>Product Videos &amp; Reels</option>
                            <option>Documentary &amp; Corporate</option>
                          </select>
                        </div>
                        <div className="w-full md:w-2/3">
                          <input
                            type="url"
                            required={idx < 2}
                            value={reel.url}
                            onChange={(e) => {
                              const next = [...reels];
                              next[idx].url = e.target.value;
                              setReels(next);
                            }}
                            placeholder={
                              idx < 2
                                ? 'https://youtube.com/... or Google Drive link'
                                : 'Optional 3rd video link (YouTube, Drive, etc.)'
                            }
                            className="w-full bg-white px-3.5 py-2 text-xs text-[#1D1D1F] rounded-lg border border-[#E5E5E7] outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 04 Compliance & Direct Disbursement */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
                    <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      Bank Details for Direct Payouts
                    </span>
                    <span className="text-xs text-[#86868B] uppercase font-semibold">Safe &amp; Encrypted</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        PAN CARD NUMBER *
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
                      <span className="text-[11px] text-[#86868B]">Required for tax deduction (TDS) as per government rules.</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        FULL NAME (AS PRINTED ON PAN CARD) *
                      </label>
                      <input
                        type="text"
                        required
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Name as per PAN and bank account"
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
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        BANK ACCOUNT NUMBER *
                      </label>
                      <input
                        type="password"
                        required
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="Enter your bank account number"
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
                        placeholder="e.g. HDFC0001234"
                        className="uppercase bg-[#F5F5F7] px-4 py-2.5 text-sm font-mono tracking-wider text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>

                  {/* NDA Checkbox */}
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex flex-col gap-2 mt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ndaAccepted}
                        onChange={(e) => setNdaAccepted(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#3B82F6] cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-[#1D1D1F] leading-relaxed">
                        <strong>CREATOR AGREEMENT &amp; CONFIDENTIALITY:</strong>
                        <br />
                        • <strong>Keep Footage Private:</strong> All raw videos, audio tracks, and client project files are strictly confidential. You agree not to upload, publicly share, or distribute client footage without written permission from Artsy.
                        <br /><br />
                        • <strong>Work Through Artsy:</strong> You agree not to contact or take direct payments from Artsy clients outside the platform for 90 days after finishing a project.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 shadow-sm"
                >
                  <span>{submitting ? 'Submitting Application...' : 'Submit Application for Review'}</span>
                  <span>→</span>
                </button>
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