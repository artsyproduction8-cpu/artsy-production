# Artsy Production — Next.js Engine (v2.2)

High-velocity post-production studio platform built with **Next.js 16** (App Router), **TypeScript**, **Supabase** (PostgreSQL), **Razorpay**, and **Backblaze B2**.

---

## Quick Start

```bash
cd artsy-next
npm install
cp .env.local.example .env.local  # Then fill in real credentials
npm run dev
```

Visit `http://localhost:3000` — the app runs in **mock mode** when credentials are placeholders.

---

## Service Setup (Free Tier)

### 1. Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com) → Create a free project
2. Copy your **Project URL** and **Anon Key** from Settings → API
3. Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```
4. Run migrations in Supabase SQL Editor (in order):
   - `supabase/migrations/000_canonical_master_schema.sql`
   - `supabase/migrations/001_part1_audit_improvements.sql`
   - `supabase/migrations/002_master_plan_v2_1_locked_tables.sql`
   - `supabase/migrations/003_pii_encryption.sql`
   - `supabase/migrations/004_payments_worm.sql`
   - `supabase/migrations/005_otp_sessions.sql`
5. Seed data: Run `supabase/seed.sql` in SQL Editor
6. Verify: `curl http://localhost:3000/api/health` → `database.mode: "connected"`

### 2. Razorpay (Payments)

1. Go to [razorpay.com](https://razorpay.com) → Sign up for test mode
2. Go to Settings → API Keys → Generate Test Keys
3. Update `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_test_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
4. In Razorpay Dashboard → Webhooks → Add webhook:
   - URL: `https://your-domain.vercel.app/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `order.paid`
   - Secret: Same as `RAZORPAY_WEBHOOK_SECRET`
5. Verify: `curl -X POST http://localhost:3000/api/orders/create -H "Content-Type: application/json" -d '{"serviceId":"test","amount":500000}'`

### 3. Backblaze B2 (Raw Footage Storage)

1. Go to [backblaze.com](https://backblaze.com) → Create a free account (10GB free)
2. Create a bucket: `artsy-production-raw-footage` (private)
3. Create an Application Key with read/write access
4. Update `.env.local`:
   ```
   B2_KEY_ID=your-b2-key-id
   B2_APPLICATION_KEY=your-b2-application-key
   B2_BUCKET_NAME=artsy-production-raw-footage
   B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
   B2_REGION=us-west-004
   ```
5. Verify: `curl http://localhost:3000/api/health` → `storage.status: "configured"`

### 4. WhatsApp (OTP & Notifications)

1. Go to [developers.facebook.com](https://developers.facebook.com) → Create a WhatsApp Business App
2. Get a test phone number from the WhatsApp sandbox
3. Update `.env.local`:
   ```
   META_WHATSAPP_PHONE_ID=your-phone-number-id
   META_WHATSAPP_ACCESS_TOKEN=your-access-token
   MOCK_WHATSAPP=false
   ```
4. For development, keep `MOCK_WHATSAPP=true` to avoid sending real messages

### 5. Security Keys

```bash
# Generate secure keys
openssl rand -hex 32  # For CRON_SECRET
openssl rand -hex 32  # For PII_ENCRYPTION_KEY
```

Update `.env.local`:
```
CRON_SECRET=<generated-64-char-hex>
PII_ENCRYPTION_KEY=<generated-64-char-hex>
```

---

## Background Crons & Deployment Architecture

### Vercel Hobby Tier (Default Free Tier)
Vercel Hobby limits cron execution to **once per 24 hours**. 
- `vercel.json` is configured to run only the daily retention cron:
  ```json
  { "crons": [{ "path": "/api/cron/retention", "schedule": "0 2 * * *" }] }
  ```
- Sub-daily schedules (`/api/cron/reconcile-payments` every 15 min and `/api/cron/timeouts` hourly) are triggered via GitHub Actions:
  - File: `.github/workflows/cron.yml`
  - Required GitHub Secrets: `APP_URL`, `CRON_SECRET`

### Vercel Pro Tier
If deploying on Vercel Pro, all 3 crons are supported natively in `vercel.json`.

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel Dashboard:
# Settings → Environment Variables → Add all from .env.local
```

Required Vercel Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_WEBHOOK_SECRET`
- `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`
- `META_WHATSAPP_PHONE_ID`, `META_WHATSAPP_ACCESS_TOKEN`
- `CRON_SECRET`, `PII_ENCRYPTION_KEY`
- `MOCK_WHATSAPP=false` (for production)

---

## API Routes

| Route | Method | Description |
|:---|:---|:---|
| `/api/health` | GET | System health check (all service statuses) |
| `/api/auth/otp` | POST | Send/verify WhatsApp OTP |
| `/api/orders/create` | POST | Create Razorpay order + database record |
| `/api/webhooks/razorpay` | POST | Payment webhook (HMAC-verified) |
| `/api/leads` | POST | Contact form / lead capture |
| `/api/storage/presign` | POST | B2 presigned upload URL |
| `/api/storage/confirm` | POST | Upload confirmation |
| `/api/storage/validate-header` | POST | Video header validation |
| `/api/cron/reconcile-payments` | GET | Payment reconciliation (15min) |
| `/api/cron/retention` | GET | File retention lifecycle (daily) |
| `/api/cron/timeouts` | GET | Auto-approval & offer timeout (hourly) |
| `/api/invoices/[orderId]` | GET | Invoice generation |
| `/api/financial/gstr1-export` | GET | GST R1 export |
| `/api/admin/payouts/batch-neft` | POST | Batch NEFT payouts |
| `/api/admin/creator/[id]/reveal-pan` | POST | Decrypt PAN (admin audit-logged) |
| `/api/user/data-export` | POST | DPDP right-to-portability |
| `/api/user/data-deletion` | POST | DPDP right-to-erasure |

---

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check
npm run test:e2e         # Run 15-step E2E integration suite
npm run deploy:migrations # Deploy database migrations
```

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | Next.js 16, React 19, TypeScript |
| Database | Supabase (PostgreSQL 15) |
| Payments | Razorpay (test/live modes) |
| Storage | Backblaze B2 (S3-compatible) |
| Notifications | Meta WhatsApp Cloud API + MSG91 SMS |
| CI/CD | GitHub Actions + Vercel |
| Security | AES-256-GCM encryption, HMAC webhooks, RLS |
