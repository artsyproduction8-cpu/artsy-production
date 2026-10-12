import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import FontLoader from '@/components/FontLoader';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'optional',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'optional',
});

export const metadata: Metadata = {
  title: 'ARTSY — Place for Perspective | Cinematic Post-Production',
  description: 'High-contrast post-production studio and technological platform. Curated elite film editors, seamless cloud workflow, and transparent pricing for weddings, high-growth brands, and corporate cinema.',
  metadataBase: new URL('https://artsyproduction.com'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'ARTSY — Place for Perspective | Cinematic Post-Production',
    description: 'High-contrast post-production studio and technological platform. Curated elite film editors, seamless cloud workflow, and transparent pricing for weddings, high-growth brands, and corporate cinema.',
    url: 'https://artsyproduction.com',
    siteName: 'Artsy Production',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Artsy Production Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetbrainsMono.variable} overflow-x-clip max-w-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Preload and load Material Symbols with display=block to eliminate FOUT text flash */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body
        className="font-sans antialiased text-[#1D1D1F] bg-[#FFFFFF] selection:bg-[#3B82F6] selection:text-white overflow-x-clip max-w-full w-full min-h-screen relative"
        suppressHydrationWarning
      >
        <FontLoader />
        {children}
      </body>
    </html>
  );
}