# Artsy Production — Deep Technical/Product/Business Audit

> **Audit Date**: 2026-09-21
> **Source Documents Audited**:
> - [artsy-production-master-plan.md](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/artsy-production-master-plan.md)
> - [implementation_plan.md](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/implementation_plan.md)
> - [STATUS.md](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/STATUS.md)
> - [supabase_schema.sql](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/artsy-next/supabase_schema.sql)
>
> **Audit Scope**: Business model, pricing, financial flows, creator system, client workflow, storage, streaming, AI, database, compliance, security, privacy, operations, MVP readiness, and version roadmap.

---

# PART 1 — MASTER PLAN CONSISTENCY AUDIT

## 1.1 Business Model Identity Crisis

> [!CAUTION]
> The plan simultaneously describes Artsy as a **"two-sided marketplace"** (Section 1) and as a **managed service provider** where Admin controls assignment, QA, and delivery. These are fundamentally different business models with different legal, tax, and liability structures.

| Dimension | Marketplace Model | Managed Service Model | What The Plan Actually Does |
|---|---|---|---|
| Who contracts with client? | Freelancer (facilitated by platform) | **Artsy** | **Artsy** — client pays Artsy, not creator |
| Who is responsible for quality? | Freelancer | **Artsy** | **Artsy** — Admin QA before client sees anything |
| Who handles disputes? | Platform mediates | **Artsy resolves** | **Artsy** — Admin-controlled |
| Who assigns work? | Creator self-selects | **Artsy assigns** | **Artsy** — matching engine + Admin |
| Client-creator communication? | Direct (platform-mediated) | **None** | **None** — anonymised job cards |
| Who owns the relationship? | Both parties | **Artsy** | **Artsy** |

**Verdict**: Artsy is a **managed service provider with a curated editor pool**, not a marketplace. The "marketplace" label creates legal ambiguity.

**Why it matters**: 
- If Artsy is the service provider, Artsy issues the **GST invoice to the client** (not the freelancer). This is how the plan works.
- If Artsy were a marketplace, the freelancer would invoice the client, and Artsy would charge a commission. That's not what's described.
- The plan's actual workflow is correct for a managed service. But the word "marketplace" should be retired from formal documents to avoid legal confusion.

**RECOMMENDATION**: Classify Artsy as a **"managed creative services platform"** in all legal/business documents. The word "marketplace" can remain in marketing copy, but contracts, ToS, and internal architecture docs should use the correct model.

### Responsibility Matrix (Missing from Plan)

