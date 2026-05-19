# BLOCKERS.grok.md — Grok Agent Blockers & Requests

> 2026-05-18 Codex readiness note: this is a historical Grok blocker snapshot
> from a prior branch/session. Current blocker state for this readiness pass is
> in `BLOCKERS.codex.md`.

**Agent:** Grok
**Branch (current session):** feat/grok-crm-data-reports (target 4B: feat/grok-components-and-seed-tuning per prompt)
**Timestamp:** 2026-05-18 (Sprint 4B PREP ONLY run)
**Status:** One active blocker — external (Codex [UNBLOCK LIB] pending; Gemini fixing baseline E2E gate per user directive). All local verifications green. PREP ONLY mode — no dependent code attempted.

**Escalation required:** NO (dependency is expected per SPRINT-4B-COORDINATION.md)

---

## Sprint 4B PREP ONLY — Current Blocker (this prompt)

**Primary Blocker (RESOLVED):** Codex shipped `[UNBLOCK LIB]` (commit 336aa6d on feat/codex-services-routing-and-validation). Merged successfully. All new types (RoutingDecision, postal helpers, featureFlags, reports methods) are now available. Blocker consumed.
- **Type:** dependency / contract
- **Evidence:** 
  - Grep for `RoutingDecision`, `postal`, `featureFlags`, `EXCLUDED_ROUTES`, `normalizePostalCode`, `getRoutingDecisionForLead` in CRM-CONTRACT.md and lib/ → no matches.
  - User statement: "Codex has not yet shipped [UNBLOCK LIB] because Gemini is fixing a baseline E2E gate blocker."
  - Per COORDINATION.md: Codex Slice 1 on `feat/codex-services-routing-and-validation` must land first (featureFlags.ts, postal.ts, routing decision types + service, reports enhancements).
- **Files affected if unblocked:** Grok would then implement `components/excluded-route-placeholder.tsx`, `routing-decision-detail.tsx`, `postal-code-input.tsx`, `page-skeleton.tsx` + later report helpers/cards.
- **Awaiting:** Codex [UNBLOCK LIB] commit (with exports for the three coordination items 54/55/56) + rebase/availability on Grok's 4B branch.
- **Safe next action (PREP ONLY):** Complete Slice 0 inventory + doc updates (this SUMMARY/BLOCKERS refresh), record seed anchors, component map, and full safe-vs-blocked task list. Re-verify gate with pwsh. Do not create or edit any component or seed logic that depends on the missing types.

**Secondary status items (not blockers):**
- Branch mismatch: Current tree on historical `feat/grok-crm-data-reports` (YOLO data work). Official 4B Grok branch per prompt is `feat/grok-components-and-seed-tuning`. Will follow pre-flight branch create/switch when operator directs or [UNBLOCK] is present.
- sprint-4b-start tag: present (good for rollback safety).
- No local code issues; 148 tests + build green via prior pwsh runs.

---

## Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|---------------|------|-------------|----------|----------|------------------|
| 1 | Codex lib layer (featureFlags.ts, postal.ts, leads.ts services, reports.ts enhancements) + CRM-CONTRACT updates | dependency | [UNBLOCK LIB] not present — blocks all Grok Items 54/55/56 components and report helper work | Grep zero matches for required types/signatures; user directive + COORDINATION.md dependency graph | Codex [UNBLOCK LIB] on his branch + merge/rebase visibility here | PREP ONLY inventory, doc, seed manifest capture, pwsh gate, rg scans. Record everything in SUMMARY. Wait for signal. |

---

## Resolved this prompt
- N/A — this is the initial PREP snapshot for Sprint 4B. Historical YOLO pre-flight notes remain below.

---

## Historical (YOLO / prior readiness — resolved)
- All prior setup ( .env, prisma, baseline gate 148/148, type clean) resolved in previous runs.
- No SCHEMA_REQUEST or CONTRACT_REQUEST from Grok (we consume, do not author lib/services).

---

## Other Notes (Sprint 4B PREP)
- Full Grok ownership per GROK-SPRINT-4B.md respected: only touched SUMMARY + BLOCKERS (doc only).
- PowerShell-compatible commands used for all checks (pwsh -NoProfile -Command ... with Test-Path, git, etc.).
- Will append to AGENTS.md (Grok section) only if required during final audit (Feature 2.5).
- Seed discipline: manifest captured before any future value changes.

*Grok Sprint 4B PREP ONLY — blocked cleanly on expected external unblock. All local state excellent. Ready when Codex + Gemini clear the path.*

**Additional note (this prompt):** Full `prompts/grok/GROK-SPRINT-4B.md` (364 lines, including STOPPING CONDITIONS + GO section) read to completion and internalized. Key nuance recorded: Item 54 (excluded-route-placeholder) + Track B (seed) have partial independence paths. Prep artifacts (inventory + manifest) are up to date in SUMMARY.

**Final Handoff Status:**

- Codex [UNBLOCK LIB] (336aa6d on feat/codex-services-routing-and-validation) → **CONSUMED**
- Grok Slice 1 [UNBLOCK] (3f7ed00) → **SHIPPED**
- **Claude blocker #9 resolved** (2026-05-18): Swapped plain postal Input for `<PostalCodeInput>` in lead-form.tsx + enhanced the input component for form compatibility (name, id). This unblocks Claude's lead form client-side normalize experience while keeping server validation.
- Old "Codex pending" blocker → **STALE / RESOLVED**

**Codex/contract decision needed before final merge (excluded-route tension):**
- EXCLUDED_ROUTES currently includes /tasks, /cases, /campaigns (and others) but those have live, demo-shipped UI (C1-C3) with passing e2e.
- Recommended resolution: Clean the list in lib/featureFlags.ts to only list routes that are intentionally not part of the current demo (so the placeholder guard rails apply only to truly excluded ones). Grok's guard rail components are ready.

No active blockers remain for Grok in Sprint 4B.

All priority work completed with green gates and clean type scans. Feature 2.4 deferred per prompt guidance.
