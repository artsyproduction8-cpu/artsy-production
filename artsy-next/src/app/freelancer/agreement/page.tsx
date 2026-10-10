'use client';

import { useState } from 'react';
import { useAuth, hasAcceptedAgreement, recordAgreementAcceptance } from '@/lib/auth';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';

export default function FreelancerAgreementPage() {
  const { user } = useAuth();
  const [signed, setSigned] = useState<boolean>(hasAcceptedAgreement(user));
  const [ndaChecked, setNdaChecked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const creatorName = user?.full_name || 'Aarav Sen';

  const handleSign = () => {
    if (!ndaChecked) {
      alert('Please check the confirmation box to execute the agreement.');
      return;
    }
    recordAgreementAcceptance('both', '1.0');
    setSigned(true);
    setToastMessage('✓ Master Creator Agreement (MSA) & NDA v1.0 successfully signed and recorded in audit ledger.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 shadow-sm flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Legal Contract
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
              Master Creator Agreement &amp; Non-Disclosure Pact
            </h1>
            <p className="text-xs text-[#86868B] mt-1">
              Party: <span className="font-bold text-[#1D1D1F]">{creatorName}</span> • Artsy Creative Services Private Limited
            </p>
          </div>

          <div className="shrink-0">
            {signed ? (
              <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <span>✓</span>
                <span>Fully Executed &amp; Locked</span>
              </span>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <span>⚠️</span>
                <span>Signature Pending</span>
              </span>
            )}
          </div>
        </div>

        {/* Agreement Clauses Text */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E5E7] shadow-xs space-y-6 text-xs text-[#1D1D1F] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">1. Scope of Independent Creative Services</h2>
            <p className="text-[#86868B]">
              The Creator agrees to provide professional video post-production services, including but not limited to 4K color conform, timeline editing, audio stem mixing, and visual delivery per project specifications provided via Artsy Studio Station.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">2. Non-Disclosure &amp; Raw Footage Confidentiality</h2>
            <p className="text-[#86868B]">
              All client footage, camera logs, audio recordings, script outlines, and project proxies transferred via Backblaze B2 or private storage gateways are strictly confidential. The Creator covenants never to leak, publish, share, or broadcast any material prior to explicit commercial release by the client.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">3. Intellectual Property Assignment &amp; Work-For-Hire</h2>
            <p className="text-[#86868B]">
              All deliverables produced under an active Artsy dispatch order are deemed work made for hire. Upon disbursement of the agreed creator compensation, all worldwide copyrights, master project timelines, and derivatives vest irrevocably in Artsy and its commissioning client.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">4. 70/30 Financial Waterfall &amp; Statutory Deductions</h2>
            <p className="text-[#86868B]">
              Creator compensation is guaranteed at 70% of the platform base value (exclusive of forward-charge 18% GST). Payment is secured in the Artsy Production Vault and cleared via direct NEFT bank transfer upon client frame sign-off, less applicable Section 194C TDS.
            </p>
          </section>

          {/* Signature Action Section */}
          <div className="pt-6 border-t border-[#F5F5F7]">
            {signed ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold">Digitally Signed &amp; Recorded</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                    Signatory: {creatorName} • Agreement Version: 1.0 • Timestamp Verified
                  </div>
                </div>
                <button
                  onClick={() => alert('Printing / Downloading official agreement copy...')}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors shadow-2xs text-center"
                >
                  Download Signed Copy ↓
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ndaChecked}
                    onChange={(e) => setNdaChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#3B82F6] rounded cursor-pointer"
                  />
                  <span className="text-xs text-[#86868B] leading-snug">
                    I, <strong>{creatorName}</strong>, hereby confirm that I have reviewed, understand, and agree to be bound by the terms of the Master Creator Agreement (MSA v1.0) and Non-Disclosure Pact.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSign}
                  disabled={!ndaChecked}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Execute Digital Agreement →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  </div>
</div>
  );
}