| Scenario | Responsible Party |
|---|---|
| Failed delivery | **Artsy** (re-assigns or refunds) |
| Quality dispute | **Artsy** (QA is Artsy's gate) |
| Creator failure (abandonment) | **Artsy** (re-assigns) |
| Refund | **Artsy** (client contracted with Artsy) |
| IP ownership | **Client** (per plan) |
| Creator misconduct | **Artsy** (contractual enforcement) |
| Data breach | **Artsy** (Data Fiduciary under DPDP) |
| Chargeback | **Artsy** (merchant of record) |

> [!IMPORTANT]
> The plan never explicitly states who the **merchant of record** is. Since client pays Artsy via Razorpay, **Artsy is the merchant of record**, which means Artsy bears ALL chargeback liability. This is not mentioned anywhere.

---

## 1.2 Client Payment — Financial Model Audit

### The Critical Math Problem

The plan states:
1. Client-facing price is all-inclusive (e.g., ₹8,000)
2. GST is "absorbed" into the displayed price
3. Freelancer gets 75% of "client price"
4. Razorpay charges ~2% + GST on the fee

Let's trace the money for a ₹8,000 order:

```
Client pays:                               ₹8,000.00

Razorpay fee (2%):                        -₹  160.00
GST on Razorpay fee (18%):                -₹   28.80
─────────────────────────────────────────────────────
Artsy receives (settlement):               ₹7,811.20

GST payable to govt (18% of pre-GST base):
  Pre-GST base = ₹8,000 / 1.18           = ₹6,779.66
  GST component                           = ₹1,220.34

Creator payout (75% of ???):
  If 75% of ₹8,000 (gross client price)   = ₹6,000.00
  If 75% of ₹6,779.66 (pre-GST)           = ₹5,084.75
  If 75% of ₹7,811.20 (after gateway)     = ₹5,858.40
```

> [!CAUTION]
> **CRITICAL FINANCIAL VIABILITY ISSUE**: If the 75% is calculated from the gross ₹8,000:
>
> | Line Item | Amount |
> |---|---|
> | Artsy receives from Razorpay | ₹7,811.20 |
> | GST payable to government | -₹1,220.34 |
> | Creator payout (75% of ₹8,000) | -₹6,000.00 |
> | **Artsy net margin** | **₹590.86** |
> | **Margin percentage** | **7.4%** |
>
> That's a 7.4% margin, NOT 25%. At ₹5,000–₹8,000 order values, this is approximately ₹370–₹590 per project — barely covering admin time.

**The "75/25 split" is meaningless until the calculation base is defined.** This is flagged as an open question in the implementation plan but is a **blocking financial decision**.

### Recommended Financial Model

```
Client pays:                                    ₹8,000.00  (all-inclusive)

Step 1: Extract GST
  Pre-GST revenue = ₹8,000 / 1.18            = ₹6,779.66
  GST liability                                = ₹1,220.34

Step 2: Deduct gateway fee
  Razorpay fee (2% + GST on fee)              = ₹  188.80
  Net after GST + gateway                      = ₹6,590.86

Step 3: Split the net revenue
  Creator share (75% of net)                   = ₹4,943.15
  Artsy share (25% of net)                     = ₹1,647.71

Step 4: Creator payout
  Gross payout                                 = ₹4,943.15
  TDS (10% under 194J, or 2% under 194C)      = ₹  494.32 (or ₹98.86)
  Net payout to creator                        = ₹4,448.83 (or ₹4,844.29)
```

**This gives Artsy a true 20.6% margin** (₹1,647.71 on ₹8,000) which is operationally viable.

### Missing Financial Scenarios

| Scenario | Status in Plan |
|---|---|
| Full refund before work starts | Mentioned, no formula |
| Partial refund after work starts | "Progress-scaled" — no formula defined |
| Refund after completion | Not addressed |
| Scope change requiring additional payment | Explicitly flagged as undefined |
| Cancellation by client after payment | No cancellation fee structure |
| Cancellation by Artsy (e.g., no creator available) | Not addressed |
| Chargeback by client's bank | Not addressed at all |
| Failed payout to creator | Status exists in schema, no retry/resolution workflow |
| Gateway settlement delay | Not addressed |
| Multiple payment attempts (failed then succeeded) | Not addressed |
| Duplicate payment | Not addressed |
| Payment succeeded, order should not proceed | Not addressed |

### Contradictions Found

| Issue | Location 1 | Location 2 | Conflict |
|---|---|---|---|
| TDS rate | Master plan: "TDS deducted" (no rate) | Implementation plan: 10% | STATUS.md: "1% for freelancers" |
| Payout base | Master plan: "75% of client price" | Implementation plan: "75% of client price (in paise)" | Open question: "gross vs after GST/gateway fees" |
| Money storage | Implementation plan: `INTEGER` (paise) | SQL schema: `DECIMAL(10,2)` (rupees) | Incompatible representations |
| Schema user identity | Master plan: phone-only auth | SQL schema: `email TEXT UNIQUE NOT NULL` | Phone is optional in schema, email required |

---

# PART 2 — PRICING ENGINE AUDIT

## 2.1 Current Pricing Architecture

The plan describes:
```
Base price (admin-set per service)
  + Duration adjustment (multiplier)
  + Complexity adjustment (camera angles / footage volume)
  + Variant multiplier (number of deliverables)
  + Rush fee (if applicable)
  = Subtotal
  + GST (absorbed, shown separately on invoice only)
  = Total displayed to client
```

## 2.2 Missing Pricing Rules

| Rule | Status | Impact |
|---|---|---|
| Minimum order value | **MISSING** | Could receive ₹500 orders that cost more in admin time |
| Maximum order value | **MISSING** | No cap means AI could generate absurd quotes |
| Rush fee calculation | **UNDEFINED** | "If applicable" — what percentage? Flat fee? |
| Multi-angle fee | **PARTIAL** | Wedding highlights mention it; formula undefined |
| Volume discount (multiple products) | **MISSING** | Store/Product reels priced "per product" but no bulk discount |
| Repeat client discount | **MISSING** | No loyalty mechanism |
| Quote validity/expiry | **MISSING** | Quote could be used weeks later when costs change |
| Price locking mechanism | **MISSING** | After checkout, can the price change? |
| Revision pricing (beyond included) | **MISSING** | No included revision count defined; no per-revision fee |
| Change order pricing | **EXPLICITLY MISSING** | Plan acknowledges this gap |
| Currency handling | **MISSING** | All amounts assumed INR; no currency field in pricing engine |
| Rounding rules | **MISSING** | Paise calculations will produce fractions |
| Admin override audit trail | **PARTIAL** | `admin_approved_price` field exists; no history of WHY |
| Seasonal pricing | **MISSING** | Wedding season = higher demand; no mechanism |
| Bundle pricing | **MISSING** | Wedding Highlight + Full Film bundle? |

## 2.3 Pricing Data Model Gaps

The `services` table has `pricing_rules JSONB` — this is dangerously unstructured.

**Problem**: JSONB pricing rules means:
1. No schema validation — a typo breaks pricing silently
2. No version history — when admin changes rules, old quotes can't be reconstructed
3. No referential integrity — rules can reference nonexistent fields
4. No type safety — a string "10" vs number 10 causes different behavior

**RECOMMENDATION**: Create a structured `pricing_rules` table:

```sql
CREATE TABLE pricing_rules (
  id            UUID PRIMARY KEY,
  service_id    UUID REFERENCES services(id),
  rule_type     TEXT CHECK (rule_type IN (
    'duration_multiplier', 'complexity_multiplier',
    'variant_multiplier', 'rush_fee', 'format_fee',
    'minimum_price', 'maximum_price'
  )),
  condition     JSONB NOT NULL,     -- e.g., {"camera_angles": {"gte": 3}}
  adjustment    JSONB NOT NULL,     -- e.g., {"type": "multiply", "value": 1.5}
  priority      INTEGER DEFAULT 0,  -- evaluation order
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES users(id)
);
```

## 2.4 Complete Pricing Lifecycle (Proposed)

```
1. REQUIREMENT CAPTURE
   Client fills wizard → requirements_json created

2. QUOTE GENERATION
   Pricing engine evaluates:
   a) Load service base_price
   b) Apply pricing_rules in priority order
   c) Calculate subtotal
   d) Add GST (absorbed)
   e) Determine total
   f) AI confidence check (V3+)

3. QUOTE ROUTING
   IF price within admin floor/ceiling AND (AI confident OR no AI):
     → AUTO-QUOTE: show to client immediately
   ELSE:
     → ADMIN REVIEW: quote queued, client sees "Custom quote in progress"
     → Admin approves/adjusts → client notified

4. QUOTE PRESENTATION
   Client sees final all-inclusive price
   Quote snapshot stored (immutable):
     - service_id, base_price at time, rules applied, adjustments, GST rate, total
     - quote_valid_until (e.g., 7 days)

5. CHECKOUT
   Client proceeds → order created with status 'payment_pending'
   Price LOCKED from quote snapshot (not recalculated)

6. PAYMENT
   Razorpay checkout initiated
   On success (webhook): order → 'paid', project created
   On failure: order stays 'payment_pending', retry allowed

7. PRICE LOCK
   After payment, price is immutable
   Any change = Change Order (separate flow)

8. SCOPE CHANGE (if needed)
   See Part 3

9. COMPLETION
   Project approved → settlement calculations:
   a) Gateway fee (already deducted by Razorpay)
   b) GST liability recorded
   c) Creator payout calculated
   d) TDS calculated
   e) Artsy revenue recorded

10. SETTLEMENT
    Creator payout → NEFT (after admin approval)
    Invoice generated for client
    All entries immutable in financial ledger
```

### Missing Entity: `quotes` table

```sql
CREATE TABLE quotes (
  id              UUID PRIMARY KEY,
  order_id        UUID REFERENCES orders(id),
  service_id      UUID REFERENCES services(id),
  requirements    JSONB NOT NULL,           -- snapshot of wizard answers
  base_price      INTEGER NOT NULL,         -- service base_price at time
  adjustments     JSONB NOT NULL,           -- each rule applied + result
  subtotal        INTEGER NOT NULL,
  gst_rate        DECIMAL,
  gst_amount      INTEGER,
  total           INTEGER NOT NULL,
  ai_suggested    BOOLEAN DEFAULT FALSE,
  ai_confidence   DECIMAL,
  admin_reviewed  BOOLEAN DEFAULT FALSE,
  admin_id        UUID REFERENCES users(id),
  valid_until     TIMESTAMPTZ,
  status          TEXT CHECK (status IN ('draft','presented','accepted','expired','superseded')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

# PART 3 — CHANGE ORDER / SCOPE CREEP AUDIT

> [!CAUTION]
> The master plan explicitly acknowledges this is undefined: *"Change-order process is referenced in the specs but has no actual screens, workflow, or data model defined yet"* (Section 8). This is a **critical gap** because scope creep is the #1 source of disputes in creative services.

## 3.1 Scope Change Scenarios

| Scenario | Frequency | Complexity |
|---|---|---|
| Client uploads additional footage after project starts | Very common | Medium |
| Client wants a different song | Common | Low |
| Client wants additional output format (e.g., add 9:16 vertical) | Common | Medium |
| Client wants another version/variant | Common | High |
| Client's revisions exceed included count | Very common | Medium |
| Client wants longer final duration | Occasional | Medium |
| Client wants shorter deadline (rush after booking) | Occasional | Low |
| Revision request is actually new creative direction | Common | High — this is the dispute trigger |

## 3.2 Proposed Change Order Workflow

```
TRIGGER: One of the above scenarios detected
  ↓
DETECTION: 
  Manual: Admin identifies scope creep from revision comments or client message
  Semi-auto (V3+): AI flags revision as "out of original scope"
  ↓
CHANGE ORDER CREATED:
  Admin creates change_order record:
    - original_scope (snapshot from order requirements)
    - requested_change (description)
    - change_type (additional_footage | additional_format | additional_variant | 
                    extra_duration | extra_revisions | creative_redirect | rush_upgrade)
    - additional_price (calculated by admin; AI-suggested in V3+)
    - reason
  ↓
CLIENT NOTIFIED:
  WhatsApp + in-app: "Your project requires additional work outside the original scope"
  Client sees: change description, additional cost, Accept / Decline
  ↓
CLIENT DECISION:
  IF Accept:
    → Additional Razorpay payment collected
    → Change order status: 'accepted'
    → Original project scope updated (appended, not replaced)
    → Creator payout adjusted proportionally
    → Work continues
  IF Decline:
    → Change order status: 'declined'
    → Work continues on original scope ONLY
    → Admin decides if current revision requests fit original scope
  IF No Response (48h timeout):
    → Change order status: 'expired'
    → Work continues on original scope
    → Admin notified
  ↓
COMPLETION:
  Change order amounts included in final settlement
  Separate line items on invoice
  Creator payout includes change order share
```

## 3.3 Required Database Entities

```sql
CREATE TABLE change_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) NOT NULL,
  order_id          UUID REFERENCES orders(id) NOT NULL,
  change_type       TEXT CHECK (change_type IN (
    'additional_footage', 'additional_format', 'additional_variant',
    'extra_duration', 'extra_revisions', 'creative_redirect', 'rush_upgrade'
  )) NOT NULL,
  description       TEXT NOT NULL,
  original_scope    JSONB NOT NULL,            -- snapshot of original requirements
  requested_scope   JSONB NOT NULL,            -- what the change adds
  additional_price  INTEGER NOT NULL,          -- in paise
  gst_amount        INTEGER DEFAULT 0,
  total_price       INTEGER NOT NULL,
  
  -- Decision
  status            TEXT CHECK (status IN (
    'draft', 'pending_client', 'accepted', 'declined', 
    'expired', 'cancelled'
  )) DEFAULT 'draft',
  
  -- Payment
  payment_id        UUID REFERENCES payments(id),
  
  -- Audit
  created_by        UUID REFERENCES users(id), -- admin who created
  client_responded_at TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,               -- auto-expire if no response
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Track how change orders affect creator payout
CREATE TABLE change_order_payout_adjustments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id   UUID REFERENCES change_orders(id),
  assignment_id     UUID REFERENCES assignments(id),
  additional_payout INTEGER NOT NULL,          -- additional creator share
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

