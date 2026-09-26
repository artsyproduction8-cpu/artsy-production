# Artsy Production — Master Plan v2.2 (Post-Audit Implementation & Fix-Hardened)

> **Document Version**: 2.2 (Post-Audit Implementation & Critical Fixes Hardened)
> **Last Updated**: 2026-09-26
> **Status**: All 8 critical launch blockers resolved and self-verified.
> **Supersedes**: Master Plan v2.1, Deep Audit Parts 1–27
> **Next Action**: Staging Deployment & End-to-End User Testing

---

## 📌 How to Use This Document

This is the **single source of truth** for Artsy Production. It incorporates all decisions from the Deep Audit (Parts 1–27), the Master Plan v2.0, and the **latest Deep Audit Report** (2026-09-26).

- **For developers**: Sections 5–12 define schema, architecture, workflows.
- **For business/legal**: Sections 1–4 define model, pricing, compliance.
- **For operations**: Sections 13–17 define SOPs, notifications, workflows.
- **For finance**: Sections 3, 4, and 16 define money flow.

---

## 1. Business Model & Identity

### 1.1 What Artsy Is

**Artsy Production is a managed creative services platform** connecting clients (wedding couples, brands, corporates, individuals) with a curated pool of freelance video editors. Artsy controls pricing, assignment, QA, delivery, and payment.

| Dimension | Artsy's Position |
|:---|:---|
| Who contracts with client? | **Artsy** |
| Who is responsible for quality? | **Artsy** (admin QA) |
| Who handles disputes? | **Artsy** |
| Who assigns work? | **Artsy** (manual V1, matching V2+) |
| Client-creator communication | **None** (anonymized job cards) |
| Merchant of record | **Artsy** (chargeback liability) |
| Data Fiduciary (DPDP) | **Artsy** |

> **Important**: The word "marketplace" is retired from all legal, tax, and internal documents.

### 1.2 Corporate Structure

| Item | Decision |
|:---|:---|
| **Current entity** | Sole Proprietorship (register immediately) |
| **Target entity** | **Private Limited (Pvt Ltd)** — incorporate before commercial launch |
| **Interim operation** | Operate as if Pvt Ltd (separate books, proper contracts, no personal mixing) |
| **Liability protection** | Personal assets currently exposed — migrate to Pvt Ltd ASAP |

### 1.3 Admin Structure

| Item | Decision |
|:---|:---|
| **Primary admin** | Karan |
| **Secondary admin** | To be trained (QA Lead) |
| **Admin addition** | Only Karan can add/remove admins |
| **Admin auth** | WhatsApp OTP + Google Authenticator + SMS fallback + backup codes |
| **RBAC** | Role-based access control for future staff |

---

## 2. Service Catalog & Pricing

### 2.1 Categories

1. **Wedding**
2. **Brand**
3. **Corporate**
4. **Personal / Other**

### 2.2 Wedding Services

| Sub-Category | Duration | Base Price (Single Cam) | Delivery | Rush (4-5 days) |
|:---|:---|:---|:---|:---|
| Highlight + Teaser | 3-5 min + 45-60 sec | ₹5,000 | 7-10 working days | +₹2,000 |
| Highlight | 3-5 min | ₹4,000 | 7-10 working days | +₹2,000 |
| Teaser | 45-60 sec | ₹2,000 | 7-10 working days | +₹2,000 |
| Highlight + Teaser + Reel | 3-5 min + 45-60 sec + 30-60 sec | ₹8,000 | 7-10 working days | +₹2,000 |
| Reel | 30-60 sec | ₹1,500 | 7-10 working days | +₹2,000 |
| Cinematic Story | 10-15 min | ₹8,000 | 7-10 working days | +₹2,000 |
| Cinematic Story + Teaser + Reel | 10-15 min + 45-60 sec + 30-60 sec | ₹10,000 | 7-10 working days | +₹2,000 |

**Wedding Add-ons:**
- Additional camera: **+₹800 per camera**
- Rush delivery (4-5 days): **+₹2,000**
- Drone footage: **Client-provided only, no extra charge**

### 2.3 Brand Services

| Sub-Category | Duration | Base Price (Single Cam) | Delivery | Rush (4-5 days) | Rush (48h) |
|:---|:---|:---|:---|:---|:---|
| Product Video | Max 2 min | ₹3,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Brand Video | Max 2 min | ₹3,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Fashion/Apparel Video | Max 2 min | ₹3,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Ad Film | Max 2 min | ₹10,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Explainer Video | Max 2 min | ₹8,000 | 7-10 working days | +₹1,000 | +₹2,000 |

**Brand Add-ons:**
- Additional camera: **+₹500 per camera**
- 4K output: **+₹500**
- 4K raw footage: **+₹500**
- Rush delivery (4-5 days): **+₹1,000**
- Rush delivery (48 hours): **+₹2,000**

### 2.4 Corporate Services

| Sub-Category | Base Price (Single Cam) | Delivery | Rush (4-5 days) | Rush (48h) |
|:---|:---|:---|:---|:---|
| Event Highlight | ₹12,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Corporate Film | ₹15,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Testimonial | ₹10,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Training Video | ₹8,000 | 7-10 working days | +₹1,000 | +₹2,000 |

**Corporate Add-ons:**
- Additional camera: **+₹500 per camera**
- 4K output: **+₹500**
- 4K raw footage: **+₹500**
- Rush delivery (4-5 days): **+₹1,000**
- Rush delivery (48 hours): **+₹2,000**

### 2.5 Personal / Other Services

| Sub-Category | Duration | Base Price (Single Cam) | Delivery | Rush (4-5 days) | Rush (48h) |
|:---|:---|:---|:---|:---|:---|
| Birthday Highlight | 3-5 min | ₹3,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Birthday Highlight + Teaser | 3-5 min + 45-60 sec | ₹4,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Birthday Highlight + Teaser + Reel | 3-5 min + 45-60 sec + 30-60 sec | ₹5,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Birthday Teaser | 45-60 sec | ₹1,500 | 7-10 working days | +₹1,000 | +₹2,000 |
| Birthday Reel | 30-60 sec | ₹1,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Engagement Highlight | 3-5 min | ₹3,500 | 7-10 working days | +₹1,000 | +₹2,000 |
| Engagement Highlight + Teaser | 3-5 min + 45-60 sec | ₹4,500 | 7-10 working days | +₹1,000 | +₹2,000 |
| Engagement Highlight + Teaser + Reel | 3-5 min + 45-60 sec + 30-60 sec | ₹5,500 | 7-10 working days | +₹1,000 | +₹2,000 |
| Engagement Teaser | 45-60 sec | ₹1,500 | 7-10 working days | +₹1,000 | +₹2,000 |
| Engagement Reel | 30-60 sec | ₹1,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Baby Shower Highlight | 3-5 min | ₹3,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Baby Shower Highlight + Teaser + Reel | 3-5 min + 45-60 sec + 30-60 sec | ₹5,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Baby Shower Highlight + Teaser | 3-5 min + 45-60 sec | ₹4,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Baby Shower Reel | 30-60 sec | ₹1,000 | 7-10 working days | +₹1,000 | +₹2,000 |
| Baby Shower Teaser | 45-60 sec | ₹1,500 | 7-10 working days | +₹1,000 | +₹2,000 |
| Memorial | Same as Baby Shower | Same | 7-10 working days | +₹1,000 | +₹2,000 |
| Maternity | Reel only | ₹1,000 | 7-10 working days | +₹1,000 | +₹2,000 |

