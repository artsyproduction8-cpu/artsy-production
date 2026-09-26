# Artsy Production — Deep Audit (Parts 24–27)

---

# PART 24 — OPERATIONAL AUDIT

## "What breaks at 10/day, 50/day, 200/day?"

### 10 Projects/Day (~300/month)

| Area | Status | Bottleneck? |
|---|---|---|
| Admin workload | Manageable for 1 person | ⚠️ Each project needs: quote review + assignment + QA + client follow-up. At ~30 min/project admin touch = **5 hours/day** |
| Creator assignment | 10 assignments/day | ✅ OK if ≥15 active creators |
| QA review | 10 reviews/day | ⚠️ Each QA = 15-30 min of watching + assessment. **2.5-5 hours/day** |
| Customer support | 3-5 queries/day | ✅ Manageable |
| Drive management | 10 folders/day | ✅ Automated |
| Storage | ~300GB/day raw uploads | ⚠️ 9TB/month new uploads. 5TB plan overwhelmed. Retention CRITICAL |
| Video processing | 10 videos/day on Bunny | ✅ Well within limits |
| Payouts | ~10/day | ⚠️ Manual NEFT = 1-2 hours/day |
| Notifications | ~440/day (44 events × 10 orders) | ✅ Well within WhatsApp limits |
| **Total admin time** | | **~8-12 hours/day — 1 full-time person is at capacity** |

### 50 Projects/Day (~1,500/month)

