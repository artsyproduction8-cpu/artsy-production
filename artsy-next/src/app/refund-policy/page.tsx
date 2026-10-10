'use client';

import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="border-b border-[#E5E5E7] pb-8 mb-10">
          <div className="text-xs uppercase font-bold tracking-widest text-[#86868B] mb-2">
            FINANCIAL POLICY // RESOLUTION
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-sm text-[#86868B] mt-2">
            Version 2.0 • Studio Master Plan Locked • Effective September 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#424245]">
          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">1. Overview</h2>
            <p>
              At Artsy Production, every project involves dedicated cloud processing capacity, editing workstations, and creator allocations. Because custom creative labor is incurred sequentially, our cancellation and refund framework is strictly structured around the project lifecycle stage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-4">2. Milestone Refund Schedule</h2>
            <div className="overflow-x-auto border border-[#E5E5E7] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] border-b border-[#E5E5E7] text-[#1D1D1F] uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-4">Project Stage</th>
                    <th className="p-4">Artsy Retention</th>
                    <th className="p-4">Client Refund Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  <tr>
                    <td className="p-4 font-semibold text-[#1D1D1F]">Before Creator Assigned</td>
                    <td className="p-4 text-[#86868B]">Razorpay Gateway Fee (2% + GST)</td>
                    <td className="p-4 font-bold text-emerald-600">100% of order value (minus gateway fee)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1D1D1F]">After Assignment, Before Work Starts</td>
                    <td className="p-4 text-[#86868B]">Gateway Fee + 10% Studio Administration Fee</td>
                    <td className="p-4 font-bold text-emerald-600">90% of order value (minus gateway fee)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1D1D1F]">During Work (Partial Completion / In-Flight)</td>
                    <td className="p-4 font-bold text-red-600">100% Retained</td>
                    <td className="p-4 text-red-600 font-semibold">0% (Labor and timeline reserved)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1D1D1F]">After Final Delivery &amp; Approval</td>
                    <td className="p-4 font-bold text-red-600">100% Retained</td>
                    <td className="p-4 text-red-600 font-semibold">Non-refundable (Dispute mediation only)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">3. GST Handling on Refunds</h2>
            <p>
              In accordance with statutory Indian GST regulations, an official electronic <strong>Credit Note</strong> is generated for the refunded portion. GST is remitted only on any retained administration fees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">4. Dispute Mediation Procedure</h2>
            <p>
              If you feel a deliverable does not match the specifications submitted in your booking brief, you may open a formal Dispute from your Client Review console within forty-eight (48) hours of receipt. A Studio Director will personally assess the raw footage, the brief, and the delivered timeline. If an edit fails objective technical standards, a free recut or appropriate concession will be authorized.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
