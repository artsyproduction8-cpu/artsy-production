'use client';

import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="border-b border-[#E5E5E7] pb-8 mb-10">
          <div className="text-xs uppercase font-bold tracking-widest text-[#86868B] mb-2">
            PRIVACY ARCHITECTURE // STORAGE
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Cookie &amp; Local Storage Policy
          </h1>
          <p className="text-sm text-[#86868B] mt-2">
            Version 2.0 • Last Updated September 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#424245]">
          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">1. Minimal Cookie Usage</h2>
            <p>
              Artsy Production respects your privacy. We do not use third-party advertising cookies, cross-site tracking scripts, or data broker cookies. We only employ essential cookies and browser local storage strictly necessary for authentication and session continuity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-3">2. Essential Technologies Used</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Session Authentication:</strong> Secure tokens maintaining your authenticated state across the Client Review console and Studio Admin.</li>
              <li><strong>Project Configurator:</strong> Ephemeral session cache preserving your custom editing options, camera selections, and turnarounds while transitioning to payment.</li>
              <li><strong>Player Preferences:</strong> Local storage flags remembering your playback speed and timeline layout preferences in the frame-accurate review interface.</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
