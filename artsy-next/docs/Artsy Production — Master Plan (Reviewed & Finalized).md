# Artsy Production — Master Plan (Reviewed & Finalized)

> **Document Version**: 2.0 (Post-Audit, Decision-Locked)
> **Last Updated**: 2026-09-24
> **Status**: All major decisions locked. Ready for development.
> **Source**: Consolidated from Deep Audit Parts 1–27 + all review decisions

---

## 📌 How to Use This Document

This is the **single source of truth** for Artsy Production. It supersedes the original master plan, implementation plan, and audit reports. Every decision here has been reviewed and locked.

- **For developers**: Sections 6–12 define the schema, architecture, and workflows.
- **For business/legal**: Sections 1–5 define the model, pricing, and compliance.
- **For operations**: Sections 13–17 define the workflows, notifications, and SOPs.
- **For finance**: Sections 4, 5, and 16 define the money flow.

---

## 1. Business Model & Identity

### 1.1 What Artsy Is

**Artsy Production is a managed creative services platform** that connects clients (wedding couples, brands, corporates, individuals) with a curated pool of freelance video editors. Artsy controls the entire workflow: pricing, assignment, quality assurance, delivery, and payment.

| Dimension | Artsy's Position |
|:---|:---|
| Who contracts with the client? | **Artsy** (client pays Artsy) |
| Who is responsible for quality? | **Artsy** (admin QA before client sees anything) |
| Who handles disputes? | **Artsy** |
| Who assigns work? | **Artsy** (manual in V1, matching engine in V2+) |
| Client-creator communication? | **None** (anonymized job cards) |
| Merchant of record | **Artsy** (bears chargeback liability) |
| Data Fiduciary (DPDP) | **Artsy** |

> **Important**: The word "marketplace" is retired from all legal, tax, and internal documents. It may remain in marketing copy, but formal documents use "managed creative services platform."

### 1.2 What Artsy Is Not

- Not a marketplace (freelancers do not invoice clients)
- Not a software tool (it is a service)
- Not a video hosting platform (it is a production service with delivery)

---

## 2. Service Catalog & Pricing

### 2.1 Categories

Artsy offers **4 main categories** with sub-categories:

1. **Wedding**
2. **Brand**
3. **Corporate**
4. **Personal / Other**

### 2.2 Wedding Services

| Sub-Category | Duration | Base Price (Single Cam) | Delivery (Standard) | Rush (4-5 days) |
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
- Drone footage: **Client-provided only, no extra charge** (Artsy does not provide drone services)

### 2.3 Brand Services

| Sub-Category | Duration | Base Price (Single Cam) | Delivery (Standard) | Rush (4-5 days) | Rush (48h) |
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

| Sub-Category | Base Price (Single Cam) | Delivery (Standard) | Rush (4-5 days) | Rush (48h) |
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

| Sub-Category | Duration | Base Price (Single Cam) | Delivery (Standard) | Rush (4-5 days) | Rush (48h) |
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
| Memorial | Same as Baby Shower | Same as Baby Shower | 7-10 working days | +₹1,000 | +₹2,000 |
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

**Cost to Artsy**: ~₹287/month for 300GB on B2, so margins are healthy.

### 2.8 Quote Validity

All quotes valid for **7 days**. After expiry, client can request a new quote at current pricing.

---

## 3. Financial Model

### 3.1 Revenue Split

**70% freelancer / 30% Artsy** of net revenue (after GST and gateway fees).

**Calculation base**: Net revenue = Client payment − GST − Razorpay fee

### 3.2 Money Storage

All monetary values stored as **INTEGER in paise** (1 rupee = 100 paise).

### 3.3 Example: ₹8,000 Order

