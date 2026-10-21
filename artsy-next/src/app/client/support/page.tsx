'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';

const FAQ_ITEMS = [
  {
    q: 'What is the delivery time for wedding and commercial video edits?',
    a: 'Standard video edits are typically delivered within 5 to 7 business days after we receive your footage. If you need urgent turnaround, 48-hour rush delivery is also available.'
  },
  {
    q: 'How do revision rounds work?',
    a: 'Every project includes free revision rounds. You can watch your video draft in the Review section, pause at any second, and leave a note. Your editor will make the changes and share an updated version within 48 hours.'
  },
  {
    q: 'How long are my video files stored?',
    a: 'Your raw video footage is kept safely for 15 days after you approve the final video, and your finished master videos are stored for 30 days. You can easily download your files anytime during this period.'
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
          <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                We&apos;re here to help
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Need help with your project, revisions, or video downloads? Reach out to us anytime.
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
                    </div>
                  </div>
                  <p className="text-xs text-[#86868B] mb-4">
                    Chat directly with our team on WhatsApp for quick project updates, questions, or change requests.
                  </p>
                  <a
                    href={`https://wa.me/${(process.env.NEXT_PUBLIC_SUPPORT_PHONE || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Chat on WhatsApp {process.env.NEXT_PUBLIC_SUPPORT_PHONE ? `(${process.env.NEXT_PUBLIC_SUPPORT_PHONE})` : ''}
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
                    Email us for questions about your billing, tax invoices, contracts, or custom video requests.
                  </p>
                  <a
                    href="mailto:artsyproduction8@gmail.com"
                    className="text-xs font-bold text-[#3B82F6] hover:underline"
                  >
                    artsyproduction8@gmail.com
                  </a>
                </div>

                {/* Grievance Card */}
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="border-b border-[#F5F5F7] pb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                      Office Address
                    </h2>
                  </div>
                  <div className="text-xs space-y-1.5 text-[#1D1D1F]">
                    <div>
                      <span className="text-[#86868B]">Email:</span>{' '}
                      <a href="mailto:artsyproduction8@gmail.com" className="text-[#3B82F6] font-semibold hover:underline">
                        artsyproduction8@gmail.com
                      </a>
                    </div>
                    <div>
                      <span className="text-[#86868B]">Address:</span>{' '}
                      <span className="text-[#1D1D1F]">Artsy Production, Juinagar Railway Station, Navi Mumbai, Maharashtra 400705, India</span>
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
                      Answers to common questions about our editing process
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