## 3.4 Revision Limit Policy (MISSING)

The plan never defines:
- How many revisions are included in the base price
- What constitutes a "revision round" vs "minor tweak"
- When extra revisions trigger a change order

**RECOMMENDATION**:
- **V1**: Include 2 revision rounds in base price. Define "revision round" as all timestamped comments submitted within a 48-hour review window.
- After 2 rounds, Admin creates a change order for additional revisions.
- Store `included_revisions` on the `services` table (admin-configurable, not hardcoded).
- Track `revision_count` on `projects`.

---

# PART 4 — FREELANCER / CREATOR SYSTEM AUDIT

## 4.1 Onboarding Gaps

| Step | Plan Status | Issue |
|---|---|---|
| Phone OTP login | ✅ Defined | — |
| Profile submission | ✅ Defined | — |
| Portfolio link | ✅ Defined | No validation that link actually works |
| Sample reels (links) | ✅ Defined | Links could die after approval; no periodic re-check |
| PAN submission | ✅ Defined | No PAN format validation (ABCDE1234F) |
| Bank details | ✅ Defined | No IFSC validation against RBI's IFSC directory |
| Admin approval | ✅ Defined | — |
| Rejection with reason | ✅ Defined | — |
| **Re-application after rejection** | **MISSING** | Can a rejected freelancer re-apply? When? |
| **Profile editing after approval** | **MISSING** | Can approved creator update skills/portfolio? Does it need re-approval? |
| **Agreement/NDA acceptance** | **MISSING** | No T&C acceptance step in onboarding |
| **Identity verification** | **MISSING** | PAN submitted but never verified against name |
| **Freelancer deactivation (self)** | **MISSING** | Creator wants to pause/leave |
| **Data deletion request** | **MISSING** | DPDP Act requirement |