| Step | Line Item | Amount (₹) |
|:---|:---|:---|
| 1 | Client pays | 8,000.00 |
| 2 | GST payable (18% embedded) | −1,220.34 |
| 3 | Razorpay fee (2% + GST) | −188.80 |
| 4 | **Net distributable revenue** | **6,590.86** |
| 5 | Freelancer share (70%) | −4,613.60 |
| 6 | TDS deduction (1% under 194C) | −46.14 |
| 7 | **Net freelancer payout** | **4,567.46** |
| 8 | Artsy share (30%) | 1,972.39 |
| 9 | Variable costs (storage, streaming, notifications) | −147.40 |
| 10 | Website maintenance (allocated) | −242.27 |
| 11 | **Artsy net profit** | **1,582.72** |
| 12 | **Margin** | **19.8%** |

### 3.4 TDS

- **Section 194C (1%)** — provisional, pending CA confirmation
- Deducted from freelancer payout
- Remitted to government quarterly
- Form 16A generated by CA/accounting software

### 3.5 GST

- **18%** embedded in displayed price
- SAC code: **999613** (post-production services)
- Invoice must show: CGST + SGST (intra-state) or IGST (inter-state)
- Credit note mechanism for refunds
- Place of supply determines CGST/SGST vs IGST

### 3.6 Freelancer Payout Timing

Within **7 days** after client approves final video.

### 3.7 Cancellation Policy

| Stage | What Artsy Retains | What Client Receives |
|:---|:---|:---|
| Before freelancer assigned | Gateway fee | 100% minus gateway fee |
| After assignment, before work starts | Gateway fee + 10% admin fee | 90% minus gateway fee |
| During work (partial completion) | **100%** | **Nothing** |
| After final delivery | 0% | Nothing (dispute resolution only) |

**GST handling**: Credit note issued for refunded amount. GST paid on retained fee.

### 3.8 Refund Policy

- Full refund minus gateway fee if cancelled before assignment
- Partial refund per cancellation policy above
- No refund after delivery
- Disputes handled by admin mediation

### 3.9 Payment Reconciliation

- Automated cron job every **15 minutes**
- Fetches recent Razorpay payments
- Creates missing orders if webhook failed
- Notifies admin of discrepancies

---

## 4. Compliance & Legal

### 4.1 Business Registration

| Item | Status |
|:---|:---|
| Business entity | **Sole Proprietorship** (register immediately) |
| GST registration | Apply when threshold approached |
| TAN | Required for TDS |
| Razorpay merchant account | Apply after entity registration |
| Meta Business Account | Required for WhatsApp API |

### 4.2 TDS

- **Section 194C (1%)** — provisional
- **Pending**: CA written confirmation
- System supports configurable rate (194J/194C)
- PAN required from freelancers
- TDS rate without PAN: 20%

### 4.3 GST

- **18%** for SAC 999613
- Embedded in displayed price
- Invoice must include: invoice number, date, client name, client address (B2B), client GSTIN (B2B), Artsy GSTIN, SAC, description, taxable value, GST rate, CGST/SGST or IGST, total, place of supply

### 4.4 DPDP Compliance

| Requirement | Implementation |
|:---|:---|
| Privacy Policy | Draft before launch (deferred) |
| Consent collection | At registration (checkbox + timestamp) |
| Right to Access | Data export API + secure download link |
| Right to Correction | Profile editing |
| Right to Erasure | Data deletion request workflow (anonymize PII, retain financial records) |
| Grievance Officer | Designate + publish contact |
| Breach Notification | Incident response plan (draft before launch) |
| Data Processing Agreement | With Supabase, Razorpay, Bunny, B2 (verify) |

### 4.5 Legal Agreements (Deferred — Launch Blocker)

| Document | Status |
|:---|:---|
| Terms of Service (client-facing) | Draft before launch |
| Freelancer Agreement/NDA | Draft before launch |
| Privacy Policy | Draft before launch |
| Cancellation & Refund Policy | Draft before launch |
| Cookie Policy | Draft before launch |

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
| CI/CD | GitHub Actions + Vercel (manual approval for production) |
| Rate limiting | Vercel Edge Middleware + Upstash Redis |
| Error monitoring | Sentry |
| Uptime monitoring | Better Uptime |
| Email | Resend |
| PDF generation | @react-pdf/renderer |
| Background jobs | Vercel Cron |

