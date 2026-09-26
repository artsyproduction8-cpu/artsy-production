# Artsy Production — Deep Audit (Parts 10–18)

---

# PART 10 — DATABASE AUDIT

## 10.1 Schema vs Plan Divergence

> [!CAUTION]
> **The SQL schema ([supabase_schema.sql](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/artsy-next/supabase_schema.sql)) diverges significantly from the implementation plan's data model.** These are two separate, incompatible designs.

| Field/Table | Implementation Plan | SQL Schema | Conflict |
|---|---|---|---|
| `users.email` | Not present (phone-only auth) | `TEXT UNIQUE NOT NULL` | Schema requires email; plan uses phone-only OTP |
| `users.full_name` | Not present | `TEXT NOT NULL` | Schema requires full name at registration; plan doesn't ask |
| `users.phone` | `UNIQUE NOT NULL` | `TEXT` (nullable, not unique) | Phone is the primary identity in plan but optional in schema |
| `users.consent_given_at` | Present | **MISSING** | DPDP compliance field missing from schema |
| `users.consent_version` | Present | **MISSING** | DPDP compliance field missing from schema |
| `users.deleted_at` | Present (soft delete) | **MISSING** | No soft delete support in schema |
| `creator_profiles.hourly_rate` | Not in plan | `DECIMAL(10,2)` | Schema has freelancer hourly rate; plan uses project-based pricing only |
| `creator_profiles.rating` | Not in plan (V2 metric) | `DECIMAL(3,2)` | Rating system not designed but field exists |
| `creator_profiles.upi_id` | Not in plan | `TEXT` | UPI payout not in plan (NEFT only) |
| `creator_profiles.experience_years` | `INTEGER` | **MISSING** | Schema has no experience field |
| `creator_profiles.languages` | `TEXT[]` | **MISSING** | Schema has no languages field |
| `creator_profiles.approval_status` | `TEXT (pending/approved/rejected)` | `is_verified BOOLEAN` | Boolean vs enum — fundamentally different |
| `creator_profiles.rejection_reason` | Present | **MISSING** | Schema can't store rejection reason |
| `creator_profiles.approved_by` | `UUID FK` | **MISSING** | No audit trail for who approved |
| Money fields | `INTEGER` (paise) | `DECIMAL(10,2)` (rupees) | **Incompatible.** Paise avoids floating-point errors |
| `orders.status` | 11 statuses | 6 statuses | Schema missing: `pending_price_approval`, `quoted`, `payment_pending`, `in_progress`, `delivered`, `revision_requested` |
| `projects.status` | 9 statuses | 9 different statuses | Completely different status sets |
| `assignments` table | Present with full schema | **MISSING** | Schema has no assignments table |
| `access_grants` table | Present | **MISSING** | Schema has no Drive access tracking |
| `refund_entries` table | Present | **MISSING** | Schema has no refund ledger |
| `platform_config` table | Present | **MISSING** | Schema has no admin-configurable settings |
| `creator_samples` | Matches plan | Reasonable match | OK |
| `audit_logs` table | Referenced in master plan data model | **MISSING** | No audit logging in schema |
| `creator_availability` | Referenced in master plan | **MISSING** | No availability tracking in schema |
| `creator_skills` | Referenced in master plan | Skills stored as array on creator_profiles | Difference — array vs normalized table |

**VERDICT**: The SQL schema represents an earlier, divergent design that must be **completely rewritten** to match the implementation plan before development proceeds. Building on the current schema will create contradictions with every feature.

## 10.2 Missing Tables

| Table | Purpose | Why Missing is Critical |
|---|---|---|
| `quotes` | Immutable pricing snapshots | Without this, price at checkout can't be verified retroactively |
| `change_orders` | Scope change tracking | Core business workflow gap |
| `platform_config` | Admin-editable settings | GST rate, TDS rate, etc. hardcoded without this |
| `access_grants` | Drive permission tracking | Can't revoke access systematically |
| `refund_entries` | Compensating ledger entries | Refunds edit original records = audit nightmare |
| `audit_logs` | Security + compliance audit trail | Required for financial compliance and DPDP |
| `ai_decision_log` | AI recommendation tracking | Needed from V1 for data collection |
| `consent_records` | DPDP consent tracking | Required by law |
| `data_deletion_requests` | DPDP data deletion tracking | Required by law |
| `file_records` | File metadata tracking | Currently only `drive_folder_id` on project; no individual file tracking |
| `notification_delivery_log` | Delivery status tracking | Was WhatsApp actually delivered? Retry? |
| `webhook_events` | Idempotent webhook processing | Prevents duplicate payment processing |
| `price_history` | Service price change tracking | Admin changes price; old orders need old price |

## 10.3 Fields Stored as JSON That Should Not Be

| Table.Field | Currently | Should Be |
|---|---|---|
| `orders.requirements_json` | JSONB blob | OK for V1 (wizard answers are dynamic). BUT should have a JSON Schema stored per service for validation |
| `creator_profiles.availability` | JSONB | Normalize: `creator_availability` table with `day_of_week`, `hours`, `shift_preference` |
| `creator_profiles.bank_details` | JSONB encrypted | Should be separate encrypted columns: `bank_name`, `account_number`, `ifsc_code` — JSONB encryption is all-or-nothing |
| `services.pricing_rules` | JSONB | Normalize: `pricing_rules` table (see Part 2) |
| `payments.gateway_response` | JSONB | OK — gateway responses are opaque blobs |

## 10.4 Data That Must Be Immutable

| Data | Why | Mechanism |
|---|---|---|
| `payments` records | Financial audit trail | `INSERT` only, no `UPDATE`/`DELETE`. Use `refund_entries` for corrections |
| `invoices` | Legal tax document | Once status = 'sent', no modification. Credit notes for corrections |
| `creator_payouts` | Financial audit trail | Append-only status changes |
| `quotes` | Price verification | Insert-only snapshot |
| `audit_logs` | Security compliance | Append-only, no delete even for admin |
| `ai_decision_log` | AI audit trail | Append-only |
| `consent_records` | DPDP compliance | Append-only |

