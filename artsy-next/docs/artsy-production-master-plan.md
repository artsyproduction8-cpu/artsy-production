Artsy Production — Master Plan
1. Overview
Artsy Production is a two-sided post-production service
marketplace: a creative studio + technology platform for
video and photo editing. Initially wedding-focused, also
serving brand, product/store, and corporate/event clients.
The editor pool is a mix of Karan's own in-house team and
independent freelance editors, curated through an admin
approval process.
2. Brand & Design
Palette
 — light grey / off-white base, navy blue for
headlines and primary UI, light blue as accent. Drawn
from the original brand spec, confirmed against
nudot.com.tw as a style reference.
Design tokens (from the working mockups)
:
background 
#F4F5F7 , card surface 
(headlines/buttons/nav) 
#FFFFFF , navy
#16233F , light blue
(accent/links/tags) 
#3D7DC2 , border 
#DCDFE3 , muted
text 
#6B7280 , tag background 
#E4EEFB with tag text
#1B4C87 .
Type
 — confident geometric sans for headlines, clean
sans for body copy, a small mono accent on technical
labels (aspect-ratio tags, etc.) to ground the design in
the actual post-production craft.
Signature elements
 — a scrolling marquee band of
service categories, bracketed numeric index labels per
section ( 01 ) ( 02 ). Both inspired by nudot.com.tw's
kinetic, agency-grade energy, scaled to what a
static/lightweight site can realistically carry (no
WebGL/3D).
Marketing site structure
 — single scrolling page: Hero
→ Services → Work (portfolio) → About → Contact. A
first HTML draft already exists.
Booking/catalog model
 — inspired by unjob.ai:
productized service cards with clear specs (duration,
turnaround, price range) rather than a vague "contact
us" page.
3. Product Roadmap (from the versioned
specs)
V1 — Foundation & Direct Client Booking
: public site,
client mobile OTP, service catalogue, requirement
wizard, AI-assisted + Admin-controlled pricing,
checkout, 100% upfront payment, Drive-based upload,
project dashboard, Admin dashboard, QA/revision
workflow. Assignment stays Admin-controlled — no
open creator marketplace yet.
V2 — Creator Marketplace & Intelligent Assignment
:
freelancer OTP login + onboarding (profile, skills,
portfolio link, sample reels), Admin approval/rejection,
anonymised job cards, accept/decline, matching engine
+ Admin approval, NEFT payout ledger, performance
metrics.
V3 — AI Production OS
 (later): AI requirement
interpretation, pricing recommendation, creator
matching, QA assistance, revision classification,
learning loop from Admin decisions.
V4 — Scale & Multi-Market
 (later): multi
region/currency, corporate accounts, bulk orders,
analytics, automation.
V5 — Ecosystem
 (long-term, not a launch target): global
campaigns, enterprise accounts, partner APIs, AI
governance. Build only after V1–V4 prove out.
4. Practical Build Sequence
Rather than shipping strictly version-by-version, the
engineering order that makes sense:
1. Marketing site — ships independently, generates leads
now
2. WhatsApp OTP auth + freelancer onboarding + admin
approval panel
3. Customer-facing service catalog + requirement wizard
+ booking
4. Payments (Razorpay) + assignment/matching logic
This blends V1 and V2 pieces in the order they're actually
needed to work end-to-end, rather than finishing all of V1
before touching any of V2.
5. Freelancer Flow
1. Log in: mobile number + WhatsApp OTP
2. Submit profile: bio, skills/software, experience,
languages, availability, portfolio link, sample reels (links,
not uploaded files)
3. Goes to the Admin approval queue — approved or
rejected on portfolio/sample quality alone, no test edit
or interview step
4. Once approved: eligible for job matching
5. On a new project, the matching engine proposes eligible
freelancers. If confident in the top match, it auto
assigns; otherwise it routes to Admin for approval — the
same confidence-based pattern used for pricing
6. Freelancer receives an anonymised job card (no client
identity/contact info), accepts or declines
7. On accept: controlled, time-limited Drive access to the
relevant raw footage folder only. Internal deadline is 4-6
days — shorter than the client's 7-10 day promise,
leaving buffer for QA and reassignment
8. Daily check-in required: started or not, and progress if
started. A missed check-in flags Admin
9. Admin verifies directly (call/offline contact) if a check-in
is missed. If the freelancer isn't actually working, Admin
reassigns manually or asks the AI for a best-match
recommendation first
10. Submits completed work → Admin QA
11. On approval + client acceptance: payout becomes
eligible — NEFT transfer after TDS deduction (needs
freelancer PAN + bank details on file)
6. Customer Flow
1. Browse services (wedding films, brand/UGC reels,
store/product reels, corporate/event videos)
2. Pick a service → requirement wizard asks only relevant
questions
Example: 
Wedding Highlight (3–5 min)
 — song
