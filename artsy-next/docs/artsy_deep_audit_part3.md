# Artsy Production — Deep Audit (Parts 19–23)

---

# PART 19 — TECH STACK AUDIT

## 19.1 Component-by-Component Assessment

### Next.js — Frontend Framework

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP** |
| Fit for purpose | ✅ App Router, RSC, API routes cover all needs |
| India compatibility | ✅ Vercel Edge works well from India |
| Complexity | ⚠️ App Router is powerful but has a learning curve. Simpler alternatives exist (e.g., Remix, plain React + Express) but Next.js is the right choice for a platform with marketing + dashboards + API |
| Risk | TypeScript + RSC debugging can be painful. App Router caching behavior is non-obvious |
| Cost | Free (open source). Vercel hosting cost is the real factor |

### Supabase (Postgres + Auth + Storage + Edge Functions)

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP with caveats** |
| Fit for purpose | ✅ Postgres is excellent. Auth is decent. Storage is adequate for non-video assets. Edge Functions are useful |
| Auth limitation | ⚠️ Supabase Auth is primarily email/password/magic-link/OAuth. **WhatsApp OTP is not a native Supabase Auth provider.** You'll need a custom auth flow that generates Supabase sessions |
| Storage limitation | ✅ Fine for avatars, documents, invoices. NOT for video streaming (plan correctly uses Bunny for that) |
| RLS | ✅ Powerful but complex. The current schema's RLS policies have bugs (see Part 10) |
| Edge Functions | ⚠️ Supabase Edge Functions are Deno-based. Some Node.js packages may not work. Test early |
| India latency | ⚠️ Supabase doesn't have India regions. Nearest is Singapore. ~50-100ms latency. Acceptable but not ideal |
| Cost | Pro plan: $25/month. Adequate for V1 |
| Vendor lock-in | Medium. Postgres is portable. Auth, Storage, Edge Functions are Supabase-specific |
| **Critical Risk** | Supabase Auth doesn't natively support phone/OTP via WhatsApp. You need to: (1) handle OTP generation/verification yourself, (2) create a Supabase user programmatically after verification, (3) generate a Supabase session JWT. This is doable but adds complexity |

### Meta WhatsApp Cloud API — OTP & Notifications

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP** |
| Fit for purpose | ✅ WhatsApp is the dominant messaging platform in India. OTP via WhatsApp has higher delivery rates than SMS for Indian users |
| Cost | ~₹0.30-0.50 per authentication message (India rate). Cheapest for OTP delivery |
| Setup complexity | ⚠️ HIGH. Requires: Meta Business Account, Facebook Business verification, phone number verification, message template approval. Lead time: 1-3 weeks |
| Reliability | ⚠️ WhatsApp delivery depends on user having WhatsApp installed + internet. Not 100% |
| **Missing requirement** | **SMS fallback** for users who don't have WhatsApp or are offline. Use a service like MSG91 or Twilio (India pricing: ~₹0.15-0.25/SMS). This is a V1 MUST |
| Template restrictions | WhatsApp templates must be pre-approved by Meta. Each notification type needs a separate template. Plan for 15-20 templates |
| Rate limits | 1,000 messages/day on free tier. Need to upgrade for production |

### Razorpay — Payments

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP** |
| Fit for purpose | ✅ Best Indian payment gateway for startups. Supports UPI, cards, net banking |
| Cost | 2% + GST per transaction. Standard pricing, competitive |
| Setup | Requires business entity + KYC. Lead time: 1-2 weeks after entity registration |
| Webhooks | ✅ Reliable, with retry mechanism. Must verify signature |
| Refunds | ✅ API-based refunds. Full and partial supported |
| Risk | Settlement time: T+2 days (standard). This means Artsy receives money 2 days after client pays. Plan accordingly for cash flow |
| **Missing**: Razorpay Route (split payments) | Consider for V2+: Razorpay Route can automatically split payments between Artsy and creators. Saves manual payout work. But adds 0.25% fee |

