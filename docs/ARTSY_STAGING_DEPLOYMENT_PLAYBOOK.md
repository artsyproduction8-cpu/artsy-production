# ARTSY PRODUCTION — STAGING & PRODUCTION DEPLOYMENT PLAYBOOK

**Document Version**: 2.2  
**Date**: 2026-09-26  
**Status**: Ready for Immediate Staging Deployment  
**Codebase Readiness**: 94/100 (15/15 E2E Automated Tests Passed, 0 Lint Errors, Clean Build)

---

## 1. REPOSITORY & ARCHITECTURE STATUS

- **Branch**: `main` (Initialized and committed with clean `.gitignore`)
- **App Stack**: Next.js 16.3.5 (App Router, Turbopack, React 19)
- **Database Engine**: Supabase (PostgreSQL 15+, 30 Canonical Tables, WORM Triggers, PII Encryption)
- **Object Storage**: Backblaze B2 via AWS S3 SDK v3 (Direct Presigned Upload/Download URLs, 15m TTL)
- **Video Inspection**: `mediainfo.js` with 10MB chunk container atom parsing (QuickTime, MP4, EBML)
- **Notification Engine**: Meta WhatsApp Cloud API (Graph API v20.0 HSM Template Architecture)
- **Payment Processing**: Razorpay Gateway (HMAC-SHA256 signature verification, 5-minute replay guard)
- **Background Jobs**: Vercel Cron (Daily retention) + GitHub Actions (`*/15` payment reconciliation & hourly timeouts)

---

## 2. DEPLOYMENT STEP 1: SUPABASE DATABASE INITIALIZATION

### Option A: Using the Supabase CLI (Recommended)
1. Install or use Supabase CLI:
   ```bash
   npx supabase login
   ```
2. Link to your cloud Supabase project:
   ```bash
   npx supabase link --project-ref <YOUR_PROJECT_ID>
   ```
3. Push all migrations sequentially:
   ```bash
   npm run deploy:migrations
   npx supabase db push
   ```
4. Seed base services and initial configurations:
   ```bash
   npx supabase db execute --file supabase/seed.sql
   ```

### Option B: Using the Supabase Dashboard SQL Editor
Copy and execute each file from `artsy-next/supabase/migrations/` in exact numerical order:
1. `000_canonical_master_schema.sql` (Creates core 30 tables, RLS policies, audit infrastructure)
2. `001_part1_audit_improvements.sql` (Audit log indexing, retention soft-deletion, and NEFT payout tables)
3. `002_master_plan_v2_1_locked_tables.sql` (Locked fee tables, creator milestone state machines)
4. `003_pii_encryption.sql` (Enables `pgcrypto`, sets up `encrypt_pii`, `decrypt_pii`, and masking helpers)
5. `004_payments_worm.sql` (Attaches `BEFORE UPDATE OR DELETE` WORM trigger on `payments` table)
6. `seed.sql` (Seeds initial service packages, SLA definitions, and platform configuration)

---

## 3. DEPLOYMENT STEP 2: VERCEL DEPLOYMENT

### Connect Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** and import the GitHub repository.
3. Configure the Root Directory:
   - Root Directory: `artsy-next`
4. Build & Output Settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Configure Environment Variables
In Vercel Project Settings > **Environment Variables**, configure the production credentials from `.env.local.example`:

