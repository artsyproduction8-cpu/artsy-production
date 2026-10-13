#!/usr/bin/env bash
# Blocks PII and secrets from appearing in reports.
# Usage: cat report.txt | bash scripts/pii-lint.sh
set -e
INPUT="$(cat)"
FAIL=0

if echo "$INPUT" | grep -qE '\+?91[6-9][0-9]{9}|\b[6-9][0-9]{9}\b'; then
  echo "BLOCKED: phone number pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'; then
  echo "BLOCKED: email pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'; then
  echo "BLOCKED: JWT pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE 'vcp_[A-Za-z0-9]{20,}'; then
  echo "BLOCKED: Vercel API token pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE '\b[0-9a-f]{32,}\b'; then
  echo "BLOCKED: hex secret pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE '[A-Za-z]:\\Users\\[A-Za-z0-9]+'; then
  echo "BLOCKED: local Windows user path"; FAIL=1
fi
if echo "$INPUT" | grep -qE '\bgQ[A-Za-z0-9_-]{40,}\b'; then
  echo "BLOCKED: Upstash token pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE '\brzp_(live|test)_[A-Za-z0-9]{14,}'; then
  echo "BLOCKED: Razorpay key pattern"; FAIL=1
fi
if echo "$INPUT" | grep -qE '\bre_[A-Za-z0-9_-]{20,}'; then
  echo "BLOCKED: Resend API key pattern"; FAIL=1
fi

if [ $FAIL -eq 1 ]; then exit 1; fi
echo "PASS: no PII or secrets detected"
exit 0