### Google Drive API — Raw Footage Storage

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP for V1, CHANGE in V2-V3** |
| Fit for purpose | ⚠️ Works for small scale but not designed for this use case |
| V1 viability | ✅ At 10-30 projects/month, Drive works. Creators already use Drive. Low friction |
| V2+ risk | ⚠️ At 100+ projects/month, manual folder management becomes unsustainable. API quotas may become limiting. 5TB storage fills quickly |
| Cost (V1) | ~₹700/month for Google One 5TB. Very cheap |
| Migration path | V2-V3: Consider Backblaze B2 ($6/TB/month) + presigned URLs for creator access. Or Cloudflare R2 (free egress) |
| **Key risk** | No SLA on consumer Google One. Account suspension = total data loss. Workspace is safer |
| **Recommendation** | Use Google Drive for V1. Budget for migration to object storage (B2/R2/S3) in V2 when project volume justifies it |

### Bunny Stream — Video Hosting

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP** |
| Fit for purpose | ✅ Adaptive bitrate, token auth, custom player. Exactly what's needed |
| Cost | Extremely cheap. $1/month minimum. Even at scale, video preview costs are negligible compared to Drive storage |
| India performance | ✅ Bunny has CDN PoPs in India. Good latency |
| DRM | Basic DRM included. Enterprise DRM ($99/month) not needed for V1 |
| Risk | Low. Bunny is a reliable provider. Worst case: migration to Mux or Cloudflare Stream is straightforward |

### Vercel — Hosting

| Dimension | Assessment |
|---|---|
| **Verdict** | **KEEP for V1, EVALUATE at scale** |
| Fit for purpose | ✅ Perfect for Next.js. Zero-config deployment. Preview deployments |
| Cost (V1) | Pro plan: $20/month. Includes generous limits |
| India performance | ✅ Edge network includes India PoPs |
| Scaling risk | ⚠️ Serverless function cold starts can add latency for infrequent routes. At high scale, Vercel can become expensive ($400+/month). Monitor and evaluate at V2+ |
| Alternative at scale | V3+: Consider self-hosting on Railway, Render, or a VPS with Docker if Vercel costs escalate |
| **Missing**: Custom domain | Not set up. Low priority but should be done before public launch |

## 19.2 Missing Stack Components

| Component | Needed For | Recommendation | Version |
|---|---|---|---|
| **SMS fallback** | OTP delivery when WhatsApp fails | MSG91 (Indian provider, cheap) or Twilio | V1 |
| **Email** | Invoices, receipts, marketing | Resend.com (free tier: 3,000/month) or Postmark | V1 |
| **Background jobs/cron** | Retention deletion, notification scheduling, reconciliation | Vercel Cron (included in Pro) or Supabase pg_cron | V1 |
| **Error monitoring** | Production error tracking | Sentry (free tier: 5,000 events/month) | V1 |
| **Analytics** | Usage tracking, business metrics | Plausible or PostHog (self-hosted free) | V1 |
| **Uptime monitoring** | Know when services are down | Better Uptime (free tier) or UptimeRobot | V1 |
| **Log aggregation** | Debug production issues | Vercel logs are basic. Consider Logflare or Axiom | V2 |
| **PDF generation** | Invoice PDFs | @react-pdf/renderer or Puppeteer | V1 |
| **File virus scanning** | Uploaded file safety | ClamAV (self-hosted) or VirusTotal API | V2 |

## 19.3 STATUS.md Contradiction

> [!WARNING]
> [STATUS.md](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/STATUS.md) line 92 says: **"Tailwind CSS"** but the master plan and implementation plan both specify **"Vanilla CSS + CSS Custom Properties"**. The existing code should be checked for which is actually used.

---

# PART 20 — VERSION ROADMAP AUDIT

## 20.1 Current Roadmap (from Plan)

| Version | Purpose |
|---|---|
| V1 | Foundation + Direct Client Booking |
| V2 | Creator Marketplace + Intelligent Assignment |
| V3 | AI Production OS |
| V4 | Scale + Multi-Market |
| V5 | Ecosystem |

## 20.2 Issues with Current Roadmap

### Issue 1: V1 and V2 Are Blended in Build Sequence

The plan says: *"Rather than shipping strictly version-by-version, the engineering order blends V1 and V2 pieces"*

This is **pragmatically correct** but creates confusion about what "V1" means as a shipped product. When do you go live? After V1 features? After the blended V1+V2?

**RECOMMENDATION**: Rename the blended initial launch to **"Launch Release"** and explicitly define its scope (see Part 25 — MVP Audit).

### Issue 2: V1 Has No Creator Assignment Mechanism

