#!/bin/bash
set -e

# Repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "==> npm install"
npm install

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo ""
        echo "==> Copy .env.example to .env"
        cp .env.example .env
    else
        echo ".env is missing and .env.example was not found"
        exit 1
    fi
fi

echo ""
echo "==> node scripts/check-reachability.mjs"
node scripts/check-reachability.mjs

echo ""
echo "==> npx prisma generate"
npx prisma generate

echo ""
echo "==> npx prisma db push"
npx prisma db push

echo ""
echo "==> npm run seed"
npm run seed

echo ""
echo "==> npm run lint"
npm run lint

echo ""
echo "==> npm run typecheck"
npm run typecheck

echo ""
echo "==> npm run test"
npm run test

echo ""
echo "==> npm run build"
npm run build

echo ""
echo "==> npx playwright install chromium"
npx playwright install chromium

echo ""
echo "==> npm run test:e2e"
npm run test:e2e

echo ""
echo "Local gate completed successfully."