**Personal Add-ons:**
- Additional camera: **+₹800 per camera**
- Rush delivery (4-5 days): **+₹1,000**
- Rush delivery (48 hours): **+₹2,000**

### 2.6 Change Order Pricing

| Change Type | Price |
|:---|:---|
| Extra revision round (beyond 1 free) | 10% of total project cost |
| Additional output format | 60% of total project cost + ₹100/10GB |
| Extra raw footage processing | ₹100 per 10 GB |
| Creative redirect | 50-75% of original project cost (admin discretion) |
| Rush upgrade | As per category rush fees above |

**Freelancer share**: 70% of whatever client pays (after GST and gateway fees)

### 2.7 Retention Extension Pricing

| Extension | Price |
|:---|:---|
| +30 days | ₹999–1,499 |
| +90 days | ₹2,499–2,999 |

**Cost to Artsy**: ~₹287/month for 300GB on B2

### 2.8 Quote Validity

All quotes valid for **7 days**.

### 2.9 Minimum Order Value

**No minimum order value** (client decision). Sub-₹2,500 orders accepted with the understanding that admin QA cost may exceed margin on some orders.

---

## 3. Financial Model

### 3.1 Revenue Split & Infrastructure Deduction (Intentional Decision)

**70% freelancer / 30% Artsy** of split-eligible net revenue after deducting fixed per-project infrastructure costs.

**Calculation base**:
- **Pre-Split Net Revenue** = Client Payment (Gross) − Embedded GST (18%) − Gateway Deduction (2% + 18% GST on fee)
- **Infrastructure Allocation**: **₹115.00 (11,500 paise)** fixed allocation per project deducted before split to fund raw B2 cloud storage, Bunny Stream video transcode/CDN bandwidth, and compute.
- **Available for 70/30 Split**: `Pre-Split Net Revenue − ₹115.00`
- **Freelancer Share**: `70% × (Pre-Split Net Revenue − ₹115.00)`
- **Artsy Retained Share**: `30% × (Pre-Split Net Revenue − ₹115.00) + ₹115.00 (Infrastructure Cost Recovery)`

### 3.2 Money Storage

All monetary values stored as **INTEGER in paise** (1 rupee = 100 paise).

### 3.3 TDS (Updated — Audit Issue #2)

| Item | Decision |
|:---|:---|
| **Default section** | **194J-Tech (2%)** |
| **Configurable** | Yes — `platform_config` supports 1%, 2%, 10% |
| **Section 194C (1%)** | Available as fallback if CA confirms |
| **Section 194J-Prof (10%)** | Available as conservative option |
| **CA confirmation** | Pending written opinion |

**TDS rate without PAN**: 20%

### 3.4 Example: ₹8,000 Order (with Intentional ₹115 Infra Deduction & 194J-Tech 2%)

| Step | Line Item | Amount (₹) | Amount (Paise) | Notes |
|:---|:---|:---|:---|:---|
| 1 | Client pays (Gross) | ₹8,000.00 | 800,000 | All-inclusive booking amount |
| 2 | GST payable (18% embedded) | −₹1,220.34 | −122,034 | Rule 46 Tax Invoice liability |
| 3 | Razorpay fee (2% + 18% GST) | −₹188.80 | −18,880 | Gateway processing cost |
| 4 | Pre-Split Net Revenue | ₹6,590.86 | 659,086 | Net collected by platform |
| 5 | **Platform Infrastructure Allocation** | **−₹115.00** | **−11,500** | Fixed B2 storage & CDN reserve |
| 6 | **Available for 70/30 Split** | **₹6,475.86** | **647,586** | Split-eligible pool |
| 7 | Freelancer Gross Share (70%) | ₹4,533.10 | 453,310 | 70% of split pool |
| 8 | TDS deduction (2% under 194J-Tech) | −₹90.66 | −9,066 | Statutory tax withheld |
| 9 | **Net Freelancer Payout** | **₹4,442.44** | **444,244** | Released via NEFT batch |
| 10 | Artsy Commercial Share (30%) | ₹1,942.76 | 194,276 | 30% of split pool |
| 11 | **Total Artsy Retained (30% + ₹115 Infra)** | **₹2,057.76** | **205,776** | Retained platform cashflow |

### 3.5 GST