### 5.2 Storage Architecture

| Asset | Provider | Role |
|:---|:---|:---|
| Raw footage | Backblaze B2 | Upload, freelancer download |
| Final video (download) | Backblaze B2 | Client download |
| Final video (streaming) | Bunny Stream | HLS playback |
| CDN | Cloudflare | Free egress for B2 |
| Invoices/PDFs | Supabase Storage | Small files |

**Upload flow**: Client browser → presigned URL → B2 (direct upload, never through Artsy server)

**Download flow**: Client → Cloudflare CDN → B2 (free egress)

**Streaming flow**: Client → Bunny Stream (HLS)

### 5.3 Authentication

| User Type | Method |
|:---|:---|
| Client | WhatsApp OTP + Email (both required) |
| Freelancer | WhatsApp OTP + Email (both required) |
| Admin | WhatsApp OTP + Google Authenticator + SMS fallback + backup codes |

**Note**: WhatsApp only for client/freelancer OTP. No SMS fallback for users (deferred).

### 5.4 Database Schema (19 Tables)

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
| `audit_logs` | Admin action audit trail |
| `ai_decision_log` | AI recommendation tracking |
| `file_records` | File metadata tracking |
| `platform_config` | Admin-editable settings |
| `revisions` | Timestamped client comments |

### 5.5 Immutable Tables

| Table | Why |
|:---|:---|
| `financial_events` | Financial audit trail |
| `payments` | Financial audit trail |
| `quotes` | Price verification |
| `audit_logs` | Security compliance |
| `consent_records` | DPDP compliance |
| `ai_decision_log` | AI audit trail |

**RLS**: No UPDATE or DELETE on these tables, even for admin. Corrections are new rows.

### 5.6 Encryption at Rest

| Data | Method |
|:---|:---|
| PAN | Supabase Vault or application-level AES-256 |
| Bank details | Separate encrypted columns (not JSONB) |
| OTP codes | Hashed (bcrypt), never plaintext |
| Razorpay webhook payloads | Encrypted at rest |

### 5.7 Webhook Idempotency

**Table**: `webhook_events` with `UNIQUE(gateway, event_id)`

**Logic**: Insert event. If insert succeeds, process. If insert fails (duplicate), ignore and return 200 OK.

### 5.8 Rate Limiting

| Endpoint | Limit |
|:---|:---|
| OTP request | 5 per phone per 10 minutes |
| OTP verification | 10 attempts per phone per hour |
| Login | 10 attempts per IP per hour |
| Payment initiation | 5 per user per hour |
| API (general) | 100 requests per minute per user |
| File upload | 10 uploads per user per hour |
| Admin actions | 50 requests per minute per admin |

### 5.9 Backup & Restore

| Asset | Method |
|:---|:---|
| Database | Supabase PITR, quarterly restore test |
| Final videos | B2 versioning |
| Code | GitHub |
| Config/secrets | Password manager |

### 5.10 CI/CD Pipeline

1. Push to feature branch → Vercel preview + GitHub Actions (tests, security scan)
2. Merge to `main` → Supabase migration + Vercel production deployment (manual approval)

---

## 6. Workflows

### 6.1 Client Happy Path

```
Visitor → Service Catalog → Requirement Wizard → Quote → Login → 
Checkout → Payment → Upload → Project Active → Draft Review → 
Revision → Approval → Final Delivery → Retention → Deletion
```

### 6.2 Project Status Machine (32 Statuses)

