#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

START_TIME=$(date +%s)

function invoke_step() {
    local name="$1"
    local cmd="$2"
    
    echo -e "\n${CYAN}==> Starting: $name${NC}"
    local step_start=$(date +%s)
    
    if eval "$cmd"; then
        local step_end=$(date +%s)
        local step_duration=$((step_end - step_start))
        echo -e "${GREEN}==> Success: $name ($step_duration seconds)${NC}"
    else
        local step_end=$(date +%s)
        local step_duration=$((step_end - step_start))
        echo -e "${RED}==> FAILED: $name after $step_duration seconds${NC}"
        exit 1
    fi
}

echo -e "${MAGENTA}Starting Local Gate Validation...${NC}"

invoke_step "npm install" "npm install"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "\n${CYAN}==> Copy .env.example to .env${NC}"
        cp .env.example .env
    else
        echo -e "${RED}.env is missing and .env.example was not found${NC}"
        exit 1
    fi
fi

invoke_step "npx prisma generate" "npx prisma generate"
invoke_step "npx prisma db push" "npx prisma db push"
invoke_step "npm run seed" "npm run seed"
invoke_step "npm run test" "npm run test"
invoke_step "npm run typecheck" "npm run typecheck"
invoke_step "npm run format:check" "npm run format:check"
invoke_step "npm run build" "npm run build"
invoke_step "npx playwright install chromium" "npx playwright install chromium"
invoke_step "npm run test:e2e" "npm run test:e2e"

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
TOTAL_MINUTES=$((TOTAL_DURATION / 60))
TOTAL_SECONDS=$((TOTAL_DURATION % 60))

echo -e "\n${GREEN}============================================================${NC}"
echo -e "${GREEN}Local gate completed successfully in ${TOTAL_MINUTES}m ${TOTAL_SECONDS}s.${NC}"
echo -e "${GREEN}============================================================${NC}"