## 4.2 Creator State Machine (Missing States Identified)

The plan implies a simple `pending → approved → rejected` flow. Real-world states:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATOR LIFECYCLE STATE MACHINE                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [REGISTERED] ──→ [ONBOARDING_INCOMPLETE]                          │
│       │                    │                                        │
│       │           (submits profile)                                 │
│       │                    ↓                                        │
│       │           [PENDING_REVIEW]                                  │
│       │                    │                                        │
│       │            ┌───────┴───────┐                                │
│       │            ↓               ↓                                │
│       │      [APPROVED]      [REJECTED]                             │
│       │            │               │                                │
│       │            ↓          (re-apply                              │
│       │      [ELIGIBLE]       after 30d?)                           │
│       │            │                                                │
│       │     (offered job)                                           │
│       │            ↓                                                │
│       │      [OFFERED] ──timeout──→ [ELIGIBLE]                     │
│       │         │    │              (auto-decline)                   │
│       │    (accept) (decline)                                       │
│       │         ↓      ↓                                            │
│       │    [ASSIGNED] [ELIGIBLE]                                    │
│       │         │                                                   │
│       │    (starts work)                                            │
│       │         ↓                                                   │
│       │    [WORKING]                                                │
│       │         │                                                   │
│       │    (submits deliverable)                                    │
│       │         ↓                                                   │
│       │    [SUBMITTED]                                              │
│       │         │                                                   │
│       │    ┌────┴────┐                                              │
│       │    ↓         ↓                                              │
│       │  [QA_PASS] [QA_FAIL] ──→ [REVISION_NEEDED] ──→ [WORKING]  │
│       │    │                                                        │
│       │    ↓                                                        │
│       │  [CLIENT_REVIEW]                                            │
│       │    │                                                        │
│       │  ┌─┴──────────┐                                             │
│       │  ↓             ↓                                            │
│       │ [APPROVED]  [REVISION] ──→ [WORKING]                       │
│       │  │                                                          │
│       │  ↓                                                          │
│       │ [PAYOUT_ELIGIBLE]                                           │
│       │  │                                                          │
│       │  ↓                                                          │
│       │ [PAYOUT_PROCESSING]                                         │
│       │  │                                                          │
│       │  ├──→ [PAID] ──→ [ELIGIBLE] (for new jobs)                 │
│       │  └──→ [PAYOUT_FAILED] ──→ (admin resolves)                 │
│       │                                                             │
│  EXCEPTION STATES:                                                  │
│  [SUSPENDED] ← (admin action: misconduct, missed check-ins)        │
│  [DEACTIVATED] ← (self-initiated: creator leaves)                  │
│  [DELETED] ← (data deletion request, DPDP)                         │
│  [REASSIGNED] ← (creator failed, admin moves project)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.3 Missing Creator System Features

| Feature | Status | Priority |
|---|---|---|
| Accept/decline timeout (how long to respond?) | **MISSING** | V1 |
| Max concurrent assignments per creator | **MISSING** | V1 |
| Creator workload visibility for admin | **MISSING** | V1 |
| Skill-to-service mapping validation | **MISSING** | V1 |
| Creator rating/performance tracking | Referenced but no mechanism defined | V2 |
| Creator dispute process | **MISSING** | V1 |
| Creator payment dispute (wrong amount, delayed) | **MISSING** | V1 |
| Creator NDA/agreement acceptance (digital) | **MISSING** | V1 — LEGAL BLOCKER |
| Creator confidentiality breach handling | Mentioned ("contractual"), no enforcement mechanism | V1 |
| Client poaching prevention | Anonymised cards help, but post-delivery? | V2 |
| Creator leaving mid-project | Only "admin reassigns" — no penalty/process defined | V1 |
| Creator data export (DPDP) | **MISSING** | V1 |
| Creator data deletion (DPDP) | **MISSING** | V1 |
| Creator suspension appeal | **MISSING** | V2 |
| Creator re-activation after suspension | **MISSING** | V2 |
| Multiple bank accounts | **MISSING** | V2 |
| Creator notification preferences | **MISSING** | V2 |

## 4.4 TDS Classification Issue

> [!WARNING]
> The plan uses 10% TDS (Section 194J — professional services) but STATUS.md says 1% (Section 194C — contract work).
>
> **Video editing by a freelancer could be classified either way.** The distinction depends on whether the service is "technical/professional" (194J at 10%) or "work contract/execution" (194C at 1% for individuals).
>
> **NEEDS ACCOUNTANT/LAWYER CONFIRMATION**: Get a written opinion on the correct section before building the TDS module. This affects every creator payout calculation.

---

# PART 5 — CLIENT WORKFLOW AUDIT

## 5.1 Happy Path (Defined in Plan)

```
Visitor → Service Catalog → Requirement Wizard → Quote → Login → 
Checkout → Payment → Upload → Project Active → Draft Review → 
Revision → Approval → Final Delivery → Retention → Deletion
```

## 5.2 Missing States and Exception Paths

