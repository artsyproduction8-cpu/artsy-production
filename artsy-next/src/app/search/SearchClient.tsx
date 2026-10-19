'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  categoryTitle: string;
  duration_label?: string | null;
  base_price: number;
  base_price_formatted: string;
  standard_delivery_days?: number;
  standard_delivery?: string;
  deliverables?: string[];
  book_url: string;
  service_url: string;
  popular?: boolean;
}

interface CreatorItem {
  id: string;
  public_display_name: string;
  public_specialty: string | null;
  public_bio: string | null;
  creator_tier?: string | null;
  years_of_experience?: number | null;
  avg_rating?: number | null;
  total_projects_completed?: number | null;
  is_accepting_work?: boolean;
}

interface PortfolioItem {
  id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url?: string | null;
  youtube_id?: string;
}

interface SearchResults {
  services: ServiceItem[];
  creators: CreatorItem[];
  portfolio: PortfolioItem[];
  total: number;
}

const POPULAR_TAGS = [
  'Cinematic Story',
  'Wedding Highlight',
  'Teaser',
  'Ad Film',
  'Product Video',
  'Social Reel',
  'Color Grading',
  'Corporate Film',
];

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialQuery = searchParams.get('q') || searchParams.get('query') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'creators' | 'portfolio'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    services: [],
    creators: [],
    portfolio: [],
    total: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('query') || '';
    setSearchTerm(q);
    if (q.trim()) {
      fetchSearchResults(q.trim());
    } else {
      setResults({ services: [], creators: [], portfolio: [], total: 0 });
      setHasSearched(false);
    }
  }, [searchParams]);

  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setResults({
          services: data.services || [],
          creators: data.creators || [],
          portfolio: data.portfolio || [],
          total: data.total || 0,
        });
      } else {
        setResults({ services: [], creators: [], portfolio: [], total: 0 });
      }
    } catch (err) {
      console.error('[Search Fetch Error]:', err);
      setResults({ services: [], creators: [], portfolio: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(tag)}`);
    });
  };

  const serviceCount = results.services.length;
  const creatorCount = results.creators.length;
  const portfolioCount = results.portfolio.length;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Search Header Form */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E5E7] text-[11px] font-mono uppercase font-semibold text-[#86868B] shadow-2xs mb-4">
          <span>Search Artsy Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1D1D1F] tracking-tight mb-3">
          Explore Services &amp; Video Portfolio
        </h1>
        <p className="text-sm sm:text-base text-[#86868B] max-w-2xl mx-auto mb-8 leading-relaxed">
          Search across our verified post-production catalog with transparent unit pricing, guaranteed turnaround SLAs, and authentic video showcases.
        </p>

        {/* Premium Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center bg-white border border-[#E5E5E7] focus-within:border-[#1D1D1F] focus-within:ring-4 focus-within:ring-[#1D1D1F]/5 rounded-2xl shadow-xs transition-all p-1.5"
        >
          <div className="pl-3.5 pr-2 pointer-events-none text-[#86868B]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="main-search-input"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword, style, or package (e.g. Cinematic Story, Wedding, Teaser, Ad Film)..."
            className="w-full bg-transparent border-0 text-[#1D1D1F] placeholder:text-[#86868B] text-sm sm:text-base py-2.5 px-2 focus:outline-hidden"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                router.push('/search');
              }}
              className="text-[#86868B] hover:text-[#1D1D1F] p-2 text-xs cursor-pointer transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
          <button
            id="main-search-submit-btn"
            type="submit"
            className="px-5 py-2.5 bg-[#1D1D1F] hover:bg-black text-white font-semibold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className="text-xs font-mono uppercase text-[#86868B] mr-1">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="text-xs px-3 py-1 rounded-full bg-white border border-[#E5E5E7] hover:border-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white text-[#1D1D1F] transition-all cursor-pointer shadow-2xs"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Query Status Bar & Filter Tabs */}
      {hasSearched && (
        <div className="border-b border-[#E5E5E7] pb-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-[#1D1D1F]">
              {loading ? (
                <span>Searching catalog...</span>
              ) : (
                <span>
                  {results.total === 0
                    ? `No matches found for "${initialQuery}"`
                    : `Found ${results.total} matching ${results.total === 1 ? 'item' : 'items'} for "${initialQuery}"`}
                </span>
              )}
            </div>
            <p className="text-xs text-[#86868B] mt-0.5">
              Verified services and official video showcase
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E5E7] shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#1D1D1F] text-white shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              All ({results.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-[#1D1D1F] text-white shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Services ({serviceCount})
            </button>
            {portfolioCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'portfolio'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Portfolio ({portfolioCount})
              </button>
            )}
            {creatorCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('creators')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'creators'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Creators ({creatorCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#E5E5E7] rounded-2xl p-6 h-64">
              <div className="h-4 bg-[#E5E5E7] rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-[#E5E5E7] rounded w-3/4 mb-3"></div>
              <div className="h-16 bg-[#F5F5F7] rounded w-full mb-6"></div>
              <div className="h-10 bg-[#E5E5E7] rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State / Not Searched Yet */}
      {!loading && !hasSearched && (
        <div className="bg-white border border-[#E5E5E7] rounded-2xl p-10 sm:p-14 text-center my-6 shadow-xs">
          <div className="w-16 h-16 bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E5E5E7]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] mb-2">Explore the Artsy Production Catalog</h2>
          <p className="text-sm text-[#86868B] max-w-md mx-auto mb-6 leading-relaxed">
            Search for specialized editing services like &ldquo;Cinematic Story&rdquo;, &ldquo;Wedding Teaser&rdquo;, or &ldquo;Commercial Ad&rdquo; with matching unit prices and instant booking.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="px-4 py-2.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              Browse All Services →
            </Link>
            <Link
              href="/book"
              className="px-4 py-2.5 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] transition-all shadow-2xs"
            >
              Instant Price Estimator
            </Link>
            <Link
              href="/work"
              className="px-4 py-2.5 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] transition-all shadow-2xs"
            >
              View Official Work
            </Link>
          </div>
        </div>
      )}

      {/* No Results Found */}
      {!loading && hasSearched && results.total === 0 && (
        <div className="bg-white border border-[#E5E5E7] rounded-2xl p-10 sm:p-14 text-center my-6 shadow-xs">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] mb-2">No matching services for &ldquo;{initialQuery}&rdquo;</h2>
          <p className="text-sm text-[#86868B] max-w-md mx-auto mb-6 leading-relaxed">
            We couldn&apos;t find an exact match. Try broader keywords like &ldquo;Cinematic&rdquo;, &ldquo;Wedding&rdquo;, &ldquo;Reel&rdquo;, &ldquo;Teaser&rdquo;, or &ldquo;Ad Film&rdquo;.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="px-5 py-2.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              Browse Full Service Catalog →
            </Link>
            <Link
              href="/book"
              className="px-5 py-2.5 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] transition-all shadow-2xs"
            >
              Start Custom Booking
            </Link>
          </div>
        </div>
      )}

      {/* Results Content */}
      {!loading && hasSearched && results.total > 0 && (
        <div className="space-y-12">
          {/* SECTION 1: SERVICES (Exact Match with /services and /book) */}
          {(activeTab === 'all' || activeTab === 'services') && serviceCount > 0 && (
            <section id="services-results">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Services</h2>
                  <span className="text-xs bg-white text-[#1D1D1F] border border-[#E5E5E7] px-2.5 py-0.5 rounded-full font-mono font-bold shadow-2xs">
                    {serviceCount}
                  </span>
                </div>
                {activeTab === 'all' && serviceCount > 6 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className="text-xs text-[#1D1D1F] hover:text-[#3B82F6] font-semibold cursor-pointer"
                  >
                    View all {serviceCount} services →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? results.services.slice(0, 6) : results.services).map((service) => (
                  <div
                    key={service.id}
                    className="bg-white border border-[#E5E5E7] hover:border-[#1D1D1F]/40 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#F5F5F7] text-[#1D1D1F] font-bold border border-[#E5E5E7]">
                          {service.categoryTitle || service.category}
                        </span>
                        {service.duration_label && (
                          <span className="text-[11px] text-[#86868B] font-mono">
                            ⏱ {service.duration_label}
                          </span>
                        )}
                      </div>

                      {/* Service Title */}
                      <h3 className="text-lg font-bold text-[#1D1D1F] mb-1.5 group-hover:text-[#3B82F6] transition-colors">
                        {service.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#86868B] line-clamp-3 mb-4 leading-relaxed">
                        {service.description || 'Specialized post-production package curated by Artsy Production.'}
                      </p>

                      {/* Deliverables tags */}
                      {service.deliverables && service.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {service.deliverables.slice(0, 3).map((d, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-[#F9F9FB] border border-[#E5E5E7] text-[#86868B] px-2 py-0.5 rounded-md"
                            >
                              ✓ {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Pricing & Actions */}
                    <div className="border-t border-[#E5E5E7] pt-4 mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#86868B] uppercase font-mono tracking-wider">Starting From</div>
                        <div className="text-lg font-extrabold text-[#1D1D1F]">
                          {service.base_price_formatted || (service.base_price ? `₹${service.base_price.toLocaleString('en-IN')}` : 'Custom Quote')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={service.service_url || `/services/${service.category}`}
                          className="px-3 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                        >
                          Details
                        </Link>
                        <Link
                          href={service.book_url || `/book?category=${service.category}&sub=${service.id}`}
                          className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          Book Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: PORTFOLIO SAMPLES */}
          {(activeTab === 'all' || activeTab === 'portfolio') && portfolioCount > 0 && (
            <section id="portfolio-results">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Cinematic Work &amp; Portfolio</h2>
                  <span className="text-xs bg-white text-[#1D1D1F] border border-[#E5E5E7] px-2.5 py-0.5 rounded-full font-mono font-bold shadow-2xs">
                    {portfolioCount}
                  </span>
                </div>
                {activeTab === 'all' && portfolioCount > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('portfolio')}
                    className="text-xs text-[#1D1D1F] hover:text-[#3B82F6] font-semibold cursor-pointer"
                  >
                    View all {portfolioCount} reels →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? results.portfolio.slice(0, 3) : results.portfolio).map((sample) => (
                  <div
                    key={sample.id}
                    className="bg-white border border-[#E5E5E7] hover:border-[#1D1D1F]/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group hover:shadow-md"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden group">
                      {sample.thumbnail_url ? (
                        <img
                          src={sample.thumbnail_url}
                          alt={sample.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-[10px] font-mono text-white px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                        {sample.category}
                      </div>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/95 text-[#1D1D1F] flex items-center justify-center pl-0.5 text-xs font-bold shadow-lg group-hover:scale-110 transition-transform">
                          ▶
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-[#1D1D1F] mb-1.5 group-hover:text-[#3B82F6] transition-colors leading-snug">
                          {sample.title}
                        </h3>
                        {sample.description && (
                          <p className="text-xs text-[#86868B] line-clamp-2 leading-relaxed mb-4">
                            {sample.description}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-[#E5E5E7] pt-3 mt-2 flex items-center justify-between">
                        <Link
                          href="/work"
                          className="text-xs text-[#86868B] hover:text-[#1D1D1F] font-semibold"
                        >
                          Explore Showcase
                        </Link>
                        {sample.video_url && (
                          <a
                            href={sample.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-[#F5F5F7] hover:bg-[#1D1D1F] text-[#1D1D1F] hover:text-white border border-[#E5E5E7] text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1 shadow-2xs"
                          >
                            Watch Video ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: CREATORS */}
          {(activeTab === 'all' || activeTab === 'creators') && creatorCount > 0 && (
            <section id="creators-results">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Verified Creators</h2>
                  <span className="text-xs bg-white text-[#1D1D1F] border border-[#E5E5E7] px-2.5 py-0.5 rounded-full font-mono font-bold shadow-2xs">
                    {creatorCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? results.creators.slice(0, 3) : results.creators).map((creator) => (
                  <div
                    key={creator.id}
                    className="bg-white border border-[#E5E5E7] hover:border-[#1D1D1F]/40 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-[#1D1D1F] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                          {creator.public_display_name
                            ? creator.public_display_name.slice(0, 2).toUpperCase()
                            : 'CR'}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                            {creator.public_display_name}
                          </h3>
                          <div className="text-[11px] text-[#86868B]">
                            {creator.public_specialty || 'Film Editor & Colorist'}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#86868B] line-clamp-2 leading-relaxed mb-4">
                        {creator.public_bio || 'Vetted post-production specialist in the Artsy Network.'}
                      </p>
                    </div>

                    <div className="border-t border-[#E5E5E7] pt-3 flex items-center justify-between">
                      <span className="text-[11px] text-[#86868B]">
                        {creator.total_projects_completed || 0} projects delivered
                      </span>
                      <Link
                        href={`/creators/${creator.id}`}
                        className="px-3.5 py-1.5 bg-[#F5F5F7] hover:bg-[#1D1D1F] text-[#1D1D1F] hover:text-white text-xs font-semibold rounded-xl border border-[#E5E5E7] transition-all shadow-2xs"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
