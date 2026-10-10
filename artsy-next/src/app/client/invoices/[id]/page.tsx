'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ClientHeader from '../../components/ClientHeader';
import ClientSidebar from '../../components/ClientSidebar';
import { InvoiceData } from '@/lib/invoices/generator';

export default function ClientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ message: string; success: boolean } | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/invoices/${invoiceId}?format=json`);
        if (!res.ok) {
          throw new Error(`Failed to load invoice ${invoiceId}`);
        }
        const data: InvoiceData = await res.json();
        setInvoice(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load invoice record');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceId]);

  const handleEmailInvoice = async () => {
    if (!invoice) return;
    setEmailSending(true);
    setEmailStatus(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invoice.clientDetails.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailStatus({
          message: `Tax invoice successfully dispatched to ${invoice.clientDetails.email}`,
          success: true,
        });
      } else {
        setEmailStatus({
          message: data.error || 'Failed to dispatch email invoice',
          success: false,
        });
      }
    } catch {
      setEmailStatus({
        message: 'Network error dispatching invoice email',
        success: false,
      });
    } finally {
      setEmailSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <div className="no-print">
        <ClientHeader />
      </div>
      <div className="flex w-full max-w-full overflow-x-hidden">
        <div className="no-print">
          <ClientSidebar />
        </div>
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
            {/* Header & Actions */}
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href="/client" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                    Dashboard
                  </Link>
                  <span className="text-xs text-[#86868B]">/</span>
                  <Link href="/client/invoices" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                    Tax Invoices
                  </Link>
                  <span className="text-xs text-[#86868B]">/</span>
                  <span className="text-xs font-bold text-[#1D1D1F]">
                    {invoice?.invoiceNumber || invoiceId}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1D1D1F]">
                  Tax Invoice
                </h1>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Statutory Rule 46 CGST Tax Invoice for SAC 999613
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleEmailInvoice}
                  disabled={emailSending}
                  className="px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {emailSending ? 'Sending...' : 'Email Invoice'}
                </button>
              </div>
            </div>

            {/* Email Toast/Notification */}
            {emailStatus && (
              <div
                className={`no-print p-4 rounded-xl text-xs font-semibold ${
                  emailStatus.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {emailStatus.message}
              </div>
            )}

            {/* Invoice Container */}
            {loading ? (
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-16 text-center text-xs text-[#86868B]">
                Generating statutory invoice...
              </div>
            ) : error || !invoice ? (
              <div className="bg-white border border-red-200 rounded-2xl p-8 text-center text-xs text-red-600">
                {error || 'Invoice not found'}
              </div>
            ) : (
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-8 md:p-12 shadow-xs space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#1D1D1F] pb-6">
                  <div>
                    <div className="text-2xl font-black uppercase tracking-tight text-[#1D1D1F]">
                      ARTSY PRODUCTION
                    </div>
                    <div className="text-xs text-[#86868B] font-medium mt-1">
                      TAX INVOICE (RULE 46 OF CGST RULES)
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-block bg-[#F5F5F7] text-[#86868B] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      ORIGINAL FOR RECIPIENT
                    </span>
                    <div className="text-sm font-bold text-[#1D1D1F] mt-2">
                      Invoice: {invoice.invoiceNumber}
                    </div>
                    <div className="text-xs text-[#86868B]">
                      Date: {invoice.invoiceDate}
                    </div>
                  </div>
                </div>

                {/* Supplier & Recipient Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs leading-relaxed">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-2">
                      SUPPLIER (DATA FIDUCIARY / SERVICE PROVIDER)
                    </div>
                    <div className="font-bold text-[#1D1D1F]">{invoice.artsyDetails.legalName}</div>
                    <div className="text-[#555]">{invoice.artsyDetails.address}</div>
                    <div>
                      <strong className="text-[#1D1D1F]">GSTIN:</strong> {invoice.artsyDetails.gstin}
                    </div>
                    <div>
                      <strong className="text-[#1D1D1F]">PAN:</strong> {invoice.artsyDetails.pan}
                    </div>
                    <div>
                      <strong className="text-[#1D1D1F]">State:</strong> {invoice.artsyDetails.state} (Code: {invoice.artsyDetails.stateCode})
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-2">
                      BILLED TO (RECIPIENT)
                    </div>
                    <div className="font-bold text-[#1D1D1F]">{invoice.clientDetails.name}</div>
                    <div className="text-[#555]">{invoice.clientDetails.billingAddress || 'Studio Registered Address'}</div>
                    <div>
                      <strong className="text-[#1D1D1F]">Phone:</strong> {invoice.clientDetails.phone}
                    </div>
                    <div>
                      <strong className="text-[#1D1D1F]">Email:</strong> {invoice.clientDetails.email}
                    </div>
                    <div>
                      <strong className="text-[#1D1D1F]">Place of Supply:</strong> {invoice.orderDetails.placeOfSupply}
                    </div>
                    {invoice.clientDetails.gstin && (
                      <div>
                        <strong className="text-[#1D1D1F]">GSTIN:</strong> {invoice.clientDetails.gstin}
                      </div>
                    )}
                  </div>
                </div>

                {/* Services Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E7] bg-[#F5F5F7] text-[#86868B] uppercase font-semibold text-[10px] tracking-wider">
                        <th className="text-left p-3">Description of Service</th>
                        <th className="text-center p-3">SAC Code</th>
                        <th className="text-right p-3">Taxable Value</th>
                        <th className="text-center p-3">GST Rate</th>
                        <th className="text-right p-3">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F7]">
                      <tr>
                        <td className="p-3">
                          <div className="font-bold text-[#1D1D1F]">
                            {invoice.orderDetails.serviceName}
                          </div>
                          <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                            Order Ref: #{invoice.orderDetails.orderId}
                          </div>
                        </td>
                        <td className="text-center p-3 font-mono">{invoice.orderDetails.sacCode}</td>
                        <td className="text-right p-3 font-mono">
                          ₹{(invoice.orderDetails.taxableAmountPaise / 100).toFixed(2)}
                        </td>
                        <td className="text-center p-3">18%</td>
                        <td className="text-right p-3 font-mono font-bold text-[#1D1D1F]">
                          ₹{(invoice.orderDetails.totalPaidPaise / 100).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tax Breakdown & Totals */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-80 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#F5F5F7]">
                      <span className="text-[#86868B]">Taxable Amount:</span>
                      <span className="font-mono font-semibold">
                        ₹{(invoice.orderDetails.taxableAmountPaise / 100).toFixed(2)}
                      </span>
                    </div>

                    {invoice.orderDetails.isInterState ? (
                      <div className="flex justify-between py-1 border-b border-[#F5F5F7]">
                        <span className="text-[#86868B]">Integrated GST (IGST 18%):</span>
                        <span className="font-mono font-semibold">
                          ₹{(invoice.orderDetails.igstPaise / 100).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between py-1 border-b border-[#F5F5F7]">
                          <span className="text-[#86868B]">Central GST (CGST 9%):</span>
                          <span className="font-mono font-semibold">
                            ₹{(invoice.orderDetails.cgstPaise / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#F5F5F7]">
                          <span className="text-[#86868B]">State GST (SGST 9%):</span>
                          <span className="font-mono font-semibold">
                            ₹{(invoice.orderDetails.sgstPaise / 100).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between py-2 border-t-2 border-[#1D1D1F] text-sm font-extrabold text-[#1D1D1F]">
                      <span>Total Amount (Paid):</span>
                      <span className="font-mono">
                        ₹{(invoice.orderDetails.totalPaidPaise / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statutory Footer */}
                <div className="border-t border-[#E5E5E7] pt-6 text-[11px] text-[#86868B] text-center leading-relaxed">
                  This is a computer-generated tax invoice issued by Artsy Production under SAC 999613.<br />
                  Electronic Payment captured via {invoice.orderDetails.paymentMode} • No signature required under Section 145(2) of GST Act.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
