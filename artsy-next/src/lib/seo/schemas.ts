export interface VideoSchemaInput {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate?: string;
  duration?: string; // ISO 8601 format e.g. "PT4M13S"
  contentUrl?: string;
  embedUrl?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ServiceSchemaInput {
  name: string;
  description: string;
  category?: string;
  price?: string | number;
  currency?: string;
  url?: string;
}

export interface PersonSchemaInput {
  id?: string;
  name: string;
  jobTitle?: string;
  bio?: string;
  image?: string;
  url?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com';

export function organizationSchema() {
  const sameAs = [
    process.env.NEXT_PUBLIC_YOUTUBE_URL,
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    process.env.NEXT_PUBLIC_LINKEDIN_URL,
  ].filter(Boolean) as string[];

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Artsy Production',
    alternateName: 'Artsy Place for Perspective',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: sameAs.length > 0 ? sameAs : [
      'https://www.youtube.com/@artsyproduction',
      'https://www.instagram.com/artsyproduction',
      'https://www.linkedin.com/company/artsy-production',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || process.env.SUPER_ADMIN_PHONE || '+91-XXXXXXXXXX',
      contactType: 'customer service',
      areaServed: ['IN', 'AE', 'US', 'GB'],
      availableLanguage: ['English', 'Hindi'],
    },
  };
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Artsy Production',
    image: `${BASE_URL}/logo.png`,
    url: BASE_URL,
    telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || process.env.SUPER_ADMIN_PHONE || '+91-XXXXXXXXXX',
    priceRange: '₹₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: process.env.BUSINESS_ADDRESS || 'Artsy Production Hub, Bandra Kurla Complex',
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      postalCode: '400051',
      addressCountry: 'IN',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Artsy Production',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/services?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function videoObjectSchema(v: VideoSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.name,
    description: v.description ? v.description.slice(0, 150) : v.name,
    thumbnailUrl: [v.thumbnailUrl || `${BASE_URL}/logo.png`],
    uploadDate: v.uploadDate || '2026-01-01T00:00:00Z',
    duration: v.duration || 'PT0S', // Fallback ISO 8601 duration
    contentUrl: v.contentUrl,
    embedUrl: v.embedUrl || v.contentUrl,
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

export function serviceSchema(s: ServiceSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    provider: {
      '@type': 'Organization',
      name: 'Artsy Production',
      url: BASE_URL,
    },
    areaServed: 'IN',
    url: s.url ? (s.url.startsWith('http') ? s.url : `${BASE_URL}${s.url}`) : `${BASE_URL}/services`,
    offers: s.price ? {
      '@type': 'Offer',
      price: s.price,
      priceCurrency: s.currency || 'INR',
      availability: 'https://schema.org/InStock',
    } : undefined,
  };
}

export function personSchema(creator: PersonSchemaInput) {
  const profileUrl = creator.id ? `${BASE_URL}/creators/${creator.id}` : (creator.url || `${BASE_URL}/creators`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.name,
    jobTitle: creator.jobTitle || 'Film Editor & Colorist',
    description: creator.bio,
    image: creator.image,
    url: profileUrl,
    worksFor: {
      '@type': 'Organization',
      name: 'Artsy Production',
      url: BASE_URL,
    },
  };
}
