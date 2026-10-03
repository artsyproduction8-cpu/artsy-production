'use client';

import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';

interface TaxInvoice {
  invoiceNumber: string;
  orderRef: string;
  date: string;
  projectTitle: string;
  netBase: number;
  gstAmount: number;
  totalPaid: number;
  gstin: string;
  status: 'paid' | 'vault_locked' | 'released';
}

const INVOICES: TaxInvoice[] = [
  {
    invoiceNumber: 'ART-INV-2026-004',
    orderRef: 'AP-8841',
    date: 'September 24, 2026',
    projectTitle: 'Udaipur Palace Royal Wedding — Master Highlight',
    netBase: 6780,
    gstAmount: 1220,
    totalPaid: 8000,
    gstin: '07AAAAA0000A1Z5',
    status: 'vault_locked',
  },
  {
    invoiceNumber: 'ART-INV-2026-001',
    orderRef: 'AP-8835',
    date: 'August 14, 2026',
    projectTitle: 'Autumn Brand Commercial & Direct-To-Consumer UGC',
    netBase: 3814,
    gstAmount: 686,
    totalPaid: 4500,
    gstin: '07AAAAA0000A1Z5',
    status: 'released',
  },
];

export default function ClientInvoicesPage() {
  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <Link href="/client/projects" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Projects
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs font-bold text-[#1D1D1F]">Tax Invoices</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
                Tax Invoices &amp; Billing
              </h1>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1D1D1F]">Tax Invoices</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E5E7] text-[#86868B] font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Invoice # / Date</th>
                      <th className="py-3 px-3">Project Title</th>
                      <th className="py-3 px-3">Base Price</th>
                      <th className="py-3 px-3">GST (18%)</th>
                      <th className="py-3 px-3">Total Paid</th>
                      <th className="py-3 px-3">Payment Status</th>
                      <th className="py-3 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F7]">
                    {INVOICES.map((inv) => (
                      <tr key={inv.invoiceNumber} className="hover:bg-[#F5F5F7]/50">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-[#1D1D1F]">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-[#86868B]">{inv.date}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1D1D1F]">{inv.projectTitle}</div>
                          <div className="text-[10px] font-mono text-blue-600">Order: {inv.orderRef}</div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          ₹{inv.netBase.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-600">
                          ₹{inv.gstAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1D1D1F]">
                          ₹{inv.totalPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'released'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {inv.status === 'released' ? 'Disbursed' : 'Secured In Vault'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => alert(`Downloading PDF receipt for ${inv.invoiceNumber}...`)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E7] hover:bg-slate-50 text-xs font-semibold text-[#1D1D1F] transition-colors shadow-2xs"
                          >
                            Download PDF ↓
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
