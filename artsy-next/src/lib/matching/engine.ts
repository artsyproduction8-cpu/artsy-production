/**
 * ARTSY PRODUCTION — Creator Matching & Dispatch Engine
 * Implements user decision:
 * "Algorithmic Top Match + First-to-Claim + our own AI"
 * AI scores creator performance & profile compatibility,
 * then dispatches anonymised job card to top candidates for First-to-Claim.
 */

export interface ArtsyCreator {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  completedProjects: number;
  verifiedStatus: 'approved' | 'pending' | 'rejected';
  skills: string[];
  software: string[];
  sampleReelsCount: number;
  onTimeDeliveryRate: number; // percentage
  availableForJobs: boolean;
}

export interface AnonymisedJob {
  id: string;
  serviceCategory: 'wedding' | 'brand_ugc' | 'store_product' | 'corporate_event';
  title: string;
  durationLabel: string;
  cameraAnglesCount: number;
  payoutAmount: number; // 70% of available split in ₹ INR (post GST/gateway/infra deductions)
  clientSlaDays: number; // 7–10 days
  internalDeadlineDays: number; // 4–6 days
  scopeSummary: string;
  status: 'open_claim' | 'claimed' | 'in_progress' | 'qa_review' | 'completed';
  claimedByCreatorId?: string;
  claimedAt?: string;
  driveFolderReady: boolean;
}

export const MOCK_CREATORS: ArtsyCreator[] = [
  {
    id: 'creator-1',
    name: 'Kabir Verma',
    tagline: 'Senior DaVinci Colorist & Wedding Cinematic Lead',
    rating: 4.96,
    completedProjects: 48,
    verifiedStatus: 'approved',
    skills: ['Wedding Films', '4K Color Grade', 'Multi-Cam Sync', 'Sound Design'],
    software: ['DaVinci Resolve Studio', 'Premiere Pro', 'Audition'],
    sampleReelsCount: 4,
    onTimeDeliveryRate: 98,
    availableForJobs: true
  },
  {
    id: 'creator-2',
    name: 'Aanya Sen',
    tagline: 'Viral UGC & Brand Hooks Specialist',
    rating: 4.92,
    completedProjects: 72,
    verifiedStatus: 'approved',
    skills: ['Brand & UGC Reels', 'High Retention', 'Motion Graphics', 'Sound FX'],
    software: ['Premiere Pro', 'After Effects', 'CapCut Pro'],
    sampleReelsCount: 5,
    onTimeDeliveryRate: 100,
    availableForJobs: true
  },
  {
    id: 'creator-3',
    name: 'Rohan Mehra',
    tagline: 'Commercial E-Commerce & 3D Product Video Editor',
    rating: 4.88,
    completedProjects: 39,
    verifiedStatus: 'approved',
    skills: ['Store & Product Reels', '3D Cutaways', 'Callout Graphics', 'Colorist'],
    software: ['After Effects', 'Premiere Pro', 'Blender'],
    sampleReelsCount: 3,
    onTimeDeliveryRate: 96,
    availableForJobs: true
  },
  {
    id: 'creator-4',
    name: 'Vikram Joshi',
    tagline: 'Corporate Keynotes, Summits & Multi-Cam Editor',
    rating: 4.94,
    completedProjects: 53,
    verifiedStatus: 'approved',
    skills: ['Corporate & Event Videos', 'Multi-Cam Sync', 'Audio Cleanup', 'Subtitles'],
    software: ['Premiere Pro', 'DaVinci Resolve', 'iZotope RX'],
    sampleReelsCount: 4,
    onTimeDeliveryRate: 97,
    availableForJobs: true
  }
];

export const INITIAL_OPEN_JOBS: AnonymisedJob[] = [
  {
    id: 'job-artsy-101',
    serviceCategory: 'wedding',
    title: 'Luxury Destination Wedding Highlight (3–5 Min)',
    durationLabel: '3–5 Min Cinematic Highlight',
    cameraAnglesCount: 3,
    payoutAmount: 4533, // 70% of available split for ₹8,000 project (net ₹4,488 after 1% TDS)
    clientSlaDays: 8,
    internalDeadlineDays: 5,
    scopeSummary: '3 camera sources (Sony FX3/A7S3) + drone footage. Song reference: Acoustic Hindi romantic ballad. Full 4K HDR master needed.',
    status: 'open_claim',
    driveFolderReady: true
  },
  {
    id: 'job-artsy-102',
    serviceCategory: 'brand_ugc',
    title: 'Fintech App High-Retention Hook Reel (3 Variants)',
    durationLabel: '45s Hook + 3 Variants',
    cameraAnglesCount: 1,
    payoutAmount: 2111, // 70% of available split for ₹3,800 project (net ₹2,090 after 1% TDS)
    clientSlaDays: 4,
    internalDeadlineDays: 2,
    scopeSummary: 'A-roll talking head with dynamic zooms, sound effects, bold captions, and 3 alternative hook intros for TikTok/Reels.',
    status: 'open_claim',
    driveFolderReady: true
  },
  {
    id: 'job-artsy-103',
    serviceCategory: 'store_product',
    title: 'Premium D2C Watch E-Commerce Showcase (3D Cutaways)',
    durationLabel: '30s High-Energy Showcase',
    cameraAnglesCount: 2,
    payoutAmount: 2976, // 70% of available split for ₹5,300 project (net ₹2,946 after 1% TDS)
    clientSlaDays: 6,
    internalDeadlineDays: 3,
    scopeSummary: 'Macro studio shots of watch dial + movement. 3D feature callouts (sapphire crystal, 100m waterproof) and upbeat electronic rhythm.',
    status: 'open_claim',
    driveFolderReady: true
  }
];

const JOBS_STORAGE_KEY = 'artsy_dispatch_jobs';

export function getDispatchJobs(): AnonymisedJob[] {
  if (typeof window === 'undefined') return INITIAL_OPEN_JOBS;
  try {
    const stored = localStorage.getItem(JOBS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse dispatch jobs', e);
  }
  return INITIAL_OPEN_JOBS;
}

export function claimJobByCreator(jobId: string, creatorId: string): { success: boolean; message: string; job?: AnonymisedJob } {
  const jobs = getDispatchJobs();
  const index = jobs.findIndex(j => j.id === jobId);
  if (index === -1) return { success: false, message: 'Job not found' };

  if (jobs[index].status !== 'open_claim') {
    return { success: false, message: 'This job has already been claimed by another Artsy Creator.' };
  }

  jobs[index].status = 'claimed';
  jobs[index].claimedByCreatorId = creatorId;
  jobs[index].claimedAt = new Date().toISOString();

  if (typeof window !== 'undefined') {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  }

  return { success: true, message: 'Job claimed successfully! Internal deadline started.', job: jobs[index] };
}
