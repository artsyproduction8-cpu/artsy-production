import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
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
      className={`${inter.variable} ${jetbrainsMono.variable} overflow-x-hidden max-w-full`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className="font-sans antialiased text-[#1D1D1F] bg-[#FFFFFF] selection:bg-[#3B82F6] selection:text-white overflow-x-hidden max-w-full w-full min-h-screen relative"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}