**RLS policies should enforce**: No `UPDATE` or `DELETE` on immutable tables, not even for admin. Only new status rows or compensating entries.

## 10.5 Data Requiring Encryption at Rest

| Data | Classification | Encryption Method |
|---|---|---|
| `creator_profiles.pan_number` | HIGHLY SENSITIVE | Supabase Vault or application-level encryption |
| `creator_profiles.bank_details` | HIGHLY SENSITIVE | Supabase Vault or application-level encryption |
| Phone numbers | CONFIDENTIAL | Consider: store hashed for lookup, encrypted for display |
| OTP codes | HIGHLY SENSITIVE | Store hashed (bcrypt), never plaintext. Auto-expire |
| Razorpay webhook payloads | CONFIDENTIAL | Encrypt at rest, access-logged |

## 10.6 Missing Indexes (Beyond What Schema Has)

```sql
-- Critical for operations
CREATE INDEX idx_orders_client_status ON orders(client_id, status);
CREATE INDEX idx_projects_status_deadline ON projects(status, internal_deadline);
CREATE INDEX idx_assignments_project_status ON assignments(project_id, status);
CREATE INDEX idx_assignments_creator_status ON assignments(creator_id, status);
CREATE INDEX idx_creator_profiles_approval ON creator_profiles(approval_status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_access_grants_expires ON access_grants(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_payments_gateway_ref ON payments(gateway_ref);  -- webhook lookup
CREATE INDEX idx_change_orders_status ON change_orders(status);
CREATE INDEX idx_creator_payouts_status ON creator_payouts(status);
```

---

# PART 11 — FINANCIAL LEDGER AUDIT

## 11.1 Current State: Transaction Table, Not a Ledger

The current design has separate tables: `payments`, `payouts`, `invoices`, `refund_entries`. This is a transaction recording system, not a financial ledger.

**Why it matters**: Without a proper ledger:
- You cannot reconcile "money in vs money out" systematically
- You cannot generate financial statements
- You cannot prove to an auditor that every rupee is accounted for
- GST returns require structured input/output records
- Errors compound silently

## 11.2 Is Double-Entry Necessary?

**For V1**: No. A double-entry ledger is overkill for <100 transactions/month.

**For V2+**: A simplified double-entry ledger should be introduced when:
- Monthly transaction volume exceeds 500
- GST filing becomes regular
- Accountant needs structured data export

## 11.3 Minimum Practical Financial Model (V1)

Instead of full double-entry, use an **immutable financial event log**:

```sql
CREATE TABLE financial_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT CHECK (event_type IN (
    'client_payment',         -- money in from client
    'gateway_fee',            -- deducted by Razorpay
    'gst_liability',          -- GST owed to government
    'creator_payable',        -- amount owed to creator
    'tds_withheld',           -- TDS deducted from creator
    'creator_payout',         -- actual NEFT payment to creator
    'payout_failed',          -- payout attempt failed
    'payout_reversed',        -- payout was reversed
    'client_refund',          -- money returned to client
    'refund_gateway_recovery',-- gateway fee recovery on refund (partial)
    'chargeback',             -- bank-initiated reversal
    'chargeback_defense',     -- successful chargeback dispute
    'manual_adjustment',      -- admin manual correction
    'artsy_revenue'           -- Artsy's recognized revenue
  )) NOT NULL,
  
  -- Linked entities
  order_id        UUID REFERENCES orders(id),
  project_id      UUID REFERENCES projects(id),
  payment_id      UUID REFERENCES payments(id),
  payout_id       UUID REFERENCES creator_payouts(id),
  
  -- Financial
  amount          INTEGER NOT NULL,           -- in paise, positive = credit, negative = debit
  currency        TEXT DEFAULT 'INR',
  
  -- Counterparty
  counterparty_type TEXT CHECK (counterparty_type IN ('client', 'creator', 'gateway', 'government', 'artsy')),
  counterparty_id UUID,                       -- user_id if client/creator
  
  -- Audit
  reference       TEXT,                       -- gateway ref, NEFT ref, etc.
  notes           TEXT,
  created_by      UUID REFERENCES users(id),  -- admin who created (for manual adjustments)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- IMMUTABLE: no updated_at, no soft delete
  -- Corrections are new events, not edits
  CONSTRAINT no_zero_amount CHECK (amount != 0)
);

CREATE INDEX idx_financial_events_order ON financial_events(order_id);
CREATE INDEX idx_financial_events_type ON financial_events(event_type);
CREATE INDEX idx_financial_events_date ON financial_events(created_at);
```

### Example: Complete Order Lifecycle in the Ledger

```
Order: ₹8,000 wedding highlight, completed successfully.

1. client_payment:    +800000 paise  (client → Artsy via Razorpay)
2. gateway_fee:       -18880 paise   (Razorpay deducts 2% + GST on fee)
3. gst_liability:     -122034 paise  (Artsy owes to government)
4. creator_payable:   -494315 paise  (75% of net owed to creator)
5. artsy_revenue:     -164771 paise  (Artsy's 25% share)
6. tds_withheld:      -49432 paise   (10% of creator payable)
7. creator_payout:    -444883 paise  (net to creator bank account)

Verification: Sum of all events for this order = 0 ✓
(800000 - 18880 - 122034 - 494315 - 164771 = 0)
(creator_payable 494315 = tds_withheld 49432 + creator_payout 444883)
```

### Reconciliation Query

```sql
-- Daily reconciliation: does money in = money out?
SELECT 
  DATE(created_at) as date,
  SUM(CASE WHEN event_type = 'client_payment' THEN amount ELSE 0 END) as money_in,
  SUM(CASE WHEN event_type != 'client_payment' THEN amount ELSE 0 END) as money_out,
  SUM(amount) as balance  -- should be 0
FROM financial_events
GROUP BY DATE(created_at);
```

---

# PART 12 — GST / TDS / INDIA COMPLIANCE AUDIT