| # | Status | When It Applies |
|:---|:---|:---|
| 1 | `draft` | Client filling requirements |
| 2 | `quoted` | Quote generated |
| 3 | `pending_price_approval` | Quote needs admin review |
| 4 | `payment_pending` | Client on checkout |
| 5 | `payment_failed` | Payment failed |
| 6 | `paid` | Payment confirmed |
| 7 | `awaiting_upload` | Waiting for upload |
| 8 | `upload_processing` | Files being verified |
| 9 | `upload_complete` | Files verified |
| 10 | `pending_assignment` | Waiting for match |
| 11 | `creator_proposed` | Job offered to freelancer |
| 12 | `creator_assigned` | Freelancer accepted |
| 13 | `in_progress` | Freelancer editing |
| 14 | `escalated` | Check-in missed |
| 15 | `reassignment_needed` | Freelancer failed |
| 16 | `submitted` | Deliverable submitted |
| 17 | `qa_review` | Admin QA |
| 18 | `revision_needed` | QA failed |
| 19 | `client_review` | Client reviewing |
| 20 | `client_revision_requested` | Client requested revision |
| 21 | `change_order_needed` | Scope creep detected |
| 22 | `auto_approved` | 7-day timeout |
| 23 | `approved` | Client approved |
| 24 | `final_delivery` | Links generated |
| 25 | `completed` | Project done |
| 26 | `retention_active` | Timers running |
| 27 | `archived` | Files deleted |
| 28 | `cancelled` | Cancelled |
| 29 | `refunded` | Refund processed |
| 30 | `disputed` | Dispute open |
| 31 | `stale` | No activity 14+ days |
| 32 | `on_hold` | Admin paused |

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

### 6.5 Retention & Deletion Flow

**Raw Footage:**
- Day 0: Delivery
- Day 7: Warning (7 days left)
- Day 12: Warning (3 days left)
- Day 14: Warning (1 day left)
- Day 15: Soft delete (move to trash/)
- Day 22: Hard delete (remove from B2)

**Final Video:**
- Day 0: Approval
- Day 23: Warning (7 days left)
- Day 27: Warning (3 days left)
- Day 29: Warning (1 day left)
- Day 30: Soft delete
- Day 37: Hard delete

**Safety Rules:**
- Never delete during dispute
- Soft delete before hard delete
- Keep 480p watermarked proof-of-delivery copy for 1 year

### 6.6 Revision Policy

- **1 free revision round** (minor changes only)
- Comments must be submitted within **48 hours** (max 7 days)
- Minor changes: trim, color tweak, audio sync, transition fix
- Major changes (scope creep): charged as change order
- Extra revision round: 10% of project cost
- Freelancer paid 70% of change order price

### 6.7 Client Approval Timeout

- **7-day auto-approve** if no response
- Reminders at day 3, 5, 6

### 6.8 Freelancer Acceptance Timeout

- **24-hour window** with reminder at 12 hours
- Auto-decline after 24 hours

### 6.9 SLA

- **7-10 working days** standard
- Weekends/holidays paused
- Rush: 4-5 days (+₹1,000-2,000) or 48 hours (+₹2,000)
- SLA breach: 10% discount on next order or partial refund (admin discretion)

### 6.10 Freelancer Suspension

| Offense | Action |
|:---|:---|
| First missed deadline | Warning |
| Second missed deadline | 7-14 day suspension |
| Third missed deadline | 30-day or permanent removal |
| NDA violation | Immediate permanent suspension |
| Reactivation | Appeal after 30 days, probation on return |

---

## 7. Notifications (44 Events)

### 7.1 Event Matrix

| # | Event | Client | Creator | Admin | Channel |
|:---|:---|:---|:---|:---|:---|
| 1 | OTP sent | ✅ | ✅ | — | WhatsApp |
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
- **Retry**: 1 retry after 60 seconds for WhatsApp
- **Escalation**: Admin alerted if 5+ notifications fail in an hour

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
| Refunds | Initiate refund, refund history |
| Retention | Upcoming deletions, extend retention, manual delete |
| Notifications | Delivery status, resend failed |
| Settings | Platform config, GST/TDS rates, feature flags |
| Audit | Admin action history |
| Analytics | Revenue dashboard |

