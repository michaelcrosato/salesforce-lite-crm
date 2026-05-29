#!/usr/bin/env bash
# Full non-e2e gate: lint + typecheck + test + build. Fails fast.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
npm run agent:check
echo "check: passed (e2e not included; see scripts/agent/.. or npm run test:e2e)"
