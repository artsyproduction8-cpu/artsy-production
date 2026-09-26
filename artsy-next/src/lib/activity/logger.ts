/**
 * ARTSY PRODUCTION — Activity Logger
 * ====================================
 * Append-only immutable activity logging for:
 *   - Refund evidence (download events, progress milestones)
 *   - Audit trail (all project state changes)
 *   - Admin accountability
 *
 * V1: Writes to localStorage (mock mode).
 * Production: Writes to the `activity_log` Supabase table.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityEventType =
  | 'footage_download'
  | 'footage_import_confirmed'
  | 'project_started'
  | 'timeline_created'
  | 'progress_milestone'
  | 'draft_submitted'
  | 'qa_review'
  | 'client_review'
  | 'revision_requested'
  | 'revision_submitted'
  | 'final_approved'
  | 'admin_action'
  | 'checkin'
  | 'status_change'
  | 'assignment_accepted'
  | 'assignment_declined'
  | 'raw_footage_uploaded'
  | 'change_order_created'
  | 'change_order_responded'
  | 'refund_requested'
  | 'refund_processed'
  | 'payout_initiated'
  | 'payout_completed';

export interface ActivityLogEntry {
  id: string;
  projectId: string;
  userId: string | null;
  eventType: ActivityEventType;
  eventData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage (V1: localStorage mock)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'artsy_activity_log';

function getStoredLog(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function appendToLog(entry: ActivityLogEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const log = getStoredLog();
    log.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    console.error('Failed to write to activity log');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Logging Function
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log an activity event. This is append-only — entries cannot be modified or deleted.
 */
export function logActivity(
  projectId: string,
  userId: string | null,
  eventType: ActivityEventType,
  eventData?: Record<string, unknown>
): ActivityLogEntry {
  const entry: ActivityLogEntry = {
    id: generateId(),
    projectId,
    userId,
    eventType,
    eventData,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    createdAt: new Date().toISOString(),
  };

  appendToLog(entry);
  return entry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Logging Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Log when a creator downloads raw footage */
export function logFootageDownload(
  projectId: string,
  userId: string,
  metadata?: { fileCount?: number; totalSizeMb?: number; driveFileIds?: string[] }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'footage_download', metadata);
}

/** Log when a project officially starts */
export function logProjectStart(
  projectId: string,
  userId: string
): ActivityLogEntry {
  return logActivity(projectId, userId, 'project_started');
}

/** Log a progress milestone (e.g., 25%, 50%, 75%) */
export function logProgressMilestone(
  projectId: string,
  userId: string,
  milestone: { percentage: number; description: string }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'progress_milestone', milestone);
}

/** Log a draft submission by creator */
export function logDraftSubmission(
  projectId: string,
  userId: string,
  draftInfo: { draftUrl?: string; version: number; notes?: string }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'draft_submitted', draftInfo);
}

/** Log a project status change */
export function logStatusChange(
  projectId: string,
  userId: string | null,
  statusInfo: { oldStatus: string; newStatus: string; reason?: string }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'status_change', statusInfo);
}

/** Log a daily check-in from a creator */
export function logCheckin(
  projectId: string,
  userId: string,
  checkinData: { status: string; hoursWorked?: number; notes?: string }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'checkin', checkinData);
}

/** Log an admin action */
export function logAdminAction(
  projectId: string,
  adminUserId: string,
  action: { type: string; description: string; metadata?: Record<string, unknown> }
): ActivityLogEntry {
  return logActivity(projectId, adminUserId, 'admin_action', action);
}

/** Log when raw footage is uploaded by client */
export function logRawFootageUploaded(
  projectId: string,
  userId: string,
  uploadData: { fileCount?: number; totalSizeMb?: number }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'raw_footage_uploaded', uploadData);
}

/** Log a revision request from client */
export function logRevisionRequested(
  projectId: string,
  userId: string,
  revisionData: { round: number; commentCount: number }
): ActivityLogEntry {
  return logActivity(projectId, userId, 'revision_requested', revisionData);
}

/** Log a revision request from client with round number and notes */
export function logRevisionRequest(
  projectId: string,
  userId: string,
  round: number,
  notes?: string
): ActivityLogEntry {
  return logActivity(projectId, userId, 'revision_requested', { round, notes });
}

/** Log a refund dispute / request from client */
export function logRefundRequest(
  projectId: string,
  userId: string,
  requestedAmountPaise: number,
  reason: string
): ActivityLogEntry {
  return logActivity(projectId, userId, 'refund_requested', { requestedAmountPaise, reason });
}

/** Log final approval by client */
export function logFinalApproval(
  projectId: string,
  userId: string
): ActivityLogEntry {
  return logActivity(projectId, userId, 'final_approved');
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Helpers (for refund evidence)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all activity log entries for a project.
 */
export function getProjectActivityLog(projectId: string): ActivityLogEntry[] {
  return getStoredLog().filter(e => e.projectId === projectId);
}

/**
 * Check if any work-started events exist for a project.
 * Used by the refund engine to determine refund tier.
 */
export function hasWorkStartedEvidence(projectId: string): boolean {
  const WORK_EVENTS: ActivityEventType[] = [
    'footage_download',
    'footage_import_confirmed',
    'project_started',
    'timeline_created',
  ];
  return getStoredLog().some(
    e => e.projectId === projectId && WORK_EVENTS.includes(e.eventType)
  );
}

/**
 * Check if substantial progress events exist for a project.
 */
export function hasSubstantialProgressEvidence(projectId: string): boolean {
  const PROGRESS_EVENTS: ActivityEventType[] = [
    'progress_milestone',
    'draft_submitted',
    'qa_review',
  ];
  return getStoredLog().some(
    e => e.projectId === projectId && PROGRESS_EVENTS.includes(e.eventType)
  );
}

/**
 * Get activity summary for admin dashboard.
 */
export function getProjectActivitySummary(projectId: string): {
  totalEvents: number;
  lastActivity: string | null;
  hasWorkStarted: boolean;
  hasSubstantialProgress: boolean;
  checkinsCount: number;
  revisionsCount: number;
} {
  const entries = getProjectActivityLog(projectId);
  return {
    totalEvents: entries.length,
    lastActivity: entries.length > 0 ? entries[entries.length - 1].createdAt : null,
    hasWorkStarted: hasWorkStartedEvidence(projectId),
    hasSubstantialProgress: hasSubstantialProgressEvidence(projectId),
    checkinsCount: entries.filter(e => e.eventType === 'checkin').length,
    revisionsCount: entries.filter(e => e.eventType === 'revision_requested').length,
  };
}
