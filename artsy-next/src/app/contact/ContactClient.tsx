'use client';

import { useState } from 'react';

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'wedding',
    project_budget: '50000_100000',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'wedding',
        project_budget: '50000_100000',
        message: '',
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please reach out via WhatsApp.');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E5E7] shadow-xs">
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D1D1F] mb-2">
        Send Studio Inquiry
      </h2>
      <p className="text-xs sm:text-sm text-[#86868B] mb-8 leading-relaxed">
        Fill out this direct dispatch form. Our senior post-production supervisor responds within 4 business hours with technical scope evaluation and feasibility analysis.
      </p>

      {status === 'success' ? (
        <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h3 className="text-base font-bold text-emerald-900">Inquiry Dispatched Successfully</h3>
          <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
            Thank you! Your project brief has been logged in our operations dispatch. Our supervisor will contact you shortly via email and WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {status === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                required
                maxLength={100}
                placeholder="Rohit Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={200}
                placeholder="producer@company"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                Phone / WhatsApp Number *
              </label>
              <div className="flex items-center rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3B82F6] overflow-hidden transition-all">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-[#E5E5E7]/70 border-r border-[#E5E5E7] text-xs font-bold text-[#1D1D1F] select-none shrink-0">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="98765 43210"
                  value={formData.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(-10)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const val = (raw.length === 12 && raw.startsWith('91')) ? raw.slice(2) : raw.slice(0, 10);
                    setFormData({ ...formData, phone: val });
                  }}
                  className="w-full px-4 py-3 text-sm text-[#1D1D1F] bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                Project Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
              >
                <option value="wedding">Wedding Cinema Post-Production</option>
                <option value="brand">Commercial &amp; Brand Campaign</option>
                <option value="product">Macro Product Video</option>
                <option value="corporate">Corporate Keynote &amp; Summit</option>
                <option value="other">Bespoke Production / Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
              Estimated Budget Range
            </label>
            <select
              id="budget"
              value={formData.project_budget}
              onChange={(e) => setFormData({ ...formData, project_budget: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
            >
              <option value="under_25000">Under ₹25,000 (Single Reel / Teaser)</option>
              <option value="25000_50000">₹25,000 – ₹50,000 (Standard Film Package)</option>
              <option value="50000_100000">₹50,000 – ₹1,00,000 (Multi-Day Ceremony / Commercial)</option>
              <option value="above_100000">Above ₹1,00,000 (Enterprise / Comprehensive Post)</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
              Project Brief &amp; Specifications
            </label>
            <textarea
              id="message"
              rows={4}
              maxLength={5000}
              placeholder="Tell us about your project: footage volume, number of cameras, camera log profile (Sony S-Log3, ARRI, etc.), audio requirements, and expected delivery deadline..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-4 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {status === 'submitting' ? (
              <span>Submitting Brief...</span>
            ) : (
              <>
                <span>Submit Technical Inquiry</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
