# Artsy Production — Next.js Engine (v2.2)

High-velocity post-production studio platform built with Next.js 16 (App Router), TypeScript, and PostgreSQL.

---

## Background Crons & Deployment Architecture

### 1. Vercel Hobby Tier (Default Free Tier)
Vercel Hobby limits cron execution to **once per 24 hours**. 
- `vercel.json` is configured to run only the daily retention cron:
  ```json
  {
    "crons": [
      { "path": "/api/cron/retention", "schedule": "0 2 * * *" }
    ]
  }
  ```
- Sub-daily schedules (`/api/cron/reconcile-payments` every 15 min and `/api/cron/timeouts` hourly) are triggered via GitHub Actions:
  - File: `.github/workflows/cron.yml`
  - Required GitHub Secrets:
    - `APP_URL`: Your production URL (e.g. `https://artsyproduction.in`)
    - `CRON_SECRET`: 64-char hex string matching production env var.

### 2. Vercel Pro Tier
If deploying on Vercel Pro, sub-daily crons are supported natively. You can uncomment all 3 crons in `vercel.json` and disable `.github/workflows/cron.yml`:
```json
{
  "crons": [
    { "path": "/api/cron/reconcile-payments", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/retention", "schedule": "0 2 * * *" },
    { "path": "/api/cron/timeouts", "schedule": "0 * * * *" }
  ]
}
```

---

## Required Environment Variables
See `.env.local.example` for all required keys:
- `CRON_SECRET`: Secures `/api/cron/*` endpoints against unauthenticated invocation.
- `PII_ENCRYPTION_KEY`: 32-character AES-256 encryption key for PAN and banking credentials.
- `B2_APPLICATION_KEY_ID` & `B2_APPLICATION_KEY`: Backblaze B2 S3 storage ingest credentials.
- `WHATSAPP_ACCESS_TOKEN` & `WHATSAPP_PHONE_NUMBER_ID`: Meta WhatsApp Cloud API credentials.