- **18%** embedded in displayed price
- SAC code: **999613** (post-production services)
- Invoice must show: CGST + SGST (intra-state) or IGST (inter-state)
- Place of supply determines CGST/SGST vs IGST
- **Inter-state GST registration mandatory from Day 1** (Audit Issue #11) — no ₹20L threshold exemption for e-commerce service providers under Section 24(x)

### 3.6 Freelancer Payout Timing

Within **7 days** after client approves final video.

### 3.7 Cancellation Policy (Updated — Audit Issue #5)

**Graduated forfeiture structure to comply with Section 74 of Indian Contract Act:**

| Stage | Artsy Retains | Client Receives | Freelancer Payout |
|:---|:---|:---|:---|
| Before freelancer assigned | Gateway fee only | 100% minus gateway fee | ₹0 |
| After assignment, before work starts | Gateway fee + 10% admin fee | 90% minus gateway fee | ₹0 |
| **During work — ingestion/sync started** | **50%** | **50%** | 70% of retained amount |
| **During work — rough cut in-flight** | **70%** | **30%** | 70% of retained amount |
| **During work — draft submitted** | **100%** | **0%** | 70% of retained amount |
| After final delivery | 0% refund | Nothing (dispute resolution only) | Full payout |

**GST handling**: Credit note issued for refunded amount. GST paid on retained fee.

**Freelancer compensation**: Creator receives 70% of net retained funds for work completed.

### 3.8 Refund Policy

- Full refund minus gateway fee if cancelled before assignment
- Partial refund per graduated cancellation policy
- No refund after delivery
- Disputes handled by admin mediation

### 3.9 Payment Reconciliation

- Automated cron job every **15 minutes**
- Fetches recent Razorpay payments
- Creates missing orders if webhook failed
- Notifies admin of discrepancies

### 3.10 Refund Mechanism (Audit Issue #14)

- Use Razorpay API with `speed: 'normal'` for refunds
- Backed by gateway reserve funds
- Avoids negative balance on Razorpay gateway before T+2 settlement

---

## 4. Compliance & Legal

### 4.1 Business Registration

| Item | Status |
|:---|:---|
| Business entity | **Sole Proprietorship** (register immediately) |
| Target entity | **Private Limited (Pvt Ltd)** — incorporate before commercial launch |
| GST registration | **Apply immediately** (mandatory from Day 1 for inter-state) |
| TAN | Required for TDS |
| Razorpay merchant account | Apply after entity registration |
| Meta Business Account | Required for WhatsApp API |

### 4.2 TDS

- **Default: 194J-Tech (2%)** — configurable
- Pending CA written confirmation
- System supports 194C (1%), 194J-Tech (2%), 194J-Prof (10%)
- PAN required from freelancers
- TDS rate without PAN: 20%

### 4.3 GST

- **18%** for SAC 999613
- Embedded in displayed price
- Invoice must include all 13 statutory fields (Rule 46)
- **Automated GSTR-1 JSON export** required (Audit Missing Requirement)
- **Statutory Credit Note generation** for refunds (Section 34)

### 4.4 DPDP Compliance (Updated — Audit Issue #3)

| Requirement | Implementation |
|:---|:---|
| Privacy Policy | Draft before launch (deferred) |
| Consent collection | At registration (checkbox + timestamp + IP + version) |
| Right to Access | Data export API + secure download link |
| Right to Correction | Profile editing |
| Right to Erasure | **Redact active tables; preserve encrypted invoice PDFs** |
| Grievance Officer | Designate + publish at `/grievance` |
| Breach Notification | Incident response plan (draft before launch) |
| Data Processing Agreement | With Supabase, Razorpay, Bunny, B2 (verify) |

**Dual-State Retention (Audit Fix):**

```
Users Table: PII scrubbed (Name -> 'Anonymized User', Phone -> '0000000000')
Invoices Table: Encrypted PDF preserved in immutable cold archive for 72 months
               (GST Section 36 compliance)
```

### 4.5 Legal Agreements (Deferred — Launch Blocker)

| Document | Status |
|:---|:---|
| Terms of Service (client-facing) | Draft before launch |
| Freelancer Agreement/MSA/NDA | Draft before launch |
| Privacy Policy | Draft before launch |
| Cancellation & Refund Policy | Draft before launch |
| Cookie Policy | Draft before launch |
| Copyright Assignment Agreement | Draft before launch |

**Critical**: Without written assignment, IP remains with freelancer under Section 19 of Indian Copyright Act.

---

## 5. Technical Architecture

### 5.1 Stack

| Component | Technology |
|:---|:---|
| Frontend | Next.js (App Router) |
| Backend | Supabase (Postgres + Auth + Storage) |
| Payments | Razorpay |
| Video streaming | Bunny Stream |
| Raw storage | Backblaze B2 + Cloudflare CDN |
| Hosting | Vercel |
| Staging | Separate Supabase project |
| CI/CD | GitHub Actions + Vercel |
| Rate limiting | Vercel Edge Middleware + Upstash Redis |
| Error monitoring | Sentry |
| Uptime monitoring | Better Uptime |
| Email | Resend |
| PDF generation | @react-pdf/renderer |
| Background jobs | Vercel Cron |
| Upload validation | ffprobe.wasm (client) + Cloudflare Workers (server) |

### 5.2 Storage Architecture

| Asset | Provider | Role |
|:---|:---|:---|
| Raw footage | Backblaze B2 | Upload, freelancer download |
| Final video (download) | Backblaze B2 | Client download |
| Final video (streaming) | Bunny Stream | HLS playback |
| CDN | Cloudflare | Free egress for B2 |
| Invoices/PDFs | **Immutable invoice vault** | Statutory retention (72 months) |

**Upload flow**: Client browser → presigned URL → B2 (direct upload)
**Validation flow**: Client-side ffprobe.wasm → Cloudflare Worker header check → B2
**Download flow**: Client → Cloudflare CDN → B2 (free egress)
**Streaming flow**: Client → Bunny Stream (HLS)

### 5.3 Authentication (Updated — Audit Issue #6)

| User Type | Method |
|:---|:---|
| Client | WhatsApp OTP + **SMS fallback** + Email OTP fallback + Email (required) |
| Freelancer | WhatsApp OTP + **SMS fallback** + Email OTP fallback + Email (required) |
| Admin | WhatsApp OTP + Google Authenticator + SMS fallback + backup codes |

**OTP Fallback Chain:**
1. **Primary**: WhatsApp (Meta WhatsApp Cloud API v19.0+ with official HSM templates)
2. **Fallback 1**: SMS via MSG91 Flow API
3. **Fallback 2**: Email via Resend

### 5.4 WhatsApp Integration (Decision-Locked: Meta Cloud API)

| Property | Decision Specification |
|:---|:---|
| **Official Engine** | **Meta WhatsApp Cloud API v19.0+** (Graph API) |
| **Baileys Status** | **Retired**. Not used. |
| **Templates** | 44 Registered HSM Templates (Authentication & Utility) |
| **Outbound Policy** | Business-initiated messages use pre-approved templates per Meta anti-spam regulations |
| **Dev / Staging Mode** | Simulated console logging when `MOCK_WHATSAPP=true` or unconfigured |

### 5.5 Database Schema (30 Canonical Tables)

The production database comprises **30 tables** with Row Level Security (RLS) enabled across 100% of the catalog:
- **Core Master Tables (19)**: `users`, `creator_profiles`, `services`, `pricing_rules`, `orders`, `projects`, `assignments`, `revisions`, `review_comments`, `file_records`, `b2_storage_nodes`, `video_deliverables`, `change_orders`, `creator_payouts`, `disputes`, `webhook_events`, `notifications`, `notification_delivery_log`, `consent_records`.
- **Statutory & Audit WORM Tables (7)**: `financial_events` (WORM), `audit_logs` (WORM), `consent_records` (WORM), `ai_decision_log` (WORM), `quotes` (WORM on acceptance), `invoice_records` (WORM), `credit_notes` (WORM), `payments` (WORM via Migration 004).
- **Platform Auxiliary Tables (4)**: `platform_config`, `leads`, `client_feedback`, `project_milestones`, `system_health_metrics`.

| Table | Purpose |
|:---|:---|
| `users` | Client, admin, freelancer accounts (phone + email, both NOT NULL) |
| `creator_profiles` | Freelancer details, skills, PAN, bank info (encrypted) |
| `services` | Service catalog (4 categories) |
| `pricing_rules` | Structured pricing rules (not JSONB) |
| `orders` | Financial transaction records |
| `projects` | Operational workflow records |
| `assignments` | Freelancer assignment tracking |
| `access_grants` | B2 access tracking with expiry |
| `creator_payouts` | Payout records with TDS tracking |
| `refund_entries` | Compensating ledger entries for refunds |
| `notifications` | In-app notification records |
| `notification_delivery_log` | WhatsApp/SMS delivery status |
| `consent_records` | DPDP consent tracking |
| `data_deletion_requests` | DPDP erasure workflow |
| `audit_logs` | Admin action audit trail (partitioned monthly) |
| `ai_decision_log` | AI recommendation tracking |
| `file_records` | File metadata tracking |
| `platform_config` | Admin-editable settings |
| `revisions` | Timestamped client comments |

**New tables (Audit additions):**
| Table | Purpose |
|:---|:---|
| `webhook_events` | Idempotency for Razorpay webhooks |
| `financial_events` | Immutable ledger |
| `quotes` | Immutable pricing snapshots |
| `change_orders` | Scope creep tracking |
| `change_order_payout_adjustments` | Freelancer share for change orders |
| `invoice_records` | Immutable GST invoice vault |
| `credit_notes` | Statutory credit notes for refunds |

### 5.6 Immutable Tables

| Table | Why |
|:---|:---|
| `financial_events` | Financial audit trail |
| `payments` | Financial audit trail |
| `quotes` | Price verification |
| `audit_logs` | Security compliance |
| `consent_records` | DPDP compliance |
| `ai_decision_log` | AI audit trail |
| `invoice_records` | Statutory GST retention |
| `credit_notes` | Statutory GST retention |

**RLS**: No UPDATE or DELETE, even for admin. Corrections are new rows.

### 5.7 Encryption at Rest

| Data | Method |
|:---|:---|
| PAN | Supabase Vault or AES-256 |
| Bank details | Separate encrypted columns |
| OTP codes | Hashed (bcrypt), never plaintext |
| Razorpay webhook payloads | Encrypted at rest |

### 5.8 Webhook Idempotency

**Table**: `webhook_events` with `UNIQUE(gateway, event_id)`
**Logic**: Insert event → if success, process; if duplicate, ignore and return 200 OK.
**Replay protection**: Verify timestamp within 5 minutes.

### 5.9 Rate Limiting

| Endpoint | Limit |
|:---|:---|
| OTP request | 5 per phone per 10 minutes (keyed by phone_hash + IP) |
| OTP verification | 10 attempts per phone per hour |
| Login | 10 attempts per IP per hour |
| Payment initiation | 5 per user per hour |
| API (general) | 100 requests per minute per user |
| File upload | 10 uploads per user per hour |
| Admin actions | 50 requests per minute per admin |

### 5.10 Upload Validation (Updated — Audit Issue #4)

**Free validation stack:**

| Layer | Method | Cost |
|:---|:---|:---|
| Client-side | ffprobe.wasm validates first 10MB | Free |
| Server-side | Cloudflare Worker fetches header, validates codec | Free (100k req/day) |
| Integrity | B2 MD5 verification | Free |

**Logic**: Client-side validation blocks corrupt files before upload. Server-side Worker validates after B2 upload completes, before status advances to `upload_complete`.

### 5.11 Cloudflare Cache Purge (Audit Issue #12)

**Trigger**: Project cancellation, copyright claim, or content revocation
**Action**: API call to Cloudflare to purge specific URL from edge cache
**Cost**: Free (included in Cloudflare API)

### 5.12 Backup & Restore

| Asset | Method |
|:---|:---|
| Database | Supabase PITR, quarterly restore test |
| Final videos | B2 versioning |
| Code | GitHub |
| Config/secrets | Password manager |

### 5.13 CI/CD Pipeline

1. Push to feature branch → Vercel preview + GitHub Actions (tests, security scan)
2. Merge to `main` → Supabase migration + Vercel production deployment (manual approval)

### 5.14 Legacy Schema Handling (Audit Issue #10)

- Move `supabase_schema.sql` to `docs/archive/supabase_schema_legacy_v0.sql`
- Add header comment: `-- DEPRECATED: Superseded by 000_canonical_master_schema.sql`
- Keep `000_canonical_master_schema.sql` as single source of truth

---

## 6. Workflows

### 6.1 Client Happy Path

```
Visitor → Service Catalog → Requirement Wizard → Quote → Login → 
Checkout → Payment → Upload → Project Active → Draft Review → 
Revision → Approval → Final Delivery → Retention → Deletion
```

### 6.2 Project Status Machine (32 Statuses)

| # | Status |
|:---|:---|
| 1 | `draft` |
| 2 | `quoted` |
| 3 | `pending_price_approval` |
| 4 | `payment_pending` |
| 5 | `payment_failed` |
| 6 | `paid` |
| 7 | `awaiting_upload` |
| 8 | `upload_processing` |
| 9 | `upload_complete` |
| 10 | `pending_assignment` |
| 11 | `creator_proposed` |
| 12 | `creator_assigned` |
| 13 | `in_progress` |
| 14 | `escalated` |
| 15 | `reassignment_needed` |
| 16 | `submitted` |
| 17 | `qa_review` |
| 18 | `revision_needed` |
| 19 | `client_review` |
| 20 | `client_revision_requested` |
| 21 | `change_order_needed` |
| 22 | `auto_approved` |
| 23 | `approved` |
| 24 | `final_delivery` |
| 25 | `completed` |
| 26 | `retention_active` |
| 27 | `archived` |
| 28 | `cancelled` |
| 29 | `refunded` |
| 30 | `disputed` |
| 31 | `stale` |
| 32 | `on_hold` |

### 6.3 Order Status Machine (14 Statuses)

| # | Status |
|:---|:---|
| 1 | `draft` |
| 2 | `pending_price_approval` |
| 3 | `quoted` |
| 4 | `payment_pending` |
| 5 | `payment_failed` |
| 6 | `payment_processing` |
| 7 | `paid` |
| 8 | `partially_paid` |
| 9 | `cancelled` |
| 10 | `refund_initiated` |
| 11 | `refunded` |
| 12 | `disputed` |
| 13 | `chargeback` |
| 14 | `completed` |

### 6.4 Creator Lifecycle

```
Registered → Onboarding Incomplete → Pending Review → 
Approved → Eligible → Offered → Assigned → Working → 
Submitted → QA Pass → Client Review → Approved → Payout
```

**Exception states**: Suspended, Deactivated, Deleted, Reassigned

### 6.5 Retention & Deletion Flow (Updated — Audit Issue #1)

**CRITICAL FIX**: Retention clock triggers on `project.status = 'approved'`, NOT on `delivery`.

**Raw Footage:**
- Day 0: **Client approval**
- Day 7: Warning (7 days left)
- Day 12: Warning (3 days left)
- Day 14: Warning (1 day left)
- Day 15: Soft delete (move to trash/)
- Day 22: Hard delete (remove from B2)

**Final Video:**
- Day 0: **Client approval**
- Day 23: Warning (7 days left)
- Day 27: Warning (3 days left)
- Day 29: Warning (1 day left)
- Day 30: Soft delete
- Day 37: Hard delete

**Safety Rules:**
- Never delete during dispute
- Soft delete before hard delete
- Keep 480p watermarked proof-of-delivery copy for 1 year
- Retention extended by paid extension

### 6.6 Revision Policy

- **1 free revision round** (minor changes only)
- Comments within **48 hours** (max 7 days)
- Minor changes: trim, color tweak, audio sync, transition fix
- Major changes (scope creep): charged as change order
- Extra revision round: 10% of project cost
- Freelancer paid 70% of change order price

### 6.7 Client Approval Timeout

- **7-day auto-approve** if no response
- Reminders at day 3, 5, 6
- **NEW**: `is_auto_approve_blocked` flag — if client emails support outside platform, admin can block auto-approve (Audit Issue #17)

### 6.8 Freelancer Acceptance Timeout (Updated — Audit Issue #9)

| Order Type | Acceptance Window |
|:---|:---|
| Standard | 24 hours (reminder at 12h) |
| Rush (4-5 days) | **4 hours** (reminder at 2h) |
| Rush (48 hours) | **2 hours** (reminder at 1h) |

Auto-decline after timeout.

### 6.9 SLA

- **7-10 working days** standard
- Weekends/holidays paused
- Rush: 4-5 days (+₹1,000-2,000) or 48 hours (+₹2,000)
- SLA breach: 10% discount on next order or partial refund (admin discretion)
- **Timezone**: All SLA calculations use IST (UTC+05:30)
- **Holidays**: Centralized Indian Gazetted holidays in `platform_config`

### 6.10 Freelancer Suspension

| Offense | Action |
|:---|:---|
| First missed deadline | Warning |
| Second missed deadline | 7-14 day suspension |
| Third missed deadline | 30-day or permanent removal |
| NDA violation | Immediate permanent suspension |
| Reactivation | Appeal after 30 days, probation on return |

### 6.11 Dispute Resolution

- **Time limit**: 14 days from dispute opening
- Admin reviews, mediates, decides
- If unresolved, escalate to secondary admin
- All actions logged in `audit_logs`

### 6.12 Escalation Matrix (Audit Missing Requirement)

| Trigger | Escalation Path | SLA |
|:---|:---|:---|
| Check-in missed | Auto-notify admin → admin calls freelancer | 4 hours |
| Deadline risk (80% SLA) | Auto-notify admin → admin reassigns or extends | 24 hours |
| Dispute opened | Admin reviews → secondary admin if unresolved | 14 days |
| SLA breach | Admin notifies client → 10% discount or partial refund | Immediate |
| Payment failure | Auto-retry → admin notified if 3 failures | 1 hour |

---

## 7. Notifications (44 Events)

### 7.1 Event Matrix

| # | Event | Client | Creator | Admin | Channel |
|:---|:---|:---|:---|:---|:---|
| 1 | OTP sent | ✅ | ✅ | — | WhatsApp + SMS fallback + Email fallback |
| 2 | Profile submitted | — | ✅ | ✅ | WA + In-app |
| 3 | Profile approved | — | ✅ | — | WhatsApp |
| 4 | Profile rejected | — | ✅ | — | WhatsApp |
| 5 | Quote ready | ✅ | — | — | WA + In-app |
| 6 | Payment successful | ✅ | — | ✅ | WA + In-app |
| 7 | Payment failed | ✅ | — | — | WhatsApp |
| 8 | Upload reminder | ✅ | — | — | WhatsApp |
| 9 | Upload complete | ✅ | — | ✅ | In-app |
| 10 | Upload failed | ✅ | — | — | WA + In-app |
| 11 | Creator assigned | — | — | ✅ | In-app |
| 12 | Job offered | — | ✅ | — | WA + In-app |
| 13 | Creator accepted | — | — | ✅ | In-app |
| 14 | Creator declined | — | — | ✅ | In-app + WA |
| 15 | Acceptance timeout | — | — | ✅ | WA + In-app |
| 16 | Daily check-in | — | ✅ | — | WhatsApp |
| 17 | Check-in missed | — | — | ✅ | WA + In-app |
| 18 | Deadline risk | — | — | ✅ | WA + In-app |
| 19 | Deliverable submitted | — | — | ✅ | In-app |
| 20 | QA passed | ✅ | — | — | WA + In-app |
| 21 | QA failed | — | ✅ | — | WA + In-app |
| 22 | Revision requested | — | ✅ | ✅ | WA + In-app |
| 23 | Review reminder | ✅ | — | — | WhatsApp |
| 24 | Auto-approved | ✅ | ✅ | ✅ | WA + In-app |
| 25 | Project completed | ✅ | ✅ | ✅ | WhatsApp |
| 26 | Change order created | ✅ | — | — | WA + In-app |
| 27 | Change order accepted | — | ✅ | ✅ | In-app |
| 28 | Change order declined | — | — | ✅ | In-app |
| 29 | Payout eligible | — | ✅ | ✅ | In-app |
| 30 | Payout processed | — | ✅ | — | WhatsApp |
| 31 | Payout failed | — | ✅ | ✅ | WA + In-app |
| 32 | Refund initiated | ✅ | — | — | WhatsApp |
| 33 | Refund processed | ✅ | — | — | WhatsApp |
| 34 | Dispute opened | ✅ | ✅ | ✅ | WA + In-app |
| 35 | Raw deletion warning (7d) | ✅ | — | — | WhatsApp |
| 36 | Raw deletion warning (3d) | ✅ | — | — | WhatsApp |
| 37 | Raw deletion warning (1d) | ✅ | — | — | WhatsApp |
| 38 | Raw deleted | ✅ | — | — | WhatsApp |
| 39 | Final deletion warning (7d) | ✅ | — | — | WhatsApp |
| 40 | Final deletion warning (3d) | ✅ | — | — | WhatsApp |
| 41 | Final deleted | ✅ | — | — | WhatsApp |
| 42 | Creator suspended | — | ✅ | — | WhatsApp |
| 43 | Project cancelled | ✅ | ✅ | ✅ | WA + In-app |
| 44 | SLA breach | ✅ | — | ✅ | WA + In-app |

### 7.2 Channel Rules

- **Critical events** (payment, delivery, deletion): WhatsApp + In-app
- **Non-critical events**: In-app only
- **Formal documents** (invoices, receipts): Email
- **Retry**: 1 retry after 60 seconds for WhatsApp; then SMS fallback; then Email fallback
- **Escalation**: Admin alerted if 5+ notifications fail in an hour

### 7.3 WhatsApp Webhook Verification (Audit Issue #21)

- Verify HMAC signature on all WhatsApp webhooks
- Reject unsigned or invalid payloads

---

## 8. Admin Panel Requirements

### 8.1 V1 Admin Screens

| Category | Screen |
|:---|:---|
| Services | Service list, create/edit, pricing rules |
| Quotes | Quote approval queue |
| Orders | Orders list, order detail, payment history |
| Projects | Projects list, project detail, status change, reassign, hold/cancel |
| Creators | Creator list, approve/reject, suspend, workload view |
| Payouts | Pending payouts, approve/reject, manual NEFT entry, retry failed |
| Refunds | Initiate refund, refund history, credit note generation |
| Retention | Upcoming deletions, extend retention, manual delete |
| Notifications | Delivery status, resend failed |
| Settings | Platform config, GST/TDS rates, feature flags, holidays |
| Audit | Admin action history |
| Analytics | Revenue dashboard |
| GSTR-1 | Automated GST return export |
| Invoice Vault | Search, retrieve statutory invoices |

### 8.2 Admin RBAC (Audit Issue #13)

| Role | Permissions |
|:---|:---|
| **Super Admin** (Karan) | All access, add/remove admins |
| **QA Lead** | QA review, project management, creator management |
| **Finance Admin** | Payouts, refunds, invoice management |
| **Support Admin** | Client communication, dispute handling |

**Rule**: Only Super Admin can add/remove admins.

---

## 9. Security

### 9.1 Authentication

| Vulnerability | Mitigation |
|:---|:---|
| OTP brute force | Rate limiting (5/10 min), lock after 10 failures |
| OTP reuse | Single-use, expire after 5 minutes |
| Phone enumeration | Same response for all |
| Admin compromise | OTP + TOTP + SMS fallback + backup codes |
| Session fixation | Regenerate on login |
| **B2 Presigned URL Replay** (Audit Issue) | **TTL 15 minutes**, bind origin to domain |
| **Admin Panel Session Hijack** (Audit Issue) | WebAuthn (FIDO2) for admin routes |

### 9.2 Authorization

| Vulnerability | Mitigation |
|:---|:---|
| Role stored client-side | Server-verified on every request |
| IDOR | RLS policies on all tables |
| Creator self-approval | RLS `WITH CHECK` prevents self-update of `approval_status` |
| Creator modifies payout | No write access to `creator_payouts` |
| Admin actions unaudited | `audit_logs` for every admin action |

### 9.3 Payment Security

| Vulnerability | Mitigation |
|:---|:---|
| Webhook signature | HMAC SHA256 verification |
| Duplicate webhook | `webhook_events` UNIQUE constraint |
| Amount tampering | Server-side price recalculation |
| Razorpay secret | Never in frontend |
| Refund authorization | Admin role + reason + amount validation |

### 9.4 File Access Security

| Vulnerability | Mitigation |
|:---|:---|
| Public folder | No manual sharing, audit daily |
| Creator retains access | Cron revokes after expiry |
| Guessable URL | Signed URLs, token auth |
| Metadata leak | Strip EXIF + NLE scratch metadata from photos/videos |

### 9.5 API Security

| Vulnerability | Mitigation |
|:---|:---|
| No rate limiting | Vercel Edge + Upstash Redis |
| No input validation | Validate all inputs |
| No CORS | Strict origin policy |
| Secrets in repo | `.env.local` in `.gitignore` |
| No CSP | Add Content-Security-Policy headers |
| **WhatsApp webhook replay** | HMAC verification + timestamp check |

### 9.6 Data Security

| Vulnerability | Mitigation |
|:---|:---|
| PAN plaintext | Supabase Vault |
| Bank details plaintext | Encrypted columns |
| No backup | Supabase PITR, quarterly test |
| No encryption at rest | Supabase Pro default |
| **Audit log bloat** | Monthly Postgres range partitioning on `created_at` |

---

## 10. Data Privacy (DPDP)

### 10.1 Data Classification

| Data | Classification | Access |
|:---|:---|:---|
| Phone | Confidential | Self, Admin |
| Email | Confidential | Self, Admin |
| PAN | Highly Sensitive | Creator (masked), Admin (logged) |
| Bank details | Highly Sensitive | Creator (masked), Admin (logged) |
| Wedding footage | Highly Sensitive | Assigned Creator, Admin |
| Client requirements | Confidential | Admin, Assigned Creator |
| Payment info | Confidential | Razorpay, Admin |
| OTP codes | Highly Sensitive | System only |
| Audit logs | Internal | Admin only |
| Invoice records | Statutory | Admin (tax audit only) |

### 10.2 Data Subject Rights

| Right | Implementation |
|:---|:---|
| Access | Data export API, secure download link |
| Correction | Profile editing |
| Erasure | Deletion request workflow, **anonymize PII only** |
| Grievance | Designated officer at `/grievance` |
| Breach notification | Incident response plan |

### 10.3 Deletion Workflow (Updated — Audit Issue #3)

1. User submits request in-app
2. Admin notified
3. Admin verifies identity (OTP)
4. Admin runs anonymization script:
   - `users.full_name = 'Anonymized User'`
   - `users.phone = '0000000000'`
   - `users.email = NULL`
   - `users.deleted_at = NOW()`
5. **Invoice records preserved** in immutable vault (encrypted, 72 months)
6. User notified when complete
7. Logged in `data_deletion_requests`

---

## 11. Failure & Edge Cases

### 11.1 Critical Scenarios

| # | Scenario | Detection | Auto Action | Admin Action |
|:---|:---|:---|:---|:---|
| 1 | OTP not delivered | API error | SMS fallback → Email fallback | — |
| 2 | Duplicate OTP | Rate limiter | Block after 5 | — |
| 3 | OTP brute force | Failed count > 10 | Lock 1 hour | — |
| 4 | Payment succeeds, no webhook | Reconciliation cron | Create order | Verify |
| 5 | Chargeback | Razorpay webhook | Pause project, freeze deletion | Gather evidence |
| 6 | Duplicate payment | Two payments same order | Refund second | — |
| 7 | 500GB upload | Size check | Reject | — |
| 8 | Upload stops at 90% | Tracker | Allow resume | — |
| 9 | Duplicate file | Hash comparison | Skip | — |
| 10 | Corrupted file | ffprobe validation | Reject | — |
| 11 | Creator disappears | Missed check-in | Flag admin | Reassign |
| 12 | Creator downloads, suspended | Suspension | Revoke access | Legal notice |
| 13 | Wrong deliverable | QA review | QA fail | Return |
| 14 | Low quality | QA review | QA fail | Reassign |
| 15 | QA delayed | Deadline tracking | Alert admin | Prioritize |
| 16 | Creator late | Deadline comparison | Escalation | Contact |
| 17 | All creators busy | No matches | Alert admin | Wait/extend |
| 18 | B2 permission public | Daily audit | Revoke | Investigate |
| 19 | B2 outage | Health check | Show error | — |
| 20 | Razorpay outage | Health check | Show error | — |
| 21 | WhatsApp outage | Error rate | SMS fallback → Email fallback | — |
| 22 | Bunny outage | Health check | Show error | — |
| 23 | Supabase outage | Uptime monitor | Maintenance page | — |
| 24 | Extra revision | Count > limit | Block, change order | — |
| 25 | Revision = new direction | Admin assessment | Flag scope change | Change order |
| 26 | Client won't approve | No response 5 days | Reminder | Contact |
| 27 | Refund after delivery | Request received | Route to admin | Review |
| 28 | Chargeback after delivery | Razorpay notification | Suspend client | Dispute |
| 29 | Refund after payout | Financial log | Flag admin | Decide |
| 30 | Payout fails | NEFT notification | Mark failed | Contact creator |
| 31 | TDS wrong section | Accountant review | — | Correct |
| 32 | Invalid PAN | Validation | Reject | — |
| 33 | AI absurd quote (V3) | Outside floor/ceiling | Route to admin | Correct |
| 34 | AI wrong creator (V3) | Skill mismatch | Route to admin | Override |
| 35 | Copyright music | Cannot auto-detect | — | Ask client |
| 36 | Fraudulent footage | Cannot auto-detect | — | Cancel, suspend |
| 37 | Concurrent creator conflict | Max concurrent check | Queue second | Manage |
| 38 | Admin wrong payout | Audit log | — | Manual adjustment |
| 39 | Session hijacking | Unusual IP | — | Suspend, reset |
| 40 | DB corruption | Monitoring | — | Restore |
| 41 | Vercel deployment fails | Deployment monitoring | Auto-rollback | Fix |
| 42 | Client cancels during work | Cancellation | Graduated refund | Approve |
| 43 | Retention job fails | Cron monitoring | Retry | Manual delete |
| 44 | Client re-uploads after start | New files detected | Notify admin | Change order |
| 45 | B2 storage 95% full | Storage alert | Notify admin | Enforce deletion |
| 46 | Client disputes quality | Requirements comparison | — | Mediate |
| 47 | Creator contacts client | Cannot auto-detect | — | Warn/suspend |
| 48 | Concurrent Razorpay order | Transaction lock | Process first | — |
| 49 | Phone number changed | Client reports | — | Update |
| 50 | Plagiarism | Cannot auto-detect | — | Suspend |
| 51 | Multiple admins conflict | Optimistic locking | Show warning | Communicate |
| 52 | Price rule change | Quote snapshot | No effect | — |

---

## 12. Cost Structure

### 12.1 Fixed Monthly Costs (V1)

| Service | Plan | Cost/Month (₹) |
|:---|:---|:---|
| Supabase | Pro | ~₹2,100 |
| Vercel | Pro | ~₹1,700 |
| Backblaze B2 | Pay-as-go | ~₹3,300 (5TB) |
| Bunny Stream | Minimum | ~₹85 |
| Domain | Annual | ~₹83 |
| WhatsApp Cloud API | Usage | ~₹1,500 |
| SMS Fallback (MSG91) | Usage | ~₹350 |
| Sentry | Free tier | ₹0 |
| **Total Fixed** | | **~₹9,118** |

### 12.2 Variable Costs Per Order

| Cost | Amount (₹) |
|:---|:---|
| Razorpay fee | ~₹189 |
| WhatsApp notifications | ~₹4 |
| Bunny Stream bandwidth | ~₹3 |
| B2 storage (30GB project, 15 days) | ~₹14 |
| **Total Variable** | **~₹210** |

### 12.3 Profit at Scale

| Scale | Orders/Month | Revenue | Net Profit | Margin |
|:---|:---|:---|:---|:---|
| V1 launch | 30 | ₹2,40,000 | ₹47,000 | 19.6% |
| V1 growth | 100 | ₹8,00,000 | ₹1,58,000 | 19.8% |
| V2 | 300 | ₹24,00,000 | ₹4,75,000 | 19.8% |

---

## 13. Operational SOPs

### 13.1 Daily Admin Tasks

| Task | Frequency |
|:---|:---|
| Check quote approval queue | Daily |
| Check project status board | Daily |
| Check payout queue | Daily |
| Check retention deletions | Daily |
| Check failed notifications | Daily |
| Check reconciliation discrepancies | Daily |

### 13.2 Weekly Tasks

| Task | Frequency |
|:---|:---|
| Review creator performance | Weekly |
| Check storage usage | Weekly |
| Review dispute log | Weekly |
| Check backup status | Weekly |

### 13.3 Monthly Tasks

| Task | Frequency |
|:---|:---|
| GSTR-1 JSON export | Monthly |
| TDS reconciliation | Monthly |
| Financial reconciliation | Monthly |
| Creator payout reconciliation | Monthly |
| Audit log partition check | Monthly |

### 13.4 Quarterly Tasks

| Task | Frequency |
|:---|:---|
| Restore test | Quarterly |
| TDS return filing (Form 26Q) | Quarterly |
| Form 16A generation | Quarterly |

---

## 14. Roadmap

### 14.1 V1 — Launch (Weeks 1-20)

**Purpose**: End-to-end working platform with in-house team fulfillment
**Exit criteria**: 10 real projects completed end-to-end

### 14.2 V2 — Creator Marketplace (Months 4-8)

**Purpose**: Scale beyond in-house team
**Must-have**: Creator onboarding, creator dashboard, accept/decline, daily check-in, payout system, change order workflow, refund workflow, matching engine, performance metrics, data export/deletion, all 44 notifications, structured logging
**Exit criteria**: 50+ active creators, 100+ projects/month

### 14.3 V3 — Intelligent Operations (Months 9-15)

**Purpose**: AI-assisted operations
**Must-have**: AI pricing (rule-based), AI matching, technical QA (ffprobe), admin decision logging, AI confidence thresholds, AI enable/disable toggles
**Exit criteria**: AI auto-handles >60% of pricing quotes with admin approval rate >90%

### 14.4 V4 — Scale (Months 16-24)

**Purpose**: Handle 200+ projects/day
**Must-have**: Storage migration, automated batch payouts, QA team tooling, ops dashboard, LLM integration, AI learning, enterprise accounts

### 14.5 V5 — Ecosystem (Months 24+)

Multi-region/currency, international payouts, partner APIs, AI governance, mobile app (if justified)

---

## 15. V1 MVP Scope

### 15.1 MUST HAVE (Launch Blocker)

| Category | Features |
|:---|:---|
| **Legal** | Business entity, GST registration, Razorpay merchant account |
| **Auth** | WhatsApp OTP + SMS fallback + Email fallback, DPDP consent |
| **Client** | Marketing site, service catalog, wizard, pricing engine, admin quote approval, checkout, invoice generation |
| **Upload** | Client upload to B2 (resumable), ffprobe validation, project creation |
| **Workflow** | Admin manual assignment, status tracking, client dashboard, Bunny Stream preview, timestamped commenting, revision tracking, admin QA, client approval + auto-approve, final delivery |
| **Retention** | Timer + deletion cron, deletion notifications |
| **Financial** | Financial event log, payout tracking, TDS calculation (2% 194J-Tech) |
| **Compliance** | Privacy policy, ToS, DPDP consent, RLS, GSTR-1 export, credit notes |
| **Security** | Rate limiting, webhook verification, encryption, Cloudflare purge |
| **Operations** | Sentry, admin dashboard, contact info, grievance officer, multi-admin RBAC |

### 15.2 SHOULD HAVE (2-4 Weeks Post-Launch)

Creator onboarding, admin creator approval, creator dashboard, accept/decline, daily check-in, change order workflow, refund workflow, client order history, email notifications, analytics, data export/deletion, admin audit log

### 15.3 LATER (V2+)

Creator matching engine, automated payouts, creator performance metrics, client reviews, repeat client features, GST auto-filing, advanced reporting, WhatsApp interactive messages

### 15.4 DO NOT BUILD YET

AI pricing, AI matching, AI QA, AI revision classification, AI learning, multi-currency, enterprise accounts, bulk orders, partner APIs, international payouts, mobile app, real-time chat, subscription pricing

---

## 16. Pre-Development Checklist

- [ ] Business entity registered (Proprietorship)
- [ ] GST registration applied (mandatory from Day 1)
- [ ] TAN registration applied
- [ ] Razorpay merchant account submitted
- [ ] Meta Business Account created
- [ ] WhatsApp business phone verified
- [ ] Backblaze B2 account created
- [ ] Cloudflare account created
- [ ] Bunny Stream account created
- [ ] Vercel project created
- [ ] Supabase project created (Pro)
- [ ] Staging Supabase project created
- [ ] 70/30 split confirmed
- [ ] TDS section confirmed with CA (provisional 194J-Tech 2%)
- [ ] GST rate confirmed (18% SAC 999613)
- [ ] Database schema rewritten (000_canonical_master_schema.sql)
- [ ] Legacy schema archived
- [ ] Staging environment set up
- [ ] Sentry set up
- [ ] `.env.local` in `.gitignore`
- [ ] Privacy policy drafted
- [ ] Terms of Service drafted
- [ ] Freelancer agreement drafted
- [ ] Grievance officer designated
- [ ] **ffprobe validation worker designed**
- [ ] **Cloudflare cache purge designed**
- [ ] **Invoice vault designed**
- [ ] **GSTR-1 export designed**
- [ ] **Credit note generation designed**
- [ ] **Multi-admin RBAC designed**
- [ ] **Escalation matrix documented**

---

## 17. Pre-Launch Checklist

- [ ] Business entity active
- [ ] GST registration complete (mandatory Day 1)
- [ ] TAN registration complete
- [ ] Razorpay live (not test mode)
- [ ] WhatsApp OTP template approved
- [ ] SMS fallback tested
- [ ] Email fallback tested
- [ ] Payment webhook tested
- [ ] Refund tested
- [ ] Invoice generation tested (all 13 fields)
- [ ] GSTR-1 export tested
- [ ] Credit note generation tested
- [ ] B2 upload tested
- [ ] ffprobe validation tested
- [ ] Bunny Stream tested
- [ ] Retention deletion tested (triggers on `approved`)
- [ ] Cloudflare cache purge tested
- [ ] RLS policies tested
- [ ] Rate limiting active
- [ ] Webhook signature verification active
- [ ] PAN/bank encrypted
- [ ] Invoice vault WORM policy active
- [ ] DPDP consent checkbox present
- [ ] Privacy policy published
- [ ] Terms of Service published
- [ ] Grievance officer page published
- [ ] Admin accounts with stronger auth
- [ ] Multi-admin RBAC configured
- [ ] Error monitoring active
- [ ] Uptime monitoring active
- [ ] Backup verified
- [ ] CORS configured
- [ ] CSP headers configured
- [ ] Secrets not in code
- [ ] 10 test projects completed
- [ ] Financial reconciliation checked
- [ ] Mobile responsiveness verified
- [ ] Page load < 3 seconds on 4G
- [ ] Contact info published
- [ ] Escalation matrix documented
- [ ] SOPs documented

---

## 18. Open Questions (Deferred)

| # | Question | Who Answers | Blocks |
|:---|:---|:---|:---|
| 1 | Exact TDS section (194C vs 194J-Tech vs 194J-Prof) | CA | Payout calculations |
| 2 | Business entity type (Pvt Ltd timeline) | Karan + CA | Registrations |
| 3 | Legal agreements | Lawyer | Launch |
| 4 | Copyright assignment enforceability | Lawyer | Client contracts |
| 5 | Razorpay high-ticket pre-approval | Razorpay | Cash flow |

---

## 19. Change Log (v2.0 → v2.1)

| # | Change | Reason |
|:---|:---|:---|
| 1 | Retention trigger: `delivery` → `approved` | Audit Issue #1 |
| 2 | TDS: 194C (1%) → 194J-Tech (2%) | Audit Issue #2 |
| 3 | DPDP: anonymize PII only, preserve invoice vault | Audit Issue #3 |
| 4 | Upload validation: ffprobe.wasm + Cloudflare Worker | Audit Issue #4 |
| 5 | Cancellation: 100% → graduated (50/70/100%) | Audit Issue #5 |
| 6 | SMS fallback restored | Audit Issue #6 |
| 7 | Corporate structure: Pvt Ltd target | Audit Issue #8 |
| 8 | Freelancer acceptance: dynamic (4h/24h) | Audit Issue #9 |
| 9 | Legacy schema archived | Audit Issue #10 |
| 10 | Inter-state GST registration Day 1 | Audit Issue #11 |
| 11 | Cloudflare cache purge added | Audit Issue #12 |
| 12 | Multi-admin RBAC | Audit Issue #13 |
| 13 | Razorpay refund `speed: 'normal'` | Audit Issue #14 |
| 14 | Audit log partitioning | Audit Medium #15 |
| 15 | Change order ledger entry fix | Audit Medium #16 |
| 16 | Auto-approve block flag | Audit Medium #17 |
| 17 | NLE metadata scrubbing | Audit Medium #18 |
| 18 | PAN verification API | Audit Medium #19 |
| 19 | Timezone standardization (IST) | Audit Medium #20 |
| 20 | WhatsApp webhook HMAC | Audit Medium #21 |
| 21 | Client phone update flow | Audit Medium #22 |
| 22 | Bunny async webhook handling | Audit Medium #23 |
| 23 | Bank account penny drop | Audit Medium #24 |
| 24 | GSTR-1 JSON export | Audit Missing |
| 25 | Credit note generation | Audit Missing |
| 26 | Invoice vault (WORM) | Audit Missing |
| 27 | Escalation matrix | Audit Missing |
| 28 | Grievance officer page | Audit Missing |
| 29 | WhatsApp: Baileys for testing, Meta API for production | User decision |
| 30 | Free tier testing stack documented | User request |

---

## 20. Document Control

| Version | Date | Changes |
|:---|:---|:---|
| 1.0 | 2026-09-21 | Original master plan |
| 2.0 | 2026-09-24 | Post-audit, all decisions locked |
| 2.1 | 2026-09-26 | Post-deep-audit corrections, all critical issues resolved |
| 2.2 | 2026-09-26 | All 8 Critical Launch Blockers resolved & verified: B2 S3 SDK client, mediainfo container validation, PII encryption (AES-256), Vercel Hobby external crons, strict CRON_SECRET auth, Meta WhatsApp HSM templates (44 events), Razorpay 5-min replay window & HMAC, payments WORM trigger |

### Change Log: Master Plan v2.2 Critical Fixes

1. **Fix 1 — Backblaze B2 Upload & Delete Integration**: Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. Implemented `src/lib/storage/b2-client.ts`, `/api/storage/presign` (PUT URL TTL 15m), `/api/storage/confirm`, and wired `deleteObject()` into the retention lifecycle cron.
2. **Fix 2 — Real Video Container Validation**: Installed `mediainfo.js`. Updated `src/lib/storage/validator.ts` with deep container atom inspection (MOOV, FTYP, SMPTE MXF, R3D, EBML) reading up to 10MB slices. Removed extension-based forgiveness entirely; corrupted files are strictly rejected with HTTP 422.
3. **Fix 3 — PAN & Bank Details Encryption**: Created Migration 003 (`003_pii_encryption.sql`) with PostgreSQL `pgcrypto` functions. Created `src/lib/crypto/pii.ts` for AES-256-GCM encryption and masking (`XXXXX1234F`). Built `/api/admin/creator/[id]/reveal-pan` with audit log tracking.
4. **Fix 4 — Vercel Hobby Cron Architecture**: Configured `vercel.json` with single daily cron (`0 2 * * *`) for Hobby plan compliance. Created `.github/workflows/cron.yml` to trigger sub-daily payment reconciliation (15 min) and timeouts (hourly) via GitHub Actions.
5. **Fix 5 — Strict `CRON_SECRET` Enforcement**: Updated all cron routes to reject unauthenticated requests immediately with HTTP 500 when `CRON_SECRET` is unset, and HTTP 401 when tokens do not match.
6. **Fix 6 — Official Meta WhatsApp HSM Templates**: Created `src/lib/whatsapp/templates.ts` and `docs/whatsapp-templates.md` mapping all 44 events to official Meta HSM templates with typed body parameters and language tags.
7. **Fix 7 — Razorpay Webhook Replay Protection & HMAC**: Enforced strict HMAC SHA256 validation (rejects missing secret with 500, missing signature with 401, mismatch with 400). Added 5-minute (300s) replay window check rejecting stale timestamps.
8. **Fix 8 — WORM Trigger on `payments` Table**: Created Migration 004 (`004_payments_worm.sql`) and applied `enforce_immutable_record()` trigger to `payments`, making the financial ledger completely immutable.

---

> **End of Master Plan v2.2**
>
> This document is the locked, post-verification authority for Artsy Production. All 8 critical launch blockers have been resolved and self-verified with executable evidence.
>
> **Owner**: Karan  
> **Last Verified & Locked**: 2026-09-26