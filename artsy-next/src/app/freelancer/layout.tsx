import type { Metadata } from 'next';
import FreelancerLayoutClient from './FreelancerLayoutClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return <FreelancerLayoutClient>{children}</FreelancerLayoutClient>;
}