### 8.2 Future Screens (V2+)

- Creator performance metrics
- Advanced reporting
- Feature flags
- AI decision log
- Marketing consent analytics

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

### 9.2 Authorization

| Vulnerability | Mitigation |
|:---|:---|
| Role stored client-side | Server-verified on every request |
| IDOR | RLS policies on all tables |
| Creator self-approval | RLS excludes `approval_status` from self-update |
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
| Metadata leak | Strip EXIF from photos |

### 9.5 API Security

| Vulnerability | Mitigation |
|:---|:---|
| No rate limiting | Vercel Edge + Upstash Redis |
| No input validation | Validate all inputs |
| No CORS | Strict origin policy |
| Secrets in repo | `.env.local` in `.gitignore` |
| No CSP | Add Content-Security-Policy headers |

### 9.6 Data Security

| Vulnerability | Mitigation |
|:---|:---|
| PAN plaintext | Supabase Vault |
| Bank details plaintext | Encrypted columns |
| No backup | Supabase PITR, quarterly test |
| No encryption at rest | Supabase Pro default |

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

### 10.2 Data Subject Rights

| Right | Implementation |
|:---|:---|
| Access | Data export API, secure download link |
| Correction | Profile editing |
| Erasure | Deletion request workflow, anonymize PII |
| Grievance | Designated officer, published contact |
| Breach notification | Incident response plan |

### 10.3 Deletion Workflow

1. User submits request in-app
2. Admin notified
3. Admin verifies identity (OTP)
4. Admin runs anonymization script
5. User notified when complete
6. Logged in `data_deletion_requests`

**Anonymization**: Set `phone = NULL`, `email = NULL`, `full_name = NULL`, mark `deleted_at`. Retain financial records with anonymized user ID.

---

## 11. Failure & Edge Cases

### 11.1 Critical Scenarios

| # | Scenario | Detection | Auto Action | Admin Action |
|:---|:---|:---|:---|:---|
| 1 | OTP not delivered | API error | — | — |
| 2 | Duplicate OTP | Rate limiter | Block after 5 | — |
| 3 | OTP brute force | Failed count > 10 | Lock 1 hour | — |
| 4 | Payment succeeds, no webhook | Reconciliation cron | Create order | Verify |
| 5 | Chargeback | Razorpay webhook | Pause project | Gather evidence |
| 6 | Duplicate payment | Two payments same order | Refund second | — |
| 7 | 500GB upload | Size check | Reject | — |
| 8 | Upload stops at 90% | Tracker | Allow resume | — |
| 9 | Duplicate file | Hash comparison | Skip | — |
| 10 | Corrupted file | Header validation | Reject | — |
| 11 | Creator disappears | Missed check-in | Flag admin | Reassign |
| 12 | Creator downloads, suspended | Suspension | Revoke access | Legal notice |
| 13 | Wrong deliverable | QA review | QA fail | Return |
| 14 | Low quality | QA review | QA fail | Reassign |
| 15 | QA delayed | Deadline tracking | Alert admin | Prioritize |
| 16 | Creator late | Deadline comparison | Escalation | Contact |
| 17 | All creators busy | No matches | Alert admin | Wait/extend |
| 18 | Drive/B2 permission public | Daily audit | Revoke | Investigate |
| 19 | B2 outage | Health check | Show error | — |
| 20 | Razorpay outage | Health check | Show error | — |
| 21 | WhatsApp outage | Error rate | Queue + retry | — |
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
| 42 | Client cancels during work | Cancellation | Calculate refund | Approve |
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
| SMS Fallback | Usage | ~₹350 |
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

**Note**: Margins improve with retention extensions and change orders.

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
| GST filing data export | Monthly |
| TDS reconciliation | Monthly |
| Financial reconciliation | Monthly |
| Creator payout reconciliation | Monthly |

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

**Scope**: As per Section 15 (MVP)

**Exit criteria**: 10 real projects completed end-to-end successfully

