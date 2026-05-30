#!/usr/bin/env bash
# TypeScript typecheck (tsc --noEmit).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
PM="npm"
if [[ -n "${AGENT_PKG_MANAGER:-}" ]]; then
  PM="${AGENT_PKG_MANAGER}"
elif [[ -f pnpm-lock.yaml && ! -f package-lock.json ]]; then
  PM="pnpm"
fi

if ! command -v "$PM" >/dev/null 2>&1; then
  echo "typecheck: package manager '$PM' not found" >&2
  exit 1
fi

"$PM" run typecheck
