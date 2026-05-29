#!/usr/bin/env bash
# Install deps, ensure .env, generate client, push schema, seed.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found; this repo uses npm" >&2
  exit 1
fi

npm install
if [ ! -f .env ]; then
  if [ -f .env.example ]; then cp .env.example .env; echo "created .env from .env.example"; fi
fi
npx prisma generate
npx prisma db push
npm run seed
echo "bootstrap: done"