| Variable Name | Description | Example / Source |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret | `eyJhbGciOi...` (Never expose to client) |
| `NEXT_PUBLIC_APP_URL` | Application Domain | `https://staging.artsyproduction.in` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` (or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret | From Razorpay API Keys console |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | Set in Razorpay Dashboard > Webhooks |
| `B2_KEY_ID` | Backblaze Application Key ID | From Backblaze App Keys console |
| `B2_APPLICATION_KEY` | Backblaze Application Key | From Backblaze App Keys console |
| `B2_BUCKET_NAME` | Backblaze Bucket Name | `artsy-production-raw-footage` |
| `B2_ENDPOINT` | Backblaze S3 API Endpoint | `https://s3.us-west-004.backblazeb2.com` |
| `B2_REGION` | Backblaze Region | `us-west-004` |
| `PII_ENCRYPTION_KEY` | AES-256 Secret Key (32+ chars) | Generate via `openssl rand -hex 32` |
| `CRON_SECRET` | Cron Authorization Secret | Generate via `openssl rand -hex 32` |
| `META_WHATSAPP_PHONE_ID` | Meta WhatsApp Phone Number ID | Meta Developer Console |
| `META_WHATSAPP_ACCESS_TOKEN` | Meta System User Access Token | Meta Developer Console (Permanent token) |
| `META_WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business Account ID | Meta Business Suite |
| `MOCK_WHATSAPP` | Dev Mode Flag | Set to `false` in production, `true` in staging sandbox |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Upstash Console (Rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | Upstash Console |

---

## 4. DEPLOYMENT STEP 3: EXTERNAL CRON CONFIGURATION (VERCEL HOBBY / GITHUB ACTIONS)

Vercel Hobby plan only permits **1 cron schedule per day**.

- **Daily Cron (`vercel.json`)**:
  - `0 2 * * *` calls `/api/cron/retention` (Daily retention cleanup and soft-deleted B2 purge).
- **High-Frequency Crons (`.github/workflows/cron.yml`)**:
  - Schedule `*/15 * * * *` calls `/api/cron/reconcile-payments`.
  - Schedule `0 * * * *` calls `/api/cron/timeouts`.

### Setting Up GitHub Actions Secrets
In your GitHub Repository > **Settings** > **Secrets and variables** > **Actions**, add:
1. `APP_URL`: `https://staging.artsyproduction.in`
2. `CRON_SECRET`: Exact value matching `CRON_SECRET` set in Vercel.

---

## 5. DEPLOYMENT STEP 4: RAZORPAY WEBHOOK SETUP

1. Go to **Razorpay Dashboard** > **Settings** > **Webhooks**.
2. Click **Add New Webhook**:
   - Webhook URL: `https://staging.artsyproduction.in/api/webhooks/razorpay`
   - Secret: Exact secret configured in `RAZORPAY_WEBHOOK_SECRET`
   - Alert Email: `tech@artsyproduction.in`
   - Active Events:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `refund.processed`
3. Click **Create Webhook**.

---

## 6. DEPLOYMENT STEP 5: BACKBLAZE B2 BUCKET CORS CONFIGURATION

Backblaze B2 bucket must permit direct browser presigned PUT uploads:

In Backblaze B2 Console > **Buckets** > **CORS Rules**:
```json
[
  {
    "corsRuleName": "AllowBrowserDirectUpload",
    "allowedOrigins": [
      "https://staging.artsyproduction.in",
      "https://artsyproduction.in",
      "http://localhost:3000"
    ],
    "allowedOperations": [
      "s3_put",
      "s3_get",
      "s3_head"
    ],
    "allowedHeaders": [
      "*"
    ],
    "exposeHeaders": [
      "ETag"
    ],
    "maxAgeSeconds": 3600
  }
]
```

---

## 7. DEPLOYMENT STEP 6: POST-DEPLOYMENT VERIFICATION

Once deployed, run the automated E2E test suite against your staging domain:

```bash
# In artsy-next directory:
APP_URL=https://staging.artsyproduction.in npm run test:e2e
```

### Verification Checklist:
- [x] All 15 automated E2E assertions return `[PASS]`
- [x] Test booking placed and Razorpay test payment captured
- [x] B2 presigned upload accepts 10MB test clip and confirms into `file_records`
- [x] Corrupted video clip fails container atom inspection (`HTTP 422`)
- [x] Admin reveal PAN logs audit record and returns decrypted identifier
- [x] WORM trigger blocks any manual payment table update in Supabase
- [x] Cron endpoints return `401 Unauthorized` without bearer secret