## 12.1 Classification Table

| Item | Classification | Confidence |
|---|---|---|
| GST rate for post-production services | **18%** (SAC 999613) | **FACT** (verified) — but NEEDS ACCOUNTANT CONFIRMATION for Artsy's specific classification |
| GST registration threshold | ₹20 lakh aggregate turnover | **FACT** |
| GST absorbed into displayed price | **PRODUCT DECISION** | Correct approach — client sees all-inclusive price |
| GST itemization on invoice | **LEGAL REQUIREMENT** once GST registered | FACT |
| TDS section for video editing freelancers | **UNCLEAR** — 194J (10%) vs 194C (1-2%) | **NEEDS ACCOUNTANT/LAWYER CONFIRMATION** |
| TDS threshold (194J) | ₹50,000/year per payee | **FACT** |
| TDS threshold (194C) | ₹30,000/single payment or ₹1,00,000/year | **FACT** |
| TAN required for TDS deduction | Yes | **FACT** |
| PAN required from freelancer | Yes | **FACT** |
| TDS rate without PAN | 20% | **FACT** |
| Business entity required before GST/TAN | Yes | **FACT** |
| Razorpay needs business entity | Yes | **FACT** |
| DPDP Act full enforcement | May 13, 2027 | **FACT** (verified) |
| DPDP consent requirement | Free, specific, informed consent | **FACT** |
| DPDP breach notification | Mandatory to DPB + affected individuals | **FACT** |
| DPDP penalty | Up to ₹250 crore per contravention | **FACT** |

## 12.2 Critical Compliance Gaps

### Gap 1: No Business Entity

> [!CAUTION]
> The plan acknowledges no business entity exists yet. Without it:
> - Cannot register for GST
> - Cannot get TAN for TDS
> - Cannot open Razorpay merchant account
> - Cannot legally accept payments
> - Cannot issue valid invoices
>
> **This is THE blocking dependency.** Timeline: Proprietorship registration = 1-2 weeks. LLP/Pvt Ltd = 2-4 weeks. GST registration after entity = 3-7 working days. TAN = 7-14 days.
>
> **RECOMMENDATION**: Register as **Sole Proprietorship** immediately (fastest). Convert to LLP/Pvt Ltd later if needed. Start GST + TAN applications in parallel.

### Gap 2: GST Before Registration

The plan has a `gst_enabled` config flag. This is correct — but:

| Period | Behavior |
|---|---|
| Pre-GST registration | No GST charged. Invoice shows only total. No GSTIN on invoice |
| Post-GST registration | GST calculated and shown on invoice. GSTIN displayed. |
| Transition | All orders placed pre-registration are NOT retrospectively GST'd |

**ASSUMPTION** (needs accountant confirmation): If Artsy's turnover is below ₹20 lakh, GST registration is optional. But voluntary registration is recommended because: (a) it builds credibility, (b) you can claim input tax credit on expenses (software, hosting, etc.).

### Gap 3: TDS Implementation Ambiguity

Two possible TDS classifications exist:

**Scenario A: Section 194J (Professional/Technical Services)**
- Rate: 10%
- Threshold: ₹50,000/year per freelancer
- Used when: service requires specialized knowledge/skill

**Scenario B: Section 194C (Contractor)**
- Rate: 1% (individual freelancer)
- Threshold: ₹30,000/single or ₹1,00,000/year
- Used when: execution of a specified work contract

**Video editing is genuinely ambiguous.** Some accountants classify it as 194J (technical expertise), others as 194C (execution of a deliverable).

**RECOMMENDATION**: 
1. Get written opinion from CA
2. Build the system to support BOTH rates (configurable per creator or globally)
3. Default to 194J (10%) — it's the safer/conservative classification
4. Store the section and rate on each payout record for audit

### Gap 4: Invoice Requirements

A valid GST invoice must contain (when GST registered):

| Field | Present in Plan? |
|---|---|
| Invoice number (sequential) | ✅ `invoice_number TEXT UNIQUE` |
| Invoice date | ✅ `created_at` |
| Client name | ❌ **MISSING** — `users` table has no name in plan schema (only phone) |
| Client address | ❌ **MISSING** |
| Client GSTIN (if B2B) | ❌ **MISSING** |
| Artsy GSTIN | ✅ configurable |
| SAC code | ❌ **MISSING** |
| Description of service | ❌ **MISSING** on invoice table |
| Taxable value | ✅ `subtotal` |
| GST rate | ✅ `gst_rate` |
| CGST + SGST (intra-state) or IGST (inter-state) | ❌ **MISSING** — GST must be split for filing |
| Total | ✅ `total` |
| Place of supply | ❌ **MISSING** — required for CGST/SGST vs IGST determination |

> [!WARNING]
> **For B2B clients (corporate/event category), the client's GSTIN is needed on the invoice.** The current system doesn't collect client business details. V1 can defer this for B2C (individual wedding clients), but corporate clients will need it.

### Gap 5: TDS Certificate (Form 16A)

The plan mentions `form16a_url` on `creator_payouts`. Form 16A must be:
- Generated quarterly (Q1-Q4)
- Filed with government (Form 26Q)
- Issued to freelancer within 15 days of quarterly filing

**This requires dedicated accounting integration or manual CA involvement.** The platform should generate the data; the actual Form 16A generation should be handled by accounting software.

---

# PART 13 — SECURITY AUDIT

## 13.1 Authentication & Session Security

