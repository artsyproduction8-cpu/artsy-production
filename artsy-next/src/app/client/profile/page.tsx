'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';
import { useAuth } from '@/lib/auth';

export default function ClientProfilePage() {
  const { user } = useAuth();

  // Profile local state
  const [fullName, setFullName] = useState(user?.full_name || 'Sneha Patel');
  const [email, setEmail] = useState(user?.email || 'sneha@weddingfilms.in');
  const [phone, setPhone] = useState(user?.phone || '+919876543210');

  // Billing address state
  const [companyName, setCompanyName] = useState('Patel Wedding Studios LLP');
  const [addressLine, setAddressLine] = useState('402, Signature One, S.G. Highway');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('380054');
  const [gstin, setGstin] = useState('24ABCDE1234F1Z5');

  // Notification Preferences
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyMilestones, setNotifyMilestones] = useState(true);

  // OTP Modal State for Changing Email / Phone
  const [modalType, setModalType] = useState<'email' | 'phone' | null>(null);
  const [newContactValue, setNewContactValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Data & Privacy Action States
  const [exportLoading, setExportLoading] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Save feedback
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const openOtpModal = (type: 'email' | 'phone') => {
    setModalType(type);
    setNewContactValue(type === 'email' ? email : phone);
    setOtpSent(false);
    setOtpCode('');
    setOtpError('');
    setOtpSuccess('');
  };

  const closeOtpModal = () => {
    setModalType(null);
    setOtpSent(false);
    setOtpCode('');
    setOtpError('');
    setOtpSuccess('');
  };

  const handleSendOtp = async () => {
    if (!newContactValue) {
      setOtpError(`Please enter a valid ${modalType}`);
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const payload: Record<string, string> = {};
      if (modalType === 'email') {
        payload.email = newContactValue;
      } else {
        payload.phone = newContactValue;
      }
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpSuccess(data.message || `OTP sent to ${newContactValue}`);
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch {
      setOtpError('Network error while requesting verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter the verification code');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const payload: Record<string, any> = { otp: otpCode, verify: true };
      if (modalType === 'email') {
        payload.email = newContactValue;
      } else {
        payload.phone = newContactValue;
      }
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (modalType === 'email') {
          setEmail(newContactValue);
        } else {
          setPhone(newContactValue);
        }
        setOtpSuccess('Contact verified and updated successfully!');
        setTimeout(() => {
          closeOtpModal();
        }, 1200);
      } else {
        setOtpError(data.error || 'Invalid or expired OTP');
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDownloadData = async () => {
    const userId = user?.id || 'usr-client-demo';
    setExportLoading(true);
    setPrivacyMessage(null);
    try {
      const res = await fetch(`/api/user/data-export?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        throw new Error('Failed to generate DPDP export bundle');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artsy_dpdp_export_${userId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setPrivacyMessage({ text: 'Personal data archive downloaded (DPDP Compliant)', type: 'success' });
    } catch (err: any) {
      setPrivacyMessage({ text: err.message || 'Error downloading data export', type: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    const userId = user?.id || 'usr-client-demo';
    setDeletionLoading(true);
    setPrivacyMessage(null);
    try {
      const res = await fetch('/api/user/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: 'Client requested erasure under DPDP Act §10' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPrivacyMessage({
          text: 'Account deletion request processed. Personal PII has been anonymized.',
          type: 'success',
        });
        setShowDeleteConfirm(false);
      } else {
        setPrivacyMessage({
          text: data.error || 'Failed to submit deletion request',
          type: 'error',
        });
      }
    } catch {
      setPrivacyMessage({ text: 'Error connecting to erasure service', type: 'error' });
    } finally {
      setDeletionLoading(false);
    }
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/client" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Dashboard
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs font-bold text-[#1D1D1F]">Profile Settings</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                Profile Settings
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Manage your studio details, statutory billing information, and DPDP privacy controls.
              </p>
            </div>

            {savedFeedback && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center justify-between">
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Section 1: Personal Info */}
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <h2 className="text-base font-bold text-[#1D1D1F]">Personal Information</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">Primary producer contact details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        readOnly
                        value={email}
                        className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] cursor-not-allowed select-none"
                      />
                      <button
                        type="button"
                        onClick={() => openOtpModal('email')}
                        className="px-4 py-2 bg-blue-50 text-[#3B82F6] hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Phone Number (WhatsApp)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={phone}
                        className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] cursor-not-allowed select-none"
                      />
                      <button
                        type="button"
                        onClick={() => openOtpModal('phone')}
                        className="px-4 py-2 bg-blue-50 text-[#3B82F6] hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Billing Address */}
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <h2 className="text-base font-bold text-[#1D1D1F]">Billing & Tax Address</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">Used for statutory B2B GST tax invoices</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Legal Studio / Entity Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm font-mono text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">PIN Code</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm font-mono text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Notification Preferences */}
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="border-b border-[#F5F5F7] pb-3">
                  <h2 className="text-base font-bold text-[#1D1D1F]">Notification Preferences</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">Control how you receive production status dispatches</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-[#1D1D1F]">WhatsApp Dispatches</div>
                      <div className="text-xs text-[#86868B]">Receive review links and milestone triggers on WhatsApp</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyWhatsApp}
                      onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                      className="w-5 h-5 accent-[#3B82F6] rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer border-t border-[#F5F5F7] pt-3">
                    <div>
                      <div className="text-sm font-semibold text-[#1D1D1F]">Email Invoices & Reports</div>
                      <div className="text-xs text-[#86868B]">Receive statutory invoices and monthly ledger statements</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-5 h-5 accent-[#3B82F6] rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer border-t border-[#F5F5F7] pt-3">
                    <div>
                      <div className="text-sm font-semibold text-[#1D1D1F]">Creator Workroom Alerts</div>
                      <div className="text-xs text-[#86868B]">Real-time alerts when creators upload rough cuts or stems</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyMilestones}
                      onChange={(e) => setNotifyMilestones(e.target.checked)}
                      className="w-5 h-5 accent-[#3B82F6] rounded-md cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>

            {/* Section 4: Data & Privacy (DPDP Act) */}
            <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-[#F5F5F7] pb-3">
                <h2 className="text-base font-bold text-[#1D1D1F]">Data & Privacy (DPDP Act 2023)</h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Exercise statutory rights of data access and erasure under Indian data protection law
                </p>
              </div>

              {privacyMessage && (
                <div
                  className={`p-4 rounded-xl text-xs font-semibold ${
                    privacyMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {privacyMessage.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1D1D1F]">Download Personal Data Portfolio</h3>
                  <p className="text-xs text-[#86868B]">
                    Get a complete JSON archive of all projects, orders, consent records, and revisions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadData}
                  disabled={exportLoading}
                  className="px-4 py-2 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Download My Data'}
                </button>
              </div>

              <div className="border-t border-[#F5F5F7] pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-red-600">Request Account Deletion</h3>
                  <p className="text-xs text-[#86868B]">
                    Irreversibly anonymize your PII. Statutory tax invoices remain archived for 8 years per GST Act.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Request Account Deletion
                </button>
              </div>

              {showDeleteConfirm && (
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-red-900">
                    Are you sure you want to request data erasure? Active projects must be completed before erasure.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRequestDeletion}
                      disabled={deletionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      {deletionLoading ? 'Erasing...' : 'Confirm Erasure'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-white border border-[#E5E5E7] text-[#1D1D1F] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Support Quick Access */}
            <div className="bg-white border border-[#E5E5E7] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1D1D1F]">Dedicated Production Support</h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Have inquiries regarding your studio contract, custom deliverables, or billing?
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/917777078742"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  WhatsApp Desk
                </a>
                <Link
                  href="/client/support"
                  className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded-xl text-xs font-bold transition-colors"
                >
                  Help Center & FAQ
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* OTP Verification Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Verify New {modalType === 'email' ? 'Email Address' : 'Phone Number'}
              </h3>
              <button
                type="button"
                onClick={closeOtpModal}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              To protect your production assets, changes to contact details require 2-step OTP verification.
            </p>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {otpError}
              </div>
            )}
            {otpSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                {otpSuccess}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                New {modalType === 'email' ? 'Email' : 'WhatsApp Phone'}
              </label>
              <div className="flex gap-2">
                <input
                  type={modalType === 'email' ? 'email' : 'text'}
                  value={newContactValue}
                  onChange={(e) => setNewContactValue(e.target.value)}
                  disabled={otpSent}
                  placeholder={modalType === 'email' ? 'producer@studio.in' : '+919876543210'}
                  className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading}
                    className="flex-1 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify & Update'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="px-3 py-2.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#86868B] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Resend
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