| Area | Status | Bottleneck? |
|---|---|---|
| Admin workload | **🔴 BROKEN** | 1 person cannot handle 50 QA reviews + 50 assignments + support. **Need 3-4 operations staff** |
| Creator assignment | 50 assignments/day | 🔴 Need 50+ active creators. Matching engine becomes essential (can't manually evaluate each time) |
| QA review | 50 reviews/day | 🔴 **12-25 hours of QA/day**. Need dedicated QA team or AI-assisted pre-screening |
| Customer support | 15-25 queries/day | ⚠️ Need dedicated support person |
| Drive management | 50 folders/day | ⚠️ API quotas still OK but folder organization becomes critical |
| Storage | ~1.5TB/day | 🔴 **45TB/month**. Need enterprise storage plan |
| Payouts | ~50/day | 🔴 Manual NEFT completely broken. **Need Razorpay Route or banking API** |
| Notifications | ~2,200/day | ⚠️ Approaching WhatsApp rate limits. Need message queuing |
| AI workload (V3) | 50 pricing + 50 matching | ✅ Still manageable |
| **Verdict** | | **Cannot operate at 50/day with V1/V2 tooling. Need: QA team, automated payouts, matching engine, enterprise storage** |

### 200 Projects/Day (~6,000/month)

| Area | Status | Bottleneck? |
|---|---|---|
| Admin workload | 🔴 Requires 10-15 staff | Full operations team |
| Creator pool | 🔴 Need 200+ active creators | Major recruitment challenge |
| QA | 🔴 Need QA team of 5-10 or AI-assisted screening | Manual QA impossible |
| Storage | 🔴 6TB/day = 180TB/month | Need cloud object storage (S3/R2/B2) |
| Payouts | 🔴 Need automated batch payouts | Banking API required |
| Supabase | 🔴 Database may need scaling | Consider self-hosted Postgres or Supabase Enterprise |
| Vercel | 🔴 Serverless costs spike | Consider dedicated infrastructure |
| Drive | 🔴 **Completely unsuitable** | Migrate to object storage |
| WhatsApp | 🔴 Need enterprise messaging tier | 200 × 44 = 8,800 messages/day |
| Revenue | ✅ ~₹1.3 crore/month | Financially very healthy |
| **Verdict** | | **Requires: dedicated ops team, enterprise infrastructure, automated workflows, AI assistance (V3+), storage migration, payout automation** |

## 24.1 Manual Bottleneck Summary

| Process | 10/day | 50/day | 200/day | Automation Needed By |
|---|---|---|---|---|
| Quote review/approval | Manual OK | Automated pricing needed | AI pricing essential | 50/day (V2) |
| Creator assignment | Manual OK | Matching engine needed | Fully automated | 50/day (V2) |
| QA review | Manual OK | QA team needed | AI pre-screening | 50/day (V2-V3) |
| Payouts | Manual NEFT OK | Batch payout API needed | Fully automated | 30/day (V2) |
| Client support | Admin handles | Dedicated person | Support team/chatbot | 30/day (V2) |
| Storage management | Cron handles | Monitoring needed | Enterprise storage | 50/day (V2-V3) |
| Dispute resolution | Admin handles | Need SOP + team | Dedicated role | 50/day (V2) |

---

# PART 25 — MVP AUDIT

## What Is Actually Needed for First Production Launch

### MUST HAVE (Launch Blocker)

| Feature | Why It's Mandatory |
|---|---|
| Business entity registration | Cannot accept payments without it |
| GST registration (or explicit sub-threshold documentation) | Legal requirement |
| Razorpay merchant account | Only payment mechanism |
| Marketing site (single page) | Discovery + lead generation |
| WhatsApp OTP login (client + admin) | Authentication |
| SMS fallback for OTP | WhatsApp isn't 100% reliable |
| Service catalog (4 categories) | Core product |
| Requirement wizard (per category) | Captures project scope |
| Deterministic pricing engine (no AI) | Generates quotes |
| Admin quote approval queue | Safety net for pricing |
| Checkout + Razorpay payment | Revenue collection |
| Payment webhook handler (idempotent) | Order confirmation |
| Invoice generation (basic PDF) | Tax compliance |
| Client upload to Google Drive (resumable) | Footage delivery |
| File validation (format, size) | Prevents issues |
| Project creation from paid order | Workflow trigger |
| Admin manual assignment | In-house team for V1 |
| Project status tracking (admin view) | Operational control |
| Client project dashboard (status + timeline) | Client transparency |
| Video preview player (Bunny Stream) | Client review |
| Timestamped commenting | Revision workflow |
| Revision tracking (round count) | Scope management |
| Admin QA workflow | Quality gate |
| Client approval / auto-approve timeout | Project completion |
| Final delivery links | Client receives work |
| Retention timer + deletion cron | Storage management |
| Deletion warning notifications (WhatsApp) | Client responsibility |
| Financial event log (immutable) | Audit trail |
| Admin payout tracking (manual NEFT entry) | Creator payment |
| DPDP consent collection at registration | Legal compliance |
| Privacy policy page | Legal compliance |
| Rate limiting on auth + payment endpoints | Security |
| Webhook signature verification | Security |
| RLS on all tables | Data isolation |
| Error monitoring (Sentry) | Operational awareness |
| Basic admin dashboard (projects, orders, revenue) | Admin needs |
| Terms of Service page | Legal compliance |
| Creator NDA/agreement (even if simple) | IP protection |

### SHOULD HAVE (Ship Within 2-4 Weeks of Launch)

| Feature | Why It's Important |
|---|---|
| Creator onboarding form | Scale beyond in-house team |
| Admin creator approval/rejection | Creator quality gate |
| Creator dashboard (assigned jobs, earnings) | Creator experience |
| Accept/decline job flow | Creator agency |
| Daily check-in system | Progress tracking |
| Change order workflow (basic) | Scope change management |
| Refund workflow (admin-initiated) | Dispute resolution |
| Client order history | Client experience |
| Email notifications (invoice, completion) | Professional communication |
| Analytics (basic: revenue, orders, completion rate) | Business metrics |
| Data export endpoint (DPDP) | Legal compliance |
| Data deletion request endpoint (DPDP) | Legal compliance |
| Admin audit log | Security |

### LATER (V2 — 2-4 Months After Launch)

| Feature | Why It Can Wait |
|---|---|
| Creator matching engine | Need data + creator pool first |
| Automated payout (bank API) | Manual NEFT works for <30/month |
| Creator performance metrics | Need project history first |
| Client reviews/ratings | Need completed projects first |
| Repeat client features (loyalty) | Need returning clients |
| GST auto-filing integration | Manual filing works initially |
| Multi-admin support | Single admin for now |
| Advanced reporting | Basic dashboard sufficient |
| WhatsApp interactive messages (buttons, lists) | Standard templates work |

### DO NOT BUILD YET

| Feature | Why Not Now |
|---|---|
| AI pricing suggestions | No data to calibrate. Rule-based works |
| AI creator matching | Manual assignment works. Need data |
| AI QA assistance | Manual QA works. Need quality baselines |
| AI revision classification | Admin can categorize manually |
| AI learning from admin | Need 100+ decisions to learn from |
| Multi-currency / multi-region | India-only for V1-V3 |
| Enterprise/corporate accounts | Individual clients first |
| Bulk order management | Not enough volume |
| Partner APIs | No partners yet |
| International payouts | India-only creators |
| Mobile app | Web app is sufficient |
| Real-time chat (client-admin) | WhatsApp handles this |
| Subscription/retainer pricing | Project-based is correct for V1 |

---

# PART 26 — MISSING REQUIREMENTS

## Requirements Not Found Anywhere in the Master Plan

### Legal/Compliance

| Requirement | Impact |
|---|---|
| **Terms of Service (client-facing)** | Cannot legally accept payments without contract terms |
| **Freelancer agreement/contract** | No enforceable NDA, IP assignment, non-compete |
| **Cancellation policy (explicit)** | Disputes will have no reference point |
| **Refund policy (explicit)** | Same as above |
| **Cookie policy** | EU visitors (even if India-first) may trigger GDPR |
| **Grievance officer designation (DPDP)** | Required by DPDP Act |
| **Data Processing Agreement with Supabase, Google, Bunny** | Artsy is Data Fiduciary; these are Data Processors |
| **Incident response plan** | What happens when a data breach occurs? |
| **Record of Processing Activities** | DPDP requirement |

### Financial/Accounting

| Requirement | Impact |
|---|---|
| **Accounting software integration** | Tally/QuickBooks export for CA |
| **GST return data export** | Monthly/quarterly filing |
| **TDS return data export** | Quarterly Form 26Q filing |
| **Revenue recognition rules** | When is revenue booked? At payment? At completion? |
| **Bad debt handling** | What if refund is issued but Razorpay won't return gateway fee? |
| **Cash flow projection mechanism** | T+2 settlement means cash isn't immediately available |
| **Financial reconciliation dashboard** | Money in vs money out vs payable |

### Operational

| Requirement | Impact |
|---|---|
| **Standard Operating Procedures (SOPs)** | What does admin do step-by-step for each scenario? |
| **Escalation matrix** | When admin is overwhelmed, who handles what? |
| **SLA breach handling** | What happens when Artsy misses the 7-10 day promise? |
| **Creator onboarding criteria** | What minimum portfolio quality is required? |
| **Client communication guidelines** | How does admin communicate delays, issues? |
| **Business continuity plan** | What if Karan is unavailable? |
| **Holiday/weekend handling** | Do SLA timers pause? Do check-ins pause? |

### Technical

| Requirement | Impact |
|---|---|
| **Database migration strategy** | How to evolve schema without losing data |
| **Staging environment** | Can't test payment flows against production |
| **CI/CD pipeline** | Automated testing before deployment |
| **Backup and restore procedures** | What's backed up? How often? How to restore? |
| **Rollback procedure** | If a deployment breaks production |
| **Health check endpoints** | Is the system up? Are external services reachable? |
| **Structured logging** | JSON logs for querying and alerting |
| **API documentation** | For future team members, integrations |
| **Performance benchmarks** | What response time is acceptable? |
| **Load testing plan** | Can the system handle expected traffic? |
| **Mobile responsiveness testing** | Wedding clients are 90% mobile |
| **Browser compatibility matrix** | Which browsers/versions supported? |
| **Accessibility (a11y)** | WCAG compliance level |
| **Internationalization (i18n)** | Hindi UI for V2? |

### Monitoring/Observability

| Requirement | Impact |
|---|---|
| **Uptime monitoring** | Know when site is down |
| **Database performance monitoring** | Slow queries, connection pool exhaustion |
| **Storage capacity alerts** | Drive/Supabase approaching limits |
| **Payment failure rate monitoring** | Spike in failures = integration issue |
| **Notification delivery monitoring** | WhatsApp messages actually reaching users |
| **API response time monitoring** | Performance degradation detection |
| **Error rate dashboards** | Spike detection |
| **Cron job monitoring** | Are deletion jobs, reconciliation running? |

### User Experience (Non-Visual)

| Requirement | Impact |
|---|---|
| **Client FAQ / Help center** | Self-service answers |
| **Status page (public)** | "Is Artsy down?" transparency |
| **Onboarding email/WhatsApp sequence** | New client guidance |
| **Creator help documentation** | How to submit work, format requirements |
| **Upload format guide** | What file formats/codecs are accepted |

---

# PART 27 — FINAL AUDIT REPORT

---

## A. Executive Summary

The Artsy Production Master Plan describes a **viable business model** — a managed creative services platform connecting wedding/brand/corporate clients with curated video editors. The core concept is sound, the market is real (India's wedding industry is massive), and the tech stack is appropriate for the scale.

However, the plan has **significant gaps in financial modeling, legal compliance, operational workflows, and database architecture** that must be resolved before development produces a production-ready system. The existing SQL schema contradicts the implementation plan in fundamental ways. The financial model (75/25 split) is undefined at a level that could make the business unprofitable. Several critical legal prerequisites (business entity, GST, TAN, contracts) have not been started.

**The plan is approximately 60% complete.** The vision and product design are strong. The business rules, financial logic, compliance requirements, and operational procedures need substantial work before code should be written against them.

---

## B. Critical Issues (Must Resolve Before Development)

| # | Issue | Parts | Impact |
|---|---|---|---|
| B1 | **75/25 payout split calculation base undefined** | 1, 2 | Could make business unprofitable (7.4% margin vs 20.6% margin). Financial model cannot be coded |
| B2 | **No business entity registered** | 12 | Blocks GST, TAN, Razorpay, legal invoicing. Cannot accept money |
| B3 | **SQL schema contradicts implementation plan** | 10 | Two incompatible data models. Schema must be rewritten |
| B4 | **TDS section unclear (194J vs 194C)** | 4, 12 | 10% vs 1% rate affects every creator payout. Need CA opinion |
| B5 | **No Terms of Service or client contract** | 12, 26 | No legal basis for payments, refunds, cancellations, IP transfer |
| B6 | **No freelancer agreement/NDA** | 4, 26 | No enforceable confidentiality, IP assignment, non-compete |
| B7 | **Change order system completely undefined** | 3 | #1 source of client disputes in creative services. No mechanism to handle scope creep |
| B8 | **Payment webhook idempotency not designed** | 5, 13 | Duplicate payments, lost orders. Race conditions on concurrent webhooks |
| B9 | **Google Drive architecture undefined** (service account vs OAuth vs Workspace) | 6 | Fundamental storage architecture decision unmade |

---

## C. High-Priority Issues (Resolve Before Feature Goes Live)

| # | Issue | Parts | Impact |
|---|---|---|---|
| C1 | No revision limit defined per service | 3, 18 | Unlimited free revisions = unpaid creator work |
| C2 | No client response timeout / auto-approve | 5, 16 | Projects stuck indefinitely waiting for client |
| C3 | No SMS fallback for WhatsApp OTP | 19 | Users without WhatsApp can't login |
| C4 | DPDP compliance not built in | 12, 14 | Penalties up to ₹250 crore. Full enforcement May 2027 |
| C5 | No rate limiting on auth/payment APIs | 13 | Brute force, DDoS, cost explosion |
| C6 | PAN/bank details encryption not implemented in schema | 10, 13 | HIGHLY SENSITIVE data in plaintext |
| C7 | Financial event log missing | 11 | No audit trail for money flow. GST/TDS filing impossible |
| C8 | No refund formula defined | 1, 5 | Admin makes ad-hoc decisions with no consistency |
| C9 | Invoice missing required fields (client name, SAC, CGST/SGST split) | 12 | Invalid GST invoices |
| C10 | No admin audit logging | 13, 18 | Admin actions untraceable. Compliance risk |
| C11 | RLS policies in schema have bugs (self-update on approval_status) | 10, 13 | Creator could self-approve. Privilege escalation |
| C12 | No quote validity/expiry mechanism | 2 | Quotes usable indefinitely, prices change underneath |
| C13 | Admin has same auth strength as regular users | 13 | Admin account compromise = total platform compromise |

---

## D. Medium-Priority Issues (Important But Not Immediate)

| # | Issue | Parts |
|---|---|---|
| D1 | No creator workload/capacity tracking | 4, 18 |
| D2 | No holiday/weekend SLA pause mechanism | 24, 26 |
| D3 | Notification system only has 14 of 44 needed events | 17 |
| D4 | No staging environment defined | 21, 26 |
| D5 | No CI/CD pipeline defined | 21, 26 |
| D6 | No backup/restore procedures | 13, 26 |
| D7 | No status page for clients | 26 |
| D8 | No file metadata stripping (EXIF/XMP) before creator access | 6, 14 |
| D9 | No draft watermarking on preview videos | 7 |
| D10 | No creator re-application process after rejection | 4 |
| D11 | No client cancellation fee structure | 1, 5 |
| D12 | Drive storage capacity planning needed | 6, 23 |
| D13 | STATUS.md says Tailwind CSS, plan says Vanilla CSS | 19 |
| D14 | No structured error handling strategy | 26 |

---

## E. Low-Priority / Future Issues

| # | Issue | Parts |
|---|---|---|
| E1 | No mobile app (web-only is fine for V1-V3) | 25 |
| E2 | No i18n/Hindi UI support | 26 |
| E3 | No accessibility (a11y) plan | 26 |
| E4 | No API documentation | 26 |
| E5 | No load testing plan | 26 |
| E6 | Enterprise/multi-user accounts | 20 |
| E7 | International payouts | 20 |
| E8 | Multi-currency support | 20 |

---

## F. Contradictions Found

| # | Contradiction | Location 1 | Location 2 | Resolution |
|---|---|---|---|---|
| F1 | **Business model identity**: "marketplace" vs managed service | Master plan §1: "marketplace" | Master plan §5-6: admin controls everything | **Managed service provider.** Drop "marketplace" from formal docs |
| F2 | **TDS rate**: 10% vs 1% | Implementation plan: `tds_rate DECIMAL DEFAULT 0.10` | STATUS.md §Phase 6: "TDS calculation (1% for freelancers)" | **Get CA opinion.** Default to 10% (conservative) |
| F3 | **Money storage format**: paise vs rupees | Implementation plan: `INTEGER` (paise) | SQL schema: `DECIMAL(10,2)` (rupees) | **Use INTEGER in paise.** Avoids floating-point errors |
| F4 | **User identity**: phone-only vs email-required | Master plan: phone + WhatsApp OTP | SQL schema: `email TEXT UNIQUE NOT NULL` | **Phone is primary.** Email optional. Rewrite schema |
| F5 | **CSS framework**: Vanilla vs Tailwind | Master plan + implementation plan: "Vanilla CSS" | STATUS.md line 92: "Tailwind CSS" | **Follow master plan.** Vanilla CSS. Update STATUS.md |
| F6 | **Creator approval**: enum vs boolean | Implementation plan: `approval_status TEXT (pending/approved/rejected)` | SQL schema: `is_verified BOOLEAN` | **Use enum.** Three states are needed |
| F7 | **Project statuses**: incompatible sets | Implementation plan: 9 statuses | SQL schema: 9 different statuses | **Use expanded set** from Part 16 (~25 statuses) |
| F8 | **Order statuses**: incompatible sets | Implementation plan: 11 statuses | SQL schema: 6 statuses | **Use implementation plan** statuses + additions from Part 16 |
| F9 | **Build sequence vs version scope** | Master plan §3: V1 = no creator marketplace | Master plan §4: build sequence starts with creator onboarding | **Decide**: Is V1 in-house only, or does it include creator onboarding? |

---

## G. Missing Requirements (Major)

| # | Requirement | Category |
|---|---|---|
| G1 | Terms of Service (client-facing) | Legal |
| G2 | Freelancer agreement/NDA/contract | Legal |
| G3 | Cancellation + refund policy | Legal/Business |
| G4 | Change order workflow | Product |
| G5 | Revision limit per service | Product |
| G6 | Financial event ledger | Finance |
| G7 | Quote snapshot + expiry | Product |
| G8 | DPDP consent + deletion + export | Compliance |
| G9 | Privacy policy | Legal |
| G10 | Incident response plan | Security |
| G11 | Payment reconciliation system | Finance |
| G12 | SMS OTP fallback | Technical |
| G13 | Admin audit logging | Security |
| G14 | Webhook idempotency | Technical |
| G15 | Client response timeout / auto-approve | Product |
| G16 | Creator acceptance timeout | Product |
| G17 | SLA breach handling | Operational |
| G18 | Backup + restore procedures | Technical |
| G19 | Database migration strategy | Technical |
| G20 | SOPs for admin operations | Operational |

---

## H. Recommended Corrections

### H1. Financial Model
**Current**: 75/25 split base undefined
→ **Problem**: Could yield 7.4% or 20.6% margin depending on interpretation
→ **Why it matters**: Business viability
→ **Solution**: Split calculated from **net revenue after GST and gateway fees**. Document explicitly.
→ **Version**: V1 (blocking)
→ **Dependency**: Accountant confirmation of GST rate

### H2. Database Schema
**Current**: SQL schema diverges from implementation plan
→ **Problem**: Two incompatible designs exist simultaneously
→ **Why it matters**: Any code built on current schema will contradict the plan
→ **Solution**: Rewrite schema to match implementation plan + audit additions. Use INTEGER for money. Phone as primary identity.
→ **Version**: V1 (blocking)
→ **Dependency**: None

### H3. Change Order System
**Current**: Acknowledged as missing
→ **Problem**: No mechanism for the most common creative services dispute
→ **Why it matters**: Clients WILL request changes. Without a system, admin handles ad-hoc.
→ **Solution**: Implement change_orders table + workflow from Part 3
→ **Version**: V1 (SHOULD HAVE within 2-4 weeks of launch)
→ **Dependency**: Payment system, pricing engine

### H4. Google Drive Architecture
**Current**: Undefined (service account vs OAuth vs Workspace)
→ **Problem**: Cannot build upload/access system without this decision
→ **Why it matters**: Wrong choice = data loss risk, scalability wall
→ **Solution**: Google Workspace Business Standard ($12/user/month) + service account with domain-wide delegation
→ **Version**: V1 (blocking)
→ **Dependency**: Google Workspace purchase

### H5. SMS Fallback
**Current**: WhatsApp-only OTP
→ **Problem**: Users without WhatsApp can't use platform
→ **Why it matters**: 5-10% of potential users
→ **Solution**: MSG91 SMS as fallback. User clicks "Didn't receive on WhatsApp? Send SMS instead"
→ **Version**: V1 (MUST HAVE)
→ **Dependency**: MSG91 account

### H6. DPDP Compliance
**Current**: Mentioned but no implementation
→ **Problem**: Penalties up to ₹250 crore. Full enforcement May 2027.
→ **Why it matters**: Platform collects phone numbers + footage with faces
→ **Solution**: Consent at registration, data export API, deletion request workflow, privacy policy, grievance officer
→ **Version**: V1 (consent + privacy policy), V2 (export + deletion endpoints)
→ **Dependency**: Privacy policy draft (legal)

### H7. Immutable Financial Events
**Current**: Payments table with UPDATE capability
→ **Problem**: Financial records can be modified, breaking audit trail
→ **Why it matters**: GST/TDS compliance, dispute evidence
→ **Solution**: financial_events table (append-only) from Part 11. No UPDATE/DELETE policies.
→ **Version**: V1 (MUST HAVE)
→ **Dependency**: None

---

## I. Corrected Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARTSY PRODUCTION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CLIENT BROWSER ──→ NEXT.JS (Vercel)                               │
│       │                    │                                        │
│       │              ┌─────┴──────┐                                 │
│       │              │  API Routes │                                │
│       │              │  (Server)   │                                │
│       │              └─────┬──────┘                                 │
│       │                    │                                        │
│       │    ┌───────────────┼───────────────┐                        │
│       │    │               │               │                        │
│       │    ▼               ▼               ▼                        │
│       │ SUPABASE      RAZORPAY        EXTERNAL                     │
│       │ (Postgres       (Payments)     SERVICES                    │
│       │  + Auth         ┌──────┐       ┌──────┐                    │
│       │  + RLS)         │Webhook│      │WhatsApp│                   │
│       │    │            │Handler│      │SMS(fb) │                   │
│       │    │            └──────┘      │Google   │                   │
│       │    │                          │ Drive   │                   │
│       │    │                          │Bunny    │                   │
│       │    │                          │Stream   │                   │
│       │    │                          └──────┘                      │
│       │    │                                                        │
│       │    ▼                                                        │
│       │ DATABASE LAYER                                              │
│       │ ┌─────────────────────────────────────────┐                │
│       │ │ TRANSACTIONAL          IMMUTABLE         │                │
│       │ │ ┌──────────────┐  ┌─────────────────┐   │                │
│       │ │ │ users         │  │ financial_events │   │                │
│       │ │ │ orders        │  │ audit_logs       │   │                │
│       │ │ │ projects      │  │ quotes (snapshot) │   │                │
│       │ │ │ assignments   │  │ webhook_events   │   │                │
│       │ │ │ revisions     │  │ ai_decision_log  │   │                │
│       │ │ │ notifications │  │ consent_records  │   │                │
│       │ │ │ services      │  │ invoices (sent)  │   │                │
│       │ │ │ change_orders │  │                   │   │                │
│       │ │ └──────────────┘  └─────────────────┘   │                │
│       │ │                                          │                │
│       │ │ ENCRYPTED AT REST                        │                │
│       │ │ ┌──────────────────────┐                │                │
│       │ │ │ pan_number            │                │                │
│       │ │ │ bank_account_number   │                │                │
│       │ │ │ ifsc_code             │                │                │
│       │ │ └──────────────────────┘                │                │
│       │ └─────────────────────────────────────────┘                │
│       │                                                             │
│       │ STORAGE LAYER                                               │
│       │ ┌────────────────────────────────────────┐                 │
│       │ │ Google Drive/Workspace: Raw footage     │                 │
│       │ │ Bunny Stream: Draft + final videos      │                 │
│       │ │ Supabase Storage: Avatars, invoices,PDFs│                 │
│       │ └────────────────────────────────────────┘                 │
│       │                                                             │
│       │ BACKGROUND JOBS (Vercel Cron / pg_cron)                    │
│       │ ├── Retention deletion (daily)                              │
│       │ ├── Payment reconciliation (every 15 min)                   │
│       │ ├── Drive permission expiry (hourly)                        │
│       │ ├── Stale project detection (daily)                         │
│       │ ├── Notification retry (every 5 min)                        │
│       │ └── Storage capacity check (daily)                          │
│       │                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## J. Corrected V1–V5 Roadmap

### V1 — Launch Release (Week 1-20)
**Purpose**: End-to-end working platform with in-house team fulfillment

**Must-have**:
- Marketing site
- WhatsApp OTP + SMS fallback login (client + admin)
- Service catalog (4 categories)
- Requirement wizard
- Deterministic pricing engine
- Admin quote approval
- Checkout + Razorpay payment
- Client upload to Google Drive (resumable)
- Project management (admin-controlled)
- Manual creator assignment (in-house team via DB entries)
- QA workflow (admin)
- Bunny Stream preview player
- Timestamped commenting
- Client approval + auto-approve timeout
- Revision tracking (with limit)
- Final delivery
- Retention + deletion
- Invoice generation (PDF)
- Manual payout tracking
- Financial event log
- DPDP consent + privacy policy
- Admin dashboard (projects, orders, revenue)
- Webhook idempotency
- Rate limiting
- Error monitoring

**Exit criteria**: 10 real projects completed end-to-end successfully

---

### V2 — Creator Marketplace (Month 4-8)
**Purpose**: Scale beyond in-house team with freelancer pool

**Must-have**:
- Creator onboarding + admin approval
- Creator dashboard + job cards
- Accept/decline flow
- Daily check-in system
- Creator payout system (manual NEFT with tracking)
- Change order workflow
- Refund workflow
- Client cancellation policy enforcement
- Matching engine (weighted scoring, admin override)
- Creator performance metrics (basic)
- Data export + deletion endpoints (DPDP)
- Admin: creator management, refund management
- Notification system complete (all 44 events)
- Structured logging + monitoring

**Should-have**:
- Automated payout (Razorpay Route or bank API)
- Creator workload tracking
- Client reviews
- Analytics dashboard

**Exit criteria**: 50+ active creators, 100+ projects/month

---

### V3 — Intelligent Operations (Month 9-15)
**Purpose**: AI-assisted operations to reduce admin workload

**Must-have**:
- AI pricing suggestions (weighted formula, not LLM)
- AI creator matching (scoring engine)
- Technical QA checks (ffprobe: resolution, duration, audio)
- Admin decision logging (for future learning)
- AI confidence thresholds (admin-configurable)
- AI enable/disable toggles

**Should-have**:
- Revision classification (keyword-based)
- AI suggestion quality tracking
- Admin override analytics
- Advanced reporting

**Premature (move to V4)**: LLM integration, model training, production planner

**Exit criteria**: AI auto-handles >60% of pricing quotes with admin approval rate >90%

---

### V4 — Scale (Month 16-24)
**Purpose**: Handle 200+ projects/day, enterprise readiness

**Must-have**:
- Storage migration (Drive → object storage like B2/R2)
- Automated batch payouts
- QA team tooling
- Operations team dashboard
- LLM integration for requirement interpretation
- AI learning from admin (feedback loop)
- Enterprise client accounts (multi-user)
- Advanced analytics

**Should-have**:
- Bulk order management
- Client API for corporate clients
- SLA monitoring dashboard
- Multi-admin with role granularity

---

### V5 — Ecosystem (Month 24+)
**Purpose**: Platform expansion

- Multi-region/currency
- International creator payouts
- Partner APIs
- AI governance/audit
- Mobile app (if justified by usage data)

---

## K. Pre-Development Checklist

- [ ] **Business entity registered** (Proprietorship or LLP)
- [ ] **GST registration applied** (or documented sub-threshold exemption)
- [ ] **TAN registration applied**
- [ ] **Razorpay merchant account application submitted**
- [ ] **Meta Business Account created**
- [ ] **WhatsApp business phone verified**
- [ ] **Google Workspace account created** (or Google One purchased with architecture decision documented)
- [ ] **Bunny Stream account created**
- [ ] **Vercel project created with custom domain**
- [ ] **Supabase project created (Pro plan)**
- [ ] **75/25 split calculation base confirmed** (gross vs net — decision documented)
- [ ] **TDS section confirmed with CA** (194J vs 194C)
- [ ] **GST rate confirmed with accountant** (18% for SAC 999613)
- [ ] **Database schema rewritten** to match implementation plan + audit findings
- [ ] **SQL schema stored in version control** with migration strategy
- [ ] **Staging environment set up**
- [ ] **Error monitoring set up** (Sentry)
- [ ] **.env.local in .gitignore** (verified)
- [ ] **Privacy policy drafted** (even if basic)
- [ ] **Terms of Service drafted** (even if basic)
- [ ] **Freelancer agreement drafted** (even if basic)
- [ ] **SMS fallback provider selected** (MSG91 or similar)

---

## L. Pre-Launch Checklist

- [ ] **Business entity active and operational**
- [ ] **GST registration complete** (or documented exemption)
- [ ] **TAN registration complete**
- [ ] **Razorpay merchant account live** (not just test mode)
- [ ] **WhatsApp OTP template approved by Meta**
- [ ] **SMS fallback tested end-to-end**
- [ ] **Payment webhook tested** (success, failure, duplicate)
- [ ] **Refund tested** (full, partial)
- [ ] **Invoice generation tested** (PDF with correct fields)
- [ ] **Google Drive upload tested** (resumable, large file, permission grant/revoke)
- [ ] **Bunny Stream tested** (upload, transcode, signed playback)
- [ ] **Retention deletion tested** (cron runs, files actually deleted, trash emptied)
- [ ] **RLS policies tested** (client can't see other clients' data)
- [ ] **Rate limiting active** on auth and payment endpoints
- [ ] **Webhook signature verification active**
- [ ] **PAN/bank fields encrypted at rest**
- [ ] **DPDP consent checkbox present** at registration
- [ ] **Privacy policy published** at /privacy
- [ ] **Terms of Service published** at /terms
- [ ] **Admin account created with stronger auth**
- [ ] **Error monitoring active and alerting**
- [ ] **Uptime monitoring active**
- [ ] **Backup verified** (restore tested)
- [ ] **CORS policy configured** (production domain only)
- [ ] **CSP headers configured**
- [ ] **Secrets not in code or version control**
- [ ] **10 test projects completed end-to-end** (full lifecycle)
- [ ] **Financial reconciliation checked** (money in = money out for test projects)
- [ ] **Mobile responsiveness verified** (phone + tablet)
- [ ] **Page load time < 3 seconds** on Indian 4G connection
- [ ] **Contact information published** on site
- [ ] **Grievance officer designated** (DPDP)

---

## M. Questions I Still Need to Answer

These cannot be resolved from the master plan alone:

| # | Question | Who Should Answer | Blocks |
|---|---|---|---|
| 1 | What is the exact payout split base? (75% of gross, or 75% of net after GST + gateway?) | **Karan (business decision)** | Financial model, pricing engine, all payout code |
| 2 | Which TDS section applies? 194J (10%) or 194C (1%)? | **Chartered Accountant** | Creator payout calculations |
| 3 | Is V1 in-house team only, or will freelancers be onboarded at launch? | **Karan (business decision)** | Build sequence, V1 scope, creator onboarding timing |
| 4 | How many revisions are included in the base price per service category? | **Karan (business decision)** | Pricing, change order trigger, creator expectations |
| 5 | What is the cancellation/refund policy? (Specific percentages at each stage) | **Karan (business decision) + lawyer review** | Refund workflow, Terms of Service |
| 6 | What business entity type? (Proprietorship, LLP, Pvt Ltd?) | **Karan + CA** | All registrations |
| 7 | Who is the Google Workspace account owner / what Google storage plan? | **Karan (operational decision)** | Drive architecture |
| 8 | Will Admin be Karan only, or will there be operations staff from day 1? | **Karan** | Admin panel complexity, multi-admin support |
| 9 | What is the accept/decline timeout for creators? (24h? 48h?) | **Karan (business decision)** | Assignment workflow |
| 10 | Should clients be required to provide name/address at registration, or only phone? | **Karan (business decision)** | Invoice compliance, DPDP data minimization |

---

## Master Plan Change List

Every change recommended by this audit, in a single actionable list:

| # | Section | Current | Change To | Reason |
|---|---|---|---|---|
| 1 | §1 Overview | "marketplace" | "managed creative services platform" | Legal/tax clarity (Part 1) |
| 2 | §7 Pricing | "75% to freelancer... exact calculation base still to confirm" | "75% calculated from net revenue (after GST and gateway fees)" | Financial viability (Part 1) |
| 3 | §7 Pricing | No revision limit defined | Add: "2 revision rounds included per service (admin-configurable)" | Scope management (Part 3) |
| 4 | §7 Pricing | No minimum/maximum order value | Add: admin-configurable min/max per service | Pricing safety (Part 2) |
| 5 | §7 Pricing | No quote expiry | Add: "Quotes valid for 7 days" | Price consistency (Part 2) |
| 6 | §6 Customer Flow | No change order workflow | Add complete change order flow from Part 3 | Critical business gap |
| 7 | §6 Customer Flow | No client response timeout | Add: "Auto-approve after 7 days of no response" | Prevent stuck projects (Part 5) |
| 8 | §5 Freelancer | No accept/decline timeout | Add: "24-hour acceptance window, auto-decline on timeout" | Prevent stalled assignments (Part 4) |
| 9 | §5 Freelancer | No NDA/agreement | Add: "Digital agreement acceptance during onboarding" | Legal protection (Part 4) |
| 10 | §5 Freelancer | No re-application after rejection | Add: "May re-apply after 30 days with updated portfolio" | Creator experience (Part 4) |
| 11 | §8 Data Model | Schema uses DECIMAL for money | Use INTEGER (paise) | Floating-point accuracy (Part 10) |
| 12 | §8 Data Model | Users table: email required | Phone as primary, email optional | Match OTP-based auth (Part 10) |
| 13 | §8 Data Model | Missing tables | Add: quotes, change_orders, financial_events, audit_logs, webhook_events, consent_records, data_deletion_requests, file_records, platform_config, pricing_rules, notification_delivery_log | Completeness (Part 10) |
| 14 | §8 Data Model | pricing_rules as JSONB on services | Normalize to separate pricing_rules table | Schema safety (Part 10) |
| 15 | §8 Data Model | bank_details as JSONB | Separate encrypted columns | Granular encryption (Part 10) |
| 16 | §8 Data Model | payments table allows UPDATE | Make payments immutable (INSERT only) + refund_entries | Financial integrity (Part 11) |
| 17 | §9 Compliance | GST section incomplete | Add: SAC code (999613), CGST/SGST split, client GSTIN for B2B, place of supply | Invoice compliance (Part 12) |
| 18 | §9 Compliance | TDS section incomplete | Add: configurable TDS section (194J/194C), rate, and threshold tracking | Tax compliance (Part 12) |
| 19 | §9 Compliance | No DPDP implementation details | Add: consent records, data export, data deletion, grievance officer, breach notification | Legal compliance (Part 14) |
| 20 | §10 Tech Stack | WhatsApp only for OTP | Add: SMS fallback (MSG91 or similar) | Reliability (Part 19) |
| 21 | §10 Tech Stack | No monitoring tools | Add: Sentry (errors), uptime monitor, log aggregation | Operational awareness (Part 19) |
| 22 | §10 Tech Stack | No email service | Add: Resend or Postmark for invoices/receipts | Professional communication (Part 19) |
| 23 | §10 Tech Stack | No PDF generation | Add: @react-pdf/renderer for invoices | Invoice requirement (Part 19) |
| 24 | §10 Tech Stack | No background jobs defined | Add: Vercel Cron or pg_cron for deletion, reconciliation, etc. | Automation (Part 19) |
| 25 | §3 Roadmap V1 | V1 scope includes "Admin-controlled assignment" but build sequence includes creator onboarding | Clarify: V1 = in-house team. Creator onboarding = SHOULD HAVE post-launch | Sequence clarity (Part 20) |
| 26 | §4 Build Sequence | Creator onboarding as step 2 | Move creator onboarding to after payment+project pipeline works | Correct dependency (Part 21) |
| 27 | §11 Open Questions | "Change-order process" listed as gap | Resolve with design from Part 3 of this audit | Close the gap |
| 28 | §11 Open Questions | "Video hosting" listed as open | Mark as resolved: Bunny Stream confirmed | Close the question |
| 29 | §9 Compliance | No cancellation/refund policy | Add explicit policy with stage-based percentages | Legal + business clarity |
| 30 | §5 Freelancer | "NDA/confidentiality clause in the freelancer agreement" | Add: must be signed digitally before first assignment | Enforcement mechanism |
| 31 | §8 Data Model | 9 project statuses | Expand to ~25 statuses (Part 16) | Handle all states + exceptions |
| 32 | §6 Customer Flow | No retention notifications before deletion | Add: 3 notifications (7d, 3d, 1d before each deletion) | Client responsibility |
| 33 | New section needed | No notification matrix | Add complete 44-event notification matrix from Part 17 | Operational completeness |
| 34 | New section needed | No admin control inventory | Add admin panel feature list from Part 18 | Admin completeness |
| 35 | New section needed | No security controls listed | Add security measures from Part 13 | Security baseline |
| 36 | New section needed | No data classification | Add data classification table from Part 14 | Privacy compliance |
| 37 | New section needed | No operational scaling plan | Add capacity thresholds from Part 24 | Planning |

---

> **End of Audit**
>
> This audit identified **9 critical issues**, **13 high-priority issues**, **14 medium-priority issues**, **9 contradictions**, **20 missing requirements**, and **37 recommended changes** to the master plan.
>
> The core Artsy business model is preserved. No fundamental business decisions have been changed — only gaps, contradictions, and missing implementations have been identified.

