# Artsy Production — WhatsApp Cloud API HSM Templates Catalog (44 Events)
**Standard:** Meta WhatsApp Business Cloud API v19.0+  
**Namespace:** `artsy_production`  
**Total Templates:** 44 Approved Event Templates

---

| # | Event Name | Template Name | Category | Lang | Expected Parameters | Sample Message Body |
| :-: | :--- | :--- | :---: | :---: | :--- | :--- |
| 1 | OTP_SENT | `artsy_otp_verification` | AUTHENTICATION | en | `{{1}}` (otp) | Your Artsy verification code is {{1}}. Valid for 5 minutes. Do not share this code. |
| 2 | PROFILE_SUBMITTED | `artsy_creator_application_received` | UTILITY | en | `{{1}}` (alias) | Hi {{1}}, your creator application has been submitted to Studio Curation. We will review your portfolio within 24-48 hours. |
| 3 | PROFILE_APPROVED | `artsy_creator_approved` | UTILITY | en | `{{1}}` (alias) | Welcome to Artsy Production, {{1}}! Your editor profile is approved. You are now eligible to receive project offers. |
| 4 | PROFILE_REJECTED | `artsy_creator_rejected` | UTILITY | en | `{{1}}` (alias) | Thank you for your interest, {{1}}. At this time, our roster does not match your reel. You may reapply in 60 days. |
| 5 | QUOTE_READY | `artsy_quote_ready` | UTILITY | en | `{{1}}` (service), `{{2}}` (amount) | Your custom quote for {{1}} (₹{{2}}) is ready. View breakdown and lock checkout within 7 days. |
| 6 | PAYMENT_SUCCESSFUL | `artsy_payment_confirmed` | UTILITY | en | `{{1}}` (amount), `{{2}}` (orderId) | Payment of ₹{{1}} confirmed for Order #{{2}}. Upload your raw footage to initiate timeline assembly. |
| 7 | PAYMENT_FAILED | `artsy_payment_failed` | UTILITY | en | `{{1}}` (orderId) | Payment transaction failed for Order #{{1}}. Tap to retry checkout. |
| 8 | UPLOAD_REMINDER | `artsy_upload_reminder` | UTILITY | en | `{{1}}` (orderId) | Friendly reminder: Please upload your project footage for Order #{{1}} so our editing team can begin. |
| 9 | UPLOAD_COMPLETE | `artsy_upload_complete` | UTILITY | en | `{{1}}` (projectId) | Your raw footage for Project #{{1}} has been safely ingested and verified. Assigned to editorial queue. |
| 10 | UPLOAD_FAILED | `artsy_upload_integrity_failed` | UTILITY | en | `{{1}}` (projectId) | One or more clips for Project #{{1}} failed integrity check. Please re-upload your missing clips. |
| 11 | CREATOR_ASSIGNED | `artsy_creator_assigned` | UTILITY | en | `{{1}}` (projectId), `{{2}}` (creatorName) | Lead editor {{2}} has been assigned to Project #{{1}}. |
| 12 | JOB_OFFERED | `artsy_job_offered` | UTILITY | en | `{{1}}` (service), `{{2}}` (payout) | New project offer: {{1}} (Net Payout: ₹{{2}}). Respond within 24 hours to secure assignment. |
| 13 | CREATOR_ACCEPTED | `artsy_job_accepted` | UTILITY | en | `{{1}}` (projectId) | Creator accepted Project #{{1}}. Ingest credentials issued. |
| 14 | CREATOR_DECLINED | `artsy_job_declined` | UTILITY | en | `{{1}}` (projectId) | Creator declined Project #{{1}}. Reassigning to reserve editor. |
| 15 | ACCEPTANCE_TIMEOUT | `artsy_acceptance_timeout` | UTILITY | en | `{{1}}` (projectId) | 24-hour acceptance window expired for Project #{{1}}. Job returned to curation queue. |
| 16 | DAILY_CHECKIN | `artsy_daily_checkin` | UTILITY | en | `{{1}}` (projectId) | Please submit your daily editing milestone for Project #{{1}}. |
| 17 | CHECKIN_MISSED | `artsy_checkin_missed` | UTILITY | en | `{{1}}` (projectId) | Check-in missed for Project #{{1}}. Admin attention required. |
| 18 | DEADLINE_RISK | `artsy_deadline_risk` | UTILITY | en | `{{1}}` (projectId) | Project #{{1}} internal deadline approaching in less than 24 hours. |
| 19 | DELIVERABLE_SUBMITTED | `artsy_deliverable_submitted` | UTILITY | en | `{{1}}` (projectId) | New timeline export submitted for Project #{{1}}. Ready for Studio QA review. |
| 20 | QA_PASSED | `artsy_qa_passed_preview_ready` | UTILITY | en | `{{1}}` (projectId) | Studio QA complete! Your private preview link for Project #{{1}} is ready. Review and leave frame comments. |
| 21 | QA_FAILED | `artsy_qa_failed` | UTILITY | en | `{{1}}` (projectId) | QA review requires adjustments on audio/color consistency for Project #{{1}} before client preview. |
| 22 | REVISION_REQUESTED | `artsy_revision_requested` | UTILITY | en | `{{1}}` (projectId) | Client has submitted revision comments on Project #{{1}}. Please review notes. |
| 23 | REVIEW_REMINDER | `artsy_review_reminder` | UTILITY | en | `{{1}}` (projectId) | Your preview cut for Project #{{1}} is ready. Auto-approval activates in 48 hours. |
| 24 | AUTO_APPROVED | `artsy_auto_approved` | UTILITY | en | `{{1}}` (projectId) | 7-day client review period elapsed. Project #{{1}} has been auto-approved for master export. |
| 25 | PROJECT_COMPLETED | `artsy_project_completed` | UTILITY | en | `{{1}}` (projectId) | Your master 4K / HD delivery package for Project #{{1}} is ready for download. |
| 26 | CHANGE_ORDER_CREATED | `artsy_change_order_created` | UTILITY | en | `{{1}}` (projectId), `{{2}}` (amount) | Scope update required for Project #{{1}}: ₹{{2}} for additional deliverables. |
| 27 | CHANGE_ORDER_ACCEPTED | `artsy_change_order_accepted` | UTILITY | en | `{{1}}` (projectId) | Change order approved and funded for Project #{{1}}. Extra scope unlocked. |
| 28 | CHANGE_ORDER_DECLINED | `artsy_change_order_declined` | UTILITY | en | `{{1}}` (projectId) | Client declined scope change on Project #{{1}}. Proceeding with original delivery specification. |
| 29 | PAYOUT_ELIGIBLE | `artsy_payout_scheduled` | UTILITY | en | `{{1}}` (amount), `{{2}}` (projectId) | Project #{{2}} approved! Net payout of ₹{{1}} scheduled for NEFT release within 7 days. |
| 30 | PAYOUT_PROCESSED | `artsy_payout_processed` | UTILITY | en | `{{1}}` (amount), `{{2}}` (utr), `{{3}}` (tds) | NEFT Payout of ₹{{1}} successfully processed (UTR: {{2}}). Section 194J TDS withheld: ₹{{3}}. |
| 31 | PAYOUT_FAILED | `artsy_payout_failed` | UTILITY | en | `{{1}}` (amount) | NEFT transfer of ₹{{1}} failed due to invalid IFSC / account number. Please verify bank credentials. |
| 32 | REFUND_INITIATED | `artsy_refund_initiated` | UTILITY | en | `{{1}}` (amount) | Refund of ₹{{1}} initiated. Amount will reflect in original payment method in 5-7 business days. |
| 33 | REFUND_PROCESSED | `artsy_refund_processed` | UTILITY | en | `{{1}}` (amount) | Refund of ₹{{1}} settled. Statutory GST credit note generated. |
| 34 | DISPUTE_OPENED | `artsy_dispute_opened` | UTILITY | en | `{{1}}` (projectId) | Dispute opened for Project #{{1}}. Studio Admin has initiated manual review. |
| 35 | RAW_DELETION_7D | `artsy_raw_retention_7d` | UTILITY | en | `{{1}}` (projectId) | Raw footage for Project #{{1}} will be deleted in 7 days. Extend retention in dashboard. |
| 36 | RAW_DELETION_3D | `artsy_raw_retention_3d` | UTILITY | en | `{{1}}` (projectId) | URGENT: Raw footage for Project #{{1}} will be permanently archived in 3 days. |
| 37 | RAW_DELETION_1D | `artsy_raw_retention_1d` | UTILITY | en | `{{1}}` (projectId) | FINAL NOTICE: Raw footage for Project #{{1}} will be purged tomorrow. |
| 38 | RAW_DELETED | `artsy_raw_retention_purged` | UTILITY | en | `{{1}}` (projectId) | Raw footage for Project #{{1}} soft deleted according to 15-day retention policy. |
| 39 | FINAL_DELETION_7D | `artsy_final_retention_7d` | UTILITY | en | `{{1}}` (projectId) | Master export link for Project #{{1}} expires in 7 days. Download your final films. |
| 40 | FINAL_DELETION_3D | `artsy_final_retention_3d` | UTILITY | en | `{{1}}` (projectId) | Master video files for Project #{{1}} will be archived in 3 days. |
| 41 | FINAL_DELETED | `artsy_final_retention_purged` | UTILITY | en | `{{1}}` (projectId) | Final video files for Project #{{1}} archived from hot CDN storage. |
| 42 | CREATOR_SUSPENDED | `artsy_creator_suspended` | UTILITY | en | `{{1}}` (alias) | Notice: Your editor account has been temporarily paused by Studio Administration. |
| 43 | PROJECT_CANCELLED | `artsy_project_cancelled` | UTILITY | en | `{{1}}` (projectId) | Project #{{1}} cancelled. Cancellation terms applied per platform policy. |
| 44 | SLA_BREACH | `artsy_sla_breach_concession` | UTILITY | en | `{{1}}` (projectId) | Turnaround deadline exceeded on Project #{{1}}. 10% credit applied to account. |
