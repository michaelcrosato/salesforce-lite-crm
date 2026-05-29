#!/usr/bin/env bash
# TypeScript typecheck (tsc --noEmit).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
npm run typecheck