| Vulnerability | Severity | Status | Mitigation |
|---|---|---|---|
| **OTP brute force** | 🔴 HIGH | No rate limiting defined | Max 5 OTP attempts per phone per 10 minutes. Lock account after 10 failures in 1 hour. Progressive cooldown |
| **OTP reuse** | 🔴 HIGH | Not addressed | Single-use OTP. Invalidate on first verification attempt (success or failure). Expire after 5 minutes |
| **OTP interception** | 🟡 MEDIUM | WhatsApp E2E encrypted | Acceptable risk for V1. Add 2FA for admin in V2 |
| **Phone number enumeration** | 🟡 MEDIUM | Not addressed | Don't reveal if phone exists. Same response for "OTP sent" whether account exists or not |
| **No SMS fallback** | 🟡 MEDIUM | Plan only mentions WhatsApp | WhatsApp delivery can fail (no internet, blocked). Add SMS fallback option |
| **Session fixation** | 🟡 MEDIUM | Not addressed | Regenerate session token on login. Invalidate old sessions |
| **Multi-device sessions** | 🟡 LOW | Not addressed | Allow max 3 concurrent sessions. Show active sessions in profile |
| **Admin has same auth as users** | 🔴 HIGH | Same OTP flow | Admin should have stronger auth: OTP + PIN/password, or OTP + device binding |
| **No admin IP restriction** | 🟡 MEDIUM | Not addressed | V1: Log admin IP. V2: Allow admin access only from whitelisted IPs |

## 13.2 Authorization & Access Control

| Vulnerability | Severity | Current State | Mitigation |
|---|---|---|---|
| **Role stored client-side** | 🔴 HIGH | `role` in user record, RLS checks | Role MUST be server-verified on every request. Never trust client-sent role |
| **IDOR on project access** | 🔴 HIGH | RLS policy exists but complex joins | Test: can client A access client B's project by changing UUID in URL? RLS must handle this |
| **IDOR on payment info** | 🔴 HIGH | Payments RLS joins through orders | Test: can user access another user's payment records? |
| **Creator accessing other projects** | 🔴 HIGH | RLS checks assignment | Test: can creator A see creator B's assigned project? |
| **Admin actions unaudited** | 🟡 MEDIUM | `audit_logs` referenced but not implemented | Every admin action must be logged: who, what, when, old value, new value |
| **RLS bypass via direct SQL** | 🟡 MEDIUM | If Supabase service key is exposed | Never use service key in frontend. Edge Functions only |
| **Freelancer updates own approval_status** | 🔴 HIGH | RLS allows self-update on `creator_profiles` | RLS must EXCLUDE `approval_status`, `approved_at`, `approved_by` from self-update policy |
| **Creator modifies own payout amount** | 🔴 HIGH | No explicit restriction | Creator should have NO write access to `creator_payouts` |

## 13.3 Payment Security

| Vulnerability | Severity | Mitigation |
|---|---|---|---|
| **Webhook signature not verified** | 🔴 CRITICAL | Plan mentions `webhook.ts — Webhook signature verification` but no implementation detail | Verify Razorpay webhook signature using `X-Razorpay-Signature` header with HMAC SHA256. Reject unverified webhooks |
| **Duplicate webhook processing** | 🔴 HIGH | No idempotency key | Store `razorpay_payment_id` in `webhook_events` table. Check existence before processing. Use database transaction |
| **Payment amount tampering** | 🔴 HIGH | Client-side price → backend → Razorpay | Always recalculate price server-side from order ID. Never use client-sent amount |
| **Razorpay secret in frontend** | 🔴 CRITICAL | Not addressed | Key ID goes to frontend (public). Secret stays server-side only. Never expose |
| **Refund without authorization** | 🟡 MEDIUM | Refund requires admin approval | Enforce: refund API requires admin role + specific reason + amount validation |

## 13.4 File Access Security

| Vulnerability | Severity | Mitigation |
|---|---|---|
| **Drive folder becomes public accidentally** | 🔴 CRITICAL | All-or-nothing exposure of private footage | Programmatic permission management only. No manual sharing. Audit permissions daily |
| **Creator retains access after project ends** | 🔴 HIGH | `access_grants.revoked_at` exists | Cron job: revoke all access where `expires_at < NOW()`. Verify via Drive API |
| **Client files accessible via guessable Drive URL** | 🟡 MEDIUM | Drive uses long IDs but shared links could leak | Never use "anyone with link" sharing. Only grant to specific Google accounts |
| **Video preview URL guessable** | 🟡 MEDIUM | Bunny Stream can use signed URLs | Enable signed/token-authenticated playback. Time-limited tokens (24h) |
| **File metadata exposes client info** | 🟡 MEDIUM | EXIF data in photos/videos | Strip metadata from uploaded files before creator access (for photos). Video metadata is harder — accept the risk for V1 |

## 13.5 API Security

| Vulnerability | Severity | Mitigation |
|---|---|---|
| **No rate limiting on APIs** | 🔴 HIGH | Not addressed | Implement rate limiting: 100 requests/minute per user, 10 requests/minute on auth endpoints |
| **No input validation** | 🟡 MEDIUM | Not addressed | Validate all inputs: phone format, PAN format, file types, JSON schemas |
| **GraphQL/REST over-fetching** | 🟡 LOW | Supabase PostgREST | RLS handles this, but limit `select` columns in queries |
| **Prompt injection via requirements** | 🟡 MEDIUM | Client requirements text fed to AI (V3+) | Sanitize all client text before passing to LLM. Never include system prompts in user-visible text |
| **No CORS policy defined** | 🟡 MEDIUM | Not addressed | Strict CORS: allow only Artsy domain origins |
| **Secrets in .env exposed** | 🔴 HIGH | `.env.local` exists in repo | Add `.env.local` to `.gitignore` (check). Never commit secrets |
| **No CSP headers** | 🟡 MEDIUM | Not addressed | Add Content-Security-Policy headers to prevent XSS |

## 13.6 Data Security

| Vulnerability | Severity | Mitigation |
|---|---|---|
| **PAN stored without encryption** | 🔴 HIGH | Plan says "encrypted via Supabase Vault" but schema has `TEXT` | Use Supabase Vault (pgsodium) or application-level AES-256 encryption |
| **Bank details in plain JSONB** | 🔴 HIGH | Schema has `JSONB` without encryption | Encrypt each field separately before storing |
| **No database backup strategy** | 🔴 HIGH | Not addressed | Supabase Pro includes daily backups. Enable Point-in-Time Recovery. Test restoration quarterly |
| **No encryption at rest for Supabase** | 🟡 MEDIUM | Supabase encrypts at rest by default on Pro plans | Verify with Supabase that encryption at rest is enabled |

