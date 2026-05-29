#!/usr/bin/env bash
# ESLint (max-warnings=0).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
npm run lint