V1 says *"Assignment stays Admin-controlled"* but the build sequence includes creator onboarding + matching. If V1 doesn't have creators, how are projects fulfilled?

**Current plan answer**: Karan's in-house team. This means:
- V1 doesn't need the freelancer onboarding flow
- V1 doesn't need matching engine
- V1 doesn't need anonymized job cards
- V1 only needs: Admin manually assigns from a known list

**But** the build sequence puts freelancer onboarding as step 2 (before client booking!). This suggests the plan actually intends to have freelancers at launch.

**RECOMMENDATION**: Clarify: Is V1 in-house team only? If yes, simplify V1 dramatically. If freelancers are needed at launch, then V1 already includes V2 features.

### Issue 3: V3 AI Prerequisites Not in V1-V2

AI features in V3 require:
- Historical pricing data (collected in V1-V2) ✅ Possible if `ai_decision_log` is in V1
- Creator performance data (collected in V2) ✅ Possible
- Training data from admin overrides ✅ Possible if logged

**RECOMMENDATION**: Add `ai_decision_log` table and admin decision tracking to V1 data model. No AI code, just data collection.

### Issue 4: V4 Multi-Currency/Region Too Vague

V4 says "multi-region/currency" but this requires:
- Currency conversion
- Multi-currency payment gateways
- International compliance (VAT/GST per country)
- Multi-language UI
- Regional storage (data residency)

This is essentially a complete rebuild of the financial system. It should NOT be a "version" — it should be a "product expansion" with its own planning cycle.

## 20.3 Corrected Roadmap

See Part 27 Section J for the complete corrected V1-V5 roadmap.

---

# PART 21 — DEVELOPMENT SEQUENCE AUDIT

## 21.1 Current Build Sequence (from Plan)

```
1. Marketing site
2. WhatsApp OTP auth + freelancer onboarding + admin approval
3. Customer-facing service catalog + requirement wizard + booking
4. Payments (Razorpay) + assignment/matching
```

## 21.2 Issues with Current Sequence

| Issue | Why It's a Problem |
|---|---|
| Freelancer onboarding before payment | Onboarded freelancers have nothing to do until orders exist. They'll lose interest |
| No database migration strategy defined | Schema changes during development will break existing data |
| No staging environment mentioned | Testing against production Supabase is dangerous |
| No deployment pipeline defined | How does code get from development to production? |
| Payment webhook infrastructure not prioritized | This is the most critical integration point |
| No mention of testing | No unit tests, integration tests, or E2E tests in sequence |
| Admin panel treated as one phase | Admin needs incremental screens as each feature ships |

## 21.3 Recommended Build Sequence

