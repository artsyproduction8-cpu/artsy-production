'use client';

import React, { useState } from 'react';
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton';

export default function CheckoutDemoPage() {
  const [rupees, setRupees] = useState<number>(500);
  const [name, setName] = useState<string>('Test Client');
  const [email, setEmail] = useState<string>('client@artsyproduction.in');
  const [contact, setContact] = useState<string>('9876543210');
  const [paymentResult, setPaymentResult] = useState<{
    order_id: string;
    payment_id: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amountPaise = Math.max(100, Math.round(rupees * 100));

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold tracking-wide uppercase">
            <span>●</span> Razorpay Standard Web Checkout
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Razorpay Payment Verification Demo
          </h1>
          <p className="text-sm text-stone-400 max-w-lg mx-auto">
            Test the complete end-to-end payment workflow: order creation, client modal checkout, and server-side HMAC-SHA256 signature verification.
          </p>
        </div>

        {/* Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* Amount Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Payment Amount
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 100, 500, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRupees(amt)}
                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                    rupees === amt
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                      : 'bg-stone-800/60 text-stone-300 border-stone-700 hover:bg-stone-800'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                value={rupees}
                onChange={(e) => setRupees(Number(e.target.value) || 0)}
                placeholder="Enter custom amount in INR"
                className="w-full pl-8 pr-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Paise value: {amountPaise} paise (Min. 100 paise / ₹1)
            </p>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Checkout Button */}
          <div className="pt-2">
            <RazorpayCheckoutButton
              amount={amountPaise}
              name="Artsy Production"
              description="Post-Production Film Booking"
              prefill={{ name, email, contact }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-950 font-bold text-base rounded-xl shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              onSuccess={(data) => {
                setPaymentResult(data);
                setErrorMessage(null);
              }}
              onError={(err) => {
                setErrorMessage(err);
                setPaymentResult(null);
              }}
            />
          </div>

          {/* Success Message Card */}
          {paymentResult && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Payment Verified Successfully!
              </div>
              <div className="text-xs text-stone-300 font-mono space-y-1">
                <div><span className="text-stone-500">Order ID:</span> {paymentResult.order_id}</div>
                <div><span className="text-stone-500">Payment ID:</span> {paymentResult.payment_id}</div>
                <div><span className="text-stone-500">Signature:</span> HMAC-SHA256 Match Verified</div>
              </div>
            </div>
          )}

          {/* Error Message Card */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
              <div className="font-semibold mb-1">Transaction Incomplete / Error:</div>
              <div>{errorMessage}</div>
            </div>
          )}
        </div>

        {/* Integration Architecture Summary */}
        <div className="bg-stone-900/40 border border-stone-800/80 rounded-xl p-5 text-xs text-stone-400 space-y-3">
          <div className="font-semibold text-stone-300 uppercase tracking-wider text-[11px]">
            Integration Pipeline
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-stone-400">
            <li><strong className="text-stone-300">Order Creation:</strong> Frontend calls <code className="text-amber-400">POST /api/create-order</code> with amount in paise. Backend uses Razorpay SDK to create order.</li>
            <li><strong className="text-stone-300">Checkout Modal:</strong> Razorpay Standard Checkout opens with <code className="text-amber-400">order_id</code> and public key.</li>
            <li><strong className="text-stone-300">Signature Verification:</strong> Client sends <code className="text-amber-400">razorpay_order_id</code>, <code className="text-amber-400">razorpay_payment_id</code>, and <code className="text-amber-400">razorpay_signature</code> to <code className="text-amber-400">POST /api/verify-payment</code>.</li>
            <li><strong className="text-stone-300">Security Check:</strong> Server calculates <code className="text-amber-400">HMAC-SHA256(order_id + &quot;|&quot; + payment_id, KEY_SECRET)</code> with timing-safe comparison.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
