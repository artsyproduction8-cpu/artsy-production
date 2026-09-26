'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const CATEGORIES = [
  { key: 'wedding', title: 'Wedding', startingPrice: '₹1,500' },
  { key: 'brand', title: 'Brand', startingPrice: '₹3,000' },
  { key: 'corporate', title: 'Corporate', startingPrice: '₹8,000' },
  { key: 'personal', title: 'Personal / Other', startingPrice: '₹1,000' }
];

interface SubFormat {
  id: string;
  label: string;
  base: number;
  duration: string;
  tag?: string;
}

const SUB_CATEGORIES: Record<string, SubFormat[]> = {
  wedding: [
    { id: 'highlight-teaser', label: 'Highlight + Teaser', base: 5000, duration: '3–5m + 45–60s', tag: 'Most Popular' },
    { id: 'highlight-only', label: 'Highlight Only', base: 4000, duration: '3–5 min' },
    { id: 'teaser-only', label: 'Teaser Only', base: 2000, duration: '45–60 sec' },
    { id: 'trinity-bundle', label: 'Trinity: Highlight + Teaser + Reel', base: 8000, duration: '3–5m + teaser + reel', tag: 'Full Suite' },
    { id: 'reel-only', label: 'Social Reel Only', base: 1500, duration: '30–60 sec' },
    { id: 'cinematic-story', label: 'Cinematic Story', base: 8000, duration: '10–15 min' },
    { id: 'master-package', label: 'Cinematic Story + Teaser + Reel', base: 10000, duration: 'Archival Master' },
  ],
  brand: [
    { id: 'product-video', label: 'Product Video', base: 3000, duration: 'Max 2 min', tag: 'DTC Hero' },
    { id: 'brand-video', label: 'Brand Video', base: 3000, duration: 'Max 2 min' },
    { id: 'fashion-apparel', label: 'Fashion / Apparel Video', base: 3000, duration: 'Max 2 min' },
    { id: 'ad-film', label: 'Ad Film (Commercial Cut)', base: 10000, duration: 'Max 2 min', tag: 'High Velocity' },
    { id: 'explainer-video', label: 'Explainer Video', base: 8000, duration: 'Max 2 min' },
  ],
  corporate: [
    { id: 'event-highlight', label: 'Event Highlight', base: 12000, duration: '3–5 min', tag: 'Summit Recap' },
    { id: 'corporate-film', label: 'Corporate Film (Full Keynote)', base: 15000, duration: 'Enterprise' },
    { id: 'testimonial', label: 'Testimonial Video', base: 10000, duration: '2–4 min' },
    { id: 'training-video', label: 'Internal Training Video', base: 8000, duration: 'Modular Chapter' },
  ],
  personal: [
    { id: 'birthday-highlight', label: 'Birthday Highlight', base: 3000, duration: '3–5 min' },
    { id: 'birthday-highlight-teaser', label: 'Birthday Highlight + Teaser', base: 4000, duration: '3–5m + teaser' },
    { id: 'birthday-triple', label: 'Birthday Triple Bundle', base: 5000, duration: 'Highlight + Teaser + Reel', tag: 'Popular' },
    { id: 'birthday-teaser', label: 'Birthday Teaser Only', base: 1500, duration: '45–60 sec' },
    { id: 'birthday-reel', label: 'Birthday Reel Only', base: 1000, duration: '30–60 sec' },
    { id: 'engagement-highlight', label: 'Engagement Highlight', base: 3500, duration: '3–5 min' },
    { id: 'engagement-highlight-teaser', label: 'Engagement Highlight + Teaser', base: 4500, duration: '3–5m + teaser' },
    { id: 'engagement-triple', label: 'Engagement Triple Bundle', base: 5500, duration: 'Highlight + Teaser + Reel' },
    { id: 'baby-shower-highlight', label: 'Baby Shower Highlight', base: 3000, duration: '3–5 min' },
    { id: 'baby-shower-bundle', label: 'Baby Shower Triple Bundle', base: 5000, duration: 'Highlight + Teaser + Reel' },
    { id: 'memorial-film', label: 'Memorial & Celebration of Life', base: 3000, duration: '3–5 min' },
    { id: 'maternity-reel', label: 'Maternity Reel Only', base: 1000, duration: '30–60 sec' },
  ],
};

function ConfiguratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryService = (searchParams.get('service') || 'wedding').toLowerCase();
  const resolvedCategory =
    queryService === 'ugc' || queryService === 'brand_ugc' || queryService === 'product' || queryService === 'store_product'
      ? 'brand'
      : queryService === 'corporate_event'
      ? 'corporate'
      : queryService === 'personal_event'
      ? 'personal'
      : queryService in SUB_CATEGORIES
      ? queryService
      : 'wedding';

  const [category, setCategory] = useState<string>(resolvedCategory);

  const querySub = searchParams.get('sub') || '';
  const currentSubs = SUB_CATEGORIES[category] || SUB_CATEGORIES.wedding;
  const initialSub = currentSubs.find((s) => s.id === querySub) || currentSubs[0];

  const [selectedSubId, setSelectedSubId] = useState<string>(initialSub.id);
  const [angles, setAngles] = useState<string>('single');
  const [turnaround, setTurnaround] = useState<string>('standard');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(42);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // When category changes, reset sub-category if not in new category, and reset turnaround if wedding
  useEffect(() => {
    const subs = SUB_CATEGORIES[category] || SUB_CATEGORIES.wedding;
    if (!subs.some((s) => s.id === selectedSubId)) {
      setSelectedSubId(subs[0].id);
    }
    if (category === 'wedding' && turnaround === 'rush') {
      setTurnaround('priority');
    }
  }, [category, selectedSubId, turnaround]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  // Selected sub-category details
  const activeSubs = SUB_CATEGORIES[category] || SUB_CATEGORIES.wedding;
  const activeSub = activeSubs.find((s) => s.id === selectedSubId) || activeSubs[0];
  const baseServiceCost = activeSub.base;

  // Add-ons per Master Plan §2.2, §2.3, §2.4, §2.5
  const anglePerCam = category === 'wedding' || category === 'personal' ? 800 : 500;
  const angleCost = angles === 'dual' ? anglePerCam : angles === 'multicam' ? anglePerCam * 2 : 0;

  const turnaroundCost =
    turnaround === 'rush'
      ? 2000
      : turnaround === 'priority'
      ? category === 'wedding'
        ? 2000
        : 1000
      : 0;

  const totalPayable = baseServiceCost + angleCost + turnaroundCost;

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    setResendTimer(42);
    setOtp(['1', '2', '3', '4', '5', '6']);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    const orderId = 'ARTSY-' + Math.floor(100000 + Math.random() * 900000);
    const bookingPayload = {
      orderId,
      bookingData: {
        service: category,
        serviceName: `${CATEGORIES.find((c) => c.key === category)?.title} — ${activeSub.label}`,
        subCategoryId: activeSub.id,
        duration: activeSub.duration,
        angles,
        turnaround,
        audioUrl,
        notes,
        mobile,
        priceBreakdown: {
          baseCost: baseServiceCost,
          angleCost,
          turnaroundCost,
          grandTotal: totalPayable,
        },
      },
    };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('artsy_confirmed_order', JSON.stringify(bookingPayload));
      localStorage.setItem('artsy_active_booking', JSON.stringify(bookingPayload));
    }
    setTimeout(() => {
      setIsProcessing(false);
      router.push(`/book/confirmation?orderId=${orderId}`);
    }, 900);
  };

  return (
    <main className="w-full max-w-full overflow-x-hidden pt-16 bg-[#F5F5F7] min-h-screen">
      <div className="flex flex-col w-full max-w-full overflow-x-hidden">
        
        {/* Editorial Subheader Strip */}
        <section className="w-full bg-white border-b border-[#E5E5E7] px-6 sm:px-8 py-4">
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              <span className="text-xs font-semibold tracking-wide text-[#1D1D1F] uppercase">
                {CATEGORIES.find((c) => c.key === category)?.title || 'Production'} Order
              </span>
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-[#1D1D1F] text-white font-medium">
                Category &amp; Format
              </span>
              <span className="text-[#86868B]">→</span>
              <span className="px-3 py-1 rounded-full bg-[#3B82F6] text-white font-medium">
                Specifications
              </span>
              <span className="text-[#86868B]">→</span>
              <span className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[#86868B] font-medium border border-[#E5E5E7]">
                Checkout
              </span>
            </div>
          </div>
        </section>

        {/* Main Grid Content */}
        <section className="w-full px-6 sm:px-8 py-10 sm:py-14">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Configuration Wizard (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              {/* Top Banner Card */}
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#3B82F6]/10 text-[#3B82F6]">
                    Deterministic Studio Pricing
                  </span>
                  <span className="text-xs font-semibold text-[#86868B]">
                    Guaranteed SLA
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
                  Configure production parameters.
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Select your exact category and sub-category format. Unit pricing is calculated transparently with 18% embedded GST and 1 complimentary revision pass.
                </p>
              </div>

              {/* Stage 1A: Core Category Selection */}
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                <div className="mb-4 pb-3 border-b border-[#F5F5F7]">
                  <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                    Select Creative Category
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      type="button"
                      className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                        category === c.key
                          ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm'
                          : 'bg-white text-[#1D1D1F] border-[#E5E5E7] hover:border-[#3B82F6]'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold block">
                        {c.title}
                      </span>
                      <span className={`text-[11px] font-semibold block mt-1 ${category === c.key ? 'text-[#3B82F6]' : 'text-[#86868B]'}`}>
                        From {c.startingPrice}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage 1B: Sub-Category Format Selection */}
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                <div className="mb-4 pb-3 border-b border-[#F5F5F7]">
                  <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                    Choose Sub-Category Format &amp; Base Rate
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {activeSubs.map((sub) => {
                    const isSelected = selectedSubId === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubId(sub.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#3B82F6] bg-[#3B82F6]/5 shadow-xs'
                            : 'border-[#E5E5E7] hover:border-[#86868B]/40 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="sub_category"
                            checked={isSelected}
                            onChange={() => setSelectedSubId(sub.id)}
                            className="accent-[#3B82F6] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#1D1D1F]">
                                {sub.label}
                              </span>
                              {sub.tag && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">
                                  {sub.tag}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#86868B] block mt-0.5">
                              Deliverable Duration: {sub.duration}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-extrabold text-[#1D1D1F] block">
                            ₹{sub.base.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-[#86868B] block">
                            Single Cam Base
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage 2: Camera Angles & Synchronization */}
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                <div className="mb-4 pb-3 border-b border-[#F5F5F7]">
                  <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                    Camera Setup &amp; Ingestion Complexity
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'single', label: 'Single Camera Setup', desc: 'Linear A-roll raw timeline', add: 0 },
                    { id: 'dual', label: 'Dual Camera (2 Angles)', desc: 'A/B camera angle switching and waveform sync', add: anglePerCam },
                    { id: 'multicam', label: '3–4 Multi-Cam Sync', desc: 'Audio waveform aligned multi-perspective', add: anglePerCam * 2 },
                    { id: 'drone', label: 'Drone Footage (Client Provided)', desc: 'Client-provided drone plates conform', add: 0 },
                  ].map((a) => (
                    <label
                      key={a.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        angles === a.id
                          ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                          : 'border-[#E5E5E7] hover:border-[#86868B]/40 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#1D1D1F]">
                          {a.label}
                        </span>
                        <input
                          type="radio"
                          name="angles"
                          checked={angles === a.id}
                          onChange={() => setAngles(a.id)}
                          className="accent-[#3B82F6] w-4 h-4 cursor-pointer mt-0.5"
                        />
                      </div>
                      <p className="text-[11px] text-[#86868B] mt-1">
                        {a.desc}
                      </p>
                      <div className="mt-3 pt-2 border-t border-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]">
                        {a.add === 0 ? 'Included' : `+₹${a.add.toLocaleString('en-IN')}`}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stage 3: Turnaround SLA */}
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                <div className="mb-4 pb-3 border-b border-[#F5F5F7]">
                  <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                    Turnaround SLA &amp; Dispatch Priority
                  </h2>
                </div>

                <div className={`grid grid-cols-1 ${category === 'wedding' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
                  {[
                    { id: 'standard', label: '7–10 Working Days', tag: 'Normal SLA', add: 0 },
                    { id: 'priority', label: '4–5 Working Days', tag: 'Rush SLA', add: category === 'wedding' ? 2000 : 1000 },
                    ...(category !== 'wedding' ? [{ id: 'rush', label: '48 Hours', tag: 'Ultra Rush SLA', add: 2000 }] : []),
                  ].map((t) => (
                    <label
                      key={t.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        turnaround === t.id
                          ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                          : 'border-[#E5E5E7] hover:border-[#86868B]/40 bg-white'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#86868B] block w-fit mb-2">
                          {t.tag}
                        </span>
                        <span className="text-xs font-bold text-[#1D1D1F] block">
                          {t.label}
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]">
                        {t.add === 0 ? 'Included' : `+₹${t.add.toLocaleString('en-IN')}`}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Creative Brief & Music Link */}
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                <div className="mb-4 pb-3 border-b border-[#F5F5F7]">
                  <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                    Creative Brief &amp; Reference Links
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                      Music Reference or Video Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://open.spotify.com/track/... or YouTube link"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] text-xs focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                      Editing Notes &amp; Specific Cut Directives
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Focus on emotional speeches, color tone warm filmic Rec.709, prioritize couple vows..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] text-xs focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Quotation Breakdown & Mobile Checkout (5 Cols) */}
            <div className="lg:col-span-5 sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7]">
                
                {/* Header */}
                <div className="pb-4 border-b border-[#F5F5F7]">
                  <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                    Order Summary
                  </h3>
                </div>

                {/* Line Items */}
                <div className="py-4 space-y-2.5 border-b border-[#F5F5F7] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#86868B]">Category</span>
                    <span className="font-semibold text-[#1D1D1F] uppercase">{category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#86868B] max-w-[200px] truncate">{activeSub.label}</span>
                    <span className="font-semibold text-[#1D1D1F]">₹{baseServiceCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#86868B]">Camera Setup</span>
                    <span className="font-semibold text-[#1D1D1F]">+{angleCost === 0 ? '₹0' : `₹${angleCost.toLocaleString('en-IN')}`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#86868B]">Turnaround SLA</span>
                    <span className="font-semibold text-[#1D1D1F]">+{turnaroundCost === 0 ? '₹0' : `₹${turnaroundCost.toLocaleString('en-IN')}`}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-[#86868B]">
                    <span>GST (18%)</span>
                    <span className="text-[#1D1D1F] font-medium">Included in Total</span>
                  </div>
                </div>

                {/* Total Payable Box */}
                <div className="my-5 p-4 rounded-xl bg-[#F5F5F7] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#86868B] block uppercase font-bold tracking-wider">
                      Total Payable (Escrow)
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] mt-0.5 block">
                      ₹{totalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#86868B] bg-white px-2.5 py-1 rounded-md border border-[#E5E5E7]">
                    INR • All-Inclusive
                  </span>
                </div>

                {/* Guarantee Pills */}
                <div className="space-y-2 mb-6 text-xs text-[#86868B]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                    <span>15-day raw project footage retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                    <span>30-day master cloud archive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                    <span>1 complimentary revision pass included</span>
                  </div>
                </div>

                {/* Mobile Auth & Dispatch */}
                <div className="pt-5 border-t border-[#F5F5F7]">
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
                    Mobile Number for WhatsApp Delivery Link
                  </label>
                  
                  {!otpSent ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-2.5 text-xs text-[#86868B] font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E5E5E7] text-xs font-mono focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                      >
                        Send OTP
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-[#86868B]">
                        <span>OTP sent to +91 {mobile}</span>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[#3B82F6] hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const newOtp = [...otp];
                              newOtp[i] = e.target.value;
                              setOtp(newOtp);
                              if (e.target.value && i < 5) {
                                document.getElementById(`otp-${i + 1}`)?.focus();
                              }
                            }}
                            className="w-10 h-10 text-center font-bold text-sm rounded-lg border border-[#E5E5E7] focus:outline-none focus:border-[#3B82F6]"
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleSimulatePayment}
                        className="w-full py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-2"
                      >
                        {isProcessing ? 'Locking Escrow Deposit...' : 'Lock Escrow & Confirm Booking →'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen pt-32 text-center text-xs text-[#86868B]">Loading order specifications...</div>}>
        <ConfiguratorContent />
      </Suspense>
      <Footer />
    </div>
  );
}