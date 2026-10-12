'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

interface CreatorItem {
  id: string;
  public_display_name: string;
  public_specialty: string;
  public_bio: string;
  years_of_experience: number;
  avg_rating: number | string;
  total_projects_completed: number;
  is_accepting_work: boolean;
  creator_tier: 'rising_talent' | 'standard' | 'senior';
}

export default function PublicCreatorsPage() {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  useEffect(() => {
    fetchCreators();
  }, [categoryFilter, tierFilter, availabilityFilter]);

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (availabilityFilter !== 'all') params.append('availability', availabilityFilter);

      const res = await fetch(`/api/creators?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCreators(data.creators || []);
      } else {
        setError(data.error || 'Failed to load creators');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading creators');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Disciplines' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'brand', label: 'Brand & Commercial' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'social', label: 'Social & UGC' },
  ];

  const tiers = [
    { id: 'all', label: 'All Tiers' },
    { id: 'rising_talent', label: 'Rising Talent' },
    { id: 'standard', label: 'Standard Roster' },
    { id: 'senior', label: 'Senior Lead' },
  ];

  const availabilities = [
    { id: 'all', label: 'All Status' },
    { id: 'available', label: 'Available Now' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-tight sm:leading-none">
            Meet Our Creative Team
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#86868B] max-w-2xl mx-auto leading-relaxed">
            Handpicked editors for weddings, brands, and corporate cinema. Browse approved portfolios and request your preferred specialist at booking with guaranteed Artsy QA.
          </p>
        </div>

        {/* Filter Controls Strip */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5E7] shadow-xs mb-10">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-[#1D1D1F] text-white shadow-xs'
                      : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5E7]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tier & Availability Selectors */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#86868B]">Tier:</span>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#86868B]">Availability:</span>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  {availabilities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-xs animate-pulse h-96 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#E5E5E7]" />
                  <div className="h-4 bg-[#E5E5E7] rounded-md w-3/4" />
                  <div className="h-3 bg-[#E5E5E7] rounded-md w-1/2" />
                </div>
                <div className="h-10 bg-[#E5E5E7] rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchCreators}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#E5E5E7] shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center text-2xl mx-auto mb-4">
              🎬
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">No creators matching this filter</h3>
            <p className="text-xs text-[#86868B] mt-2">
              Try adjusting your category or tier filters to view active talent profiles.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setTierFilter('all');
                setAvailabilityFilter('all');
              }}
              className="mt-6 px-4 py-2 bg-[#1D1D1F] text-white rounded-xl text-xs font-semibold hover:bg-black transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {creators.map((c) => {
              const initials = (c.public_display_name || 'Artsy Creator')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('');

              const isRisingTalent =
                c.creator_tier === 'rising_talent' || c.total_projects_completed < 10;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E5E7] shadow-xs hover:shadow-md hover:border-[#DCDFE3] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar & Badges */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1D1D1F] to-[#3B82F6] text-white flex items-center justify-center font-bold text-xl shadow-xs group-hover:scale-105 transition-transform">
                        {initials}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Rising Talent Badge */}
                        {isRisingTalent && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
                            ★ Rising Talent
                          </span>
                        )}
                        {!isRisingTalent && c.creator_tier === 'senior' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-50 text-purple-800 border border-purple-200">
                            Senior Lead
                          </span>
                        )}

                        {/* Availability Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.is_accepting_work
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.is_accepting_work ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                            }`}
                          />
                          {c.is_accepting_work ? 'Available' : 'Fully Booked'}
                        </span>
                      </div>
                    </div>

                    {/* Name & Specialty */}
                    <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight group-hover:text-[#3B82F6] transition-colors">
                      {c.public_display_name}
                    </h2>
                    <p className="text-xs font-semibold text-[#3B82F6] mt-1 leading-snug">
                      {c.public_specialty || 'Cinematic Video Editor'}
                    </p>

                    {/* Bio snippet */}
                    <p className="text-xs text-[#86868B] mt-3 line-clamp-3 leading-relaxed">
                      {c.public_bio ||
                        'Crafting frame-accurate cinematic timelines and color grades calibrated for modern displays.'}
                    </p>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 py-4 my-5 border-y border-[#F5F5F7] text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                          Experience
                        </div>
                        <div className="text-xs font-extrabold text-[#1D1D1F] mt-0.5">
                          {c.years_of_experience || 3} yrs
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                          Rating
                        </div>
                        <div className="text-xs font-extrabold text-[#1D1D1F] mt-0.5 flex items-center justify-center gap-0.5">
                          <span className="text-amber-500">★</span>
                          <span>{Number(c.avg_rating || 4.9).toFixed(1)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                          Projects
                        </div>
                        <div className="text-xs font-extrabold text-[#1D1D1F] mt-0.5">
                          {c.total_projects_completed || 0} cuts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Link
                      href={`/creators/${c.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#1D1D1F] text-white hover:bg-[#3B82F6] transition-colors shadow-2xs group-hover:bg-[#3B82F6]"
                    >
                      <span>View Profile &amp; Samples</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
