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

const INVOICES: TaxInvoice[] = [];

export default function ClientInvoicesPage() {
  const invoices = INVOICES;

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                Invoices &amp; Receipts
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                View and download official payment receipts and GST tax invoices for your projects.
              </p>
            </div>

            {/* Invoices Table or Empty State */}
            {invoices.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8 space-y-3">
                <div className="text-4xl mb-3">🧾</div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">No invoices yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Your payment receipts and GST tax invoices will appear here once an order is placed.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  Start New Project →
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#1D1D1F]">All Invoices</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E5E7] text-[#86868B] font-bold uppercase text-[10px]">
                        <th className="py-3 px-3 whitespace-nowrap">Invoice # / Date</th>
                        <th className="py-3 px-3 whitespace-nowrap">Project</th>
                        <th className="py-3 px-3 whitespace-nowrap">Price</th>
                        <th className="py-3 px-3 whitespace-nowrap">GST (18%)</th>
                        <th className="py-3 px-3 whitespace-nowrap">Total Paid</th>
                        <th className="py-3 px-3 whitespace-nowrap">Payment Status</th>
                        <th className="py-3 px-3 whitespace-nowrap text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F7]">
                      {invoices.map((inv) => (
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
                              {inv.status === 'released' ? 'Completed' : 'Paid & Secured'}
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