```
PHASE 0 — INFRASTRUCTURE (Week 0-1)
├── Set up production Supabase project
├── Set up staging/preview environment  
├── Set up Vercel project + custom domain
├── Implement database migrations system
├── Configure environment variables
├── Set up error monitoring (Sentry)
├── Set up uptime monitoring
├── Start business entity registration ← PARALLEL, NON-BLOCKING
├── Start Meta Business Account setup ← PARALLEL, NON-BLOCKING
└── Start Razorpay application ← PARALLEL, NON-BLOCKING

PHASE 1 — MARKETING SITE (Week 1-2)
├── Build marketing homepage
├── SEO setup
├── Contact form (stores leads in Supabase)
├── Analytics setup
├── Deploy to production domain
└── ✅ Can ship independently

PHASE 2 — AUTH SYSTEM (Week 2-3)
├── WhatsApp OTP integration (or mock if Meta approval pending)
├── Supabase custom auth flow (OTP → session)
├── SMS fallback integration
├── Role-based routing
├── Rate limiting on auth endpoints
├── Admin user creation (manual DB insert initially)
├── DPDP consent collection at registration
└── Admin screen: user management (basic)

PHASE 3 — SERVICE CATALOG + PRICING (Week 3-5)
├── Services database + admin CRUD
├── Pricing rules engine (deterministic, not AI)
├── Requirement wizard (dynamic per service)
├── Quote generation + snapshot storage
├── Admin screen: services & pricing management
├── Admin screen: quote approval queue
└── Client-facing: service browsing + wizard + quote display

PHASE 4 — PAYMENTS + ORDER SYSTEM (Week 5-7)
├── Razorpay integration ← BLOCKED until merchant account approved
├── Checkout flow
├── Payment webhook handler (idempotent)
├── Order creation on successful payment
├── Invoice generation (PDF)
├── Financial event logging
├── Admin screen: orders list + detail
├── Admin screen: payment history
├── Reconciliation cron job
└── Client-facing: order confirmation + order history

PHASE 5 — FILE UPLOAD + DRIVE (Week 7-9)
├── Google Cloud project + Drive API setup
├── Folder creation automation
├── Client upload flow (resumable)
├── File verification (format, size)
├── Upload status tracking
├── Admin screen: storage management
└── Client-facing: upload interface + status

PHASE 6 — PROJECT + ASSIGNMENT (Week 9-12)
├── Project creation (auto from paid order + uploaded files)
├── Manual assignment by admin (V1 — no matching engine)
├── Creator assignment notification
├── Accept/decline flow
├── Drive access granting
├── Daily check-in system
├── Project status tracking
├── Admin screen: project management
├── Admin screen: assignment interface
├── Creator-facing: job cards + work view
└── Client-facing: project status dashboard

PHASE 7 — QA + REVIEW + DELIVERY (Week 12-14)
├── Video upload to Bunny Stream
├── Preview player integration
├── Timestamped commenting system
├── QA review workflow (admin)
├── Revision round tracking
├── Client approval flow
├── Auto-approval timeout
├── Final delivery links
├── Retention timer system
├── Deletion cron job
├── Admin screen: QA queue
└── Client-facing: review + approve interface

PHASE 8 — PAYOUTS + FINANCIAL (Week 14-16)
├── Creator payout calculation
├── TDS calculation + deduction
├── Payout approval queue (admin)
├── NEFT reference recording (manual for V1)
├── Creator earnings dashboard
├── Refund workflow
├── Financial reporting (basic)
├── Admin screen: payout management
└── Admin screen: refund management

PHASE 9 — NOTIFICATIONS (Ongoing, parallel to 2-8)
├── WhatsApp template creation + approval
├── Notification dispatch service
├── In-app notification center
├── Delivery tracking
├── Retry mechanism
└── All 44 notification events wired up incrementally

PHASE 10 — CREATOR ONBOARDING (Week 16-18)
├── Creator onboarding form
├── Admin approval queue
├── Creator profile management
├── Creator dashboard
├── Creator metrics (basic)
└── Admin screen: creator management

PHASE 11 — POLISH + LAUNCH PREP (Week 18-20)
├── End-to-end testing
├── Security audit (penetration test)
├── DPDP compliance review
├── Privacy policy + Terms of Service (legal)
├── Performance optimization
├── Backup verification
├── Monitoring dashboards
├── Documentation
└── Soft launch (invite-only)
```

> [!IMPORTANT]
> **Key change**: Creator onboarding moved to Phase 10 (not Phase 2 as in current plan). Rationale: Until the entire order→payment→project→delivery pipeline works, there's nothing for creators to do. Onboard creators only when you can actually assign them work. In V1, Karan's in-house team can be set up via direct database entries.

### What Can Be Built in Parallel

```
PARALLEL TRACK A (non-blocking):
  Business registration → GST → TAN → Razorpay KYC

PARALLEL TRACK B (non-blocking):
  Meta Business Account → WhatsApp template approval

PARALLEL TRACK C (engineering, parallel to main):
  Notification templates + dispatch service
  Admin screens (incremental, ship with each feature)
```

### What Can Be Mocked (Until Real Integration Ready)

| Component | Mock Strategy |
|---|---|
| WhatsApp OTP | Console log the OTP. Hardcoded "123456" in dev |
| Razorpay | Razorpay test mode (built-in) |
| Google Drive | Local file system or Supabase Storage |
| Bunny Stream | Static video file served locally |
| NEFT payout | Manual admin entry (no bank API needed for V1) |

---

# PART 22 — FAILURE / EDGE CASE AUDIT

## 55 Realistic Failure Scenarios

