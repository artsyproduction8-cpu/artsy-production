'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'What is Artsy and how does the studio platform work?',
    a: 'Artsy Production is a managed creative services platform connecting clients with an elite, curated pool of freelance video editors under strict quality supervision, transparent pricing, and centralized timeline accountability.',
  },
  {
    q: 'What are the delivery turnarounds and SLAs?',
    a: 'Standard delivery ranges from 7 to 10 working days depending on footage volume and camera complexity. For urgent campaigns, expedited priority (4–5 days) and rush (48 hours) lanes are available with an immutable timeline guarantee.',
  },
  {
    q: 'How does Artsy ensure cinema-grade quality control?',
    a: 'Every cutter undergoes strict portfolio vetting. Every cut passes through in-house Studio QA before client preview, supported by an integrated frame-accurate review player allowing timestamped notes and one comprehensive complimentary revision round.',
  },
  {
    q: 'What is your revision and refund policy?',
    a: 'Pre-assignment cancellations receive a 100% refund minus payment gateway fee. One free revision pass is included with every project (comments within 48 hours). Additional revision rounds are structured as transparent 10% change orders.',
  },
  {
    q: 'Can our creative team retain the same editor for ongoing work?',
    a: 'Yes. When placing repeat briefs or recurring catalog orders, you can designate your preferred senior fellow or creator, and our intelligent matching engine prioritizes their calendar for dedicated direct assignments.',
  },
  {
    q: 'What raw camera formats and codecs do you accept?',
    a: 'We natively ingest all cinema raw and log profiles including ARRI RAW, REDCODE, cinema mezzanine formats, Sony S-Log3, Canon Cinema RAW Light, and Blackmagic RAW up to 4K resolutions.',
  },
];

export default function FAQ() {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const toggleFaq = (idx: number) => {
    setOpenMap((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <section className="w-full py-16 sm:py-20 bg-[#F5F5F7]" id="faq-section">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        
        {/* Section Header (Compact) */}
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
            Frequently answered questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
            Everything you need to know about our workflow, SLAs, quality benchmarks, and editor matching.
          </p>
        </div>

        {/* Compact Clean FAQ Accordions */}
        <div className="max-w-3xl divide-y divide-[#E5E5E7]">
          {FAQS.map((faq, idx) => {
            const isOpen = !!openMap[idx];
            return (
              <div key={idx} className="py-4 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left flex items-center justify-between font-semibold text-sm sm:text-base tracking-[-0.02em] text-[#1D1D1F] hover:text-[#3B82F6] transition-colors cursor-pointer outline-none"
                >
                  <span>{faq.q}</span>
                  <span
                    className={`text-xl text-[#3B82F6] font-light transition-transform duration-200 leading-none ml-4 flex-shrink-0 ${
                      isOpen ? 'rotate-45' : 'rotate-0'
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-[13.5px] leading-relaxed text-[#86868B] font-normal pr-8">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
