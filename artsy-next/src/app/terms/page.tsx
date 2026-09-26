'use client';

import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="border-b border-[#E5E5E7] pb-8 mb-10">
          <div className="text-xs uppercase font-bold tracking-widest text-[#86868B] mb-2">
            LEGAL ARCHITECTURE // COMPLIANCE
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Terms of Service
          </h1>
          <p className="text-sm text-[#86868B] mt-2">
            Version 2.0 • Last Updated: September 2026 • Governing Law: Republic of India
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#424245]">
          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">1. Nature of the Platform</h2>
            <p>
              Artsy Production is a managed creative services platform operating in India. Artsy operates as the Merchant of Record and primary contractor for all video post-production, editing, and color grading services booked through this platform. Artsy manages end-to-end quality assurance, timeline adherence, and creator assignment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">2. Invoicing, Payments &amp; Taxes</h2>
            <p>
              All prices displayed on Artsy Production are inclusive of applicable Goods and Services Tax (GST) at 18% under SAC Code 999613 (video post-production services). Client payments are held in escrow custody until deliverable quality assurance is certified. Formal Tax Invoices indicating CGST/SGST or IGST based on the place of supply are issued electronically for every order.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">3. Deliverable Review &amp; Revisions</h2>
            <p>
              Each standard order includes one (1) comprehensive free revision round for minor adjustments (pacing, trim, color tweak, or audio sync). Revision notes must be submitted within forty-eight (48) hours of deliverable receipt via the frame-accurate review interface. In accordance with Section 6.7 of the Studio Master Plan, deliverables not commented on within seven (7) business days are deemed auto-approved.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">4. Scope Creep &amp; Change Orders</h2>
            <p>
              Requests requiring structural redirections, additional deliverables, or raw footage in excess of the booked tier will be quoted as formal Change Orders (billed at 10% for extra revision passes, or 60% for additional format cuts).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">5. Footage Retention &amp; Auto-Deletion</h2>
            <p>
              Raw footage uploads are retained in secure cloud storage during active production and for fifteen (15) days following formal project approval (or 7-day auto-approval), following which automated soft and hard deletion cycles occur per our Studio Retention Policy. Final rendered deliverables are retained for thirty (30) days post-approval. Files are never purged during active review or disputed milestones.
            </p>
          </section>

          <section className="p-6 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7]">
            <h2 className="text-base font-bold text-[#1D1D1F] mb-2">Statutory Contact</h2>
            <p className="text-xs text-[#86868B]">
              For contractual inquiries or formal correspondence:
              <br />
              <strong className="text-[#1D1D1F]">Artsy Production</strong>
              <br />
              Email: legal@artsyproduction.in • Phone: +91 836 925 1112
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
