#!/usr/bin/env bash
# Regression test: ensures no master OTP bypass exists in the codebase.
# Fails if 123456 or 4210 appears in any auth code path.
set -e

echo "Checking for dev OTP bypass..."

# Check for hardcoded codes in OTP route
if git grep -q "'123456'\|'4210'\|\"123456\"\|\"4210\"" src/app/api/auth/otp/route.ts; then
  echo "FAIL: hardcoded code found in OTP route"
  git grep -n "'123456'\|'4210'\|\"123456\"\|\"4210\"" src/app/api/auth/otp/route.ts
  exit 1
fi

# Check lib/supabase.ts
if git grep -q "'123456'\|'4210'\|\"123456\"\|\"4210\"" lib/supabase.ts 2>/dev/null; then
  echo "FAIL: hardcoded code found in lib/supabase.ts"
  git grep -n "'123456'\|'4210'\|\"123456\"\|\"4210\"" lib/supabase.ts
  exit 1
fi

echo "PASS: no dev OTP bypass found"
exit 0
