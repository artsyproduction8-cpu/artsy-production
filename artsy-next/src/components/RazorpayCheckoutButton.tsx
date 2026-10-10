'use client';

import React, { useState } from 'react';

export interface RazorpayCheckoutButtonProps {
  amount: number; // In paise (e.g., 50000 = ₹500)
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  buttonText?: string;
  className?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  themeColor?: string;
  onSuccess?: (data: { order_id: string; payment_id: string }) => void;
  onError?: (error: string) => void;
  onDismiss?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Loads Razorpay Standard Checkout SDK script dynamically if not already on window
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({
  amount,
  currency = 'INR',
  name = 'Artsy Production',
  description = 'Creative Studio Services',
  receipt,
  buttonText,
  className = '',
  prefill = {},
  themeColor = '#E5A93C',
  onSuccess,
  onError,
  onDismiss,
}: RazorpayCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Ensure Razorpay checkout script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay Checkout SDK. Check your internet connection.');
      }

      // 2. Call backend endpoint to create order
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes: {
            description,
            service: name,
          },
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const { order_id, key_id } = orderData;
      const razorpayKey = key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 3. Configure and open Razorpay modal
      const options = {
        key: razorpayKey,
        amount: orderData.amount || amount,
        currency: orderData.currency || currency,
        name,
        description,
        order_id,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        theme: {
          color: themeColor,
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            if (onDismiss) onDismiss();
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Verify signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              const errMsg = verifyData.error || 'Payment signature verification failed';
              setErrorMessage(errMsg);
              if (onError) onError(errMsg);
              return;
            }

            // Payment successfully verified
            if (onSuccess) {
              onSuccess({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
              });
            }
          } catch (verifyErr: any) {
            const errMsg = verifyErr?.message || 'Error during payment verification';
            setErrorMessage(errMsg);
            if (onError) onError(errMsg);
          } finally {
            setIsLoading(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event
      rzpInstance.on('payment.failed', function (failResponse: any) {
        console.error('[Razorpay Payment Failed]:', failResponse);
        const errMsg =
          failResponse.error?.description ||
          failResponse.error?.reason ||
          'Payment failed. Please retry with another payment method.';
        setErrorMessage(errMsg);
        setIsLoading(false);
        if (onError) onError(errMsg);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('[Razorpay Checkout Error]:', err);
      const errMsg = err?.message || 'Something went wrong launching payment.';
      setErrorMessage(errMsg);
      setIsLoading(false);
      if (onError) onError(errMsg);
    }
  };

  const formattedAmount = (amount / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={
          className ||
          'px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 font-bold rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        }
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          buttonText || `Pay ${formattedAmount}`
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-red-500 font-medium px-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
