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
  icons: {
    icon: '/favicon.ico',
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