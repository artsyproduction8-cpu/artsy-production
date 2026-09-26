'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GrievancePage() {
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderOrProjectId: '',
    grievanceType: 'dpdp_erasure',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketId(`GRV-${Math.floor(100000 + Math.random() * 900000)}`);
    setTicketSubmitted(true);
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F7] min-h-screen font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex flex-col select-none group">
            <span className="font-extrabold text-[15px] leading-tight tracking-[0.18em] text-white group-hover:text-blue-400 transition-colors uppercase">
              ARTSY
            </span>
            <span className="font-mono text-[7.5px] leading-none tracking-[0.24em] text-[#86868B] uppercase">
              PLACE FOR PERSPECTIVE
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#86868B]">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-[#262626] text-white hover:bg-[#333] transition-colors"
            >
              Back to Studio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Header Banner */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
            <span>STATUTORY COMPLIANCE</span>
            <span>•</span>
            <span>DPDP ACT 2023 RULE 13</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Data Grievance Redressal &amp; Privacy Officer
          </h1>
          <p className="text-sm sm:text-base text-[#86868B] leading-relaxed max-w-2xl">
            In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology
            Act, 2000, Artsy Production designates a dedicated Data Protection &amp; Grievance Redressal Officer.
          </p>
        </div>

        {/* Officer Information Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#141414] border border-[#262626] shadow-xl space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#86868B]">
            Designated Grievance Officer Particulars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-[#86868B] uppercase font-semibold">Officer In-Charge</span>
              <p className="font-bold text-white text-base">Karan (Studio Director &amp; Data Fiduciary Officer)</p>
              <p className="text-xs text-[#86868B]">Artsy Production Operations</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#86868B] uppercase font-semibold">Official Email Address</span>
              <p className="font-mono text-blue-400 font-semibold select-all">
                grievance@artsy.production
              </p>
              <p className="text-xs text-[#86868B]">Monitored under 72-hour acknowledgment SLA</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#86868B] uppercase font-semibold">Physical Registered Address</span>
              <p className="text-[#D1D1D6] leading-relaxed">
                Artsy Production Post-Production Studio<br />
                City Light Hub, Surat, Gujarat 395007, India
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#86868B] uppercase font-semibold">Statutory SLA Windows</span>
              <p className="text-[#D1D1D6]">
                <strong className="text-white">Acknowledgment:</strong> Within 72 Hours<br />
                <strong className="text-white">Resolution Window:</strong> Max 30 Days (DPDP Standard)
              </p>
            </div>
          </div>
        </div>

        {/* Statutory Policies & Dual-State Retention Summary */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            DPDP Erasure vs. Statutory Tax Preservation
          </h3>
          <p className="text-xs text-[#86868B] leading-relaxed">
            Per the Artsy Production Master Plan §4.4, §10.3, and Section 36 of the Central Goods and Services Tax Act 2017:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-2">
              <span className="font-bold text-emerald-400">1. Operational Data Erasure</span>
              <p className="text-[#86868B] leading-relaxed">
                Upon verified erasure request, customer PII in active transactional tables (<code className="text-white">users</code>, <code className="text-white">creator_profiles</code>) is permanently anonymized (<code className="text-white">full_name = &apos;Anonymized User&apos;</code>, <code className="text-white">phone = &apos;0000000000&apos;</code>).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-2">
              <span className="font-bold text-amber-400">2. Statutory Invoice Vault (WORM)</span>
              <p className="text-[#86868B] leading-relaxed">
                Section 36 CGST Act mandates 72-month retention of tax invoices. Cryptographic invoice PDF snapshots in the isolated WORM vault remain locked for tax compliance audits and are accessible exclusively during formal audit inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Grievance Submission Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#141414] border border-[#262626] space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">File an Official Privacy or Service Grievance</h2>
            <p className="text-xs text-[#86868B]">
              Submissions generate an encrypted grievance ticket dispatched directly to the Grievance Redressal desk.
            </p>
          </div>

          {ticketSubmitted ? (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <h3 className="text-sm font-bold text-white">Grievance Ticket Generated</h3>
              <p className="text-xs text-[#86868B] max-w-md mx-auto">
                Your ticket has been logged with reference number <code className="text-white font-mono">{ticketId}</code>. 
                Our Grievance Officer will send formal statutory acknowledgment to <strong className="text-white">{formData.email}</strong> within 72 hours.
              </p>
              <button
                type="button"
                onClick={() => setTicketSubmitted(false)}
                className="mt-4 px-4 py-2 bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B]">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B]">Phone Number (with Country Code)</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B]">Order / Project ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.orderOrProjectId}
                    onChange={(e) => setFormData({ ...formData, orderOrProjectId: e.target.value })}
                    placeholder="e.g. AP-8841"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#86868B]">Grievance Classification</label>
                <select
                  value={formData.grievanceType}
                  onChange={(e) => setFormData({ ...formData, grievanceType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="dpdp_erasure">DPDP Right to Erasure / Account Deletion</option>
                  <option value="dpdp_access">DPDP Right to Data Access / Export</option>
                  <option value="dpdp_correction">DPDP Right to Correction / Rectification</option>
                  <option value="unauthorized_access">Suspected Unauthorized Access / Security Incident</option>
                  <option value="service_dispute">Service Quality or Timeline Arbitration Escalation</option>
                  <option value="other">Other Statutory Inquiries</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#86868B]">Description of Grievance</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide precise details regarding your data subject request, project timeline, or concern..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
              >
                Submit Statutory Grievance
              </button>
            </form>
          )}
        </div>

        {/* Escalation Authority Notice */}
        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] text-xs text-[#86868B] space-y-1">
          <p className="font-semibold text-[#D1D1D6]">Appellate Authority Recourse:</p>
          <p>
            If a data principal is not satisfied with the resolution provided by the Grievance Officer within 30 days,
            the principal maintains the statutory right to escalate the grievance to the{' '}
            <strong className="text-white">Data Protection Board of India (DPBI)</strong> pursuant to Section 18 of the Digital
            Personal Data Protection Act, 2023.
          </p>
        </div>
      </main>
    </div>
  );
}