| # | Scenario | Impact | Detection | Auto Action | Admin Action | Recovery |
|---|---|---|---|---|---|---|
| 1 | **OTP not delivered (WhatsApp down)** | User cannot login | WhatsApp API error response | Trigger SMS fallback | — | SMS delivery |
| 2 | **Duplicate OTP requests (spam)** | API cost spike, user confusion | Rate limiter triggers | Block after 5 attempts/10min | — | Cooldown timer |
| 3 | **OTP brute force attack** | Account takeover | Failed verification count > 10 | Lock phone for 1 hour | Investigate if targeted | Automatic unlock after 1h |
| 4 | **Payment succeeds, webhook never arrives** | Money taken, no project | Reconciliation cron (every 15min checks Razorpay API for unmatched payments) | Create order from Razorpay data | Admin verifies | Order created retroactively |
| 5 | **Payment reversed by bank (chargeback)** | Artsy loses money + project may be delivered | Razorpay chargeback webhook | Pause project, suspend client | Gather evidence, respond to chargeback | Win chargeback or absorb loss |
| 6 | **Duplicate payment (client clicks twice)** | Double charge | Two payments for same order_id | Reject second, auto-refund | — | Refund duplicate |
| 7 | **Client uploads 500GB of footage** | Storage overwhelmed, slow | Upload size exceeds service limit | Reject with message: "Max 100GB per project" | — | Client re-uploads within limit |
| 8 | **Upload stops at 90% (network failure)** | Partial file on Drive | Resumable upload tracker shows incomplete | Allow resume from last chunk | — | Client resumes upload |
| 9 | **Duplicate file upload** | Wasted storage | File hash comparison | Skip duplicate, notify client | — | Auto-deduplicated |
| 10 | **Corrupted/unsupported file uploaded** | Creator can't use footage | File header validation fails | Reject with error message | — | Client re-uploads correct file |
| 11 | **Client uploads files to wrong project** | Data mix-up | Only possible if client has multiple projects | Show clear project selector | Admin moves files | Files reassigned |
| 12 | **Creator accepts job then disappears (no check-ins)** | Project delayed | Missed check-in after 2 hours | Flag admin | Admin calls creator. If unreachable: reassign | New creator assigned |
| 13 | **Creator downloads all footage then gets suspended** | Footage on creator's local machine | Suspension triggered | Revoke Drive access immediately | Send legal notice (NDA violation) | Contractual enforcement |
| 14 | **Creator submits wrong project's deliverable** | Wrong video to wrong client | Admin QA review catches it | QA fail | Admin returns to creator | Creator re-submits correct file |
| 15 | **Creator submits very low quality work** | Client dissatisfied | Admin QA catches (subjective) | QA fail with detailed feedback | Admin may reassign | Re-work or reassign |
| 16 | **Creator submits on time but Admin QA is delayed** | SLA breach (not creator's fault) | Internal deadline tracking | Alert admin that QA is blocking | Admin prioritizes | QA completed, client notified |
| 17 | **Creator finishes late (past internal deadline)** | SLA risk | Deadline comparison | Escalation notification at 80% SLA | Admin contacts creator, considers reassignment | Late delivery or reassignment |
| 18 | **All available creators are busy** | Cannot assign project | No eligible matches in system | Alert admin | Admin contacts in-house team or waits | Extended timeline communicated to client |
| 19 | **Drive folder permission accidentally set to public** | Private footage exposed | Daily permission audit cron | Auto-revoke public permissions | Admin investigation | Permissions corrected, assess data exposure |
| 20 | **Google Drive API outage** | Uploads blocked, access blocked | API error monitoring | Show "temporarily unavailable" | — | Retry when API recovers |
| 21 | **Razorpay outage** | Payments blocked | Health check endpoint | Show "payment system temporarily unavailable" | — | Queue orders, process when recovered |
| 22 | **WhatsApp API outage** | Notifications not delivered | API error rate spike | Queue messages for retry, SMS fallback for OTP | — | Retry queue processes when recovered |
| 23 | **Bunny Stream outage** | Preview player doesn't work | CDN health check | Show "preview temporarily unavailable" | — | Recovers with Bunny |
| 24 | **Supabase outage** | Entire platform down | Uptime monitor | Static maintenance page | — | Recovers with Supabase |
| 25 | **Client requests extra revision (beyond included)** | Unpaid work | Revision count > service.included_revisions | Block revision, trigger change order | Admin creates change order | Client pays or declines |
| 26 | **Client's revision is actually a new creative direction** | Scope creep, creator confusion | Admin/AI assessment | Flag as scope change | Admin creates change order | New scope negotiated |
| 27 | **Client refuses to approve but also won't request revisions** | Project stuck | No response for 5+ days | Reminder notifications | Admin contacts client | Auto-approve after 7 days |
| 28 | **Client demands refund after final delivery** | Potential chargeback if refused | Refund request received | Route to admin | Admin reviews: was delivery per spec? | Partial refund or dispute |
| 29 | **Client does chargeback after receiving final files** | Artsy loses money AND files are delivered | Razorpay chargeback notification | Suspend client account | Gather evidence (delivery proof, approval) | Dispute chargeback with bank |
| 30 | **Refund after creator has already been paid** | Artsy cash flow negative on this project | Financial event log shows payout completed | Flag admin | Admin decides: absorb loss or recover from creator | Business decision |
| 31 | **Creator payout fails (wrong bank details)** | Creator not paid | NEFT failure notification | Mark payout as failed | Admin contacts creator for correct details | Retry with correct details |
| 32 | **TDS calculated on wrong section rate** | Tax compliance issue | Accountant review | — | Admin corrects rate in system | Amended TDS filing |
| 33 | **PAN submitted by creator is invalid** | Cannot process TDS | PAN validation check | Reject onboarding, request valid PAN | — | Creator re-submits |
| 34 | **Creator uses wrong PAN (not their own)** | TDS mismatch in Form 26AS | Can't detect automatically | — | Discovered during tax season | Legal/compliance issue |
| 35 | **AI pricing gives absurd quote (V3)** | Client sees ₹50,000 for a ₹5,000 job | Price outside admin floor/ceiling | Reject, route to admin | Admin corrects | Manual quote |
| 36 | **AI recommends wrong creator type (V3)** | Wedding editor assigned to corporate video | Skill mismatch flag | Route to admin if confidence < threshold | Admin overrides | Correct creator assigned |
| 37 | **AI classifies revision as in-scope when it's out-of-scope (V3)** | Creator does free work | Admin review catches it | — | Admin creates change order | Retroactive change order |
| 38 | **Client uploads footage with copyright music** | Legal risk | Cannot auto-detect in V1 | — | Creator/admin notices | Client asked to replace music |
| 39 | **Client uploads someone else's footage (fraud)** | IP violation, potential legal liability | Cannot auto-detect | — | Creator/admin notices | Project cancelled, client suspended |
| 40 | **Two clients request same creator simultaneously** | Scheduling conflict | Creator has max_concurrent check | Assign to first, queue second | Admin manages queue | Second project assigned to alternate creator |
| 41 | **Admin accidentally approves wrong payout amount** | Financial loss | Audit log shows admin action | — | Admin creates manual adjustment | Corrective financial event |
| 42 | **Session hijacking (someone steals auth token)** | Account takeover | Unusual access pattern (IP change) | — | Admin suspends account on report | Password reset (OTP), session invalidation |
| 43 | **Database corruption** | Data loss | Monitoring alerts | — | Restore from backup | Point-in-time recovery |
| 44 | **Vercel deployment fails** | Site down or on old version | Deployment monitoring | Auto-rollback to last successful | — | Fix and redeploy |
| 45 | **Client cancels during creator's work** | Wasted creator effort | Cancellation request received | Calculate progress-scaled refund | Admin approves refund + partial creator payout | Both parties compensated |
| 46 | **Retention deletion job fails** | Files kept beyond policy | Cron monitoring | Retry next run | Admin manually deletes if sensitive | Cron catches up |
| 47 | **Client re-uploads footage after creator already started** | Confusion, scope change | New files detected in Drive folder | Notify admin + creator | Admin decides: restart or use original | Change order if needed |
| 48 | **Drive storage 95% full** | New uploads blocked | Storage monitoring alert | Admin notified | Enforce retention deletion, archive old projects | Free up space |
| 49 | **Client disputes quality but provided insufficient footage** | Unclear fault | Requirements vs delivered comparison | — | Admin reviews requirements + footage | Mediated resolution |
| 50 | **Creator attempts to contact client directly** | Platform bypass, poaching | Can't auto-detect | — | Client or creator reports | Creator warning → suspension |
| 51 | **Concurrent access to same Razorpay order** | Race condition on payment status | Database transaction lock | Only process first webhook | — | Idempotency key prevents duplicate |
| 52 | **WhatsApp number changed by client** | Can't notify, can't login | Client reports via contact form | — | Admin updates phone manually | New OTP to new number |
| 53 | **Creator submits someone else's work (plagiarism)** | IP violation | Can't auto-detect in V1 | — | Client or admin reports | Creator suspended, project reassigned |
| 54 | **Multiple admin users conflict (V2+)** | Same project modified simultaneously | Optimistic locking on project updates | Show conflict warning | Admins communicate | Last write wins with audit log |
| 55 | **Price rule change affects in-progress quotes** | Client sees different price | Quote snapshot is immutable | Price changes don't affect existing quotes | — | New quotes use new rules |

---

# PART 23 — COST AUDIT

## 23.1 Fixed Monthly Costs (V1)

| Service | Plan | Cost/month | Notes |
|---|---|---|---|
| Supabase | Pro | $25 (~₹2,100) | 8GB DB, 250GB bandwidth, 100GB storage |
| Vercel | Pro | $20 (~₹1,700) | Sufficient for V1 |
| Google One / Workspace | 5TB | ~₹700-₹900 | Personal: ₹700. Workspace: $12/user |
| Bunny Stream | Minimum | $1 (~₹85) | Pay-as-you-go |
| Domain | Annual | ~₹1,000/year (~₹83/month) | |
| WhatsApp Cloud API | Free tier + messages | ~₹500-2,000 | Depends on volume |
| SMS fallback (MSG91) | Pay-as-go | ~₹200-500 | Low volume |
| Sentry (error monitoring) | Free tier | $0 | 5,000 events/month |
| **Total fixed** | | **~₹5,500-7,500/month** | |

## 23.2 Variable Costs (Per-Transaction)

| Cost Type | Rate | Per ₹8,000 Order | Scales With |
|---|---|---|---|
| Razorpay gateway fee | 2% + 18% GST on fee | ₹189 | Payment volume |
| WhatsApp (notifications per order) | ~₹0.30-0.50 × 10 messages | ₹3-5 | Orders |
| Bunny Stream (per video) | ~$0.01 storage + $0.03 bandwidth | ₹3-5 | Video minutes |
| Google Drive storage | ₹0.14/GB/month at 5TB plan | ~₹4/month per project | Active storage |
| AI API calls (V3+) | ~$0.01-0.05 per call | ₹1-4 | AI calls |
| **Total variable per order** | | **~₹200-205** | |

## 23.3 Revenue vs Cost Analysis

| Scale | Orders/month | Revenue (avg ₹6,500) | Variable cost | Fixed cost | Creator payout (75% of net) | **Artsy gross margin** |
|---|---|---|---|---|---|---|
| V1 launch | 30 | ₹1,95,000 | ₹6,000 | ₹7,000 | ₹1,21,275 | **₹60,725** |
| V1 growth | 100 | ₹6,50,000 | ₹20,000 | ₹7,500 | ₹4,04,250 | **₹2,18,250** |
| V2 | 300 | ₹19,50,000 | ₹61,500 | ₹15,000 | ₹12,12,750 | **₹6,60,750** |

> **Note**: These margins assume the 75% split is calculated from net revenue (after GST + gateway fees), as recommended in Part 1. If 75% is calculated from gross, margins collapse to ~₹18,000/month at 30 orders — barely covering fixed costs.

## 23.4 Cost Explosion Risks

| Risk | Trigger | Impact | Mitigation |
|---|---|---|---|
| **Google Drive storage** | >100 concurrent projects without retention enforcement | 5TB exhausted | Enforce 15-day retention strictly. Monitor storage weekly |
| **WhatsApp messages** | High notification volume (44 events × 100 orders) | ₹5,000+/month in messages | Batch non-critical notifications. Use in-app for non-essential |
| **Vercel serverless** | Traffic spikes, long-running Edge Functions | Overage charges | Monitor function duration. Optimize cold starts |
| **AI API costs (V3)** | LLM calls per pricing/matching | Could add ₹5-50 per order | Use rule-based engine first. LLM only when rules insufficient |
| **Video bandwidth** | Clients re-watching drafts many times | Bunny bandwidth fees (₹2.50/GB in Asia) | Limit preview plays? Or accept as cost of business |
| **Razorpay fees** | UPI is growing but Razorpay charges 2% even on UPI | ~₹130/order just for gateway | Unavoidable. Consider PayU or Cashfree if rates improve |
| **Chargebacks** | Bad clients doing chargeback fraud | ₹8,000+ per incident + ₹500 dispute fee | Strong delivery proof, client agreement, watermarked previews |