---

# PART 14 — DATA PRIVACY AUDIT

## 14.1 Data Classification Table

| Data Element | Classification | Collected From | Stored In | Who Can Access |
|---|---|---|---|---|
| Phone number | **CONFIDENTIAL** | Client, Creator | `users.phone` | Self, Admin |
| Client name | **INTERNAL** | Not currently collected (gap!) | — | Self, Admin |
| Creator display name | **INTERNAL** | Creator onboarding | `creator_profiles.display_name` | Admin (NOT client — anonymised) |
| Creator bio/skills | **INTERNAL** | Creator onboarding | `creator_profiles` | Admin |
| PAN number | **HIGHLY SENSITIVE** | Creator onboarding | `creator_profiles.pan_number` (encrypted) | Creator (masked: XXXX1234X), Admin (full, logged access) |
| Bank account number | **HIGHLY SENSITIVE** | Creator onboarding | `creator_profiles.bank_details` (encrypted) | Creator (masked: XXXX5678), Admin (full, logged access) |
| IFSC code | **CONFIDENTIAL** | Creator onboarding | `creator_profiles.bank_details` | Creator, Admin |
| Wedding footage | **HIGHLY SENSITIVE** | Client upload | Google Drive | Assigned Creator (time-limited), Admin |
| Faces in footage | **HIGHLY SENSITIVE** | Client upload (embedded) | Google Drive, Bunny Stream | Cannot be technically separated from footage |
| Venue info in footage | **CONFIDENTIAL** | Client upload (embedded) | Google Drive, Bunny Stream | Same as footage |
| Client requirements | **CONFIDENTIAL** | Requirement wizard | `orders.requirements_json` | Admin, Assigned Creator (anonymised job card) |
| Payment info | **CONFIDENTIAL** | Razorpay (not stored by Artsy) | Razorpay servers | Razorpay, Admin (transaction ref only) |
| Project drafts (video) | **CONFIDENTIAL** | Creator submission | Bunny Stream | Client, Admin |
| Client revision comments | **CONFIDENTIAL** | Client review | `revisions` | Client, Assigned Creator, Admin |
| Payout details | **HIGHLY SENSITIVE** | Financial events | `creator_payouts` | Creator (own), Admin |
| OTP codes | **HIGHLY SENSITIVE** | Generated | Ephemeral (should not persist) | System only |
| Audit logs | **INTERNAL** | System | `audit_logs` | Admin only |
| AI decision logs | **INTERNAL** | System | `ai_decision_log` | Admin only |
| Analytics data | **INTERNAL** | System | Analytics store | Admin only |
| Marketing consent | **CONFIDENTIAL** | Client (explicit opt-in) | `orders.marketing_consent` | Admin |

## 14.2 Privacy Gaps

| Gap | Impact | DPDP Requirement |
|---|---|---|
| **No privacy policy page** | Cannot collect consent | Must exist before collecting any personal data |
| **No consent record** | Cannot prove consent was given | Must store timestamp + policy version + method |
| **No data export mechanism** | DPDP violation | Data Principal has right to access their data |
| **No data deletion workflow** | DPDP violation | Data Principal has right to erasure |
| **No data retention policy for personal data** | DPDP violation | Data must not be retained beyond purpose |
| **No breach notification process** | DPDP violation (₹250 crore penalty) | Must notify DPB + affected individuals |
| **Creator sees client footage (including faces)** | Privacy risk | Contractual protection only — the plan acknowledges this |
| **No consent for marketing use of final video** | Plan mentions it but no mechanism | Must be explicit opt-in, revocable |
| **Phone number used as primary identifier** | Medium risk | If breached, directly identifies person |

## 14.3 DPDP Compliance Checklist

| Requirement | Status | Action Needed |
|---|---|---|
| Privacy Policy | ❌ Not drafted | Draft before launch. Must be in English + Hindi at minimum |
| Consent collection (registration) | ❌ No mechanism | Add consent checkbox + timestamp |
| Consent collection (marketing) | Partial (`marketing_consent` field) | Make it opt-in, not pre-checked |
| Right to Access | ❌ No endpoint | Build data export API |
| Right to Correction | ❌ No mechanism | Allow profile editing |
| Right to Erasure | ❌ No mechanism | Build deletion request workflow |
| Grievance Redressal | ❌ No mechanism | Designate a grievance officer, publish contact |
| Breach Notification | ❌ No process | Define incident response plan |
| Children's Data | N/A | Platform is B2B/B2C for adults. Add age gate if needed |
| Data Processing Agreement (with freelancers) | ❌ Not drafted | Freelancers process client data; need DPA |
| Data Processing Agreement (with Supabase, Razorpay, etc.) | ❌ Not checked | Verify DPA exists with each service provider |

---

# PART 15 — RETENTION / DELETION AUDIT

## 15.1 Current Policy

| Asset | Retention | Timer Starts |
|---|---|---|
| Raw footage (Drive) | ~15 days | Project completion |
| Final files (Bunny Stream + Drive) | ~30 days | Project completion |

## 15.2 Complete Retention Lifecycle