choice or reference link, number of camera
angles/footage sources → priced roughly ₹5,000
8,000 depending on angle count
3. Price shown, GST absorbed into the total (itemized on
the invoice after payment)
4. Log in: mobile + WhatsApp OTP
5. Checkout via Razorpay (cards/UPI/net banking)
6. Raw footage delivered to an Artsy-controlled Google
Drive folder (not the client's personal Drive)
7. Track project status; Admin assigns a freelancer or in
house editor
8. QA → freelancer's draft goes into a built-in preview
player on the customer's dashboard → customer leaves
timestamped comments for any revisions, or approves
→ final acceptance
9. On final acceptance: retention clocks start — 15 days
for raw footage, 30 days for final files, running
concurrently
10. Mid-project scope changes: currently undefined as an
actual feature (see gaps below) — AI can flag a likely
scope change, but it routes to Admin review rather than
auto-billing
7. Pricing Model
Mechanism: base price per service + weighted
adjustments from requirement-wizard answers
(duration, camera/angle count, output formats,
urgency) — AI-assisted suggestion, Admin sets the
actual floor/ceiling/rules
AI pricing autonomy: quotes go straight to the customer
when the price falls within the admin-set range and the
AI is confident it understood the requirements correctly.
Outside that range, or when confidence is low, the quote
routes to Admin for approval first.
Pricing is admin-editable, not hardcoded: a Services &
Pricing screen in the admin panel lets Karan set/update
base prices and adjustment rules per service at any
time, without a code change.
Worked example: Wedding Highlight, 3–5 min, ₹5,000
8,000 depending on number of camera angles/footage
sources supplied
Brand & UGC Reels pricing factors: footage
volume/complexity, number of variants/deliverables
needed, and turnaround speed (rush fees) — all three
combine, a multi-factor model unlike the wedding
highlight's single camera-angle driver
Store & Product Reels pricing: same three factors as
Brand & UGC Reels, calculated per video and per
product — each product's reel is priced individually, not
bundled
Corporate & Event Videos pricing: blends both —
footage/camera-angle volume (like weddings) plus
variants and turnaround (like reels), rather than a
distinct model
Pricing model is now defined for all four service
categories (see above); actual rate numbers beyond the
wedding highlight example are still TBD, to be set via
the admin pricing screen
Freelancer payout split: 75% to freelancer, 25% to Artsy,
calculated from the client price (exact calculation base
— gross vs. after GST/gateway fees — still to confirm)
8. Data Model (consolidated, with known
gaps flagged)
From V1
: users, client_profiles, services, service_questions,
orders, payments, projects, files, revisions, notifications,
audit_logs
From V2
: creator_profiles, creator_samples,
creator_availability, creator_skills, jobs, assignments,
creator_payouts, creator_metrics, access_grants
Core table schemas (columns, not just names):
users — id (pk), phone (unique), role
(client/freelancer/admin), status, created_at, last_login
creator_profiles — user_id (fk), display_name, bio,
skills[], software[], experience_years, languages[], availability
(jsonb), portfolio_url, pan_number (encrypted), bank_details
(jsonb, encrypted), approval_status, approved_at,
approved_by (fk)
creator_samples — id, creator_id (fk), url, type, tags[],
approved (bool)
services — id, category, name, description, base_price,
pricing_rules (jsonb, admin-editable), active
orders — id, client_id (fk), service_id (fk),
requirements_json, final_price, status, marketing_consent
(bool), created_at
payments — id, order_id (fk), gateway, gross_amount,
gst_amount, gateway_fee, net_amount, gateway_ref, status,
created_at
projects — id, order_id (fk), assigned_creator_id (fk,
nullable), drive_folder_id, status, raw_footage_expires_at,
final_file_expires_at
assignments — id, project_id (fk), creator_id (fk), score,
proposed_at, accepted_at, declined_at, internal_deadline,
last_checkin_at, checkin_status
(on_track/missed/escalated), reassigned_from (fk,
nullable), reassignment_reason
creator_payouts — id, assignment_id (fk), gross_payout
(75% of client price), pan_number, tds_amount, net_payout,
form16a_url, neft_ref, status, paid_at
revisions — id, project_id (fk), round_no,
timestamp_seconds, comment, status, created_at
Remaining gaps to close before implementation:
"Change-order process" is referenced in the specs but
has no actual screens, workflow, or data model defined
yet
9. Compliance & Financial Rules
GST absorbed into the displayed checkout price;
itemized on the invoice generated after payment
TDS deducted before NEFT payout; requires TAN
registration (Artsy) and PAN on file (freelancer)
Refunds: pre-start requests are Admin-reviewed (full
refund if valid); post-start refunds are progress-scaled;
refunds recorded as compensating ledger entries, not
edits to the original record
Default delivery SLA: 7–10 days. AI or Admin assesses
project size — camera-angle/footage volume and final
output length — at booking, and extends the timeline
dynamically if it's likely to run long. Not a fixed rule
based threshold.
Dispute evidence is archived in an Admin-only store,
outside the normal 30-day client-facing deletion window
IP/ownership: client owns the final edited video
outright. Artsy may use it for marketing only with
explicit client consent (same permission-based model
as public reviews). Freelancers have no reuse rights —
can't use delivered work for their own portfolio or
marketing.
Footage access protection: faces and venue can't be
technically hidden from a freelancer actually doing the
edit, so protection is purely contractual — an
NDA/confidentiality clause in the freelancer agreement,
no watermarking or download restrictions layered on
top.
GST registration is in progress, not yet complete —
checkout/invoicing tax logic should use a configurable
GSTIN field so GST itemization can be switched on
once registration finishes, rather than hard-coded as
always-on from day one.
Registration status overall: no business entity, TAN, or
Razorpay merchant account exists yet either. Entity
registration is the dependency the rest sit behind (GST,
TAN, and Razorpay onboarding all typically need it) —
worth starting immediately, in parallel with the
marketing site and early build. Checkout, GST invoicing,
and TDS-deducted payouts can't go live until this chain
is done, even once the code is ready.
10. Tech Stack
Frontend: Next.js
Backend: Supabase (Postgres + auth + storage)
Auth/OTP: Meta WhatsApp Cloud API, direct (not a
reseller) — cheapest at India rates. Setup needs a Meta
Business Account, a verified business phone number,
and an approved authentication template before it can
send real OTPs.
Payments: Razorpay
Video hosting: Bunny Stream — roughly a fifth of
Cloudflare Stream's storage cost ($1 vs $5 per 1,000
minutes stored), still gives adaptive bitrate, a custom
player, and basic DRM. Right fit for a cost-conscious
early platform; revisit if usage analytics needs grow
later.
Hosting: Vercel
11. Open Questions & Gaps
Money & legal — deferred by choice, not blocking the build:
Freelancer agreement: IP terms are decided (client
owns outright, freelancer has no reuse rights); the
actual signed contract (independent-contractor terms,
confidentiality) is being drafted later.
Customer Terms of Service + cancellation policy —
drafting deferred to later.
Applicable GST rate once registered (confirm exact
rate/classification for post-production services with an
accountant).
Data protection — worth designing in now, not retrofitting:
India's DPDP Act is mid-rollout: Rules notified Nov 2025,
phased enforcement through Nov 2026 and May 2027.
Substantive obligations (consent management, data
principal rights to access/correct/erase, breach
notification) aren't fully enforced yet, but the timeline
overlaps almost exactly with this platform's
build/launch window. Given the platform collects phone
numbers and footage containing real people's faces,
worth building consent and data-deletion flows in from
the start.
Product mechanics — not yet specified:
Video hosting/streaming for the built-in preview player:
Supabase Storage alone isn't built for smooth video
streaming — needs a dedicated service added to the
stack (e.g. Cloudflare Stream, Mux, Bunny Stream).
Previously flagged, still open:
International payout rails
Enterprise/multi-user accounts
Google Drive API rate limits at scale
12. Already in Progress
Marketing site: an early HTML draft exists but used an
older dark cinematic theme that was later superseded
— it needs rebuilding to match the current light
grey/navy/light-blue direction, not used as-is.
Visual mockups now exist (rendered, not files) for:
homepage hero with the animated marquee, the
freelancer onboarding form, and the freelancer
dashboard with animated stats/progress. Use the
design tokens above to rebuild these as real, production
components.
13. Phase 2 — Screen-by-Screen Specs
Login (shared: freelancer & customer)
Phone number input → "Send OTP" → WhatsApp
delivers a 6-digit code
OTP entry: 6-digit input, "Verify" button, "Resend" link
(with cooldown)
On success: new freelancer → onboarding form;
approved freelancer → freelancer dashboard; customer
→ service catalog/dashboard
Freelancer Onboarding Form
Fields: display name, bio, skills, software used, years of
experience, languages, availability, portfolio URL, 2–4
sample reel links (tagged by service type), PAN, bank
details
"Submit for review" → status becomes "pending" →
confirmation screen shown to the freelancer, entry
appears in the Admin queue
Admin Approval Queue
List view: pending submissions (name, submitted date,
quick sample preview)
Detail view: full profile, clickable sample links, Approve /
Reject (reject can include an optional reason)
Approve → status "approved", freelancer notified via
WhatsApp, becomes eligible for matching
Reject → status "rejected", freelancer notified (with
reason if given)
Freelancer Dashboard
Sections: Available jobs, Assigned jobs, Active work,
Revisions, Earnings, Payout status
Assigned job detail: anonymised brief, accept/decline,
Drive access link (once accepted), daily check-in
prompt (started? progress?)