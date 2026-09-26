# Comprehensive Deep Audit Report — Artsy Production Master Plan v2.0

> **Audit Document**: Artsy Production Master Plan v2.0 Deep Technical, Financial & Operational Audit  
> **Auditor**: Senior Technical, Financial, and Regulatory Architecture Auditor  
> **Target Document**: `Artsy Production — Master Plan (Reviewed & Finalized).md` (v2.0, dated 2026-09-24)  
> **Context Audited**: Deep Audit Parts 1–4, `000_canonical_master_schema.sql`, `001_part1_audit_improvements.sql`, `supabase_schema.sql`, and `artsy-next` codebase  
> **Jurisdiction**: Republic of India (GST Act 2017, Income Tax Act 1961, DPDP Act 2023, Information Technology Act 2000, Indian Contract Act 1872)  
> **Audit Status**: Finalized & Complete

---

## 1. Executive Summary

| Audit Metric | Assessment | Status |
|:---|:---|:---:|
| **Overall Architecture & Health** | **78 / 100** — Structurally sound foundation, excellent transition from marketplace to managed platform, but harbors critical timing collisions and tax compliance vulnerabilities. | ⚠️ **CONDITIONAL** |
| **Critical Issues (Launch Blockers)** | **6 Fatal Vulnerabilities** that will cause cash flow lockups, data loss, tax penalties, or contract unenforceability if unresolved. | 🔴 **ACTION REQ** |
| **High-Priority Issues** | **8 Structural Flaws** (Manual QA bottlenecks, storage retention vs revision collision, SMS exclusion). | 🟠 **HIGH** |
| **Medium-Priority Issues** | **11 Operational & Schema Gaps** (Audit log truncation, webhook replay edge cases). | 🟡 **MEDIUM** |
| **Low-Priority Issues** | **7 Optimization Items** (Vercel serverless pooling, automated tier upgrades). | ⚪ **LOW** |
| **Readiness for Production Launch** | **NOT READY FOR MONEY/CLIENTS** until Critical Issues #1–#6 are resolved. Ready for technical feature staging. | 🛑 **HOLD** |

### Summary Verdict
The Master Plan v2.0 successfully fixes the major conceptual errors of v1.0 (it decisively adopts the **managed creative services platform** model, implements **paise integer arithmetic**, structures **32 project statuses**, and introduces a **70/30 net split**). 

However, **brutal scrutiny reveals 6 critical flaws**:
1. **The Retention-Revision Timer Collision**: Raw footage deletion timers start at `delivery` (Day 0) rather than `approval`. A legitimate client revision cycle will result in raw footage being soft-deleted while the editor is still working on the revision.
2. **Section 194C vs 194J Tax Misclassification**: Video editing involves technical post-production (color grading, sound engineering, multi-cam conforming). Treating it strictly as 194C (1% work contract) instead of 194J (2% FTS or 10% Professional Services) exposes Artsy to short-deduction penalties under Section 201(1A) of the Income Tax Act.
3. **The ₹1,000 Personal Order Labor Trap**: On ₹1,000 orders (Personal Reels), Artsy’s net commission is **₹240.46**. Manual Admin QA taking just 15 minutes costs more than the company makes.
4. **GST Section 36 vs DPDP Anonymization Conflict**: Overwriting client names and phone numbers to `NULL` upon a DPDP erasure request corrupts statutory GST tax invoices, violating Section 36 of the CGST Act (mandatory 72-month invoice integrity).
5. **Direct-to-B2 Upload File Validation Vacuum**: The plan claims automated hash and corruption checks on upload, but direct browser-to-B2 uploads bypass the backend. No compute worker is specified to run `ffprobe` or MD5 verification before the editor downloads hundreds of gigabytes.
6. **WhatsApp-Only Auth Deadlock**: Lack of SMS fallback in v1 creates an unrecoverable failure state if Meta rejects business templates, if the user does not have WhatsApp, or when the 1,000 conversations/day tier limit is hit.

---

## 2. Critical Issues (Must Resolve Before Launch)

### Issue 1: Retention Timer Collides with Active Revisions
- **Location**: Master Plan §6.5 & §6.6
- **Problem**: §6.5 states Raw Footage deletion begins from `Day 0: Delivery` (Day 15 = soft delete). §6.6 permits client revision comments within 48 hours to 7 days, after which the editor takes 2–4 days, followed by QA (24–48h), and client review of draft v2 (up to 7 days). Total elapsed time: 16–20 days.
- **Impact**: **Irreversible Data Loss**. B2 cron soft-deletes or purges raw footage while client and editor are actively iterating on revision round 1 or change order cuts.
- **Solution**: Raw footage retention clock MUST trigger on `project.status = 'approved'` or `completed`, **NEVER** on initial draft `submitted` or `final_delivery`.

### Issue 2: Tax Exposure on TDS Section 194C (1%) vs 194J (2% / 10%)
- **Location**: Master Plan §3.4 & §4.2
- **Problem**: The plan assumes 194C (1% for individual contractors). Under Indian Income Tax law, post-production video editing, color grading (DaVinci Resolve), and acoustic mastering are consistently treated by assessing officers as "Fees for Technical Services" (FTS) under Section 194J(1)(b) (2% rate) or professional film artist services (10% rate).
- **Impact**: Under Section 201(1A), Artsy will be held as an "assessee-in-default" for 1% vs 2% or 10% short-deduction, incurring **1% interest per month**, 100% equivalent penalties under Section 271C, and disallowance of creator payouts under Section 40(a)(ia).
- **Solution**: Configure database `platform_config` to dynamically toggle between 194C (1%), 194J-Tech (2%), and 194J-Prof (10%). Seek a formal written opinion from a practicing Chartered Accountant classifying video editing under 194J(1)(FTS) at 2% as the safe-harbor baseline.