| Exception | Status in Plan | Impact | Recommended Handling |
|---|---|---|---|
| **Abandoned checkout** | MISSING | Lost revenue, analytics needed | Track `draft` orders; send WhatsApp reminder after 24h; expire after 7 days |
| **Payment failure** | MISSING (only `failed` status exists) | Client stuck | Show retry option; allow 3 attempts; then expire with notification |
| **Payment success but browser closed** | MISSING | Client sees nothing | Webhook creates project regardless; client sees it on next login |
| **Payment success but webhook failed** | MISSING | **CRITICAL** — money taken, no project | Razorpay webhook retry (built-in); add reconciliation cron job to check Razorpay API for unmatched payments every 15 min |
| **Upload interrupted** | MISSING | Partial files on Drive | Use resumable uploads (Drive API supports this); show upload progress; allow resume |
| **Wrong files uploaded** | MISSING | Creator works on wrong footage | Allow file replacement before project starts; admin verification step |
| **Missing footage** | MISSING | Creator can't start | Admin flags, WhatsApp notification to client to re-upload |
| **Corrupted/unsupported file** | MISSING | Silent failure | Server-side validation: check file headers, minimum size, supported formats |
| **Client uploads more footage later** | MISSING | Scope creep | Allow additional uploads only before creator starts; after = change order |
| **Client disappears (no response)** | MISSING | Project in limbo | Auto-timeout: if no client response for 14 days → admin notified → project marked stale → 30-day auto-complete |
| **Client delays feedback** | MISSING | Creator waiting, payout delayed | SLA for client review: 5 days. Reminder at day 3. Auto-approve at day 7? (needs business decision) |
| **Client requests cancellation** | PARTIAL ("admin-reviewed") | No cancellation fee structure | Pre-assignment: full refund minus gateway fee. Post-assignment: progress-scaled. Post-delivery: no refund (dispute process) |
| **Client requests refund** | PARTIAL | No refund formula | Define: 100% if not assigned, 75% if assigned but not started, 50% if in progress, 0% if delivered |
| **Client exceeds revision allowance** | MISSING | Unpaid work | Change order triggered (see Part 3) |
| **Client disputes final delivery** | PARTIAL ("admin resolves") | No formal process | Escalation: admin reviews → mediates → decides refund/redo/close |
| **Client does not approve** | MISSING | Project never completes | Auto-approve after 7 days of no response post-delivery |
| **Project expires (SLA breach)** | MISSING | Client trust broken | Admin escalation at 80% SLA; client notified of delay |
| **Final files expire** | Defined (30 days) | Client loses files | 3 notifications: at 7 days, 3 days, 1 day before expiry |
| **Client wants to download after expiry** | MISSING | Recovery impossible? | Allow admin recovery within 30 days of deletion (soft delete → hard delete) |

## 5.3 Client State Machine (Complete)

```
[VISITOR]
  ↓ (browses services)
[BROWSING]
  ↓ (selects service, fills wizard)
[REQUIREMENTS_SUBMITTED]
  ↓ (quote generated)
  ├── [QUOTE_AUTO] → shown immediately
  └── [QUOTE_PENDING_ADMIN] → admin reviews
        ↓ (admin approves)
       [QUOTE_READY]
  ↓ (client sees price)
[QUOTE_PRESENTED]
  ├── (client proceeds)
  └── (client abandons) → [ABANDONED_CHECKOUT]
  ↓
[LOGIN_REQUIRED] → (OTP flow)
  ↓
[CHECKOUT]
  ↓ (payment initiated)
[PAYMENT_PENDING]
  ├── [PAYMENT_FAILED] → retry or expire
  ├── [PAYMENT_PROCESSING] → waiting for webhook
  └── [PAYMENT_SUCCESS]
  ↓
[AWAITING_UPLOAD]
  ↓ (client uploads raw footage)
[UPLOAD_IN_PROGRESS]
  ├── [UPLOAD_FAILED] → retry
  └── [UPLOAD_COMPLETE]
  ↓
[UPLOAD_VERIFICATION] (format/size check)
  ↓
[PENDING_ASSIGNMENT]
  ↓ (admin/engine assigns creator)
[CREATOR_ASSIGNED]
  ↓ (creator accepts)
[IN_PROGRESS]
  ↓ (creator submits)
[QA_REVIEW]
  ├── [QA_FAILED] → creator revision
  └── [QA_PASSED]
  ↓
[CLIENT_REVIEW]
  ├── [REVISION_REQUESTED] → creator revision → resubmit → QA
  ├── [APPROVED]
  └── [NO_RESPONSE_TIMEOUT] → auto-approve?
  ↓
[FINAL_DELIVERY]
  ↓ (download window open)
[COMPLETED]
  ↓ (retention timer)
[RETENTION_ACTIVE]
  ├── raw footage expires (15 days)
  └── final files expire (30 days)
  ↓
[ARCHIVED] (metadata only, files deleted)

EXCEPTION STATES:
[CANCELLED] ← client or admin cancellation
[REFUNDED] ← full or partial refund processed
[DISPUTED] ← client disputes, under admin review
[STALE] ← no activity for 14+ days
```

---

# PART 6 — GOOGLE DRIVE ARCHITECTURE AUDIT

## 6.1 Proposed Architecture (from Plan)

> "Client uploads through Artsy → Artsy-controlled Google Drive → project folder → controlled creator access"

## 6.2 Critical Architecture Questions (Unanswered)

| Question | Status | Impact |
|---|---|---|
| Service account vs OAuth? | **UNDEFINED** | Fundamental architecture decision |
| Whose Google account? | **UNDEFINED** | Determines storage limits and billing |
| 5TB Google One — personal account? | Implied | Service accounts DON'T use personal storage quotas |
| Who owns uploaded files? | **UNDEFINED** | Determines who can delete, who survives account suspension |
| How does the client upload? | **UNDEFINED** | Browser → Artsy server → Drive? Or browser → Drive directly? |

## 6.3 Recommended Architecture

**Use a Google Workspace account (not personal Google One)** with a service account for API operations:

