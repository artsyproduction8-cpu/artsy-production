'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ServiceCategory,
  ServiceProduct,
  loadPricingMatrix,
  savePricingMatrix,
} from '@/lib/pricing/catalog-matrix';

export default function AdminCatalogPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadPricingMatrix();
    setCategories(loaded);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleProduct = (categoryId: string, productId: string) => {
    const updated = categories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        products: cat.products.map((p) =>
          p.id === productId ? { ...p, active: !p.active } : p
        ),
      };
    });
    setCategories(updated);
    savePricingMatrix(updated);
    showToast('Catalog format status updated and synchronized.');
  };

  // Flatten all products with their category context for filtering
  const allProductsWithCat = categories.flatMap((cat) =>
    cat.products.map((p) => ({
      ...p,
      categoryTitle: cat.title,
      categoryBadge: cat.badge,
    }))
  );

  const filteredProducts = allProductsWithCat.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.deliverables.some((d) => d.toLowerCase().includes(q)) ||
      p.cameraProfiles.some((cp) => cp.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const totalProducts = allProductsWithCat.length;
  const activeProducts = allProductsWithCat.filter((p) => p.active).length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs font-bold text-[#1D1D1F]">Production Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
            Production Catalog &amp; Technical Specs
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Live catalog synchronized with the public website. Inspect format specifications, camera profile ingest requirements, and delivery standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/pricing"
            className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span>Configure Pricing Matrix</span>
            <span>→</span>
          </Link>
          <Link
            href="/services"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span>Public Website Preview</span>
            <span>↗</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Studio Formats
          </span>
          <div className="text-2xl font-black text-[#1D1D1F] mt-1">
            {totalProducts}
          </div>
          <span className="text-[11px] text-[#86868B] mt-0.5 block">
            Across 4 production categories
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Active Lines
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {activeProducts}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Bookable on public portal
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Color Standards
          </span>
          <div className="text-2xl font-black text-[#0071E3] mt-1">
            Rec.709 / ACES
          </div>
          <span className="text-[11px] text-[#86868B] mt-0.5 block">
            DaVinci Wide Gamut calibrated
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Dialogue Audio Target
          </span>
          <div className="text-2xl font-black text-[#1D1D1F] mt-1">
            -14 LUFS
          </div>
          <span className="text-[11px] text-[#86868B] mt-0.5 block">
            Broadcast &amp; OTT specification
          </span>
        </div>
      </div>

      {/* Category Pills & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            All Formats ({totalProducts})
          </button>
          {categories.map((cat) => {
            const count = cat.products.length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#3B82F6] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {cat.title} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search specs, formats, camera profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E7] text-xs text-[#1D1D1F] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
          />
        </div>
      </div>

      {/* Catalog Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-2xl p-6 border shadow-xs space-y-5 transition-all flex flex-col justify-between ${
              service.active ? 'border-[#E5E5E7]' : 'border-dashed border-slate-300 opacity-60'
            }`}
          >
            <div className="space-y-4">
              {/* Header Badge & Active Toggle */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-[#3B82F6] bg-blue-50 px-2 py-0.5 rounded">
                      {service.categoryTitle}
                    </span>
                    {service.tag && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {service.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] mt-2 leading-snug">
                    {service.name}
                  </h3>
                  <span className="text-xs text-[#86868B] font-medium block mt-0.5">
                    Target Runtime: {service.duration}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleProduct(service.categoryId, service.id)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer shrink-0 ${
                    service.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {service.active ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-[#86868B] leading-relaxed line-clamp-2">
                {service.description}
              </p>

              {/* Pricing & SLAs */}
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black font-mono text-[#1D1D1F]">
                      ₹{service.basePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#86868B] ml-1.5 uppercase font-bold">
                      Base Rate
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {service.creatorSharePct}% Creator Share
                  </span>
                </div>

                <div className="text-[11px] text-[#86868B] flex items-center justify-between pt-1 border-t border-[#E5E5E7]">
                  <span>Turnaround: <strong className="text-[#1D1D1F]">{service.standardDelivery}</strong></span>
                  <span className="font-mono text-[10px] text-[#86868B]">({service.slaHours}h SLA)</span>
                </div>

                <div className="text-[11px] text-[#86868B] flex items-center justify-between">
                  <span>Rush Turnaround:</span>
                  <strong className="text-amber-700 font-semibold">{service.rushOptions}</strong>
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] mb-2">
                  Master Deliverables
                </div>
                <ul className="space-y-1 text-xs text-[#1D1D1F]">
                  {service.deliverables.map((df, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{df}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Supported Camera Profiles */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] mb-2">
                  Camera Ingest Profiles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {service.cameraProfiles.map((cp, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-[#F5F5F7] px-2 py-0.5 rounded border border-[#E5E5E7] text-[#1D1D1F]"
                    >
                      {cp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Action Link */}
            <div className="pt-3 border-t border-[#F5F5F7]">
              <Link
                href={`/admin/pricing?tab=formats`}
                className="block text-center w-full py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-xs font-bold text-[#1D1D1F] transition-colors"
              >
                Configure Pricing &amp; Creator Splits →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E7] text-[#86868B] text-sm">
          No catalog formats match your search filter "{searchQuery}".
        </div>
      )}

      {/* Ingest Guidelines Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#1D1D1F]">
          Ingest &amp; Color Pipeline Technical Standard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#86868B]">
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="font-bold text-[#1D1D1F] mb-1">Color Management</div>
            DaVinci YRGB Color Managed or ACEScc 1.3. Output standard is Rec.709 Gamma 2.4 with mastering white point D65. Multi-format HDR passes available on enterprise brief.
          </div>
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="font-bold text-[#1D1D1F] mb-1">Audio Normalization</div>
            Integrated dialogue targets -14 LUFS (±1.0). Maximum True Peak limited to -1.0 dBTP. Stereo stem exports (Dialogue, Foley, Music Score) mandatory for all deliverables.
          </div>
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="font-bold text-[#1D1D1F] mb-1">Timeline Conforming</div>
            Multi-camera sync verified by scratch audio waveform match + timecode alignment. Final master exports rendered at full camera raster with zero spatial distortion.
          </div>
        </div>
      </div>
    </div>
  );
}
