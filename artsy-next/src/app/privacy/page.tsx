'use client';

import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="border-b border-[#E5E5E7] pb-8 mb-10">
          <div className="text-xs uppercase font-bold tracking-widest text-[#86868B] mb-2">
            DATA FIDUCIARY DISCLOSURE // DPDP ACT 2023
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#86868B] mt-2">
            Version 2.0 • In Compliance with the Digital Personal Data Protection Act, 2023
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#424245]">
          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">1. Data Fiduciary Identity</h2>
            <p>
              Artsy Production acts as a <strong>Data Fiduciary</strong> in respect of your personal data collected via this website and platform. We process personal data solely for providing high-precision post-production creative services, processing transactions, ensuring quality assurance, and complying with statutory taxation obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">2. Personal Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Contact &amp; Identity:</strong> Full name, telephone number (for WhatsApp transaction updates and OTP authentication), and verified email address.</li>
              <li><strong>Creative Assets:</strong> Client raw footage, audio tracks, editing briefs, and timecoded feedback comments.</li>
              <li><strong>Tax &amp; Compliance Data:</strong> GSTIN and registered business address for B2B tax invoicing; PAN and encrypted bank account numbers for creator payout remittances.</li>
              <li><strong>Technical Metadata:</strong> Anonymized IP addresses, browser types, and upload logs to guarantee secure file integrity and fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">3. Data Subject Rights Under DPDP Act</h2>
            <p className="mb-4">
              As a Data Principal, you are entitled to exercise the following rights directly via our automated portal endpoints or by contacting our Grievance Officer:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7]">
                <h3 className="font-bold text-[#1D1D1F] mb-1">Right to Access</h3>
                <p className="text-xs text-[#86868B]">
                  Download a complete, machine-readable JSON archive of all your personal records, active slates, and consent timestamps via our Data Export API.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7]">
                <h3 className="font-bold text-[#1D1D1F] mb-1">Right to Erasure</h3>
                <p className="text-xs text-[#86868B]">
                  Submit a verified data deletion request. Your personally identifiable information (PII) will be irreversibly anonymized while statutory financial ledgers remain securely archived.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">4. Security &amp; Storage Architecture</h2>
            <p>
              All video assets are uploaded directly from your browser to Backblaze B2 object storage via ephemeral, presigned cryptographic URLs. Financial details, including PAN and banking parameters, are encrypted at rest using AES-256 encryption. We never sell, lease, or monetize your creative media or personal details.
            </p>
          </section>

          {/* Grievance Officer Card */}
          <section className="p-6 bg-[#1D1D1F] text-white rounded-2xl border border-black/10">
            <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
              Designated DPDP Grievance Redressal Officer
            </h2>
            <p className="text-xs text-white/80 leading-relaxed mb-4">
              In accordance with the Digital Personal Data Protection Act, 2023, the details of the designated Data Protection Grievance Officer for Artsy Production are as follows:
            </p>
            <div className="text-xs space-y-1 text-white/90 font-mono">
              <div><strong className="text-white">Officer:</strong> Privacy &amp; Grievance Redressal Cell</div>
              <div><strong className="text-white">Organization:</strong> Artsy Production</div>
              <div><strong className="text-white">Email:</strong> grievance@artsyproduction.in</div>
              <div><strong className="text-white">Direct Line:</strong> +91 836 925 1112</div>
              <div><strong className="text-white">Response SLA:</strong> Within 48 business hours</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