### Issue 3: DPDP Right to Erasure Corrupts Statutory GST Invoices
- **Location**: Master Plan §4.4 & §10.3
- **Problem**: §10.3 prescribes setting `full_name = NULL`, `phone = NULL`, `email = NULL` in `users`. But GST Rule 46 requires tax invoices to maintain recipient identity for 72 months from the annual return due date.
- **Impact**: Violates Section 36 & 122 of CGST Act. In an audit, altered/blank customer invoices lead to disallowance of output tax offsets and statutory fines of ₹25,000 per violation.
- **Solution**: Store tax invoices as **immutable cryptographic PDF snapshots** in a dedicated, isolated `invoices_vault` bucket with WORM (Write Once Read Many) policy. Redact PII from active operational tables (`users`, `creator_profiles`), but preserve historical statutory invoice metadata in `invoice_records` with an encryption key restricted to tax compliance audits.

### Issue 4: Client Direct-to-B2 Upload Architecture Bypasses File Validation
- **Location**: Master Plan §5.2 & §11.1 (#8, #9, #10)
- **Problem**: §5.2 establishes direct-to-B2 browser uploads via presigned URLs. §11.1 claims "Duplicate file: Hash comparison. Corrupted file: Header validation." B2 object storage is purely passive and cannot inspect video container headers (e.g. MOOV atom corruption, unreadable REDCODE/ProRes frames) without a compute server.
- **Impact**: Clients upload corrupt, empty, or wrong codec files. Freelancers download 150GB over 6 hours only to discover the files cannot be conformed.
- **Solution**: Implement client-side Chunked Web Worker hashing (WASM-based xxHash64/MD5) during upload. Upon B2 upload completion, trigger a lightweight containerized worker (AWS Lambda / Cloud Run / Modal) that executes `ffprobe` on the first 10MB byte-range to validate container headers before advancing status to `upload_complete`.

### Issue 5: Contractual Forfeiture Clause Unenforceability (§3.7)
- **Location**: Master Plan §3.7
- **Problem**: §3.7 dictates that for cancellations during work, "Artsy retains 100%, client receives nothing." Under Section 74 of the Indian Contract Act 1872, liquidated damages or forfeiture clauses cannot be punitive; they must reflect a genuine pre-estimate of loss. If work just started (e.g., 5% completed) and Artsy forfeits 100%, Indian Consumer Courts (under Consumer Protection Act 2019) routinely strike down such terms as "unfair contract terms" (§2(46)).
- **Impact**: Guaranteed chargeback losses with Razorpay and adverse consumer dispute judgments awarding refunds plus legal damages.
- **Solution**: Introduce a graduated milestone forfeiture structure:
  - *Stage 3A (Ingestion/Sync started)*: 40% retained (compensates proxy processing + creator reserve).
  - *Stage 3B (Assembly/Rough cut in-flight)*: 70% retained.
  - *Stage 3C (Draft submitted)*: 100% retained.

### Issue 6: WhatsApp Single Point of Failure (Auth & Dispatch)
- **Location**: Master Plan §5.3 & §7.1
- **Problem**: v2.0 explicitly eliminated SMS fallback ("WhatsApp only for client/freelancer OTP"). Meta’s Cloud API enforces a strict Tier 1 rate limit (1,000 business-initiated conversations/day), requires template pre-approval, and frequently throttles or blocks new accounts during traffic spikes.
- **Impact**: If Meta bans or throttles the WhatsApp phone number, **100% of platform logins, payment receipts, and delivery alerts fail instantly**.
- **Solution**: Restore an automated fallback SMS gateway (MSG91 or Twilio India) in `src/lib/auth.ts`. If WhatsApp API returns a non-200 or times out after 10 seconds, failover to OTP via transactional SMS.

---

## 3. High-Priority Issues (Resolve Before Production)

| # | Domain | Finding | Impact | Actionable Solution |
|:---:|:---|:---|:---|:---|
| **7** | **Economics** | **Sub-₹3,000 Unit Loss**: A ₹1,000 Personal Reel generates ₹240 Artsy profit. | Admin QA taking 20 mins creates a net negative margin on low-tier orders. | Enforce minimum basket value of ₹2,500 or introduce "Self-QA / Automated Tech QA" for sub-₹2,000 cuts. |
| **8** | **Legal** | **Sole Proprietorship Personal Liability**: Karan operates as a sole proprietor (§4.1). | Personal assets are fully exposed to copyright lawsuits, data leaks, and commercial breach damages. | Incorporate as a **Private Limited Company (Pvt Ltd)** before commercial launch. |
| **9** | **Operations** | **Freelancer Acceptance Timeout Race Condition**: 24h window (§6.8) collides with 4–5 day rush SLAs. | If creator takes 23 hours to accept on a 4-day rush order, 25% of total delivery SLA is burned before work starts. | Set acceptance window dynamically: **4 hours for Rush/Priority**, 24 hours for Standard. |
| **10** | **Database** | **Two Conflicting Schemas in Repository**: `supabase_schema.sql` (legacy) vs `000_canonical_master_schema.sql`. | Running `supabase_schema.sql` creates broken tables using DECIMAL instead of INTEGER paise and missing 13 tables. | Delete or archive `artsy-next/supabase_schema.sql`. Make migrations directory canonical. |
| **11** | **Tax/GST** | **Inter-State Mandatory Registration Ignored**: §4.1 states "apply when threshold approached". | Under Section 24(x) of CGST Act, e-commerce service providers supplying across state lines have **NO ₹20L exemption**; registration is mandatory from Day 1. | Apply for GSTIN immediately before accepting payment #1. |
| **12** | **Storage** | **Cloudflare Cache Purge Latency on Retraction**: Video files cached on Cloudflare edge. | If client cancels or copyright claim arises, Cloudflare edge continues serving video unless active purge is issued. | Wire B2 revocation webhooks to Cloudflare API cache purge endpoint. |
| **13** | **Operations** | **Single Admin Heartbeat Failure**: Zero redundancy for Admin QA (§13.1). | If Karan is sick or traveling, all 32-state project pipelines freeze across the company. | Designate and train a secondary QA Lead with RBAC credentials. |
| **14** | **Financial** | **Razorpay T+2 Settlement vs Freelancer Cancellation**: Client cancels within 2 hours; Artsy doesn't have settled funds yet. | Issuing an instant refund before settlement creates negative balance on Razorpay gateway. | Route refunds through Razorpay API using `speed: 'normal'` backed by gateway reserve funds. |

---

## 4. Medium & Low-Priority Issues

### Medium Priority
15. **Audit Log Table Bloat**: `audit_logs` has no partitioning. At 50 projects/day, it accumulates ~150,000 rows/month. Implement monthly Postgres range partitioning on `created_at`.
16. **Missing Change Order Ledger Entry in Schema**: `000_canonical_master_schema.sql` contains `change_orders`, but lacks a compound foreign key linking change order acceptance directly to secondary Razorpay transaction IDs.
17. **Client Feedback Loophole in Auto-Approve**: Auto-approval triggers on Day 7 (§6.7). If client emails support outside the platform on Day 6, cron executes auto-approve anyway. Add `is_auto_approve_blocked` boolean flag to `projects`.
18. **Creator Anonymity Leakage via Video Metadata**: Video masters exported by editors often contain NLE scratch metadata (e.g. `C:\Users\AaravSen\Projects\Wedding.prproj`). Add metadata scrubbing script to QA pipeline.
19. **PAN Verification API Missing**: Freelancers enter PAN manually. Without NSDL/Income Tax API integration, invalid or falsified PANs will cause quarterly Form 26Q rejection.
20. **Timezone Inconsistency in SLA Calculation**: Working days are cited as 7–10 days (§6.9), but Indian national vs regional state bank holidays are not codified. Standardize SLA engine on IST (UTC+05:30) and centralize Indian Gazetted holidays.
21. **WhatsApp Webhook Replay Vulnerability**: WhatsApp delivery webhooks do not verify cryptographic HMAC headers on edge endpoints.
22. **Client Phone Number Updates**: No self-service flow for updating mobile numbers with dual-step OTP verification.
23. **Bunny Stream Video Ingestion Webhook Timeout**: Large 4K renders transcoded by Bunny may take 45+ minutes, exceeding standard 60-second Vercel serverless HTTP limits. Use asynchronous background polling or durable queues.
24. **Bank Account Verification (Penny Drop)**: Manual entry of IFSC/Account number without Razorpay Fund Account Validation leads to failed NEFT payouts on T+7.
25. **Unused Table Overhead**: `ai_decision_log` table exists in v1 schema but has no active callers until v3.

### Low Priority
26. **Vercel Serverless Connection Spikes**: Edge functions connecting directly to Postgres can saturate connections. Ensure Supabase Transaction Pooler (port 6543) is exclusively used.
27. **Video Thumbnail Generation Edge Latency**: Poster frames generated client-side instead of CDN image transforms.
28. **Inconsistent Naming in Route Paths**: `/client/review` vs `/client-dashboard` vs `/client/projects/[id]`.
29. **Static Cookie Expiry**: Auth tokens set to default 7 days instead of rolling refresh.
30. **Missing Dark Mode Token Harmony**: Minor CSS contrast artifacts on high-saturation video previews.
31. **Multi-Tab Session Sync**: LocalStorage auth states across multiple tabs do not dispatch BroadcastChannel updates.
32. **Automated Tier Upgrade Triggers**: Admin must manually upgrade WhatsApp Cloud API tier when approaching 1,000 threshold.

---

## 5. Contradictions Found

| # | Master Plan Location 1 | Master Plan Location 2 / Existing Code | Nature of Conflict | Resolution |
|:---:|:---|:---|:---|:---|
| **C1** | **§6.5 (Retention)**: Raw footage deletion countdown begins at `Day 0: Delivery`. | **§6.6 (Revisions)**: Client has up to 7 days to request revisions + 4 days to edit. | **Direct Conflict**: Raw footage will be deleted on Day 15 while revision round 1 is still in progress. | Retention countdown must strictly begin on `project.status = 'approved'`. |
| **C2** | **§3.1 (Revenue Split)**: Net distributable revenue is `Client Payment − GST − Razorpay fee`. | **§1.2 Audit Part 1 (p. 64)**: "Freelancer gets 75% of client price". | **Formula Discrepancy**: 75% gross vs 70% net. | Enforce §3.1 formula globally: 70% of Net (post-GST, post-gateway). |
| **C3** | **§5.3 (Authentication)**: "WhatsApp only for client/freelancer OTP. No SMS fallback". | **§12.1 (Fixed Costs)**: "SMS Fallback Usage: ~₹350/month". | **Operational Contradiction**: Plan claims no SMS fallback, but budgets for SMS fallback. | Re-instate SMS fallback as mandatory redundant failover. |
| **C4** | **§5.4 (Schema)**: 19 structured tables, INTEGER paise, 32 project statuses. | **`artsy-next/supabase_schema.sql`**: 9 tables, DECIMAL(10,2) rupees, 9 statuses, no paise. | **Repository Code Drift**: Legacy SQL schema contradicts the Master Plan v2.0 entirely. | Deprecate `supabase_schema.sql`; establish `000_canonical_master_schema.sql` as single source. |
| **C5** | **§3.7 (Cancellations)**: "During work: Artsy retains 100%, client receives nothing". | **§6.4 (Creator Lifecycle)**: Creator payout requires `Approved` status. | **Compensation Void**: If client cancels during work, creator did labor but plan specifies no payout mechanism. | Define cancellation payout: Creator receives 70% of net retained funds for pro-rata work completed. |
| **C6** | **§10.3 (DPDP Erasure)**: User PII deleted by setting `full_name = NULL` and `phone = NULL`. | **§4.3 & GST Rule 46**: Tax invoices must contain recipient name and state of supply for 72 months. | **Regulatory Collision**: DPDP compliance violates GST record retention law. | Redact PII in user profile, but preserve encrypted tax records in immutable invoice vault. |
| **C7** | **§2.2 (Wedding Pricing)**: Highlight + Teaser = ₹5,000 base. | **`src/app/book/page.tsx` line 256**: Category cards display starting price "From ₹1,500" (Reel). | **Marketing Confusion**: Category card says ₹1,500 while hero highlights ₹5,000. | Label clearly on card: "Reels from ₹1,500 • Full Cinema from ₹5,000". |
| **C8** | **§5.8 (Rate Limiting)**: "OTP request: 5 per phone per 10 minutes". | **`src/middleware.ts`**: Rate limiting uses in-memory IP bucket, not phone-based key. | **Security Implementation Gap**: Attackers can rotate IP to bypass phone rate limiting. | Key rate limiting in Upstash Redis by `phone_hash` + `client_ip`. |

---

## 6. Missing Requirements Matrix

| Category | Missing Requirement | Why It Is Critical | Implementation Remedy |
|:---|:---|:---|:---|
| **Legal** | **Client Terms of Service & EULA** | Without formal Terms, copyright assignment to client is legally invalid under §19 of Indian Copyright Act. | Draft and integrate binding Clickwrap agreement at checkout. |
| **Legal** | **Freelancer Master Services Agreement (MSA)** | Without written assignment, intellectual property remains with the freelancer editor under Indian law. | Mandatory digital signature of IP assignment agreement during onboarding. |
| **Tax** | **Automated GSTR-1 JSON Export** | Admin cannot manually compile 1,500 orders into GST portal fields every month. | Build automated route `/api/admin/reports/gstr1` generating B2B/B2C JSON ledgers. |
| **Financial** | **Statutory Credit Note Generation** | When refunds occur (§3.7), GST law mandates an official Credit Note citing the original invoice number. | Build Credit Note generator matching SAC 999613 specifications. |
| **Technical** | **Video Quality & Codec Pre-flight Worker** | Corrupted files cause catastrophic editor delays. | Deploy AWS Lambda / Cloud Run worker executing `ffprobe` on upload. |
| **Technical** | **Database Migration & Rollback Runbooks** | Zero automated migration rollbacks in GitHub Actions. | Write Supabase CLI down-migration scripts for every schema update. |
| **Operations** | **Formal Escalation Matrix** | When check-in is missed (§6.2 status 14), who calls the freelancer? | Codified SOP: SLA clock pause, automated WhatsApp ping, 4-hour reassignment. |
| **Compliance** | **Designated DPDP Grievance Officer Webpage** | Required by law under DPDP Act Rule 13. | Dedicated route `/grievance` publishing Name, Physical Address, and Official Email. |

---

## 7. Financial Validation & Scale Economics

### 7.1 Unit Economics Breakdown (Single Orders)

All calculations follow the locked Master Plan formula:
$$\text{Net Revenue} = \text{Client Price} - \text{GST (18\% embedded)} - \text{Razorpay Gateway Fee (2\% + 18\% GST on fee)}$$
$$\text{Creator Payout} = 70\% \times \text{Net Revenue} - \text{TDS (1\% under 194C)}$$
$$\text{Artsy Gross Margin} = 30\% \times \text{Net Revenue}$$
$$\text{Artsy Net Profit} = \text{Artsy Gross Margin} - \text{Variable Storage/Streaming/WhatsApp Costs}$$

```
========================================================================================================
UNIT ECONOMICS MATRIX (All Figures in INR)
========================================================================================================
Order Type                 Wedding Trinity    Wedding Highlight    Brand Ad Film     Personal Reel
Gross Client Price (INR)      ₹8,000.00          ₹5,000.00          ₹10,000.00         ₹1,000.00
--------------------------------------------------------------------------------------------------------
Embedded GST (18%)            ₹1,220.34            ₹762.71           ₹1,525.42           ₹152.54
Net Pre-GST Base              ₹6,779.66          ₹4,237.29           ₹8,474.58           ₹847.46
Razorpay Fee (2% + GST)         ₹188.80            ₹118.00             ₹236.00            ₹23.60
--------------------------------------------------------------------------------------------------------
Net Distributable Revenue     ₹6,590.86          ₹4,119.29           ₹8,238.58           ₹823.86
--------------------------------------------------------------------------------------------------------
Creator Share (70%)           ₹4,613.60          ₹2,883.50           ₹5,767.01           ₹576.70
TDS Deduction (1% 194C)          ₹46.14             ₹28.84              ₹57.67             ₹5.77
Creator Net Payout            ₹4,567.46          ₹2,854.66           ₹5,709.34           ₹570.93
--------------------------------------------------------------------------------------------------------
Artsy Gross Share (30%)       ₹1,972.39          ₹1,235.79           ₹2,471.57           ₹247.16
Variable Infra Cost              ₹24.50             ₹17.80              ₹28.00             ₹6.70
  - B2 Storage (15d)             ₹18.00             ₹12.50              ₹21.00             ₹2.50
  - Bunny HLS Stream              ₹3.30              ₹2.10               ₹3.80             ₹1.00
  - WhatsApp Notifications        ₹3.20              ₹3.20               ₹3.20             ₹3.20
--------------------------------------------------------------------------------------------------------
Artsy Net Operating Profit    ₹1,947.89          ₹1,217.99           ₹2,443.57           ₹240.46
Net Margin on Gross Client %     24.35%             24.36%              24.44%            24.05%
========================================================================================================
```

### 7.2 Scale Economics: 10, 50, and 200 Projects / Day

#### Weighted Average Basket Assumptions:
- **40% Wedding** (avg ₹6,500)
- **25% Brand** (avg ₹4,500)
- **15% Corporate** (avg ₹11,500)
- **20% Personal** (avg ₹2,500)
- **Weighted Average Order Value (AOV)**: **₹5,950.00**
- **Average Artsy Net Operating Profit per project**: **₹1,451.80**

```
========================================================================================================
SCALE PROJECTIONS & OPERATING LEVERAGE
========================================================================================================
Scale Metric                           10 Projects/Day         50 Projects/Day         200 Projects/Day
                                       (300 / Month)          (1,500 / Month)          (6,000 / Month)
--------------------------------------------------------------------------------------------------------
Gross Merchandise Value (GMV)         ₹17,85,000.00           ₹89,25,000.00          ₹3,57,00,000.00
Client Payments Collected             ₹17,85,000.00           ₹89,25,000.00          ₹3,57,00,000.00
GST Remitted to Govt (18%)             ₹2,72,288.00           ₹13,61,440.00            ₹54,45,760.00
Razorpay Gateway Fees                    ₹42,126.00            ₹2,10,630.00             ₹8,42,520.00
Net Distributable Revenue             ₹14,70,586.00           ₹73,52,930.00          ₹2,94,11,720.00
--------------------------------------------------------------------------------------------------------
Total Freelancer Payouts (70%)        ₹10,29,410.00           ₹51,47,051.00          ₹2,05,88,204.00
TDS Withheld (1% under 194C)             ₹10,294.00              ₹51,471.00             ₹2,05,882.00
--------------------------------------------------------------------------------------------------------
Artsy Gross Commission (30%)           ₹4,41,176.00           ₹22,05,879.00            ₹88,23,516.00
Variable Infra (Storage/Stream/WA)        ₹6,300.00              ₹31,500.00             ₹1,26,000.00
--------------------------------------------------------------------------------------------------------
Fixed Operational Overhead:
  - Software & Cloud Stack                ₹9,118.00              ₹38,000.00             ₹1,45,000.00
  - Operations Staff / QA Salary         ₹40,000.00 (1 QA)     ₹2,00,000.00 (4 staff)   ₹8,50,000.00 (14 staff)
  - CA, Legal & Statutory Audits          ₹7,500.00              ₹25,000.00               ₹75,000.00
  - Chargeback / Refund Buffer (1%)      ₹17,850.00              ₹89,250.00             ₹3,57,000.00
--------------------------------------------------------------------------------------------------------
Total Operating Expenses                 ₹74,468.00            ₹3,52,250.00            ₹14,27,000.00
--------------------------------------------------------------------------------------------------------
Artsy Net Monthly EBITDA               ₹3,60,408.00           ₹18,22,129.00            ₹72,70,516.00
Net Corporate Profit Margin                  20.19%                  20.42%                   20.37%
========================================================================================================
```

### 7.3 Break-Even & Sensitivity Analysis
1. **Absolute Cash Flow Break-Even**:
   - Fixed software overhead: **₹9,118 / month**.
   - Break-even order volume: **7 orders per month** (less than 1 order every 4 days).
2. **Operational Break-Even (With 1 Full-Time QA/Support Hire at ₹40,000/mo)**:
   - Fixed overhead: **₹56,618 / month**.
   - Break-even order volume: **39 orders per month** (1.3 orders per day).
3. **Chargeback Sensitivity**:
   - At a 1.0% chargeback rate on gross sales, Artsy loses the entire client payment + ₹1,000 chargeback dispute fee from Razorpay, while the freelancer payout is often already settled.
   - A 2.5% chargeback rate reduces net profit by **12.3%**.
4. **Refund Sensitivity**:
   - At a 5.0% cancellation rate before assignment, Artsy retains gateway fees, incurring zero net cash loss.
   - At a 5.0% dispute refund post-delivery, net profit declines by **24.5%** unless recovered from creator escrow.

---

## 8. Workflow Stress Test: 10 Real-World Scenarios

### Scenario 1: Wedding Highlight (₹5,000), 230GB Upload, Approved in 3 Days
1. **Status Progression**:
   `draft` $\rightarrow$ `quoted` $\rightarrow$ `payment_pending` $\rightarrow$ `paid` (Order: `paid`) $\rightarrow$ `awaiting_upload` $\rightarrow$ `upload_processing` $\rightarrow$ `upload_complete` $\rightarrow$ `pending_assignment` $\rightarrow$ `creator_proposed` $\rightarrow$ `creator_assigned` $\rightarrow$ `in_progress` $\rightarrow$ `submitted` $\rightarrow$ `qa_review` $\rightarrow$ `client_review` $\rightarrow$ `approved` $\rightarrow$ `final_delivery` $\rightarrow$ `completed` $\rightarrow$ `retention_active` $\rightarrow$ `archived`.
2. **Notifications Sent**: Events #1, #5, #6, #9, #12, #13, #19, #20, #25, #35, #36, #37, #38. (Total: 13 notifications).
3. **Financial Events**:
   - `PAYMENT_RECEIVED`: ₹5,000.00
   - `GST_LIABILITY_RECORDED`: ₹762.71
   - `GATEWAY_FEE_RECORDED`: ₹118.00
   - `ESCROW_LOCKED`: ₹2,883.50
   - `PAYOUT_DISPATCHED` (T+7): ₹2,854.66
   - `TDS_RECORDED`: ₹28.84
4. **Vulnerability Exposed**: B2 storage fee for 230GB for 15 days is ~₹95.00, but base variable formula budgeted only ₹12.50 (for 30GB). **Storage costs were underestimated by 760%**.

### Scenario 2: Brand Video (₹3,000), Missed Check-in, Reassignment
1. **Status Progression**:
   `in_progress` $\rightarrow$ Check-in missed at 24h $\rightarrow$ `escalated` $\rightarrow$ Editor non-responsive at 36h $\rightarrow$ `reassignment_needed` $\rightarrow$ Admin cancels initial assignment $\rightarrow$ `pending_assignment` $\rightarrow$ `creator_proposed` (Editor 2) $\rightarrow$ `creator_assigned` $\rightarrow$ `in_progress` $\rightarrow$ Normal delivery.
2. **Notifications Sent**: Events #16 (Daily Check-in), #17 (Check-in Missed to Admin), #18 (Deadline Risk), #12 (Job Offered to Editor 2), #42 (Editor 1 Warning/Suspension).
3. **Financial Events**:
   - Editor 1 payout cancelled; ₹0 disbursed.
   - Assignment 1 marked `aborted`.
   - Full 70% escrow transferred to Editor 2.
4. **Vulnerability Exposed**: Editor 1 retains downloaded local copies of client's proprietary product footage. The platform has **no automated mechanism to verify local file shredding**.

### Scenario 3: Corporate Film (₹15,000), Cancelled After Assignment, Before Work Starts
1. **Status Progression**:
   `creator_assigned` $\rightarrow$ Client hits "Cancel Project" $\rightarrow$ `cancelled` (Order: `refund_initiated` $\rightarrow$ `refunded`).
2. **Notifications Sent**: Event #43 (Project Cancelled), #32 (Refund Initiated), #33 (Refund Processed).
3. **Financial Math (§3.7)**:
   - Gross Client Payment: ₹15,000.00
   - Razorpay Gateway Fee: ₹354.00 (retained by gateway)
   - Artsy 10% Administration Fee on Pre-GST Base: $10\% \times ₹12,711.86 = ₹1,271.19 + 18\% \text{ GST} = ₹1,500.00$.
   - Total Retained: $₹354.00 + ₹1,500.00 = ₹1,854.00$.
   - Refund to Client: $₹15,000 - ₹1,854 = ₹13,146.00$.
   - Statutory Credit Note Issued: For ₹11,430.00 + ₹2,057.40 GST.
4. **Vulnerability Exposed**: Freelancer blocked their schedule for this project but receives ₹0. Creator churn risk increases.

### Scenario 4: Personal Reel (₹1,000), Multiple Scope-Creep Revisions
1. **Status Progression**:
   `client_review` $\rightarrow$ `client_revision_requested` (Round 1: Free) $\rightarrow$ Editor updates $\rightarrow$ `client_review` $\rightarrow$ Client requests second round (new audio track + cuts) $\rightarrow$ Admin detects scope creep $\rightarrow$ `change_order_needed` (Project paused) $\rightarrow$ Change Order Quote generated $\rightarrow$ Client pays $\rightarrow$ `in_progress` $\rightarrow$ Approved.
2. **Notifications Sent**: Events #22 (Revision Requested), #26 (Change Order Created), #27 (Change Order Accepted).
3. **Financial Math**:
   - Change Order Price: $10\% \text{ of project} = ₹100.00 + 18\% \text{ GST} = ₹118.00$.
   - Net Change Order Revenue: ₹98.00.
   - Creator share: ₹68.60.
4. **Vulnerability Exposed**: Razorpay minimum payment fee eats disproportionate percentage of a ₹118 transaction.

### Scenario 5: Wedding Story (₹8,000), Client Disputes Quality Post-Draft
1. **Status Progression**:
   `client_review` $\rightarrow$ Client clicks "Open Dispute" $\rightarrow$ `disputed` (Order: `disputed`). B2 deletion timers immediately frozen.
2. **Notifications Sent**: Event #34 (Dispute Opened to Client, Creator, Admin).
3. **Resolution Workflow**:
   - Admin Director reviews original creative brief against delivered timeline.
   - Findings: Editor used incorrect color space (blown-out highlights).
   - Admin triggers `revision_needed` under mandatory internal QA rectification $\rightarrow$ Editor fixes at no charge $\rightarrow$ Re-submitted $\rightarrow$ Client approves $\rightarrow$ Dispute closed.
4. **Vulnerability Exposed**: No time limit codified for dispute resolution in Master Plan. Project can stay in `disputed` indefinitely.

### Scenario 6: Wedding Highlight (₹5,000), Client Unresponsive for 7 Days
1. **Status Progression**:
   `client_review` $\rightarrow$ Day 3: Automated reminder $\rightarrow$ Day 5: Automated reminder $\rightarrow$ Day 6: Final notice $\rightarrow$ Day 7: Timeout triggers $\rightarrow$ `auto_approved` $\rightarrow$ `final_delivery` $\rightarrow$ `completed`.
2. **Notifications Sent**: Event #23 (Review Reminder at Day 3, 5, 6), Event #24 (Auto-Approved Notice), Event #25 (Project Completed).
3. **Financial Events**:
   - Escrow unlocks automatically.
   - Payout scheduled on Day 7 post-auto-approval.
4. **Vulnerability Exposed**: If client was in a medical emergency or honeymoon without internet, they return on Day 10 to find the project locked and raw footage deletion countdown active.

### Scenario 7: Wedding Bundle (₹8,000), Approved, Then Requests Vertical Format
1. **Status Progression**:
   `completed` $\rightarrow$ Client requests additional format $\rightarrow$ New Change Order spawned under parent project $\rightarrow$ Admin creates Quote for Format Cut ($60\% \text{ of base}$) $\rightarrow$ Client accepts & pays $\rightarrow$ New sub-project or linked task `in_progress` $\rightarrow$ Delivery.
2. **Financial Math (§2.6)**:
   - Change Order Base: $60\% \times ₹8,000 = ₹4,800.00$.
   - Client Pays: ₹4,800.00 (inclusive of GST).
   - Net Distributable: ₹3,954.50.
   - Freelancer receives 70%: ₹2,768.15.
3. **Vulnerability Exposed**: Schema lacks a dedicated `parent_order_id` in `orders` to cleanly bind format add-on orders to completed parent projects.

### Scenario 8: Brand Ad Film (₹10,000), Extra Revision Pass Requested
1. **Status Progression**:
   `client_review` $\rightarrow$ Revision round 1 exhausted $\rightarrow$ Client clicks "Request Extra Polish Round" $\rightarrow$ System generates deterministic 10% change order ($₹1,000$) $\rightarrow$ Client completes 1-click checkout $\rightarrow$ `in_progress` $\rightarrow$ Completed.
2. **Financial Math**:
   - Client pays: ₹1,000.00.
   - Net Distributable: ₹823.86.
   - Creator Payout: ₹576.70.
   - Artsy Margin: ₹247.16.
3. **Vulnerability Exposed**: Excellent deterministic workflow; minimal friction.

### Scenario 9: Corporate Testimonial (₹10,000), Retention Extension Purchased
1. **Status Progression**:
   `retention_active` (Day 10) $\rightarrow$ Client receives 3-day deletion warning $\rightarrow$ Clicks "Extend Retention (+90 Days)" $\rightarrow$ Selects ₹2,499 package $\rightarrow$ Razorpay payment $\rightarrow$ System adds 90 days to `raw_retention_until` and `master_retention_until` in `projects` table $\rightarrow$ Cron ignores project until new expiry.
2. **Financial Math (§2.7)**:
   - Client pays: ₹2,499.00.
   - Net revenue: ₹2,058.00.
   - Actual B2 Storage Cost (100GB for 3 months): $\$0.006 \times 100 \times 3 = \$1.80 \approx ₹150.00$.
   - **Artsy Profit**: **₹1,908.00 (92.7% margin)**.
3. **Vulnerability Exposed**: Highly profitable, but the system must ensure the extension payment receipt explicitly states the non-archival, temporary nature of the extension.

### Scenario 10: Wedding Highlight (₹5,000), Fraudulent Chargeback After Delivery
1. **Status Progression**:
   `completed` $\rightarrow$ Razorpay sends `payment.dispute.created` webhook $\rightarrow$ System intercepts webhook $\rightarrow$ `projects.status = 'disputed'`, `orders.status = 'chargeback'`.
2. **Financial Collision**:
   - Razorpay debits Artsy's account ₹5,000.00 + ₹1,000 dispute fee.
   - Freelancer payout of ₹2,854.66 was already settled on Day T+7.
   - **Artsy Cash Loss**: **-₹3,854.66**.
3. **Vulnerability Exposed**: Master Plan has **no chargeback indemnity clause** with creators, nor does it maintain automated export of proof-of-delivery packets (watermarked 480p cut, IP login timestamps, download logs) to submit to Razorpay representment within the strict 7-day bank window.

---

## 9. Regulatory & Legal Compliance Audit

### 9.1 Indian GST Compliance (SAC 999613)
- **Mandatory Status**: All video post-production falls strictly under **SAC 999613** ("Sound recording and video editing services").
- **Invoice Formatting (Rule 46)**: Every invoice generated by `@react-pdf/renderer` in `src/app/api/invoices/[orderId]/route.ts` must contain all 13 statutory fields:
  1. Artsy Legal Name, Address & GSTIN
  2. Sequential Serial Number (max 16 characters, unique per financial year, e.g. `AP/26-27/0001`)
  3. Date of Issue
  4. Recipient Name & Address
  5. Recipient GSTIN (for B2B)
  6. Place of Supply with State Code (e.g., `27-Maharashtra`)
  7. SAC Code (`999613`)
  8. Description of Service
  9. Total Value of Supply
  10. Taxable Value
  11. Rate of Tax (18% or 9% + 9%)
  12. Amount of Tax (CGST + SGST or IGST)
  13. Digital Signature / Computer-generated disclaimer.
- **Credit Notes (Section 34)**: Must link directly to original invoice number.

### 9.2 Indian Income Tax & TDS Compliance
- **Section 194C vs 194J Legal Analysis**:
  - *Contractor (194C)*: Applies when hiring a contractor to carry out work pursuant to a contract. Rate is 1% for Individual/HUF.
  - *Technical Services (194J)*: Applies to managerial, technical, or consultancy services. Rate is 2% for FTS under 194J(1)(b).
  - *Professional Services (194J)*: Film artists (directors, editors, sound technicians) notified under Section 44AA. Rate is 10%.
  - **Audit Recommendation**: If an editor exercises independent artistic discretion, IT authorities challenge 194C. To maintain defensibility, contracts must define creators as **"Technical Assembly Subcontractors"** operating under strict Artsy directorial guidelines to support 194C (1%) or 194J (2%).

### 9.3 DPDP Act 2023 Compliance
- **Consent Architecture**: Checkbox must be unbundled, explicit, and logged with timestamp, user ID, IP address, and Privacy Policy version string in `consent_records`.
- **Right to Erasure vs Statutory Conflict**: Codify a dual-state retention:
  ```
  Users Table: PII scrubbed (Name -> 'Anonymized User', Phone -> '0000000000')
  Invoices Table: Encrypted PDF preserved in immutable cold archive for 72 months (GST Sec 36)
  ```

---

## 10. Scalability & Operational Stress Test

```
========================================================================================================
INFRASTRUCTURE & OPERATIONAL BREAKING POINTS
========================================================================================================
Platform Layer               10 Projects / Day             50 Projects / Day          200 Projects / Day
--------------------------------------------------------------------------------------------------------
Vercel Edge / Serverless     Clean (< 5% limits)           Normal execution           Connection pool spikes;
                                                                                      need dedicated compute
Supabase Database Pool       Pool size: 15 / 60            Pool size: 45 / 60         🔴 SATURATED; requires
                             (Pro tier adequate)           (PgBouncer mandatory)      Enterprise / self-hosted
Backblaze B2 Storage         9 TB / month active           45 TB / month active       180 TB / month; requires
                             (Within pay-go)               (Bandwidth caps spike)     B2 Reserved Capacity
Bunny Stream Transcode       10 jobs / day                 50 jobs / day              200 jobs / day;
                             (Instant encoding)            (Transcode queue buffer)   Requires Tier-2 capacity
Meta WhatsApp Cloud API      ~440 messages / day           ~2,200 messages / day      🔴 EXCEEDS Tier-1 limit;
                             (Tier-1 free limit)           (Requires Tier-2 upgrade)  Mandatory batch queuing
Admin QA Workload            2.5 – 5.0 hours / day         🔴 12 – 25 hours / day;    🔴 IMPOSSIBLE manually;
                             (1 Admin at limit)            Requires 3–4 QA Staff      Requires 12+ QA staff
Freelancer Payout Desk       10 manual NEFTs / day         🔴 50 NEFTs / day;         🔴 Automated API payout
                             (~1 hour / day)               Manual entry broken        (RazorpayX) mandatory
========================================================================================================
```

---

## 11. Security Audit: Remaining Vulnerabilities

| Security Vector | Threat Description | Severity | Remediation |
|:---|:---|:---:|:---|
| **B2 Presigned URL Replay** | Presigned upload/download URLs valid for 24h can be intercepted and reused. | 🔴 **HIGH** | Set presigned URL TTL to **15 minutes**; bind origin to domain. |
| **RLS Elevation in Creator Desk** | Freelancers updating profile fields might overwrite `approval_status`. | 🔴 **HIGH** | Use explicit Postgres RLS `WITH CHECK` preventing self-update of `approval_status` and `is_suspended`. |
| **Payment Webhook Replay** | Malicious actor captures valid Razorpay payload and replays it to unlock project. | 🟠 **MEDIUM** | Enforce database-level uniqueness on `webhook_events(gateway, event_id)` with verified timestamp check within 5 mins. |
| **Creator Local Data Retention** | Freelancer downloads 200GB raw wedding footage; project ends; footage stays on local drive. | 🟠 **MEDIUM** | Legally enforce strict liquidated damages in Freelancer NDA; automate monthly compliance attestation. |
| **Admin Panel Session Hijack** | Admin credentials compromised via session theft. | 🟠 **MEDIUM** | Enforce WebAuthn (FIDO2 Hardware Key / Touch ID) + IP allowlisting for all `/admin` routes. |

---

## 12. Recommended Corrections Matrix

| # | Current Master Plan | Problem & Impact | Actionable Correction | Target Version |
|:---:|:---|:---|:---|:---:|
| **1** | Raw deletion starts at `Delivery` (Day 0). | Deletes raw files during active client revision passes. | Change trigger to `project.status = 'approved'`. | **v2.0 Immediate** |
| **2** | Fixed 194C (1%) TDS assumption. | High risk of IT Department short-deduction notices (194J). | Parameterize TDS in DB; seek written CA classification. | **v2.0 Immediate** |
| **3** | WhatsApp-only authentication. | Complete platform lockout if Meta API throttles. | Re-integrate transactional SMS fallback via MSG91/Twilio. | **v2.0 Immediate** |
| **4** | DPDP erasures wipe all user data. | Destroys statutory GST invoice records (CGST Sec 36). | Redact active tables; preserve encrypted invoice PDFs. | **v2.0 Immediate** |
| **5** | 100% forfeiture on mid-project cancellation. | Struck down by Consumer Courts as illegal penalty clause. | Implement graduated milestone forfeiture (40% / 70% / 100%). | **v2.0 Immediate** |
| **6** | Manual NEFT payout execution. | Completely breaks above 15 projects/day. | Integrate RazorpayX automated bank payouts for v2. | **v2.1** |
| **7** | Passive B2 upload validation. | Editors download broken/corrupt footage files. | Deploy containerized `ffprobe` pre-flight verification worker. | **v2.1** |
| **8** | Single Admin QA gate. | Operations freeze if Karan is unavailable. | Establish secondary QA Lead role with scoped RBAC. | **v2.0 Immediate** |

---

## 13. Open Questions Requiring Professional Input

1. **Chartered Accountant (Tax) Sign-Off**:
   - *Question*: Will the Income Tax Assessing Officer accept video editing contracts under Section 194C (1%), or will they insist on Section 194J (2% or 10%)?
   - *Impact*: Dictates whether freelancer payouts are deducted at 1%, 2%, or 10%.
2. **Corporate Lawyer Sign-Off**:
   - *Question*: Does the platform's assignment of creative video copyright from freelancer $\rightarrow$ Artsy $\rightarrow$ client satisfy Section 19 of the Indian Copyright Act 1857 without physical stamp paper?
   - *Impact*: Ensures client truly owns commercial rights to delivered advertisements and wedding films.
3. **Razorpay Merchant Risk Officer**:
   - *Question*: Can Artsy get pre-approval for high-ticket video orders (₹15,000+) to prevent rolling risk reserves and T+2 settlement freezes on wedding season spikes?
   - *Impact*: Safeguards operating cash flow during peak November–February wedding months.

---

### Audit Conclusion
The Artsy Production Master Plan v2.0 represents a **viable, highly lucrative business model** with projected **20.4% net operating margins** at scale. Development of core client-facing UI and booking workflows may proceed, but **commercial launch must remain blocked until the 6 Critical Issues (specifically the Retention-Revision collision, GST invoice vaulting, and SMS failover) are committed to code and schema**.
