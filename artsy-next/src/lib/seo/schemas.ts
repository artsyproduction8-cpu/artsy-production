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
      'https://www.instagram.com/artsy__production/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 83692 51112',
      contactType: 'customer service',
      areaServed: ['IN', 'AE', 'US', 'GB'],
      availableLanguage: ['English', 'Hindi'],
    },
  };
}

export function localBusinessSchema(cityContext?: {
  cityName: string;
  region: string;
  areaServed: string;
  locality?: string;
  serviceUrl?: string;
}) {
  const isCity = !!cityContext;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: isCity ? `Artsy Production — Wedding Video Editing ${cityContext.cityName}` : 'Artsy Production',
    image: `${BASE_URL}/logo.png`,
    url: cityContext?.serviceUrl ? `${BASE_URL}${cityContext.serviceUrl}` : BASE_URL,
    telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 83692 51112',
    priceRange: '₹₹₹',
    areaServed: cityContext?.areaServed || 'India',
    address: {
      '@type': 'PostalAddress',
      streetAddress: process.env.BUSINESS_ADDRESS || 'Artsy Production, Juinagar Railway Station',
      addressLocality: cityContext?.locality || cityContext?.cityName || 'Navi Mumbai',
      addressRegion: cityContext?.region || 'Maharashtra',
      postalCode: '400705',
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
  const thumb = v.thumbnailUrl?.startsWith('http')
    ? v.thumbnailUrl
    : v.thumbnailUrl
      ? `${BASE_URL}${v.thumbnailUrl.startsWith('/') ? '' : '/'}${v.thumbnailUrl}`
      : `${BASE_URL}/logo.png`;

  const content = v.contentUrl?.startsWith('http')
    ? v.contentUrl
    : v.contentUrl
      ? `${BASE_URL}${v.contentUrl.startsWith('/') ? '' : '/'}${v.contentUrl}`
      : undefined;

  const embed = v.embedUrl?.startsWith('http')
    ? v.embedUrl
    : v.embedUrl
      ? `${BASE_URL}${v.embedUrl.startsWith('/') ? '' : '/'}${v.embedUrl}`
      : content;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.name,
    description: v.description ? v.description.slice(0, 150) : v.name,
    thumbnailUrl: [thumb],
    uploadDate: v.uploadDate || '2026-01-01T00:00:00Z',
    duration: v.duration || 'PT3M30S',
    ...(content ? { contentUrl: content } : {}),
    ...(embed ? { embedUrl: embed } : {}),
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

export interface FAQItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
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
