#!/usr/bin/env bash
# Read-only environment diagnostics. Non-zero only if npm is missing.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

echo "node:    $(command -v node >/dev/null 2>&1 && node -v || echo 'not found')"
echo "npm:     $(command -v npm  >/dev/null 2>&1 && npm -v  || echo 'not found')"
echo "npx:     $(command -v npx  >/dev/null 2>&1 && echo present || echo 'not found')"
echo "git:     $(command -v git  >/dev/null 2>&1 && git --version || echo 'not found')"
echo ".env:    $([ -f .env ] && echo present || echo 'missing (run bootstrap)')"
echo "prisma client: $([ -d node_modules/@prisma/client ] && echo generated || echo 'not generated')"

if ! command -v npm >/dev/null 2>&1; then
  echo "doctor: npm missing" >&2
  exit 1
fi
echo "doctor: ok"