```
CLIENT UPLOAD FLOW:
1. Client selects files in browser
2. Frontend requests upload URL from Artsy API
3. Artsy API creates project folder in Drive (via service account)
4. Artsy API generates resumable upload URI for that folder
5. Client browser uploads directly to Drive (resumable upload)
6. On completion: Artsy API verifies file integrity (size, hash)
7. File recorded in Artsy database

CREATOR ACCESS:
1. Creator assigned to project
2. Artsy API grants read-only permission to creator's Google account
   (using Drive API permissions.create)
3. Permission stored in access_grants table with expiry
4. Creator accesses folder via standard Drive UI or link
5. On project completion or reassignment: permission revoked via API

CRITICAL: Creator gets READ-ONLY access. They download to edit locally,
upload deliverables back to Artsy (via Bunny Stream, not Drive).
```

## 6.4 Failure Points

| Issue | Severity | Mitigation |
|---|---|---|
| **Google account suspended** | 🔴 CRITICAL | All files lost. Use Workspace (SLA + support), not consumer Gmail |
| **5TB storage exhaustion** | 🔴 HIGH | At 50GB per wedding project, 5TB = ~100 projects before deletion. Need retention policy enforcement + monitoring |
| **750GB daily upload limit** | 🟡 MEDIUM | At 50GB per project, max 15 projects uploading same day. Acceptable for V1 |
| **Drive API rate limits** | 🟡 MEDIUM | 1M quota units/min/project is generous. Use exponential backoff |
| **Large file upload failure** | 🔴 HIGH | Wedding footage can be 100GB+. MUST use resumable uploads with chunking |
| **Creator downloads footage, account suspended** | 🟡 MEDIUM | Files already on creator's local disk. Contractual protection only |
| **Folder permissions accidentally public** | 🔴 CRITICAL | Private wedding footage exposed. All folders must default to `private`. Never use "anyone with link" sharing |
| **Creator email not a Google account** | 🟡 MEDIUM | Drive sharing requires Google account. Creator must have one |
| **File virus/malware** | 🟡 MEDIUM | Drive scans files < 100MB. Large video files are NOT scanned. Low risk for video but not zero |
| **Duplicate uploads** | 🟡 LOW | Check file hash before accepting. Deduplicate |
| **Concurrent uploads from same client** | 🟡 LOW | Resumable uploads handle this |
| **Google Drive outage** | 🔴 HIGH | Uploads blocked. Show user-friendly error. Queue for retry |
| **Metadata leaks client identity** | 🟡 MEDIUM | File metadata (EXIF/XMP) may contain location, date, device. Not stripped by Drive |

> [!WARNING]
> **Service Account vs Personal Account**: A service account has its own isolated 15GB storage (cannot be upgraded to 5TB). If you use a service account, files are stored in the service account's Drive, NOT the 5TB personal Drive. To use the 5TB storage, you need either:
> 1. **Google Workspace** with domain-wide delegation (recommended), OR
> 2. **OAuth** with the 5TB account's credentials (fragile, requires refresh token management)
>
> **RECOMMENDATION**: Get a Google Workspace Business Standard plan ($12/user/month, 2TB per user but pooled). Use domain-wide delegation with a service account. This gives you: SLA, support, shared drives, proper API access, and audit logging.

## 6.5 Storage Capacity Planning

| Scale | Projects/month | Avg raw footage | Storage needed/month | Cumulative (pre-deletion) |
|---|---|---|---|---|
| V1 launch | 30 | 30GB | 900GB | 900GB |
| V1 growth | 100 | 30GB | 3TB | ~4.5TB (with 15-day retention) |
| V2 | 300 | 30GB | 9TB | ~13.5TB (with 15-day retention) |

At V1 growth, 5TB is already tight. **Google Workspace Business Plus** (3TB pooled per user) or **Enterprise** (5TB+ per user) would be needed.

---

# PART 7 — VIDEO PREVIEW / STREAMING AUDIT

## 7.1 Current Plan: Bunny Stream

The plan correctly identifies that Supabase Storage is unsuitable for video streaming and proposes Bunny Stream.

## 7.2 Feature Requirements vs Bunny Stream Capabilities

| Requirement | Bunny Stream Support | Notes |
|---|---|---|
| Upload API | ✅ | TUS (resumable) upload protocol |
| Transcoding | ✅ | Automatic, multiple resolutions |
| Adaptive bitrate | ✅ | HLS/DASH |
| Private videos | ✅ | Token authentication |
| Signed playback URLs | ✅ | Time-limited tokens |
| Download protection | ⚠️ Partial | No hard DRM at basic tier; $99/mo for Enterprise DRM |
| Watermarking | ❌ | Not built-in. Would need pre-processing |
| Timestamped comments | ❌ Not built-in | Must build custom overlay UI |
| Multiple versions (drafts) | ✅ | Different video IDs |
| Replacement versions | ✅ | Upload new video to same library |
| Player customization | ✅ | Customizable player |

## 7.3 Cost Projection

| Scale | Videos/month | Avg length | Storage cost | Bandwidth (India) | Total/month |
|---|---|---|---|---|---|
| V1 (30 projects) | 60 (drafts+finals) | 5 min each | ~$0.15 | ~$0.90 | **~$2/mo** |
| V1 growth (100 projects) | 200 | 5 min each | ~$0.50 | ~$3.00 | **~$5/mo** |
| V2 (300 projects) | 600 | 5 min each | ~$1.50 | ~$9.00 | **~$12/mo** |

**Verdict**: Bunny Stream is extremely cost-effective. The $1/month minimum applies early on. Good choice — **KEEP**.

## 7.4 Watermarking Gap

> [!IMPORTANT]
> The plan says *"no watermarking"* for creator access to raw footage, which is a deliberate decision. But **draft previews shown to clients** should have a watermark until final approval + payment confirmation. Without watermark on drafts:
> - Client could screenshot/screen-record the draft
> - Client could approve, download, then chargeback
>
> **RECOMMENDATION**: Add a light "DRAFT — Artsy Production" watermark to all preview videos before client approval. This can be done at transcode time (Bunny supports webhook on transcode completion → add watermark overlay via ffmpeg before upload). Move to V2 if too complex for V1.

