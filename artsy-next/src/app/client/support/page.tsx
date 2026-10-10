'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';

const FAQ_ITEMS = [
  {
    q: 'What is the turnaround time for wedding film and commercial edits?',
    a: 'Standard wedding highlights and commercial cuts are delivered within 5 to 7 business days from ingest completion. Rush orders (48-hour turnarounds) are expedited through dedicated lead editors with priority ingest pipeline allocation.'
  },
  {
    q: 'How does the 2-round revision policy work?',
    a: 'Every project includes 2 complimentary revision cycles within 7 days of master preview. Clients provide frame-accurate, timestamped feedback directly via our timestamped player. Once submitted, revisions are addressed and turned around within 48 hours.'
  },
  {
    q: 'How are raw footage and master files retained on Artsy servers?',
    a: 'Under Artsy statutory retention policy, raw footage is retained for 15 days post-approval to allow quick pickups or alternative exports. Delivered master exports are archived for 30 days before automated WORM lifecycle purging. Permanent cold storage is available upon request.'
  },
  {
    q: 'Can I request an NDA or customized usage license for enterprise assets?',
    a: 'Yes. All creators and studio editors are bound by strict bilateral non-disclosure agreements before being provisioned workspace access. Custom enterprise NDAs and bespoke IP assignment deeds can be countersigned by our legal desk prior to media ingest.'
  },
  {
    q: 'How does payment and GST invoicing work?',
    a: 'Payments are secured via Razorpay escrow-style vault upon booking. We issue GST Rule 46 compliant tax invoices under SAC 999613 (Audio-Visual Post-Production Services) with 18% GST (CGST/SGST for intra-state or IGST for inter-state) accessible in your Tax Invoices dashboard.'
  },
  {
    q: 'What happens if I am not satisfied with the delivered creative cut?',
    a: 'If a project does not meet verified brief requirements after 2 revisions, our Creative Director steps in for an executive review. If resolution is not reached, our 100% Milestone Quality Guarantee enables reassignment to a senior editor or statutory escrow refund.'
  }
];

export default function ClientSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/client" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Dashboard
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs font-bold text-[#1D1D1F]">Support</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                We&apos;re here to help
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Direct producer assistance, statutory grievance redressal, and frequently asked production questions.
              </p>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Contact Options */}
              <div className="lg:col-span-5 space-y-5">
                {/* WhatsApp Support Card */}
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs hover:border-[#3B82F6] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                      WA
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#1D1D1F]">WhatsApp Live Support</h2>
                      <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Active • Instant Response
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#86868B] mb-4">
                    Direct communication with your designated studio production supervisor for urgent cuts, ingest queries, and revision requests.
                  </p>
                  <a
                    href="https://wa.me/917777078742"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Chat on WhatsApp (+91 77770 78742)
                  </a>
                </div>

                {/* Email Support Card */}
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#3B82F6] flex items-center justify-center font-bold text-lg">
                      @
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#1D1D1F]">Email Support</h2>
                      <span className="inline-block text-[10px] font-semibold text-[#86868B]">
                        Response within 4 business hours
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#86868B] mb-3">
                    For contractual inquiries, large-scale drive shipments, and custom multi-project enterprise invoicing.
                  </p>
                  <a
                    href="mailto:support@artsyproduction.in"
                    className="text-xs font-bold text-[#3B82F6] hover:underline"
                  >
                    support@artsyproduction.in
                  </a>
                </div>

                {/* Grievance Officer Card (Statutory IT Rules 2021 / DPDP Act) */}
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="border-b border-[#F5F5F7] pb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                      Statutory Grievance Redressal
                    </h2>
                    <span className="text-[11px] text-[#86868B]">Rule 3(2) IT Rules 2021 & DPDP Act §10</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-[#1D1D1F]">
                    <div>
                      <span className="text-[#86868B]">Grievance Officer:</span> <strong>Rohan Singhania</strong>
                    </div>
                    <div>
                      <span className="text-[#86868B]">Designation:</span> <span>Head of Legal & Compliance</span>
                    </div>
                    <div>
                      <span className="text-[#86868B]">Statutory Email:</span>{' '}
                      <a href="mailto:grievance@artsyproduction.in" className="text-[#3B82F6] font-semibold hover:underline">
                        grievance@artsyproduction.in
                      </a>
                    </div>
                    <div>
                      <span className="text-[#86868B]">Registered Office:</span>{' '}
                      <span className="text-[#1D1D1F]">Artsy Production Hub, Bandra Kurla Complex, Mumbai, MH 400051</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: FAQ Accordion */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#F5F5F7] pb-3">
                    <h2 className="text-base font-bold text-[#1D1D1F]">Frequently Asked Questions</h2>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Everything you need to know about our post-production workflows
                    </p>
                  </div>

                  <div className="space-y-3">
                    {FAQ_ITEMS.map((item, index) => {
                      const isOpen = openFaq === index;
                      return (
                        <div
                          key={index}
                          className="border border-[#E5E5E7] rounded-xl overflow-hidden transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(index)}
                            className="w-full p-4 text-left flex items-center justify-between gap-4 bg-white hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-bold text-[#1D1D1F] leading-snug">{item.q}</span>
                            <span className="text-[#3B82F6] font-bold text-sm shrink-0">
                              {isOpen ? '−' : '+'}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="p-4 pt-1 bg-[#FAFAFA] border-t border-[#E5E5E7] text-xs text-[#555] leading-relaxed">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
