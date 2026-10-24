'use client';



export default function Hero() {
  return (
    <section className="relative w-full bg-white pt-10 pb-12 sm:pt-32 sm:pb-24 overflow-hidden border-b-0 sm:border-b border-[#F5F5F7]">
      {/* Background Ghost Watermark: Hidden on mobile screens */}
      <div 
        aria-hidden="true" 
        className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] text-[#1D1D1F] text-[110px] lg:text-[180px] font-extrabold whitespace-nowrap tracking-tighter leading-none z-0"
      >
        POST // 24FPS
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
        <div className="flex flex-col items-start max-w-5xl">
          
          {/* Heading with Modern Creative Teams in Blue with Clean Custom Underline */}
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold text-[#1D1D1F] tracking-tight max-w-none leading-tight sm:leading-tight">
            <span className="block">Cinematic</span>
            <span className="block mt-1 sm:mt-1.5">Post-Production For</span>
            <span className="inline-block relative mt-1 sm:mt-1.5 pb-1 sm:pb-2 text-[#2563EB]">
              Modern Creative Teams
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#3B82F6]/80 rounded-full" />
            </span>
          </h1>

          {/* Balanced Editorial Subtext */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-[#6E6E73] font-normal leading-relaxed sm:leading-[1.6] max-w-2xl">
            Two-sided post-production studio and technological platform. Curated elite film editors, seamless cloud workflow, and transparent pricing for weddings, high-growth brands, and corporate cinema.
          </p>

          {/* Minimalist Metrics Strip (2-col styled cards on mobile, minimalist strip on sm+) */}
          <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#F5F5F7] w-full grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-8 max-w-2xl">
            <div className="bg-[#F9F9FB] sm:bg-transparent border border-[#E5E5E7]/70 sm:border-0 rounded-2xl p-4 sm:p-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:shadow-none flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
                48h
              </div>
              <div className="text-[10px] sm:text-xs text-[#86868B] mt-1 font-semibold uppercase tracking-wider">
                Average First Cut
              </div>
            </div>

            <div className="bg-[#F9F9FB] sm:bg-transparent border border-[#E5E5E7]/70 sm:border-0 rounded-2xl p-4 sm:p-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:shadow-none flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
                99.4%
              </div>
              <div className="text-[10px] sm:text-xs text-[#86868B] mt-1 font-semibold uppercase tracking-wider">
                SLA Adherence Rate
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#F9F9FB] sm:bg-transparent border border-[#E5E5E7]/70 sm:border-0 rounded-2xl p-4 sm:p-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:shadow-none flex flex-col justify-center text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
                1,400+
              </div>
              <div className="text-[10px] sm:text-xs text-[#86868B] mt-1 font-semibold uppercase tracking-wider">
                Commercial Revisions
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}