### 14.2 V2 — Creator Marketplace (Months 4-8)

**Purpose**: Scale beyond in-house team

**Must-have**:
- Creator onboarding + admin approval
- Creator dashboard + job cards
- Accept/decline flow
- Daily check-in system
- Creator payout system
- Change order workflow
- Refund workflow
- Matching engine
- Creator performance metrics
- Data export + deletion endpoints
- All 44 notifications
- Structured logging

**Exit criteria**: 50+ active creators, 100+ projects/month

### 14.3 V3 — Intelligent Operations (Months 9-15)

**Purpose**: AI-assisted operations

**Must-have**:
- AI pricing suggestions (rule-based, not LLM)
- AI creator matching (scoring engine)
- Technical QA checks (ffprobe)
- Admin decision logging
- AI confidence thresholds
- AI enable/disable toggles

**Exit criteria**: AI auto-handles >60% of pricing quotes with admin approval rate >90%

### 14.4 V4 — Scale (Months 16-24)

**Purpose**: Handle 200+ projects/day

**Must-have**:
- Storage migration (B2 → object storage at scale)
- Automated batch payouts
- QA team tooling
- Operations team dashboard
- LLM integration
- AI learning from admin
- Enterprise client accounts

### 14.5 V5 — Ecosystem (Months 24+)

- Multi-region/currency
- International creator payouts
- Partner APIs
- AI governance/audit
- Mobile app (if justified)

---

## 15. V1 MVP Scope

### 15.1 MUST HAVE (Launch Blocker)

| Category | Features |
|:---|:---|
| **Legal** | Business entity, GST registration (or exemption), Razorpay merchant account |
| **Auth** | WhatsApp OTP login (client + admin), DPDP consent |
| **Client** | Marketing site, service catalog, requirement wizard, deterministic pricing, admin quote approval, checkout + Razorpay, invoice generation |
| **Upload** | Client upload to B2 (resumable), file validation, project creation |
| **Workflow** | Admin manual assignment, project status tracking, client dashboard, Bunny Stream preview, timestamped commenting, revision tracking, admin QA, client approval + auto-approve, final delivery |
| **Retention** | Retention timer + deletion cron, deletion notifications |
| **Financial** | Financial event log, admin payout tracking, TDS calculation (1%) |
| **Compliance** | Privacy policy, Terms of Service, DPDP consent, RLS |
| **Security** | Rate limiting, webhook verification, encryption for PAN/bank |
| **Operations** | Sentry, admin dashboard, contact info, grievance officer |

### 15.2 SHOULD HAVE (2-4 Weeks Post-Launch)

- Creator onboarding
- Admin creator approval
- Creator dashboard
- Accept/decline flow
- Daily check-in
- Change order workflow
- Refund workflow
- Client order history
- Email notifications
- Analytics
- Data export/deletion
- Admin audit log

### 15.3 LATER (V2+)

- Creator matching engine
- Automated payouts
- Creator performance metrics
- Client reviews
- Repeat client features
- GST auto-filing
- Multi-admin
- Advanced reporting
- WhatsApp interactive messages

### 15.4 DO NOT BUILD YET

- AI pricing
- AI matching
- AI QA
- AI revision classification
- AI learning
- Multi-currency
- Enterprise accounts
- Bulk orders
- Partner APIs
- International payouts
- Mobile app
- Real-time chat
- Subscription pricing

---

## 16. Pre-Development Checklist

- [ ] Business entity registered (Proprietorship)
- [ ] GST registration applied
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
- [ ] TDS section confirmed with CA (provisional 194C)
- [ ] GST rate confirmed (18% SAC 999613)
- [ ] Database schema rewritten
- [ ] Schema in version control
- [ ] Staging environment set up
- [ ] Sentry set up
- [ ] `.env.local` in `.gitignore`
- [ ] Privacy policy drafted
- [ ] Terms of Service drafted
- [ ] Freelancer agreement drafted
- [ ] Grievance officer designated

