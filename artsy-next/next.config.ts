import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/freelancer-dashboard',
        destination: '/freelancer',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/client-dashboard',
        permanent: true,
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://checkout.razorpay.com`.trim(),
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.b2.backblazeb2.com https://*.bunnycdn.com https://img.youtube.com https://i.ytimg.com",
              "media-src 'self' blob: https://*.b-cdn.net https://video.bunnycdn.com https://commondatastorage.googleapis.com",
              `connect-src 'self' ${isDev ? 'http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*' : ''} https://api.razorpay.com https://*.supabase.co https://*.backblazeb2.com`.trim(),
              "frame-src 'self' https://api.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
};

export default nextConfig;
