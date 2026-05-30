#!/usr/bin/env bash
# Install deps, ensure .env, generate client, push schema, seed.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

if command -v node >/dev/null 2>&1; then
  echo "node:    $(node -v)"
else
  echo "node not found" >&2
  exit 1
fi

PM="npm"
if [[ -n "${AGENT_PKG_MANAGER:-}" ]]; then
  PM="${AGENT_PKG_MANAGER}"
elif [[ -f pnpm-lock.yaml && ! -f package-lock.json ]]; then
  PM="pnpm"
elif [[ -f package-lock.json && ! -f pnpm-lock.yaml ]]; then
  PM="npm"
elif [[ -f package-lock.json && -f pnpm-lock.yaml ]]; then
  echo "both package-lock.json and pnpm-lock.yaml found; defaulting to npm for script compatibility"
fi

if ! command -v "$PM" >/dev/null 2>&1; then
  echo "package manager '$PM' not found" >&2
  exit 1
fi

"$PM" install
if [ ! -f .env ]; then
  if [ -f .env.example ]; then cp .env.example .env; echo "created .env from .env.example"; fi
fi

if [ "$PM" = "pnpm" ]; then
  PMX="pnpm exec"
else
  PMX="npx"
fi

$PMX prisma generate
$PMX prisma db push
"$PM" run seed
echo "bootstrap: done"
