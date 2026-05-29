#!/usr/bin/env bash
# Unit/integration tests (Vitest).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
npm run test
