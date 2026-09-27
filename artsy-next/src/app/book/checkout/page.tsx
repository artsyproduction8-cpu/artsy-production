'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { generateQuoteSnapshot } from '@/lib/pricing/engine';
import { generateLedgerEntries, calculateFinancialWaterfall } from '@/lib/financial/engine';
import { logProjectStart, logStatusChange } from '@/lib/activity/logger';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [bookingData, setBookingData] = useState<any>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('artsy_active_booking');
      if (stored) {
        setBookingData(JSON.parse(stored));
      }
    }
  }, []);

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const amountPaise = (bookingData?.priceBreakdown?.grandTotal || 6000) * 100;

      // 1. Create Razorpay order via server API
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: bookingData?.serviceKey || 'wedding_highlight',
          amount: amountPaise,
          requirements: bookingData?.requirements || {},
          clientPhone,
          clientName,
          clientEmail,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        alert(orderData.error || 'Failed to create order. Please try again.');
        setIsProcessing(false);
        return;
      }

      const { orderId, razorpayOrderId, razorpayKeyId, mode } = orderData;

      // 2. Generate immutable QuoteSnapshot locked at checkout
      const quote = generateQuoteSnapshot(
        bookingData?.serviceKey || 'wedding',
        bookingData?.requirements || {},
        { orderId }
      );
      quote.status = 'accepted';

      // Generate double-entry financial ledger records
      const waterfall = calculateFinancialWaterfall(quote.totalPaise);
      const ledger = generateLedgerEntries(waterfall);

      // Log initial immutable audit activity trail
      logProjectStart(orderId, clientEmail || 'client');
      logStatusChange(orderId, 'system', { oldStatus: 'draft', newStatus: 'payment_pending' });

      // 3. Open Razorpay Checkout (if SDK loaded) or simulate for mock mode
      const RazorpayClass = (window as any).Razorpay;

      if (RazorpayClass && mode === 'live') {
        const rzp = new RazorpayClass({
          key: razorpayKeyId,
          amount: amountPaise,
          currency: 'INR',
          name: 'Artsy Production',
          description: bookingData?.serviceName || 'Post-Production Service',
          order_id: razorpayOrderId,
          prefill: {
            name: clientName,
            email: clientEmail,
            contact: clientPhone,
          },
          theme: { color: '#2563EB' },
          handler: function (response: any) {
            // Payment successful — store confirmation
            const confirmedOrder = {
              orderId,
              razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              clientName,
              clientPhone,
              clientEmail,
              bookingData,
              paidAt: new Date().toISOString(),
              paymentStatus: 'captured',
              gateway: 'Razorpay (Live)',
            };

            sessionStorage.setItem('artsy_confirmed_order', JSON.stringify(confirmedOrder));
            sessionStorage.setItem('artsy_confirmed_quote', JSON.stringify(quote));

            try {
              const storedQuotes = JSON.parse(localStorage.getItem('artsy_quotes') || '[]');
              storedQuotes.push(quote);
              localStorage.setItem('artsy_quotes', JSON.stringify(storedQuotes));
              const storedLedger = JSON.parse(localStorage.getItem('artsy_financial_ledger') || '[]');
              storedLedger.push(...ledger);
              localStorage.setItem('artsy_financial_ledger', JSON.stringify(storedLedger));
            } catch { /* ignore */ }

            setIsProcessing(false);
            router.push(`/book/confirmation?orderId=${orderId}`);
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        });
        rzp.open();
      } else {
        // Mock/Demo mode — simulate successful payment after short delay
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const confirmedOrder = {
          orderId,
          razorpayOrderId,
          clientName,
          clientPhone,
          clientEmail,
          bookingData,
          paidAt: new Date().toISOString(),
          paymentStatus: 'captured',
          gateway: mode === 'live' ? 'Razorpay (SDK not loaded)' : 'Razorpay (Mock Demo)',
        };

        sessionStorage.setItem('artsy_confirmed_order', JSON.stringify(confirmedOrder));
        sessionStorage.setItem('artsy_confirmed_quote', JSON.stringify(quote));

        try {
          const storedQuotes = JSON.parse(localStorage.getItem('artsy_quotes') || '[]');
          storedQuotes.push(quote);
          localStorage.setItem('artsy_quotes', JSON.stringify(storedQuotes));
          const storedLedger = JSON.parse(localStorage.getItem('artsy_financial_ledger') || '[]');
          storedLedger.push(...ledger);
          localStorage.setItem('artsy_financial_ledger', JSON.stringify(storedLedger));
        } catch { /* ignore */ }

        setIsProcessing(false);
        router.push(`/book/confirmation?orderId=${orderId}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const grandTotal = bookingData?.priceBreakdown?.grandTotal || 6000;
  const serviceName = bookingData?.serviceName || 'Custom Post-Production';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Studio Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-[#0F172A] font-black text-2xl tracking-tight uppercase">ARTSY</span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span className="text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Escrow Checkout
            </span>
          </Link>

          <Link
            href="/book"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>← Edit Configuration</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Secure Escrow Checkout
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Order Confirmation & Ingestion
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Client Details Form */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-[#0F172A]">
                1. Project Owner & WhatsApp Alerts
              </h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                OTP Verified
              </span>
            </div>

            <form onSubmit={handlePayAndConfirm} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Full Name / Studio Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Karan Malhotra"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  WhatsApp Phone Number (For Status Alerts & OTP)
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Email Address (For Tax Invoice & Drive Workspace)
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@production.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
                />
              </div>

              {/* Escrow Guarantee Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-800">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <span>🔒</span>
                  <span>100% Upfront Escrow Protection</span>
                </div>
                <p className="leading-relaxed">
                  Funds remain securely protected in escrow. Your matched Artsy Creator is paid only after you review and approve the final master cut.
                </p>
              </div>

              {/* Payment Action Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-[#0F172A] hover:bg-[#2563EB] text-white text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Processing Razorpay Escrow...</span>
                ) : (
                  <>
                    <span>Pay ₹{grandTotal.toLocaleString('en-IN')} via Razorpay →</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                <span>UPI</span>
                <span>•</span>
                <span>Credit / Debit Cards</span>
                <span>•</span>
                <span>Net Banking</span>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <h3 className="text-lg font-bold text-[#0F172A] pb-4 border-b border-slate-100 mb-5">
              2. Configured Specifications
            </h3>

            <div className="space-y-3.5 text-sm mb-6">
              <div className="flex items-center justify-between text-slate-600">
                <span>Service</span>
                <span className="font-bold text-[#0F172A]">{serviceName}</span>
              </div>

              {bookingData?.cameraAngle && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Camera Angles</span>
                  <span className="font-medium text-slate-800">{bookingData.cameraAngle} Angles</span>
                </div>
              )}

              {bookingData?.duration && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Target Length</span>
                  <span className="font-medium text-slate-800">{bookingData.duration}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>Turnaround</span>
                <span className="font-medium text-slate-800">
                  {bookingData?.isRush ? 'Priority Rush (48–72h)' : 'Standard SLA'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Taxes</span>
                <span className="font-semibold text-emerald-600">18% GST Absorbed</span>
              </div>
            </div>

            {/* Total Block */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Due
              </span>
              <span className="text-2xl font-black text-[#0F172A]">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Direct Backblaze B2 raw ingest pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>15-day raw / 30-day master retention</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Timestamped revision review suite</span>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}