'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sub_category?: string | null;
  base_price?: number;
  standard_delivery_days?: number;
  duration_label?: string | null;
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
}

interface SearchResults {
  services: ServiceItem[];
  creators: CreatorItem[];
  portfolio: PortfolioItem[];
  total: number;
}

const POPULAR_TAGS = [
  'Wedding',
  'Commercial',
  'Color Grading',
  'Teaser',
  'Corporate',
  'Documentary',
  'Music Video',
  'Sound Design',
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Search Header Form */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Search Artsy Production
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mb-6">
          Find specialized editing services, vetted cinematic creators, and award-winning video work.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-2xl">
          <div className="absolute left-4 pointer-events-none text-zinc-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="main-search-input"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword, style, editor, or category (e.g. Wedding, Colorist, Trailer)..."
            className="w-full bg-[#18181B] border border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-zinc-500 text-sm sm:text-base rounded-2xl py-3.5 pl-12 pr-28 transition-all"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                router.push('/search');
              }}
              className="absolute right-24 text-zinc-400 hover:text-white p-1 text-xs"
              title="Clear"
            >
              ✕
            </button>
          )}
          <button
            id="main-search-submit-btn"
            type="submit"
            className="absolute right-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Popular Tags / Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="text-xs font-mono uppercase text-zinc-500 mr-1">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-zinc-300 hover:text-blue-400 transition-all cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Query Status Bar & Filter Tabs */}
      {hasSearched && (
        <div className="border-b border-white/10 pb-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-white">
              {loading ? (
                <span>Searching database...</span>
              ) : (
                <span>
                  {results.total === 0
                    ? `No results found for "${initialQuery}"`
                    : `Found ${results.total} results for "${initialQuery}"`}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Across services, verified creators, and portfolio catalog
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[#18181B] p-1 rounded-xl border border-white/10 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({results.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Services ({serviceCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('creators')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'creators'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Creators ({creatorCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'portfolio'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Portfolio ({portfolioCount})
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#18181B] border border-white/10 rounded-2xl p-6 h-64">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
              <div className="h-16 bg-white/5 rounded w-full mb-6"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State / Not Searched Yet */}
      {!loading && !hasSearched && (
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-10 text-center my-6">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Discover What Artsy Has to Offer</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            Type in keywords like &ldquo;Wedding&rdquo;, &ldquo;Commercial&rdquo;, &ldquo;Trailer&rdquo;, or an editor&apos;s name to explore verified post-production talent and rates.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Browse All Services →
            </Link>
            <Link
              href="/creators"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Meet Our Creators →
            </Link>
            <Link
              href="/work"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              View Official Portfolio →
            </Link>
          </div>
        </div>
      )}

      {/* No Results Found */}
      {!loading && hasSearched && results.total === 0 && (
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-10 text-center my-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No direct matches for &ldquo;{initialQuery}&rdquo;</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            We couldn&apos;t find any active services, creators, or portfolio samples matching that query. Try broader keywords like &ldquo;Wedding&rdquo;, &ldquo;Reel&rdquo;, &ldquo;Grading&rdquo;, or &ldquo;Cinema&rdquo;.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/book"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Start Custom Booking →
            </Link>
            <Link
              href="/services"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Explore Full Service Catalog
            </Link>
          </div>
        </div>
      )}

      {/* Results Content */}
      {!loading && hasSearched && results.total > 0 && (
        <div className="space-y-12">
          {/* SECTION 1: SERVICES */}
          {(activeTab === 'all' || activeTab === 'services') && serviceCount > 0 && (
            <section id="services-results">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Services</h2>
                  <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                    {serviceCount}
                  </span>
                </div>
                {activeTab === 'all' && serviceCount > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View all {serviceCount} services →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? results.services.slice(0, 3) : results.services).map((service) => (
                  <div
                    key={service.id}
                    className="bg-[#18181B] border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                          {service.category}
                        </span>
                        {service.standard_delivery_days && (
                          <span className="text-[10px] text-zinc-400">
                            ⏱ {service.standard_delivery_days} days
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                        {service.description || 'Specialized post-production package curated by Artsy Production.'}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase font-mono">Starting From</div>
                        <div className="text-base font-extrabold text-emerald-400">
                          {service.base_price ? `₹${service.base_price.toLocaleString('en-IN')}` : 'Custom Quote'}
                        </div>
                      </div>
                      <Link
                        href={`/book?service=${encodeURIComponent(service.id)}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        Book Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: CREATORS */}
          {(activeTab === 'all' || activeTab === 'creators') && creatorCount > 0 && (
            <section id="creators-results">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Verified Creators</h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    {creatorCount}
                  </span>
                </div>
                {activeTab === 'all' && creatorCount > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('creators')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    View all {creatorCount} creators →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? results.creators.slice(0, 3) : results.creators).map((creator) => (
                  <div
                    key={creator.id}
                    className="bg-[#18181B] border border-white/10 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                            {creator.public_display_name
                              ? creator.public_display_name.slice(0, 2).toUpperCase()
                              : 'CR'}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {creator.public_display_name}
                            </h3>
                            <div className="text-[11px] text-zinc-400">
                              {creator.public_specialty || 'Film Editor & Colorist'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-300 bg-white/5 p-2 rounded-lg mb-3">
                        {creator.creator_tier && (
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">
                            ★ {creator.creator_tier}
                          </span>
                        )}
                        {creator.years_of_experience && (
                          <span>{creator.years_of_experience}+ yrs exp</span>
                        )}
                        {creator.avg_rating ? (
                          <span className="text-amber-400">⭐ {creator.avg_rating}</span>
                        ) : null}
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                        {creator.public_bio || 'Vetted post-production specialist accepted into the Artsy Network.'}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        {creator.total_projects_completed || 0} projects delivered
                      </span>
                      <Link
                        href={`/creators/${creator.id}`}
                        className="px-4 py-2 bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: PORTFOLIO SAMPLES */}
          {(activeTab === 'all' || activeTab === 'portfolio') && portfolioCount > 0 && (
            <section id="portfolio-results">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Cinematic Work &amp; Portfolio</h2>
                  <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                    {portfolioCount}
                  </span>
                </div>
                {activeTab === 'all' && portfolioCount > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('portfolio')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                  >
                    View all {portfolioCount} reels →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'all' ? results.portfolio.slice(0, 3) : results.portfolio).map((sample) => (
                  <div
                    key={sample.id}
                    className="bg-[#18181B] border border-white/10 hover:border-purple-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group hover:shadow-xl"
                  >
                    <div className="relative aspect-video bg-black/50 overflow-hidden">
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
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-[10px] font-mono text-white px-2 py-0.5 rounded uppercase">
                        {sample.category}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
                          {sample.title}
                        </h3>
                        {sample.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                            {sample.description}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-white/10 pt-3 mt-2 flex items-center justify-between">
                        <Link
                          href="/work"
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Explore Showcase
                        </Link>
                        {sample.video_url && (
                          <a
                            href={sample.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
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
        </div>
      )}
    </div>
  );
}