```
PROJECT COMPLETED
  ↓ Day 0
[RETENTION_ACTIVE]
  │
  ├── Day 0: Final delivery link active
  │          Client notified: "Download your files within 30 days"
  │
  ├── Day 8: Raw footage deletion WARNING
  │          WhatsApp: "Raw footage will be deleted in 7 days"
  │
  ├── Day 12: Raw footage FINAL WARNING
  │          WhatsApp: "Raw footage deleted in 3 days. Download now"
  │
  ├── Day 14: Raw footage LAST WARNING
  │          WhatsApp: "Raw footage deleted TOMORROW"
  │
  ├── Day 15: RAW FOOTAGE DELETED
  │          ├── Drive: folder contents deleted (not trashed — permanently deleted)
  │          ├── Database: file records marked deleted_at
  │          ├── Drive permission revoked for creator
  │          └── Access grants expired
  │
  ├── Day 23: Final files deletion WARNING
  │          WhatsApp: "Final files will be deleted in 7 days"
  │
  ├── Day 27: Final files FINAL WARNING
  │          WhatsApp: "Final files deleted in 3 days"
  │
  ├── Day 29: Final files LAST WARNING
  │          WhatsApp: "Final files deleted TOMORROW"
  │
  ├── Day 30: FINAL FILES DELETED
  │          ├── Bunny Stream: video deleted
  │          ├── Drive: final folder deleted
  │          └── Database: records marked deleted
  │
  └── Day 30+: [ARCHIVED]
               Only metadata remains in database
               No recoverable files
```

## 15.3 What CAN and CANNOT Be Deleted

| Item | Can Delete? | Why/Why Not |
|---|---|---|
| Raw footage on Drive | ✅ Yes | Client responsibility to download |
| Final video on Bunny | ✅ Yes | Client responsibility to download |
| Final video on Drive | ✅ Yes | Backup of Bunny, same policy |
| Drive folder structure | ✅ Yes | After all files deleted |
| Database: file metadata | ❌ No (soft delete) | Audit trail — needed for disputes, accounting |
| Database: order records | ❌ No | Financial/tax records — 7+ year retention (Indian tax law) |
| Database: payment records | ❌ No | Financial/tax records — 7+ year retention |
| Database: payout records | ❌ No | Financial/tax records — 7+ year retention |
| Database: invoices | ❌ No | Legal tax documents — 7+ year retention |
| Database: audit logs | ❌ No | Security/compliance — indefinite |
| Database: user account | ⚠️ Soft delete | DPDP requires erasure capability, but financial records must be retained. Solution: anonymize personal data, retain transaction records |
| Dispute evidence | ❌ No (until resolved) | Legal hold — must retain until dispute resolved + statutory period |
| Drive Trash | ⚠️ Verify | Google Drive trash retains files for 30 days. Must empty trash explicitly or files are recoverable |
| Bunny Stream deleted videos | ⚠️ Verify | Check Bunny's deletion finality — is there a grace period? |
| Revision comments | ⚠️ Depends | Anonymize if user requests deletion. Retain comment text without PII for quality analytics |

## 15.4 Critical Gaps

| Gap | Impact |
|---|---|
| **No automated deletion job** | Files stay forever if no cron job runs. Manual = forgotten |
| **No admin override for retention** | What if client asks for 7-day extension? No mechanism |
| **No legal hold mechanism** | If client disputes on day 14, raw footage already deleted |
| **Drive Trash not emptied** | "Deleted" files recoverable from trash for 30 days — privacy issue |
| **No deletion confirmation notification** | Client should receive "Files have been deleted" confirmation |
| **Financial records retention period** | Not specified. Indian tax law requires 7+ years for financial documents |
| **DPDP data deletion vs financial retention conflict** | User requests erasure, but financial records must be kept. Solution: anonymize PII, retain financial data |

---

# PART 16 — PROJECT STATE MACHINE

## 16.1 Complete Project Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROJECT STATE MACHINE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [DRAFT]                                                            │
│    ↓ (client submits requirements)                                  │
│  [QUOTED]                                                           │
│    ├── auto-quote (within admin range)                              │
│    └── [PENDING_PRICE_APPROVAL] → admin approves → [QUOTED]        │
│    ↓ (client proceeds to checkout)                                  │
│  [PAYMENT_PENDING]                                                  │
│    ├── payment succeeds → [PAID]                                    │
│    ├── payment fails → retry or [PAYMENT_FAILED] → expire          │
│    └── payment timeout → [EXPIRED]                                  │
│    ↓                                                                │
│  [PAID]                                                             │
│    ↓                                                                │
│  [AWAITING_UPLOAD]                                                  │
│    ├── client uploads → [UPLOAD_PROCESSING]                         │
│    └── no upload 7 days → admin reminder → 14 days → [STALE]       │
│    ↓                                                                │
│  [UPLOAD_PROCESSING]                                                │
│    ├── verification passed → [UPLOAD_COMPLETE]                      │
│    └── verification failed → [UPLOAD_FAILED] → client re-uploads   │
│    ↓                                                                │
│  [UPLOAD_COMPLETE]                                                  │
│    ↓ (requirements complete)                                        │
│  [PENDING_ASSIGNMENT]                                               │
│    ↓ (matching engine + admin)                                      │
│  [CREATOR_PROPOSED]                                                 │
│    ├── creator accepts → [CREATOR_ASSIGNED]                         │
│    ├── creator declines → [PENDING_ASSIGNMENT] (re-propose)         │
│    └── creator timeout (24h) → [PENDING_ASSIGNMENT] (auto-decline)  │
│    ↓                                                                │
│  [CREATOR_ASSIGNED]                                                 │
│    ↓ (Drive access granted, deadline set)                           │
│  [IN_PROGRESS]                                                      │
│    ├── daily check-ins tracked                                      │
│    ├── missed check-in → [ESCALATED] → admin resolves → [IN_PROGRESS]│
│    ├── creator failure → [REASSIGNMENT_NEEDED] → [PENDING_ASSIGNMENT]│
│    └── creator submits deliverable                                  │
│    ↓                                                                │
│  [SUBMITTED]                                                        │
│    ↓ (admin QA review)                                              │
│  [QA_REVIEW]                                                        │
│    ├── QA pass → [CLIENT_REVIEW]                                    │
│    └── QA fail → [REVISION_NEEDED] → creator revises → [SUBMITTED]  │
│    ↓                                                                │
│  [CLIENT_REVIEW]                                                    │
│    ├── client approves → [APPROVED]                                 │
│    ├── client requests revision → [CLIENT_REVISION_REQUESTED]       │
│    │     ├── within revision limit → creator revises → [SUBMITTED]  │
│    │     └── exceeds limit → [CHANGE_ORDER_NEEDED]                  │
│    ├── client doesn't respond 7 days → [AUTO_APPROVED]              │
│    └── client disputes → [DISPUTED]                                 │
│    ↓                                                                │
│  [APPROVED] or [AUTO_APPROVED]                                      │
│    ↓                                                                │
│  [FINAL_DELIVERY]  (download links generated)                       │
│    ↓                                                                │
│  [COMPLETED]                                                        │
│    ↓ (retention timers start)                                       │
│  [RETENTION_ACTIVE]                                                 │
│    ├── raw footage expires → partial deletion                       │
│    └── final files expire                                           │
│    ↓                                                                │
│  [ARCHIVED]  (metadata only, no files)                              │
│                                                                     │
│  ── EXCEPTION STATES ──                                             │
│  [CANCELLED]        ← admin/client cancellation                     │
│  [REFUNDED]         ← refund processed (can follow CANCELLED)      │
│  [DISPUTED]         ← client disputes quality/delivery              │
│  [STALE]            ← no activity timeout                          │
│  [ON_HOLD]          ← admin pauses (scope change, issue)           │
│  [CHANGE_ORDER_NEEDED] ← scope change required                     │
│  [ESCALATED]        ← check-in missed, deadline risk               │
│  [PAYMENT_FAILED]   ← payment attempt failed                       │
│  [UPLOAD_FAILED]    ← file verification failed                     │
│  [REASSIGNMENT_NEEDED] ← creator failed/left                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### States in Plan vs States Needed