## 7.5 Timestamped Comments Architecture

Bunny Stream's player doesn't have built-in commenting. You need a custom implementation:

```
Frontend:
  - Custom overlay on Bunny player
  - Click on timeline → capture currentTime
  - Comment input appears at that position
  - Existing comments shown as markers on timeline

Backend:
  - revisions table (already defined) stores timestamp_seconds + comment
  - Supabase Realtime for live updates

This is achievable but non-trivial. Estimate: 1-2 weeks of frontend work.
```

---

# PART 8 — AI AUDIT

## 8.1 AI Feature Matrix

| AI Feature | Plan Version | Input | Output | V1 Recommendation |
|---|---|---|---|---|
| Requirement AI | V3 | Wizard answers | Structured requirements | **NOT V1** — deterministic wizard is sufficient |
| Pricing AI | V3 | Requirements + historical data | Price suggestion | **NOT V1** — rule-based pricing engine |
| Creator Matching AI | V3 | Project requirements + creator profiles | Ranked creator list | **NOT V1** — admin manual assignment in V1 |
| Translation AI | Not specified | — | — | **NOT ANY VERSION** — not mentioned in plan |
| QA AI | V3 | Delivered video | Quality flags | **NOT V1** — admin manual QA |
| Revision Classification AI | V3 | Client comments | Categorized comments | **NOT V1** — simple tags by admin |
| Admin Learning System | V3 | Admin override history | Improved future suggestions | **V3 at earliest** — needs data first |
| Client Support AI | Not specified | — | — | **V4+** |
| Production Planner | Not specified | — | — | **V5** |

## 8.2 Per-Feature Deep Analysis

### Pricing AI (V3)

| Dimension | Assessment |
|---|---|
| **Input** | Wizard answers (structured JSON), historical order data |
| **Output** | Suggested price (integer, paise) + confidence score |
| **Data required** | Minimum ~100 completed orders with actual prices to calibrate. V1-V2 data collection is the prerequisite |
| **Model requirement** | NOT a trained model for V3. Use a **weighted rules engine** with admin-set weights. "AI" here should be a scoring formula, not LLM |
| **Deterministic rules required** | Floor price, ceiling price, GST calculation, rush multiplier — ALL must be deterministic, never AI |
| **Confidence threshold** | Admin-set (e.g., 0.85). Below this → route to admin |
| **Human approval** | Always available. In V3: auto-quote if confident. In V1-V2: every quote is effectively admin-approved |
| **Failure behavior** | If pricing engine fails: show "Custom quote — we'll contact you" and route to admin |
| **Audit logging** | Every AI suggestion logged with: input, output, confidence, whether admin overrode, admin's actual price |
| **Privacy** | No PII in pricing inputs. Low risk |
| **Cost** | Zero if rule-based. If using LLM: ~$0.01-0.05 per pricing call |
| **Version** | **V3** — needs historical data from V1/V2 |

### Creator Matching AI (V3)

| Dimension | Assessment |
|---|---|
| **Input** | Project requirements + available creator profiles + past performance |
| **Output** | Ranked list of creators with match scores |
| **Data required** | Creator performance history (≥20 completed projects to have meaningful signal) |
| **Model requirement** | Weighted scoring formula (V3). ML model only in V4+ with sufficient data |
| **Deterministic rules** | Availability check, skill match, max concurrent projects, suspension status — ALL must be hard filters before scoring |
| **Confidence threshold** | High confidence (>0.9) = auto-assign. Medium (0.7-0.9) = propose top 3 to admin. Low (<0.7) = admin-only |
| **Human approval** | Admin always has override. Never auto-assign in V1 |
| **Failure** | If no match found: alert admin for manual assignment |
| **Privacy** | Creator profiles are internal. Low risk. But matching criteria must not encode discriminatory biases |
| **Version** | **V3** — V1 is 100% manual admin assignment |

### QA AI (V3)

| Dimension | Assessment |
|---|---|
| **Input** | Delivered video file |
| **Output** | Quality flags (resolution mismatch, duration wrong, audio issues) |
| **Data required** | Project requirements (expected resolution, duration, format) |
| **Model requirement** | NOT ML. Use **ffprobe** for technical checks: resolution, duration, codec, audio levels. This is deterministic, not AI |
| **Deterministic rules** | Duration within ±10% of requirement, resolution matches, audio RMS above threshold, correct aspect ratio |
| **Human approval** | Always. QA AI flags issues; admin makes final call |
| **Failure** | If ffprobe check fails: skip automated checks, admin reviews manually |
| **Version** | **V2** for technical checks (ffprobe). V3+ for subjective quality |

### Revision Classification AI (V3)

| Dimension | Assessment |
|---|---|
| **Input** | Client revision comments (text) |
| **Output** | Categories: color, audio, pacing, content, transitions |
| **Data required** | Revision comment history (100+ to calibrate) |
| **Model requirement** | Simple keyword classification (V3). LLM only if keyword matching insufficient |
| **Version** | **V3** — useful but not critical |

## 8.3 AI + Rules + Human Approval Architecture

