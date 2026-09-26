'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { getCurrentUser, setCurrentUser, PRESET_USERS, recordAgreementAcceptance } from '@/lib/auth';

export default function FreelancerOnboarding() {
  const router = useRouter();

  const [alias, setAlias] = useState('');
  const [showreelUrl, setShowreelUrl] = useState('');
  const [philosophy, setPhilosophy] = useState('');
  const [software, setSoftware] = useState<string[]>([
    'DAVINCI RESOLVE STUDIO',
    'ADOBE PREMIERE PRO'
  ]);
  const [experience, setExperience] = useState('2 - 4 Years (Mid-Level Independent)');
  const [capacity, setCapacity] = useState('20 - 30 Hours / Week (2 Commercial Projects)');
  const [languages, setLanguages] = useState<string[]>(['HINDI', 'ENGLISH']);
  const [reels, setReels] = useState([
    { type: 'COMMERCIAL / BRAND UGC', url: '' },
    { type: 'LUXURY WEDDING FILM', url: '' },
    { type: 'PRODUCT MACRO CINEMATIC', url: '' }
  ]);
  const [pan, setPan] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [legalName, setLegalName] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ndaAccepted) {
      alert('Please accept the Non-Disclosure & Footage Retention Pact');
      return;
    }
    setSubmitting(true);
    // Record legal agreement acceptance
    recordAgreementAcceptance('both', '1.0');

    const creatorPayload = {
      alias,
      showreelUrl,
      philosophy,
      software,
      experience,
      capacity,
      languages,
      reels,
      pan,
      legalName,
      agreementAccepted: true,
      agreementVersion: '1.0',
      submittedAt: new Date().toISOString()
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_creator_profile', JSON.stringify(creatorPayload));
    }
    setTimeout(() => {
      setSubmitting(false);
      setShowModal(true);
    }, 600);
  };

  return (
    <>
      <Navbar />
      <main className="w-full max-w-full overflow-x-hidden pt-24 pb-16 bg-[#F5F5F7] min-h-screen text-[#1D1D1F] font-sans">
        {/* Top Header Strip */}
        <div className="max-w-[1200px] mx-auto px-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  CREATOR ONBOARDING
                </span>
                <span className="text-xs text-[#86868B]">
                  • Verified Creative Roster
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
                Creator Profile &amp; Sample Cuts
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Join our curated post-production roster. Verified jobs with automated payouts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-lg border border-[#E5E5E7]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                OTP VERIFIED
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-semibold rounded-lg">
                AVG REVIEW: 24 HOURS
              </span>
            </div>
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
                      Identity &amp; Artistic Philosophy
                    </span>
                    <span className="text-xs text-[#86868B] uppercase font-semibold">Public Credits</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        CREATOR ALIAS / STUDIO MONIKER *
                      </label>
                      <input
                        type="text"
                        required
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="e.g. Kinetik Cuts / Aarav Sen"
                        className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                      />
                      <span className="text-[11px] text-[#86868B]">Shown on internal production cue sheets</span>
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
                      <span className="text-[11px] text-[#86868B]">Direct link to your strongest 60–90s composite reel</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      EDITING PHILOSOPHY &amp; SIGNATURE PACING *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={philosophy}
                      onChange={(e) => setPhilosophy(e.target.value)}
                      placeholder="Detail your approach to micro-pacing, sound design integration, narrative arc retention, and color palette discipline..."
                      className="bg-[#F5F5F7] p-3.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all resize-none"
                    ></textarea>
                    <div className="flex justify-between text-[11px] text-[#86868B]">
                      <span>Describe your aesthetic approach and rhythm</span>
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
                      Toolchain &amp; Production Capacity
                    </span>
                    <span className="text-xs text-[#86868B] uppercase font-semibold">Hardware / Schedule</span>
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
                        'CAPCUT PRO (FAST-TURNAROUND SOCIAL)'
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
                        COMMERCIAL POST EXPERIENCE
                      </label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6]"
                      >
                        <option>2 - 4 Years (Mid-Level Independent)</option>
                        <option>5 - 8 Years (Senior Commercial Lead)</option>
                        <option>8+ Years (Creative Director / Post Supervisor)</option>
                        <option>1 - 2 Years (High Velocity Junior)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        WEEKLY RESERVED SLATE CAPACITY
                      </label>
                      <select
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6]"
                      >
                        <option>20 - 30 Hours / Week (2 Commercial Projects)</option>
                        <option>35 - 45 Hours / Week (Full-Time Roster)</option>
                        <option>10 - 15 Hours / Week (Weekend Sprint Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      SPOKEN / DIALOGUE CUT LANGUAGES
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {['HINDI', 'ENGLISH', 'PUNJABI', 'TAMIL', 'BENGALI', 'TELUGU', 'MARATHI', 'MALAYALAM'].map(
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
                            required={idx < 2}
                            value={reel.url}
                            onChange={(e) => {
                              const next = [...reels];
                              next[idx].url = e.target.value;
                              setReels(next);
                            }}
                            placeholder={
                              idx < 2
                                ? 'https://vimeo.com/... or Google Drive public link'
                                : 'Optional 3rd category verification reel'
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
                      Compliance &amp; Direct Payouts
                    </span>
                    <span className="text-xs text-[#86868B] uppercase font-semibold">256-Bit Encrypted</span>
                  </div>

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
                      <span className="text-[11px] text-[#86868B]">
                        Mandatory for direct NEFT settlements and tax compliance in India
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        NEFT BANK ACCOUNT NUMBER *
                      </label>
                      <input
                        type="password"
                        required
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="••••••••••••"
                        className="bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6]"
                      />
                      <span className="text-[11px] text-[#86868B]">
                        Disbursement processed within 12h of client delivery milestone
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <strong>NON-DISCLOSURE &amp; FOOTAGE RETENTION PACT:</strong> I understand that all uncut camera
                        raw proxies, audio stems, and project files provided by Artsy Production remain strictly
                        proprietary to client accounts. I shall not mirror, publicly broadcast, or circulate
                        unreleased footage without written approval from Artsy Studio Administration.
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
                  <span>{submitting ? 'DISPATCHING CREDENTIALS...' : 'SUBMIT APPLICATION FOR REVIEW'}</span>
                  <span>→</span>
                </button>
              </form>
            </div>

            {/* Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Direct Payout Card */}
              <div className="bg-[#1D1D1F] text-white p-6 sm:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between relative overflow-hidden">
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#3B82F6] text-white px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full">
                      TIMELY SETTLEMENTS
                    </span>
                  </div>
                  <span className="text-3xl font-extrabold tracking-tight text-white">DIRECT NEFT</span>
                  <h2 className="text-base font-bold uppercase leading-tight text-white">
                    Automated Payouts to Roster Editors
                  </h2>
                  <p className="text-xs text-[#86868B] leading-relaxed">
                    Direct bank payment dispatch via NEFT upon creative delivery sign-off. Zero payment delays, clawbacks,
                    or deferred freelancer compensation.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[11px] font-medium text-emerald-400 border-t border-white/10 mt-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  GUARANTEED BY ESCROW POOL
                </div>
              </div>

              {/* Anonymized Job Cards Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-[#1D1D1F] uppercase mb-2">Anonymized Job Cards</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Zero awkward fee haggling or client ghosting. You receive verified production tickets with
                  pre-structured timecodes, style moodboards, and dedicated high-speed server links.
                </p>
                <div className="mt-4 bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E7] flex items-center justify-between text-xs font-semibold text-[#1D1D1F]">
                  <span>Client Comm Buffer</span>
                  <span className="text-[#3B82F6]">100% Studio Handled</span>
                </div>
              </div>

              {/* Quality Buffer Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#1D1D1F] uppercase mb-1">In-House QA Buffer</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Every task comes with our built-in internal review window. Our staff supervisors
                  inspect draft assemblies before clients see them, actively filtering out scope-creep.
                </p>
                <div className="w-full bg-[#F5F5F7] h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-[#3B82F6] h-full w-3/4 rounded-full"></div>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#86868B] mt-1">
                  <span>Current Roster Capacity</span>
                  <span>76% Claimed</span>
                </div>
              </div>

              {/* Vetting Protocol Box */}
              <div className="bg-[#F5F5F7] p-5 rounded-2xl border border-[#E5E5E7] flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#1D1D1F] uppercase">Vetting Protocol</span>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Artsy strictly opposes uncompensated &apos;test edits&apos;. We evaluate your real-world portfolio and submitted link references, followed by a 20-minute video call interview with our post supervisor. Decisions are communicated within 24 hours.
                </p>
              </div>

              {/* Current Roster Slate */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1D1D1F] text-white flex flex-col items-center justify-center font-extrabold shrink-0">
                  <span className="text-base leading-none">142</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#86868B]">ROSTER</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#86868B] uppercase font-semibold">Active Roster</span>
                  <span className="text-xs uppercase font-bold text-[#1D1D1F]">Delhi • Bengaluru • Mumbai</span>
                  <span className="text-[11px] text-[#3B82F6] font-medium mt-0.5">Accepting New Portfolios</span>
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
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  SUBMISSION RECORDED
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
                <h4 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Application Queued For Review</h4>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Your credentials and categorical cut samples have been dispatched to our editorial supervisors. You
                  will receive an SMS and dashboard notification regarding your roster approval within 24 hours.
                </p>
              </div>
              <div className="bg-[#F5F5F7] p-3.5 rounded-xl border border-[#E5E5E7] text-xs flex justify-between items-center">
                <span className="text-[#86868B] font-medium">TRACKING ID</span>
                <span className="font-mono font-bold text-[#1D1D1F]">ART-2025-VET-982</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!getCurrentUser()) {
                      setCurrentUser(PRESET_USERS.freelancer);
                    }
                    router.push('/freelancer');
                  }}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Open Creator Dashboard
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