| Plan's States (Implementation Plan `projects.status`) | Missing States |
|---|---|
| `pending_assignment` | ✅ Present |
| `assigned` | Rename: `creator_assigned` (clearer) |
| `in_progress` | ✅ Present |
| `submitted` | ✅ Present |
| `qa_review` | ✅ Present |
| `revision_needed` | ✅ Present |
| `client_review` | ✅ Present |
| `approved` | ✅ Present |
| `completed` | ✅ Present |
| — | **MISSING**: `draft`, `quoted`, `payment_pending`, `paid`, `awaiting_upload`, `upload_processing`, `upload_complete`, `final_delivery`, `retention_active`, `archived`, `cancelled`, `refunded`, `disputed`, `stale`, `on_hold`, `escalated`, `change_order_needed`, `auto_approved` |

> The plan has 9 project statuses. A realistic implementation needs **~25 statuses** to handle all states and exceptions.

---

# PART 17 — NOTIFICATION SYSTEM AUDIT

## 17.1 Complete Notification Matrix

| # | Event | Client | Creator | Admin | Channel | Timing | Retry | Escalation |
|---|---|---|---|---|---|---|---|---|
| 1 | OTP sent | ✅ | ✅ | — | WhatsApp | Immediate | 1 retry after 60s | SMS fallback |
| 2 | Profile submitted | — | ✅ (confirmation) | ✅ | WA + In-app | Immediate | — | — |
| 3 | Profile approved | — | ✅ | — | WhatsApp | Immediate | 1 retry | — |
| 4 | Profile rejected | — | ✅ (with reason) | — | WhatsApp | Immediate | 1 retry | — |
| 5 | Quote ready | ✅ | — | — | WhatsApp + In-app | Immediate | 1 retry | — |
| 6 | Payment successful | ✅ | — | ✅ | WA + In-app | Immediate | — | — |
| 7 | Payment failed | ✅ | — | — | WhatsApp | Immediate | — | — |
| 8 | Upload reminder (no upload 48h) | ✅ | — | — | WhatsApp | Delayed 48h | — | Admin alert at 7 days |
| 9 | Upload complete | ✅ | — | ✅ | In-app | Immediate | — | — |
| 10 | Upload failed/invalid | ✅ | — | — | WhatsApp + In-app | Immediate | — | — |
| 11 | Creator assigned | — | — | ✅ (log) | In-app | Immediate | — | — |
| 12 | Job offered to creator | — | ✅ | — | WhatsApp + In-app | Immediate | 1 retry | Auto-decline at 24h |
| 13 | Creator accepted | — | — | ✅ | In-app | Immediate | — | — |
| 14 | Creator declined | — | — | ✅ | In-app + WA | Immediate | — | Re-propose |
| 15 | Creator acceptance timeout | — | — | ✅ | WA + In-app | After 24h | — | Auto re-assign |
| 16 | Daily check-in prompt | — | ✅ | — | WhatsApp | Daily at preferred time | 1 reminder after 2h | Admin flagged |
| 17 | Check-in missed | — | — | ✅ | WA + In-app | After 2h of no response | — | Admin calls creator |
| 18 | Deadline risk (80% SLA) | — | — | ✅ | WA + In-app | Automatic | — | Reassignment option |
| 19 | Deliverable submitted | — | — | ✅ | In-app | Immediate | — | — |
| 20 | QA passed → preview ready | ✅ | — | — | WhatsApp + In-app | Immediate | 1 retry | — |
| 21 | QA failed → revision needed | — | ✅ | — | WA + In-app | Immediate | — | — |
| 22 | Client revision requested | — | ✅ | ✅ | WA + In-app | Immediate | — | — |
| 23 | Client review reminder (no response 3d) | ✅ | — | — | WhatsApp | After 3 days | — | Admin alert at 5 days |
| 24 | Client auto-approved (7d timeout) | ✅ | ✅ | ✅ | WA + In-app | After 7 days | — | — |
| 25 | Project completed | ✅ | ✅ | ✅ | WhatsApp | Immediate | — | — |
| 26 | Change order created | ✅ | — | — | WA + In-app | Immediate | 1 retry | Expire at 48h |
| 27 | Change order accepted | — | ✅ | ✅ | In-app | Immediate | — | — |
| 28 | Change order declined | — | — | ✅ | In-app | Immediate | — | — |
| 29 | Payout eligible | — | ✅ | ✅ | In-app | Immediate | — | — |
| 30 | Payout processed | — | ✅ | — | WhatsApp | Immediate | 1 retry | — |
| 31 | Payout failed | — | ✅ | ✅ | WA + In-app | Immediate | — | Admin resolves |
| 32 | Refund initiated | ✅ | — | — | WhatsApp | Immediate | — | — |
| 33 | Refund processed | ✅ | — | — | WhatsApp | Immediate | — | — |
| 34 | Dispute opened | ✅ | ✅ | ✅ | WA + In-app | Immediate | — | Admin resolves |
| 35 | Raw footage deletion warning (7d) | ✅ | — | — | WhatsApp | Day 8 post-completion | — | — |
| 36 | Raw footage deletion warning (3d) | ✅ | — | — | WhatsApp | Day 12 | — | — |
| 37 | Raw footage deletion warning (1d) | ✅ | — | — | WhatsApp | Day 14 | — | — |
| 38 | Raw footage deleted | ✅ | — | — | WhatsApp | Day 15 | — | — |
| 39 | Final files deletion warning (7d) | ✅ | — | — | WhatsApp | Day 23 | — | — |
| 40 | Final files deletion warning (3d) | ✅ | — | — | WhatsApp | Day 27 | — | — |
| 41 | Final files deleted | ✅ | — | — | WhatsApp | Day 30 | — | — |
| 42 | Creator suspended | — | ✅ | — | WhatsApp | Immediate | — | — |
| 43 | Project cancelled | ✅ | ✅ (if assigned) | ✅ | WA + In-app | Immediate | — | — |
| 44 | SLA breach | ✅ | — | ✅ | WA + In-app | Immediate | — | Admin intervenes |

