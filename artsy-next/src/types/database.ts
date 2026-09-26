// =============================================================================
// ARTSY PRODUCTION — DATABASE TYPES (V2.0 LOCKED)
// =============================================================================
// Source: Artsy Production — Master Plan (Reviewed & Finalized).md
// Note: All monetary fields are in integer paise (100 paise = 1 INR).

export type UserRole = 'client' | 'freelancer' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'banned';

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  consent_given_at: string | null;
  consent_version: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatorApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface CreatorProfile {
  id: string;
  bio: string | null;
  skills: string[];
  software: string[];
  experience_years: number;
  languages: string[];
  portfolio_url: string | null;
  sample_links: string[];
  approval_status: CreatorApprovalStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_suspended: boolean;
  suspended_reason: string | null;
  suspended_at: string | null;
  total_projects_completed: number;
  active_projects_count: number;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  pan_number: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = 'wedding' | 'brand' | 'corporate' | 'personal';

export interface Service {
  id: string;
  category: ServiceCategory;
  sub_category: string;
  name: string;
  description: string | null;
  duration_label: string | null;
  base_price: number; // in paise
  standard_delivery_days: number;
  rush_4_5d_fee: number; // in paise
  rush_48h_fee: number; // in paise
  deliverables: string[];
  requirements_schema: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type PricingRuleType =
  | 'extra_camera'
  | 'rush_delivery_4_5d'
  | 'rush_delivery_48h'
  | 'output_4k'
  | 'raw_4k'
  | 'extra_footage'
  | 'retention_extension_30d'
  | 'retention_extension_90d'
  | 'extra_revision_round';

export interface PricingRule {
  id: string;
  service_id: string;
  rule_type: PricingRuleType;
  name: string;
  description: string | null;
  condition: Record<string, unknown>;
  price_paise: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'presented'
  | 'accepted'
  | 'expired'
  | 'rejected';

export interface Quote {
  id: string;
  client_id: string | null;
  service_id: string | null;
  requirements: Record<string, unknown>;
  base_price: number; // in paise
  add_ons: Array<{ type: string; label: string; price_paise: number }>;
  subtotal: number; // in paise
  gst_rate: number; // e.g. 0.1800
  gst_amount: number; // in paise
  gateway_fee_pct: number; // e.g. 0.0200
  gateway_fee: number; // in paise
  net_revenue: number; // in paise
  creator_share_pct: number; // e.g. 70.00
  creator_amount: number; // in paise
  artsy_share_pct: number; // e.g. 30.00
  artsy_amount: number; // in paise
  total_price: number; // in paise
  estimated_delivery_days: number | null;
  admin_reviewed: boolean;
  admin_id: string | null;
  admin_notes: string | null;
  valid_until: string;
  status: QuoteStatus;
  created_at: string;
}

// 14 Order Statuses
export type OrderStatus =
  | 'draft'
  | 'pending_price_approval'
  | 'quoted'
  | 'payment_pending'
  | 'payment_failed'
  | 'payment_processing'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'refund_initiated'
  | 'refunded'
  | 'disputed'
  | 'chargeback'
  | 'completed';

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  quote_id: string | null;
  service_id: string | null;
  status: OrderStatus;
  currency: string;
  gross_amount: number; // in paise
  gst_amount: number; // in paise
  gateway_fee: number; // in paise
  net_amount: number; // in paise
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  requirements_snapshot: Record<string, unknown>;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  gateway: string;
  gateway_payment_id: string;
  gateway_order_id: string | null;
  gateway_signature: string | null;
  payment_method: string | null;
  status: PaymentStatus;
  gateway_response: Record<string, unknown> | null;
  captured_at: string | null;
  created_at: string;
}

// 32 Project Statuses
export type ProjectStatus =
  | 'draft'
  | 'quoted'
  | 'pending_price_approval'
  | 'payment_pending'
  | 'payment_failed'
  | 'paid'
  | 'awaiting_upload'
  | 'upload_processing'
  | 'upload_complete'
  | 'pending_assignment'
  | 'creator_proposed'
  | 'creator_assigned'
  | 'in_progress'
  | 'escalated'
  | 'reassignment_needed'
  | 'submitted'
  | 'qa_review'
  | 'revision_needed'
  | 'client_review'
  | 'client_revision_requested'
  | 'change_order_needed'
  | 'auto_approved'
  | 'approved'
  | 'final_delivery'
  | 'completed'
  | 'retention_active'
  | 'archived'
  | 'cancelled'
  | 'refunded'
  | 'disputed'
  | 'stale'
  | 'on_hold';

export interface Project {
  id: string;
  project_number: string;
  order_id: string;
  client_id: string;
  assigned_creator_id: string | null;
  title: string;
  status: ProjectStatus;
  priority: number;
  current_revision_round: number;
  max_free_revisions: number;
  internal_deadline: string | null;
  client_deadline: string | null;
  raw_footage_b2_prefix: string | null;
  raw_footage_total_bytes: number;
  bunny_stream_video_id: string | null;
  final_download_url: string | null;
  retention_raw_delete_at: string | null;
  retention_final_delete_at: string | null;
  raw_soft_deleted_at: string | null;
  raw_hard_deleted_at: string | null;
  final_soft_deleted_at: string | null;
  final_hard_deleted_at: string | null;
  auto_approve_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus =
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'timeout'
  | 'reassigned'
  | 'cancelled';

export interface Assignment {
  id: string;
  project_id: string;
  creator_id: string;
  status: AssignmentStatus;
  offered_at: string;
  expires_at: string; // 24 hours from offered_at
  responded_at: string | null;
  decline_reason: string | null;
  created_at: string;
}

export interface AccessGrant {
  id: string;
  project_id: string;
  user_id: string;
  access_type: 'raw_upload' | 'raw_download' | 'final_download';
  b2_key_id: string | null;
  token_hash: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface Revision {
  id: string;
  project_id: string;
  round_number: number;
  author_id: string;
  timecode_seconds: number | null;
  comment: string;
  status: 'requested' | 'in_progress' | 'addressed' | 'rejected';
  created_at: string;
}

export type ChangeOrderType =
  | 'extra_revision'
  | 'additional_format'
  | 'extra_footage'
  | 'creative_redirect'
  | 'rush_upgrade';

export type ChangeOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'paid';

export interface ChangeOrder {
  id: string;
  project_id: string;
  order_id: string;
  change_type: ChangeOrderType;
  description: string;
  additional_price: number; // in paise
  gst_amount: number; // in paise
  total_price: number; // in paise
  status: ChangeOrderStatus;
  expires_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
}

export type PayoutStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CreatorPayout {
  id: string;
  project_id: string;
  creator_id: string;
  gross_amount: number; // in paise
  tds_rate: number; // default 0.0200 (2% Section 194J-Tech)
  tds_amount: number; // in paise
  net_payout: number; // in paise
  status: PayoutStatus;
  neft_utr_reference: string | null;
  approved_by: string | null;
  approved_at: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface RefundEntry {
  id: string;
  order_id: string;
  amount: number; // in paise
  reason: string;
  razorpay_refund_id: string | null;
  status: 'initiated' | 'processed' | 'failed';
  initiated_by: string | null;
  credit_note_number: string | null;
  credit_note_url: string | null;
  processed_at: string | null;
  created_at: string;
}

export type FinancialEventType =
  | 'client_payment'
  | 'gateway_fee'
  | 'gst_liability'
  | 'creator_payable'
  | 'tds_withheld'
  | 'creator_payout'
  | 'payout_failed'
  | 'client_refund'
  | 'refund_gateway_recovery'
  | 'change_order_payment';

export interface FinancialEvent {
  id: string;
  order_id: string | null;
  project_id: string | null;
  event_type: FinancialEventType;
  amount: number; // in paise
  currency: string;
  reference_id: string | null;
  reference_table: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  gateway: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed_at: string | null;
  status: 'pending' | 'processed' | 'failed' | 'ignored';
  error_message: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  event_number: number | null; // 1 to 44
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationDeliveryLog {
  id: string;
  notification_id: string | null;
  channel: 'whatsapp' | 'sms' | 'email' | 'in_app';
  recipient: string;
  event_number: number | null;
  provider_message_id: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  retry_count: number;
  delivered_at: string | null;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_version: string;
  consent_type: string;
  ip_address: string | null;
  user_agent: string | null;
  granted_at: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  status: 'requested' | 'otp_verified' | 'approved' | 'anonymized' | 'rejected';
  reason: string | null;
  otp_verified_at: string | null;
  anonymized_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AIDecisionLog {
  id: string;
  feature_name: 'pricing_quote' | 'creator_matching' | 'qa_check' | 'revision_tagging';
  order_id: string | null;
  project_id: string | null;
  input_payload: Record<string, unknown>;
  recommended_output: Record<string, unknown>;
  confidence_score: number | null;
  actual_admin_action: Record<string, unknown> | null;
  was_overridden: boolean;
  created_at: string;
}

export interface FileRecord {
  id: string;
  project_id: string;
  file_type: 'raw_footage' | 'proxy' | 'preview_hls' | 'final_master' | 'invoice_pdf' | 'credit_note_pdf';
  storage_provider: 'b2' | 'bunny' | 'supabase';
  b2_key: string | null;
  bunny_video_id: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string | null;
  sha256_hash: string | null;
  retention_delete_at: string | null;
  is_soft_deleted: boolean;
  is_hard_deleted: boolean;
  created_at: string;
}

export interface PlatformConfig {
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: ServiceCategory | 'other';
  message: string | null;
  project_budget: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