---

## 17. Pre-Launch Checklist

- [ ] Business entity active
- [ ] GST registration complete
- [ ] TAN registration complete
- [ ] Razorpay live (not test mode)
- [ ] WhatsApp OTP template approved
- [ ] Payment webhook tested
- [ ] Refund tested
- [ ] Invoice generation tested
- [ ] B2 upload tested
- [ ] Bunny Stream tested
- [ ] Retention deletion tested
- [ ] RLS policies tested
- [ ] Rate limiting active
- [ ] Webhook signature verification active
- [ ] PAN/bank encrypted
- [ ] DPDP consent checkbox present
- [ ] Privacy policy published
- [ ] Terms of Service published
- [ ] Admin account with stronger auth
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
- [ ] Grievance officer designated

---

## 18. Open Questions (Deferred)

| # | Question | Who Answers | Blocks |
|:---|:---|:---|:---|
| 1 | Exact TDS section (194J vs 194C) | CA | Payout calculations |
| 2 | Business entity type | Karan + CA | Registrations |
| 3 | Legal agreements | Lawyer | Launch |
| 4 | Raw footage caps enforcement | Karan | Future storage costs |

---

## 19. Change Log (From Audit)

| # | Change | Reason |
|:---|:---|:---|
| 1 | "marketplace" → "managed creative services platform" | Legal/tax clarity |
| 2 | 75/25 → 70/30 split | Business decision |
| 3 | TDS 10% → 1% (provisional 194C) | Tax classification |
| 4 | Money DECIMAL → INTEGER (paise) | Accuracy |
| 5 | Email required → Phone + Email both required | Identity |
| 6 | Google Drive → B2 + Cloudflare for raw footage | Cost/scalability |
| 7 | SMS fallback → WhatsApp only for users | Decision |
| 8 | 9 project statuses → 32 statuses | Completeness |
| 9 | 6 order statuses → 14 statuses | Completeness |
| 10 | 14 notifications → 44 notifications | Completeness |
| 11 | Added: quotes, change_orders, financial_events, webhook_events, audit_logs, consent_records, data_deletion_requests, file_records, platform_config, notification_delivery_log, ai_decision_log, revisions | Missing tables |
| 12 | Added: RLS bug fixes (no self-approval) | Security |
| 13 | Added: rate limiting | Security |
| 14 | Added: webhook idempotency | Payment reliability |
| 15 | Added: staging environment | Testing |
| 16 | Added: CI/CD pipeline | Deployment safety |
| 17 | Added: backup/restore procedures | Data safety |
| 18 | Added: DPDP export/deletion workflow | Compliance |
| 19 | Added: admin stronger auth | Security |
| 20 | Added: retention extension pricing | Revenue |
| 21 | Added: change order pricing | Revenue/disputes |
| 22 | Added: cancellation policy | Disputes |
| 23 | Added: SLA breach handling | Operations |
| 24 | Added: creator workload limit (3) | Operations |
| 25 | Added: freelancer suspension policy | Operations |
| 26 | Added: quote validity (7 days) | Pricing |
| 27 | Added: client approval timeout (7 days) | Operations |
| 28 | Added: freelancer acceptance timeout (24h) | Operations |
| 29 | Added: creator vetting (video call, no test edit) | Operations |
| 30 | Added: invoice fields (Option A) | GST compliance |

---

## 20. Document Control

| Version | Date | Changes |
|:---|:---|:---|
| 1.0 | 2026-09-21 | Original master plan |
| 2.0 | 2026-09-24 | Post-audit, all decisions locked |

---

> **End of Master Plan**
>
> This document incorporates all decisions from the Deep Audit (Parts 1–27) and subsequent review. It supersedes all prior versions.
>
> **Next action**: Begin Phase 0 (Infrastructure Setup) per Section 14.1 and Section 16 (Pre-Development Checklist).
>
> **Owner**: Karan
> **Last Reviewed**: 2026-09-24