```
┌─────────────────────────────────────────────────────┐
│                  DECISION ARCHITECTURE              │
│                                                     │
│  Layer 1: HARD RULES (always enforced)              │
│  ┌─────────────────────────────────────────┐       │
│  │ • Price floor/ceiling                    │       │
│  │ • GST calculation                        │       │
│  │ • Creator availability check             │       │
│  │ • Skill match validation                 │       │
│  │ • Technical QA (ffprobe)                 │       │
│  │ • Business hours/SLA calculation         │       │
│  │ These CANNOT be overridden by AI         │       │
│  └─────────────────────────────────────────┘       │
│                      ↓                              │
│  Layer 2: SCORING ENGINE (V2+)                      │
│  ┌─────────────────────────────────────────┐       │
│  │ • Weighted pricing formula               │       │
│  │ • Creator match scoring                  │       │
│  │ • Revision categorization                │       │
│  │ Admin configures weights, not model      │       │
│  └─────────────────────────────────────────┘       │
│                      ↓                              │
│  Layer 3: AI SUGGESTIONS (V3+)                      │
│  ┌─────────────────────────────────────────┐       │
│  │ • LLM-based requirement interpretation  │       │
│  │ • Pattern-based pricing suggestions      │       │
│  │ • Subjective QA assessment              │       │
│  │ Always produces confidence score         │       │
│  │ Always logged                            │       │
│  └─────────────────────────────────────────┘       │
│                      ↓                              │
│  Layer 4: HUMAN APPROVAL GATE                       │
│  ┌─────────────────────────────────────────┐       │
│  │ IF confidence < threshold:               │       │
│  │   → Route to admin                       │       │
│  │ IF confidence >= threshold:              │       │
│  │   → Auto-approve (logged)               │       │
│  │ Admin can ALWAYS override                │       │
│  │ Override is logged as training signal    │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **V1 MUST NOT INCLUDE ANY AI FEATURES.** V1 should be:
> - Rule-based pricing (admin-set formulas)
> - Manual admin assignment
> - Manual admin QA
> - No LLM calls
>
> This is already stated in the plan's V1 scope but the implementation plan's Phase 8 timeline suggests AI could ship in the initial 12-19 week window. **AI should NOT ship until V3**, which should happen only after accumulating real operational data from V1-V2.

---

# PART 9 — "AI LEARNS FROM ADMIN" AUDIT

## 9.1 What the Plan Proposes

> *"Learning loop: Tracks admin overrides of AI decisions (pricing, matching) → feeds back to improve future suggestions"* (V3)

## 9.2 Deep Challenge

### What is a valid learning signal?

| Signal | Valid? | Why |
|---|---|---|
| Admin overrides AI-suggested price upward | ✅ Yes | AI underpriced — adjust formula |
| Admin overrides AI-suggested price downward | ✅ Yes | AI overpriced — adjust formula |
| Admin selects different creator than AI recommended | ⚠️ Partially | Could be: better match (valid signal) OR creator unavailability (not a learning signal) OR personal preference (noise) |
| Admin approves AI suggestion without change | ✅ Yes | Positive reinforcement |
| Client accepts quote | ⚠️ Partially | Willingness to pay ≠ fair price |
| Client rejects quote | ⚠️ Partially | Could be: too expensive, wrong service, changed mind |
| Project completes successfully | ✅ Yes | Creator match + pricing was correct |
| Project has many revision rounds | ⚠️ Partially | Could be: wrong creator, unclear requirements, picky client |

### What is NOT a valid learning signal?

| Signal | Why Invalid |
|---|---|
| Admin overrides due to personal relationship with creator | Bias, not quality signal |
| Admin gives discount for marketing reasons | Business decision, not pricing accuracy |
| Rush decisions under time pressure | May be suboptimal |
| Admin's first month of overrides (learning the system) | Admin is learning too, inconsistent |
| Outlier projects (e.g., celebrity wedding, 20-camera shoot) | Extreme cases distort averages |

## 9.3 Practical Architecture (No Over-Engineering)

### V1-V2: Data Collection Only (No "Learning")

```sql
CREATE TABLE ai_decision_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type   TEXT CHECK (decision_type IN ('pricing', 'matching', 'qa', 'revision_class')),
  context         JSONB NOT NULL,           -- input to the decision
  ai_suggestion   JSONB,                    -- what AI recommended (null in V1)
  ai_confidence   DECIMAL,                  -- AI's confidence (null in V1)
  admin_decision  JSONB NOT NULL,           -- what admin actually decided
  override        BOOLEAN DEFAULT FALSE,    -- did admin change AI suggestion?
  override_reason TEXT,                     -- optional: why admin overrode
  outcome         JSONB,                    -- post-hoc: was the decision good? (filled later)
  project_id      UUID REFERENCES projects(id),
  admin_id        UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

In V1-V2, `ai_suggestion` and `ai_confidence` are NULL. You're just recording admin decisions as raw data for future analysis.

### V3: Rule-Based "AI" with Admin Feedback

- Use the collected `ai_decision_log` data to calibrate **weighted scoring formulas** (not ML models)
- Admin sets weights via admin panel
- System suggests, admin approves
- Overrides are tracked

### V4+: Actual ML (Only If Justified)

- Only after 500+ data points per decision type
- Model versioning: track which model version made each suggestion
- A/B testing: compare model suggestions to admin decisions on held-out projects
- Rollback: ability to revert to previous model version or to pure rules

## 9.4 Preventing Bad Data From Poisoning Recommendations

```
SAFEGUARDS:
1. Minimum data threshold: Don't use any "learned" weights until
   100+ decisions for that type exist
2. Outlier detection: Exclude decisions where project was cancelled,
   disputed, or had exceptional circumstances
3. Recency weighting: Recent decisions weighted 2x vs older ones
4. Admin tagging: Admin can mark a decision as "exception - don't learn"
5. Seasonal awareness: Wedding pricing in season vs off-season
   should be separate models
6. Manual weight override: Admin can always set explicit weights
   that override learned ones
7. Confidence decay: If AI hasn't been validated in 30 days,
   reduce confidence threshold (route more to admin)
```

## 9.5 No Model Training Needed (V3)

**For V3, "AI learns from admin" should be implemented as:**

1. **Retrieval**: Look up similar past projects and their prices/assignments
2. **Rules**: Apply admin-set weighted formulas
3. **Adjustment**: Bias weights toward recent admin decisions
4. **Confidence**: Higher confidence when many similar precedents exist

This requires **zero model training**. It's a weighted lookup + rule engine. Call it "intelligent" or "data-driven" in marketing, but don't build ML infrastructure until V4.

