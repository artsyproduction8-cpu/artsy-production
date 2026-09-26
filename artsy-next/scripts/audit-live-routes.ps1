$routes = @(
  '/',
  '/services',
  '/services/wedding',
  '/services/ugc',
  '/services/product',
  '/services/corporate',
  '/services/personal',
  '/book',
  '/book?service=wedding',
  '/book?service=ugc',
  '/book?service=product',
  '/book?service=corporate',
  '/book?service=personal',
  '/book/price-summary',
  '/book/checkout',
  '/book/confirmation',
  '/client',
  '/client/review',
  '/client/projects/proj_mock_001',
  '/client-dashboard',
  '/freelancer',
  '/freelancer/payouts',
  '/freelancer/work/job-1',
  '/freelancer/onboarding',
  '/admin',
  '/admin/freelancers',
  '/admin/freelancers/creator-1',
  '/admin/login',
  '/auth/login',
  '/auth/verify',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/cookies',
  '/api/invoices/ARTSY-892410',
  '/api/cron/reconcile-payments',
  '/api/cron/retention',
  '/api/cron/timeouts',
  '/api/user/data-export?userId=user_mock_001'
)

$passed = 0
$failed = 0

Write-Host "================================================================"
Write-Host "ARTSY LIVE APP ROUTE & COMPONENT AUDIT"
Write-Host "================================================================"

foreach ($r in $routes) {
  try {
    $resp = Invoke-WebRequest -Uri ("http://localhost:3000" + $r) -UseBasicParsing -TimeoutSec 10
    Write-Host ("[PASS " + $resp.StatusCode + "] " + $r)
    $passed++
  } catch {
    Write-Host ("[FAIL] " + $r + " -> " + $_.Exception.Message)
    $failed++
  }
}

# Test POST routes
try {
  $postLeads = Invoke-RestMethod -Uri "http://localhost:3000/api/leads" -Method Post -Body '{"name":"Audit Test","email":"audit@artsy.internal","phone":"9876543210","service":"wedding","message":"Test lead"}' -ContentType "application/json"
  Write-Host "[PASS 200] POST /api/leads -> Success"
  $passed++
} catch {
  Write-Host ("[FAIL] POST /api/leads -> " + $_.Exception.Message)
  $failed++
}

Write-Host "================================================================"
Write-Host ("AUDIT SUMMARY: " + $passed + " Passed | " + $failed + " Failed")
Write-Host "================================================================"
