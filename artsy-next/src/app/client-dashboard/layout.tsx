import type { Metadata } from 'next';
import ClientLayoutClient from '../client/ClientLayoutClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutClient>{children}</ClientLayoutClient>;
}

