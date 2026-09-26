'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'wedding',
    message: '',
    project_budget: '₹5,000 - ₹25,000',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full py-20 sm:py-28 bg-[#F5F5F7] border-t border-[#E5E5E7] text-[#1D1D1F] relative overflow-hidden" id="contact">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Editorial Studio Context */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#3B82F6] text-xs font-bold uppercase tracking-wider border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
              Direct Production Desk
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F] leading-[1.1]">
              Initiate your next film commission.
            </h2>

            <p className="text-sm sm:text-base text-[#86868B] leading-relaxed">
              Connect directly with our post-production desk. Share your project treatment, timeline goals, or drive links. We respond with technical feasibility and deterministic delivery schedules within 2 hours.
            </p>

            <div className="pt-4 space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center font-bold text-sm shrink-0">
                  SLA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1D1D1F]">2-Hour Dispatch Review</h4>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Our lead colorist and post supervisor verify footage format, color profile, and audio stems immediately.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                  GST
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1D1D1F]">100% Tax Compliant Invoicing</h4>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    SAC 999613 statutory tax invoices with GST input tax credit available for all corporate commissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-[#86868B]">
              <span>Direct WhatsApp Desk:</span>
              <a 
                href="https://wa.me/919999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#3B82F6] hover:underline font-bold inline-flex items-center gap-1"
              >
                +91 (Studio Support) →
              </a>
            </div>
          </div>

          {/* Right Column: High-Converting Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto border border-emerald-100">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-[#1D1D1F]">Inquiry Received</h3>
                  <p className="text-sm text-[#86868B] max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-semibold text-[#1D1D1F]">{formData.name}</span>. Our post-production desk has logged your brief. You will receive an official response and WhatsApp dispatch note within 2 business hours.
                  </p>
                  <div className="pt-6">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 rounded-full text-xs font-bold text-[#3B82F6] bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Submit Another Brief
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-[#E5E5E7] pb-4">
                    <h3 className="text-lg font-bold text-[#1D1D1F]">Direct Commission Brief</h3>
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Vikram Malhotra"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-medium text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="vikram@brand.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-medium text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                        WhatsApp / Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-medium text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                        Production Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all"
                      >
                        <option value="wedding">Wedding Cinema</option>
                        <option value="brand">Brand / UGC Ad Campaign</option>
                        <option value="corporate">Corporate / Keynote Film</option>
                        <option value="personal">Personal / Music Video</option>
                        <option value="custom">Custom Enterprise Retainer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                      Estimated Budget Range
                    </label>
                    <select
                      value={formData.project_budget}
                      onChange={(e) => setFormData({ ...formData, project_budget: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all"
                    >
                      <option value="₹2,000 - ₹5,000">₹2,000 – ₹5,000 (Single Reel / Teaser)</option>
                      <option value="₹5,000 - ₹15,000">₹5,000 – ₹15,000 (Standard Film / Campaign)</option>
                      <option value="₹15,000 - ₹50,000">₹15,000 – ₹50,000 (Multi-Deliverable Suite)</option>
                      <option value="₹50,000+">₹50,000+ (Enterprise / Retainer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                      Project Scope &amp; Footage Details
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Specify camera types (e.g., Sony FX3, BMPCC), expected runtime, drive links, soundtrack style, or target delivery date..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-medium text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                          <span>Dispatching Brief...</span>
                        </>
                      ) : (
                        <span>Transmit Commission Brief →</span>
                      )}
                    </button>
                    <p className="text-[11px] text-[#86868B] text-center mt-3">
                      All footage submissions are protected under strict platform Non-Disclosure Agreement (NDA).
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}