### Missing from Plan's Notification Table

The implementation plan's Phase 7 lists **14 notification events**. The complete matrix above has **44 events** — over 3x more. The plan is missing 30 notification events.

---

# PART 18 — ADMIN PANEL AUDIT

## 18.1 Admin Controls Required (Without Code Changes)

| Category | Control | Status in Plan | Priority |
|---|---|---|---|
| **Services** | Create/edit/deactivate services | ✅ Defined | V1 |
| **Services** | Set base prices | ✅ Defined | V1 |
| **Services** | Configure pricing rules per service | ✅ Defined | V1 |
| **Services** | Set min/max price per service | **MISSING** | V1 |
| **Services** | Set included revision count per service | **MISSING** | V1 |
| **Services** | Set default SLA/deadline per service | **MISSING** | V1 |
| **Pricing** | Set AI confidence threshold | Mentioned (V3) | V3 |
| **Pricing** | Enable/disable AI pricing | Mentioned (V3) | V3 |
| **Pricing** | Override individual quote | ✅ Defined | V1 |
| **Taxes** | Toggle GST enabled/disabled | ✅ `platform_config` | V1 |
| **Taxes** | Set GST rate | ✅ `platform_config` | V1 |
| **Taxes** | Set GSTIN | ✅ `platform_config` | V1 |
| **Taxes** | Set TDS rate | ✅ `platform_config` | V1 |
| **Taxes** | Set TAN | **MISSING** from config | V1 |
| **Fees** | View/understand gateway fees | **MISSING** | V1 |
| **Creators** | Approve/reject applications | ✅ Defined | V1 |
| **Creators** | Suspend creator | **MISSING** screen | V1 |
| **Creators** | Reactivate creator | **MISSING** screen | V2 |
| **Creators** | View creator workload | **MISSING** | V1 |
| **Creators** | Set max concurrent assignments | **MISSING** | V1 |
| **Creators** | View creator payment history | **MISSING** screen | V1 |
| **Projects** | View all projects with filters | ✅ Defined | V1 |
| **Projects** | Change project status manually | **MISSING** | V1 |
| **Projects** | Reassign project | ✅ Defined (workflow) | V1 |
| **Projects** | Put project on hold | **MISSING** | V1 |
| **Projects** | Cancel project | **MISSING** screen | V1 |
| **Projects** | Extend deadline | **MISSING** | V1 |
| **Refunds** | Initiate refund | **MISSING** screen | V1 |
| **Refunds** | Set refund amount (full/partial) | **MISSING** | V1 |
| **Refunds** | View refund history | **MISSING** screen | V1 |
| **Payouts** | View pending payouts | ✅ Defined | V1 |
| **Payouts** | Approve/reject payout | ✅ Defined | V1 |
| **Payouts** | Retry failed payout | **MISSING** | V1 |
| **Payouts** | Manual payout entry (for offline NEFT) | **MISSING** | V1 |
| **Retention** | View upcoming deletions | **MISSING** | V1 |
| **Retention** | Extend retention for specific project | **MISSING** | V1 |
| **Retention** | Trigger manual deletion | **MISSING** | V1 |
| **Notifications** | View notification delivery status | **MISSING** | V2 |
| **Notifications** | Resend failed notification | **MISSING** | V2 |
| **AI** | Set confidence thresholds | **MISSING** (V3 scope) | V3 |
| **AI** | Enable/disable AI per feature | **MISSING** | V3 |
| **AI** | View AI decision log | **MISSING** | V3 |
| **Storage** | View Drive storage usage | **MISSING** | V1 |
| **Storage** | View Bunny Stream usage | **MISSING** | V1 |
| **Marketing** | View marketing consent analytics | **MISSING** | V2 |
| **Reviews** | Moderate client reviews | **MISSING** (no review system yet) | V2 |
| **Feature flags** | Toggle features on/off | **MISSING** | V1 |
| **Audit logs** | View admin action history | **MISSING** | V1 |
| **Analytics** | Revenue dashboard | **MISSING** | V1 (basic) |
| **Analytics** | Creator performance overview | **MISSING** | V2 |
| **Analytics** | Client acquisition metrics | **MISSING** | V2 |
| **Settings** | Platform name/contact/legal | **MISSING** | V1 |
| **Settings** | WhatsApp template management | **MISSING** | V2 |

### Plan defines 6 admin screens. Realistic V1 needs ~15-20 admin screens.

