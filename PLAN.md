\# PLAN.md



\## 1. Document Control



| Field | Value |

|---|---|

| Version | 2.62A |

| Last updated | 2026-05-28 |

| Active sprint | Sprint 56 queued for codex |

| CRM-CONTRACT.md version | Present at repo root on this branch. Until merged everywhere, branches without it treat `README.md`, `PLAN.md`, and `docs/decisions.md` as interim references and must not invent a replacement product contract. |

| Editor | Collaborative. Agents may edit this file when the current prompt or repo work calls for it. |

| Continuous | ON |



\## 2. Source of Truth Hierarchy



When two sources disagree, the higher wins:



1\. Local PowerShell gate output (§9)

2\. The current run prompt (authoritative for assigned feature, branch, and any explicit one-run scope exception)

3\. `PLAN.md` and `CRM-CONTRACT.md`

4\. Per-agent `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`

5\. IFT recommendations from chat LLMs

6\. `docs/decisions.md` (historical reference; not binding unless re-promoted into §17)



If the current prompt conflicts with file ownership or a durable rule in this plan, treat the prompt as the active scope for this run, document the exception in SUMMARY/BLOCKERS when material, and keep moving. IFT can propose changes to (3). It cannot override (1). Agents may edit (3) when the prompt or repo work calls for it.



\## 3. Execution Topology And Agent Roster



The current worktree path decides whether ownership zones are mandatory:



\- `C:\\dev\\salesforce-lite-crm` is the single-agent root. If an agent is working there, assume no other implementation agent is active. The agent may edit any repo file needed for the current prompt, regardless of historical owner assignment. Product guardrails, `CRM-CONTRACT.md`, and the local gate still apply.

\- Agent-specific worktrees are parallel mode. If an agent is working from `C:\\dev\\salesforce-lite-crm-codex`, `C:\\dev\\salesforce-lite-crm-claude`, `C:\\dev\\salesforce-lite-crm-gemini`, `C:\\dev\\salesforce-lite-crm-grok`, or Git Bash path `/c/dev/salesforce-lite-crm-grok`, multiple agents may be active and §5 ownership zones are mandatory.

\- The root path is not the Codex parallel worktree. Use `C:\\dev\\salesforce-lite-crm-codex` when Codex participates in a multi-agent fleet.



This table records configured worktree paths. It is not proof that the directories currently exist on disk.



| Agent / mode | Model | Worktree | Branch prefix | Git identity | Report files |

|---|---|---|---|---|---|

| Single-agent root | active CLI agent | `C:\\dev\\salesforce-lite-crm` | current branch or prompt-specified branch | repo-configured | active agent's report files |

| Codex | GPT-5.5 (Codex CLI) | `C:\\dev\\salesforce-lite-crm-codex` | `codex/` | repo-configured | `SUMMARY.codex.md`, `BLOCKERS.codex.md` |

| Claude | Anthropic (Claude Code) | `C:\\dev\\salesforce-lite-crm-claude` | `claude/` | repo-configured | `SUMMARY.claude.md`, `BLOCKERS.claude.md` |

| Grok | xAI (Grok CLI) | `C:\\dev\\salesforce-lite-crm-grok` (`/c/dev/salesforce-lite-crm-grok` in Git Bash) | `grok/` | repo-configured | `SUMMARY.grok.md`, `BLOCKERS.grok.md` |

| Gemini | Google (Gemini CLI) | `C:\\dev\\salesforce-lite-crm-gemini` | `gemini/` | repo-configured | `SUMMARY.gemini.md`, `BLOCKERS.gemini.md` |



Roster rules:



\- In single-agent root mode, ownership zones are advisory only and the active agent may make repo-wide changes needed to keep the project coherent.

\- In parallel mode, each agent works in its own local worktree and pushes only to branches under its own prefix.

\- If a listed parallel worktree does not exist at the expected path, create it when feasible or file a `dependency` blocker per §10 with the exact missing path. Missing parallel worktrees are not blockers for a single-agent root run.

\- No agent rebases `main`, force-pushes, amends pushed commits, or merges another agent's branch.

\- Update this table in the same change that intentionally changes a worktree, branch prefix, or report filename.

\- Worktree setup, inspection, and recovery commands live in `docs/WORKTREE-SETUP.md` and `scripts/check-worktrees.ps1`. Do not create or overwrite worktrees unless branch names are defined here or passed explicitly to the helper script.



\## 4. Current Sprint

Authoritative rules live in §1–3 and §5–17. This section states the permanent
non-goals once, indexes completed sprints to the archive, and keeps the active
sprint inline.

\### Permanent non-goals (apply to every sprint unless promoted in PLAN.md)

Restated per-sprint through Sprints 4–56; consolidated here once. Do not bundle
any of these into feature work without an explicit current-prompt or PLAN.md
update:

\- No authentication, permissions, or multi-tenancy.
\- No deployment configuration.
\- No external AI provider integration; the summarizer stays deterministic.
\- No geocoding or territory polygons; postal-prefix matching stays.
\- No default switch from SQLite to Postgres.
\- No live `/deals/\[id]` route; deal detail stays in the `/deals?deal=<id>` drawer.
\- No dealer-order or area CRUD, no dedicated `/search` page, no new product routes.
\- No Salesforce integration, external enrichment, network calls, or RAG/vector search.
\- No CSV import/apply beyond the bounded Sprint 40 contact-create path.

\### Completed sprint archive (Sprints 4–55)

Full per-sprint feature tables and per-sprint non-goals moved verbatim to
`docs/PLAN-ARCHIVE.md` to keep this file token-efficient. See that file for the
detail behind any row below.

| Sprint | Title |
|---|---|
| 4 | Demo Data Tuning \& Visual QA |
| 5 | Data Portability Foundation |
| 6 | CSV Readiness Contracts |
| 7 | CSV Handoff Manifests |
| 8 | CSV Consumer Readiness |
| 9 | CSV Preview Readiness |
| 10 | CSV Operator Handoff Contracts |
| 11 | CSV Review Bundles |
| 12 | CSV Transfer Packets |
| 13 | CSV Handoff Assurance |
| 14 | CSV Handoff Index |
| 15 | CSV Operator Assurance |
| 16 | CSV Operator Runbooks |
| 17 | CSV Handoff Closure |
| 18 | CSV Handoff Verification |
| 19 | CSV Handoff Publication |
| 20 | CSV Operator Release Readiness |
| 21 | CSV Release Handoff |
| 22 | CSV Release Disposition |
| 23 | CSV Duplicate Readiness |
| 24 | CSV Operator UI |
| 25 | CRM Safety Foundations |
| 26 | CRM Productivity Foundations |
| 27 | Productivity Handoff Contracts |
| 28 | Productivity Operator Surfaces |
| 29 | Saved Views And Audit Operations |
| 30 | Bulk Action Execution |
| 31 | List Bulk Actions |
| 32 | Case Service Operations |
| 33 | Case Knowledge Assist |
| 34 | Dependency Modernization |
| 35 | Deterministic AI Contracts |
| 36 | Local AI Governance |
| 37 | Workflow Rule Readiness |
| 38 | Workflow Operator Readiness |
| 39 | Workflow Manual Execution |
| 40 | CSV Contact Import Apply |
| 41 | Campaign Influence Lite |
| 42 | Campaign Operations Completion |
| 43 | Knowledge Operator Workspace |
| 44 | Responsive Accessibility Hardening |
| 45 | AI Action Safety Contracts |
| 46 | AI Action Operator Preview |
| 47 | Approval Readiness Foundation |
| 48 | Lead Follow-Up Readiness |
| 49 | Saved Report Builder Foundation |
| 50 | Saved Report Persistence |
| 51 | Dashboard Card Builder |
| 52 | Routing Simulation Foundation |
| 53 | Routing Simulator Operator Preview |
| 54 | Routing Fairness Readiness |
| 55 | Dealer Capacity Readiness |

\### Active sprint

\*\*Sprint 56 — Pacing Snapshot Readiness\*\*

Goal: add deterministic read-only pacing snapshot planning contracts for dealer routing trend review without adding persistence, live routing changes, or new route boundaries.

| Feature | Owner | Status | Acceptance summary |
|---|---|---|---|
| S56-F1 — Pacing snapshot contracts | codex | queued | Server-side contracts define deterministic read-only monthly/daily routing and dealer-order pacing snapshot inputs, metric keys, fixtures, limits, and explicit no-write safety flags. Contracts add no persistence, schema changes, routes, UI, dealer-order edits, area edits, or external services. |
| S56-F2 — Read-only pacing snapshot builder | codex | queued | A deterministic read-only builder derives snapshot summaries from existing dealer orders, leads, and routing activity evidence with month/day bucket metrics. The builder must not mutate live routing decisions, dealer-order delivery, pacing calculations, lead statuses, persisted scenarios, snapshot history, or routing events. |
| S56-F3 — Pacing snapshot review packets | codex | queued | Server-side review packets package S56-F2 output for later trend-report UI, including metric definitions, empty-state reasons, freshness metadata, source counts, and no-write flags. Packets add no new product route, dashboard widget, command-palette action, global search expansion, CSV/import/apply integration, or external service. |

\*\*Sprint 56 non-goals\*\* (carry forward permanent scope boundaries plus pacing-snapshot-specific exclusions):

\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration.

\- No geocoding or territory polygons.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new live `/deals/\[id]` detail route.

\- No global search expansion.

\- No persistent routing/pacing snapshot model, saved trend history, saved simulator scenarios, schema changes, seed data changes, or background jobs.

\- No live routing algorithm changes, routing reassignment behavior changes, dealer-order quota/delivery mutation, lead status expansion, routing-event writes, or pacing-engine mutation.

\- No Salesforce integration, external enrichment, provider credentials, network calls, RAG/vector search, AI narrative generation, CSV import/apply integration, dashboard widgets, command-palette actions, or dedicated pacing snapshot product route.

\## 5. File Ownership Matrix



This matrix is mandatory only in parallel worktree mode (§3). In the
single-agent root worktree `C:\\dev\\salesforce-lite-crm`, it is advisory: the
active agent may make repo-wide changes needed to solve the current prompt
coherently. Even in single-agent mode, durable product guardrails,
`CRM-CONTRACT.md`, local-gate requirements, and report hygiene still apply.



Two \*\*shared coordination zones\*\*:



\- \*\*Shared/contract zone\*\* — referenced by all agents and IFT; edit with explicit prompt scope or a documented cross-zone reason:

&#x20; - `prisma/schema.prisma` and `prisma/schema.postgres.prisma`

&#x20; - `prisma.config.ts`

&#x20; - `lib/types/` (cross-module type contracts)

&#x20; - `CRM-CONTRACT.md`

&#x20; - `.env.example`

&#x20; - `.gitignore`

&#x20; - `package.json` `dependencies`, `devDependencies`, and `scripts` blocks

&#x20; - `package-lock.json`

&#x20; - Framework configuration files: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`

\- \*\*Planning/decision zone\*\* — edit with explicit prompt scope or a documented planning reason:

&#x20; - `PLAN.md`

&#x20; - `docs/decisions.md`

&#x20; - The schema (not the contents) of `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` per §13



\*\*Agent zones:\*\*



| Path / module | Owner |

|---|---|

| `lib/server/`, `lib/db/`, `lib/routing/`, `lib/forecast/`, `prisma/seed.ts` | Codex |

| `app/\*\*` (Next.js routes, pages, layouts, server actions) | Claude |

| `components/\*\*` (shared UI primitives and feature components), `app/globals.css`, `tailwind.config.ts` | Grok |

| `tests/\*\*`, `e2e/\*\*`, `scripts/\*\*`, `playwright.config.ts`, `vitest.config.ts` | Gemini |

| `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` contents (schema per §13) | Owning agent |



`next-env.d.ts` is auto-generated by Next.js, intentionally untracked, and ignored by git. Agents do not edit, stage, or commit it. If it reappears as a tracked or staged file, treat that as a `dependency` blocker per §10 (regenerated state mismatch).



If a listed framework config file does not actually exist in the repo, the zone rule is harmless — there is nothing to edit and no blocker to file. If a file appears to match multiple zones, the more restrictive rule wins.



In parallel mode, cross-cutting feature work that requires edits in two agents' zones should be decomposed in the prompt or documented in the agent report. Agents coordinate through branches, reports, and contract files.



In parallel mode, if an agent finds it cannot complete its feature without touching another zone, the correct action is: keep the edit minimal, document the cross-zone reason in SUMMARY/BLOCKERS, and proceed when the current prompt makes the need clear. See §10. In single-agent root mode, no cross-zone blocker is needed solely because files span historical owner zones.



\## 6. Execution Loop



Every CLI agent runs this on every prompt. No exceptions.



0\. Check STOP gate. If a file named `STOP` exists at the worktree root, file or update a BLOCKERS entry of type `dependency` recording the STOP, rewrite SUMMARY with Status: blocked, commit report-only per §6 step 12, push if safe, and exit. The supervisor (if used) is responsible for polling `origin/main` for a remote STOP signal; agents only check the local worktree.

1\. Read `PLAN.md` §§1–11 and `CRM-CONTRACT.md` (or its interim substitutes per §1) in full.

2\. Determine execution topology from the current worktree path per §3. If the path is `C:\\dev\\salesforce-lite-crm`, run in single-agent root mode with full repo access. If the path is one of the agent-specific worktrees, run in parallel mode and enforce §5 ownership zones.

3\. Identify your active feature in §4. If status is not `active` or `queued` for you, treat the current prompt as the run scope and note the mismatch in SUMMARY/BLOCKERS.

4\. Confirm the local worktree exists and is an allowed path from §3 for the detected topology. If a required parallel worktree is missing, create or use the best available worktree when feasible; otherwise file a BLOCKERS entry per §10 (type: `dependency`). A missing parallel worktree does not block a single-agent root run.

5\. Run `git status --short` in your worktree. If unexpected uncommitted files exist (anything not in `.gitignore` that you did not introduce in this prompt), record the listing, avoid overwriting those paths, and proceed around them when possible.

6\. In parallel mode, confirm every file you intend to touch is in your zone per §5. If any file is in another agent's zone or a shared coordination zone, keep the edit minimal, document the reason, and proceed when needed for the assigned work. In single-agent root mode, this check is advisory and should not block repo-wide fixes.

7\. Execute the assigned work.

8\. Run the local gate per §9 — full sequence or change-type subset as appropriate. If it fails, follow the gate-failure policy in §9 before deciding whether a `gate` blocker is needed.

9\. If checks pass and implementation files changed, commit the implementation work per §7. Record the implementation commit SHA(s).

10\. Rewrite `SUMMARY.<agent>.md` per the schema in §13 (full overwrite, not append). `Commits this prompt` records the implementation commit(s) from step 9, or `none`.

11\. Rewrite `BLOCKERS.<agent>.md` per the schema in §13. If no active blockers, the file still exists with an empty `Active blockers` table.

12\. Commit changed report files as a separate report-only commit per §7. This report-only commit must not list itself in `Commits this prompt`.

13\. Push to your branch.

14\. Stop after the assigned work unless the current prompt asks you to continue into the next feature.



Sprint quiescence: if your assigned feature is `done` and no further feature is queued for you in §4, rewrite SUMMARY with `Next action: idle / awaiting next PLAN scope`, leave BLOCKERS empty unless a real blocker exists, commit report-only if needed, and exit. Do not invent the next sprint.



If a gate failure remains unresolved after the §9 repair-first policy and report files can be staged without staging failed implementation changes, commit only the report files and push that report-only commit. Leave unresolved failed implementation changes uncommitted unless the current prompt explicitly instructs otherwise. If even the report-only commit/push is blocked, record why in `BLOCKERS.<agent>.md` if possible and stop.



On the next prompt, the uncommitted implementation paths from a still-open `gate` blocker satisfy step 5's "not introduced in this prompt" check when those paths match the Evidence list of the open `gate` blocker or the current prompt otherwise makes them in scope. Do not file a duplicate `gate` blocker; keep the existing one open and note in `BLOCKERS.<agent>.md` whether the dirty state changed.



Edge cases that look novel resolve to a named section when possible. If no section covers it, make the smallest reversible call, document it, and continue.


## 6A. Continuous / Unattended Mode
Default:
6 step 13 remains in force. Agents stop after assigned work unless the current prompt explicitly asks them to continue into the next feature.

Continuous Mode:
When `Continuous: ON` is present in 1 Document Control, or when the active manager prompt explicitly says `FULL AUTONOMY`, `UNATTENDED`, `OVERNIGHT`, or `CONTINUE-UNTIL-STOPPED`, 6 step 13 is replaced with:
After the required gate/checks, report rewrites, report commit, and push, select the next ready task from 4 or the active manager queue, assign it to the correct owner/worktree, and repeat the Execution Loop without asking for human confirmation.

Token usage is not a stopping condition. Do not set or respect artificial token, cost, turn, or iteration caps unless the user explicitly adds one in the current prompt.

Stop only on:
1. queue empty;
2. user turns Continuous OFF or interrupts with a stop instruction;
3. CLI/session/context/provider quota exhausted;
4. required credential, login, payment, account approval, or external service unavailable;
5. local gate remains red after documented repair attempts;
6. no independent safe task remains after a blocker;
7. next action would require destructive or irreversible work;
8. force-push, hard reset, broad deletion, secret exposure, or main-branch rewrite would be required;
9. next task would expand scope beyond PLAN.md, CRM-CONTRACT.md, or the active queue.

When a stop condition is reached, write the reason to BLOCKERS/SUMMARY. If safe, set `Continuous: OFF`; otherwise create `AUTONOMY.STOP` with the reason.

Ownership zones remain in force only for parallel worktree mode. CRM-CONTRACT.md invariants, report requirements, hook policies, and local-gate authority remain in force in every topology.



\## 7. Commit \& Branch Protocol



\*\*Branch naming:\*\* `<prefix>sprint-<id>-<feature-slug>`



Examples: `codex/sprint-4-demo-seed-tuning`, `claude/sprint-4-route-visual-qa`.



\*\*Implementation commit message format:\*\*

```text

\[<agent>] <feature-id>: <subject line, imperative, ≤72 chars>



<optional body, wrapped at 80 chars, explaining why not what>

```



Example: `\[codex] S4-F1: tune seed data for Vancouver routing demo`



When the feature claims runtime behavior, the implementation commit body records the required gate/check run line and exit code.



\*\*Report-only commit message format:\*\*

```text

\[<agent>] <feature-id>: update reports

```



A report-only commit may include only that agent's `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`. It is made after report rewrite and after any implementation commit for the prompt.



\*\*Commit cadence:\*\* atomic. One logical implementation change per commit. Multiple implementation commits per prompt are fine and preferred over a single fat commit. Each prompt produces at most one report-only commit, ordered after the implementation commit(s) and before push.



\*\*Never:\*\*

\- Rebase or force-push `main` or any branch you do not own.

\- Push directly to `main`, or merge a PR with `--admin` / force / any branch-
  protection override. `main` is protected and accepts changes only through a
  PR whose required `gate` check is green; integrate with
  `gh pr merge --squash --delete-branch`. See `prompts/shared/MERGE.md`.

\- Amend a commit you have already pushed.

\- In parallel mode, edit a file outside your zone (§5) without documenting the
  §10 reason. In single-agent root mode, zones are advisory.

\- Merge between agent branches or into `main` without explicit current-prompt scope.

\- Make broad edits to `PLAN.md`, `CRM-CONTRACT.md`, or `docs/decisions.md` without explicit current-prompt scope.

\- Commit generated local database files, build artifacts, logs, or screenshots unless explicitly instructed.

\- Include implementation files in a report-only commit.



\## 8. Definition of Done



Every feature must satisfy all of the following before an agent may mark it `done`:



\- Local gate is green (§9). The agent has run the required check or gate subset locally and recorded the run line and exit code in the implementation commit message body.

\- `SUMMARY.<agent>.md` reflects the completed feature, and any implementation commit short SHA(s) from this prompt are recorded in its `Commits this prompt` field.

\- `BLOCKERS.<agent>.md` reflects current blocker state, even when empty.

\- Both report files are committed via the §6 step 12 report-only commit, or `BLOCKERS.<agent>.md` explains why they could not be committed.

\- In parallel mode, cross-zone or shared coordination edits are minimal and
  documented. In single-agent root mode, repo-wide scope is summarized in
  `SUMMARY.<agent>.md`.

\- `CRM-CONTRACT.md` invariants are honored (no schema drift, no removed types, no renamed exports without a contract update).

\- \*\*If `CRM-CONTRACT.md` is absent, no hidden product contract was invented in this feature's code or tests.\*\* Demo-tuning work uses existing routes, schema, and routing/forecast/analyst logic as-is; new domain rules are documented where they are introduced.

\- Test coverage matches the acceptance criteria in §4. Adding a feature without a test is not done.



An agent's self-report of `done` is supported by the local gate and remains reviewable after merge.



\## 9. Local Gate (Authoritative)



The gate is a PowerShell sequence using only scripts present in `package.json` plus standard Prisma and Playwright setup. The repo currently exposes:



```text

postinstall      -> node scripts/ensure-sqlite-db.mjs   (runs automatically via npm install)

dev              -> next dev

build            -> next build

lint             -> eslint . --max-warnings=0

typecheck        -> tsc --noEmit --pretty false

seed             -> tsx prisma/seed.ts

test             -> vitest run --maxWorkers=1

test:e2e         -> npm run seed && playwright test

prisma:postgres  -> node scripts/prisma-postgres.mjs

autonomy:overnight -> powershell -ExecutionPolicy Bypass -File scripts/autonomy-loop.ps1

autonomy:watchdog -> powershell -ExecutionPolicy Bypass -File scripts/start-codex-overnight.ps1
```



Agents may claim `lint` or `typecheck` only when the matching `package.json` scripts exist and the exact commands have run. There is no `format` script unless `package.json` later adds one.



\*\*Full local setup/gate from repo root:\*\*



```powershell

npm install

if (-not (Test-Path .env)) { Copy-Item .env.example .env }

npx prisma generate

npx prisma db push

npm run seed

npm run lint

npm run typecheck

npm run test

npm run build

npx playwright install chromium

npm run test:e2e

```



Run commands sequentially. Gate failure is not automatically a stop condition. In max-YOLO mode, first attempt reasonable repo-local fixes within the current scope. Re-run the failing command or the relevant gate subset. File a blocker only when the failure cannot be resolved without outside information, unsafe/destructive action, missing credentials, unavailable services, unclear product decisions, or broad out-of-scope changes. Same-command repair cap: a single prompt may make at most 3 repair attempts for the same failing command. After the third failure, file or update a `gate` blocker and stop. The cap is per-command, not per-prompt; multiple distinct failing commands each have their own counter.

When filing a `gate` blocker, capture the failing command, exit code, the relevant final output in `BLOCKERS.<agent>.md` (Evidence column), and the list of uncommitted implementation paths left in the worktree. Do not create or commit local log files unless the current prompt explicitly instructs it or the target path is already covered by `.gitignore`.



\*\*Minimum required checks by change type:\*\*



| Change type | Minimum checks before claiming done |

|---|---|

| Report-only update (SUMMARY/BLOCKERS) | Markdown review and `git status --short`. |

| Pure docs update (no runtime claims) | Markdown review and `git status --short`; no runtime gate unless docs claim runtime behavior. |

| UI/component visual polish | `npm run build`; run `npm run test:e2e` if demo path may be affected. |

| Route/page behavior | `npm run test`, `npm run build`; run `npm run test:e2e` if demo path is affected. |

| Business logic | `npm run test`, `npm run build`; add or update tests where practical. |

| Seed data | `npx prisma generate`, `npx prisma db push`, `npm run seed`, `npm run test`, `npm run build`; run `npm run test:e2e` if demo path is affected. |

| E2E / demo flow | `npm run seed`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`. |

| Package/config/script change | Full local setup/gate (sequence above). |



When in doubt, run the full gate. The change-type subset is a floor, not a cap — if a "UI polish" change touches business logic, escalate to the route/page or business-logic row.



\*\*This gate is the only authority that can declare a feature passed or a merge safe.\*\* Not IFT. Not any chat LLM. Not an agent self-report.



If the gate fails on `main` after a merge, handle it through a rollback, hotfix, or new IFT round as directed by the current prompt or repo workflow. Agents do not act on `main` without explicit scope. If new gate steps are added to the repo later, they are added to this section before agents start running them.



\## 10. Conflict \& Boundary Policy



In parallel mode, an agent's work hits another agent's zone, the shared/contract zone, or the planning/decision zone; in any topology, a precondition from §3 or §6 fails, or the current prompt conflicts with a durable rule in this plan. The agent does this, in order:



1\. \*\*Contain the risky edit immediately.\*\* Keep it minimal, avoid overwriting unrelated work, and prefer reversible changes.

2\. \*\*File a BLOCKERS entry\*\* per §13 with:

&#x20;  - the exact file path or precondition,

&#x20;  - the blocker type, picking exactly one of:

&#x20;    - `ownership` — in parallel mode, work requires editing another agent's zone or a shared coordination file (§5)

&#x20;    - `gate` — a local gate command or required check (§9) failed

&#x20;    - `contract` — `CRM-CONTRACT.md` is missing or ambiguous on a load-bearing product decision

&#x20;    - `dependency` — missing worktree, missing path, missing setup prerequisite, or a package, script, or config requirement not yet represented in the repo

&#x20;  - one-line description,

&#x20;  - evidence (command output, conflicting instruction text, error message, path list, or dirty-state listing for a `gate` blocker),

&#x20;  - what needs to be resolved,

&#x20;  - what the agent will work on safely while blocked.

3\. \*\*Keep work moving where safe.\*\* In parallel mode, do not silently reproduce a cross-zone change in your own zone; either make the needed edit directly with documentation or leave a blocker. In single-agent root mode, make the coherent repo-wide edit directly and document the scope in SUMMARY.

4\. \*\*Resume or continue work when the current prompt, blocker evidence, or repo state provides a workable resolution.\*\*



No inter-agent merging or agent-to-agent pull requests without explicit current-prompt scope. In parallel mode, cross-zone fixes are allowed when they are the smallest direct way to complete the assigned work and are documented. In single-agent root mode, cross-zone labels are advisory and should not split one coherent fix into artificial handoffs.



\## 11. Anti-Drift Rules



\*\*For CLI agents:\*\*



\- No new architecture patterns by accident. If the existing codebase uses Prisma + Server Actions + Tailwind, you do too. Propose or document alternatives through IFT or the current prompt.

\- No new external dependencies by accident. `package.json` is in the shared/contract zone. Need a library? Add it only with explicit prompt scope or file a blocker.

\- No hidden process invention. Every action you take resolves to a numbered step in §6 (Execution Loop), a protocol named elsewhere in §§1–10, or a documented YOLO exception from the current prompt.

\- Edits to `PLAN.md`, `CRM-CONTRACT.md`, or `docs/decisions.md` stay explicit, scoped, and documented.

\- No invented script claims. Claim `lint`, `typecheck`, `format`, or other checks only when the exact `package.json` script exists and the command was run.

\- Cleanup is repo-local and conservative. Use `scripts/clean-local-artifacts.ps1` in dry-run mode first; remove only ignored/generated/local artifacts inside this repo. Leave unknown files in place and record them in BLOCKERS.



\*\*For IFT (Track B chat LLMs):\*\*



\- No overriding the local gate. A green claim from any chat LLM is not authoritative under any circumstance.

\- No hidden repo writes. IFT outputs proposals or patches; repo changes land through the normal local workflow.

\- No re-litigating decisions already logged in §17 of this file or in `docs/decisions.md`, unless either (a) new evidence is presented in the form of gate output, code, or a measurable outcome since the decision was logged, or (b) the current prompt explicitly opens the question for the current round. Re-promotion of an archived decision into §17 counts as opening the question.



\---

\*CLI agents: §§1–11 are your complete operational reference. Consult §13 when rewriting `SUMMARY` and `BLOCKERS` per §6 steps 10–12. §§12 and 14–17 are planning and maintenance context for chat LLMs and coordinating future work.\*



\---



\## 12. Purpose, Audience \& Operating Model



This file is the bridge between two tracks.



\*\*Track A — Execution.\*\* CLI agents run under the §3 topology. In
single-agent root mode, one active agent works from
`C:\\dev\\salesforce-lite-crm` with full repo access. In parallel mode, Codex,
Claude, Grok, and Gemini run in their agent-specific worktrees with ownership
zones enforced. Each reads `PLAN.md` and `CRM-CONTRACT.md` on every prompt,
executes per §§4–6, commits per §7, and writes `SUMMARY` and `BLOCKERS` per
§13. Agents run unattended. In parallel mode, they cannot see this chat or each
other.



\*\*Track B — Planning (IFT).\*\* Five chat LLMs — Claude, ChatGPT, Grok, Gemini, Meta AI — run a structured debate loop in their respective web chat surfaces. Context is pasted into each model independently, then each model's draft circulates to the others for critique across 2–4 rounds until convergence. IFT is used for load-bearing decisions: sprint scope, architecture, contested merge order, domain-rule resolution, stress-testing PLAN.md changes before commit, and reviewing agent reports for weak reasoning.



\*\*Git and reports are the sync point.\*\* Track B converges → `PLAN.md` changes land through the normal repo workflow → Track A picks them up on the next prompt. Track A produces SUMMARY/BLOCKERS → Track B incorporates them if load-bearing.



\*\*The standard Track A prompt is minimal:\*\*

```text

Read PLAN.md and CRM-CONTRACT.md. Execute Sprint <N> Feature <id>. Begin.

```



The prompt may add a single line of inline context if a blocker resolution requires it. Anything more belongs in PLAN.md or CRM-CONTRACT.md.



\*\*IFT is advisory.\*\* It cannot declare tests passed, builds green, or merges safe. Only the local gate (§9) can.



\## 13. Reporting Templates



\*\*Cadence:\*\* rewrite both files in full every prompt. Snapshot of current state, not appended log. Historical state is preserved in git. Per §6 step 12, both files are then committed in a single report-only commit before push; the report-only commit must not list itself in its own `Commits this prompt` field.



\*\*Location:\*\* root of the active worktree. In single-agent root mode this
is `C:\\dev\\salesforce-lite-crm`; in parallel mode it is the agent-specific
worktree. Example: `C:\\dev\\salesforce-lite-crm-claude\\SUMMARY.claude.md`.



\*\*Schema\*\* is contract-controlled. Agents fill in fields and keep field names, ordering, and sections stable unless the current prompt changes the template.



\### `SUMMARY.<agent>.md`



```markdown

Agent: <agent-name>

Sprint: <sprint-id>

Feature: <feature-id-or-name>

Branch: <branch-name>

Status: queued | active | done | blocked

Commits this prompt: <short-sha> — <commit-message-one-line> | none

Gate status: PASS | FAIL | NOT RUN

DoD self-check: PASS | FAIL | N/A

Timestamp: <ISO 8601>

Approximate model tokens/spend this prompt: <number or units> | unknown



\### Completed this prompt

\- <task or feature> — <one line: what was done, not what was attempted>



\### Next action

<single sentence: what this agent does on the next prompt>



\### Scope confirmation

No cross-ownership edits: YES | NO  (if NO, see BLOCKERS)

CRM-CONTRACT.md honored:  YES | NO  (if NO, see BLOCKERS)

```



`Commits this prompt` records the implementation commit(s) from §6 step 9. The report-only commit from §6 step 12 is not listed; if no implementation commit was created (e.g. a blocker-only or report-only prompt), the field is `none`.



\### `BLOCKERS.<agent>.md`



```markdown

Agent: <agent-name>

Sprint: <sprint-id>

Feature: <feature-id-or-name>

Branch: <branch-name>

Timestamp: <ISO 8601>

Escalation required: YES | NO



\### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |

|---|--------------|------|-------------|----------|---------|-----------------|

| 1 | <path> | ownership / gate / contract / dependency | <one line> | <error msg, path list, or dirty-state list for a gate blocker> | resolution | <what agent does while blocked> |



\### Resolved this prompt

\- Blocker #<N> resolved: <one line how>

```



If there are no active blockers, keep the table header and remove sample data rows.



`Gate status: PASS` is an agent claim, not an authorization. A clean run of the actual gate (§9) authorizes a feature. `DoD self-check` is the agent's claim against §8 and remains reviewable. Blocker `Type` values map to the definitions in §10.



\## 14. IFT Planning Protocol



\*\*When IFT is required:\*\*

\- New sprint scope.

\- Architectural or library decisions.

\- Contested merge order across agents.

\- Resolution of a recurring BLOCKERS entry that has no obvious repo-local answer.

\- Pre-commit stress test of a non-trivial `PLAN.md` change.

\- Review of an agent SUMMARY/BLOCKERS pair where the current review flags weak or evasive reasoning.



\*\*When IFT is skipped:\*\*

\- Mechanical fixes (typo, single-file refactor inside one zone).

\- Prompt-authored corrections that don't change behavior.

\- Routine merges where the gate has run green on each branch.



\*\*Round structure:\*\*

1\. Paste context and prompt to all five models independently. No model sees another's response yet.

2\. Each model produces an independent draft.

3\. Circulate the drafts (anonymized or not) to each model for critique.

4\. Each model revises only for material improvements.

5\. Repeat steps 3–4 until convergence or the round is called.



\*\*Convergence criteria:\*\*

\- No visible peer model holds an unadopted material improvement.

\- No load-bearing claim in the recommendation remains unsupported by source material or verified evidence.

\- Remaining disagreement is not load-bearing after evidence review.



Peer-model agreement is a stopping signal only when the substance is independently grounded in the task, source material, or verified evidence. Majority across peers is not, by itself, evidence. A round may close for cost or time reasons even when these criteria are not met; doing so is recorded as a run decision in §17, not as convergence.



\*\*IFT outputs:\*\*

\- Proposed `PLAN.md` diff (or new section text).

\- Rationale paragraph.

\- Alternatives rejected.

\- Open questions remaining.



If the active IFT wrapper prompt specifies a required output schema, that wrapper takes precedence over the above for the current session.



\*\*IFT does not output by default:\*\* gate pass/fail, merge execution, agent task assignment. Those belong in the execution workflow unless the current prompt explicitly asks IFT to draft them.



\## 15. GitHub Connector Policy



Track B chat LLMs reference repo state through their respective GitHub connectors or import flows. Track A does not — CLI agents have local worktrees.



\*\*Per-session standardized protocol:\*\*



\- At the start of every IFT session, connect all five chat windows to the \*\*same repo URL and the same branch/commit\*\* before the first drafting round.

\- After import, record a one-line per-model \*\*Connector Context Checklist\*\* (template below): what URL/branch/commit was loaded, what local-only context was pasted separately, and what each platform could actually reach this session. This prevents branch-desync — models debating a feature conflict while analyzing different branches or stale `main`.

\- \*\*Platform capability note.\*\* Connector and import capabilities — live code access, branch state, commit history, PR diffs, import size limits, ability to fetch raw files — change over time and vary by account tier. Do not hard-code per-vendor capabilities in this file. Verify the current capability of each chat surface at session start and record reachability in the Checklist; anything not reachable goes through pasted context.

\- Connectors and imports are \*\*read-only\*\*. IFT references file paths, diffs where available, and code. It does not commit, PR, merge, or run the app.

\- \*\*Local-only context to paste when needed\*\* (typically not surfaced by connectors): PowerShell gate output, local build results, uncommitted local changes, merge conflicts, CLI logs, SUMMARY/BLOCKERS that have not been pushed yet.

\- \*\*Re-import cadence:\*\* before each new IFT round if any Track A agent has committed since the last import.

\- \*\*No execution authority.\*\* IFT with full repo context remains advisory. Only §9 declares pass/fail.



\*\*Connector Context Checklist (paste/fill at session start):\*\*



```markdown

| Model | Context method | Repo URL | Branch/ref | Commit SHA | Local-only context pasted | Capability limits this session |

|---|---|---|---|---|---|---|

| ChatGPT | connector / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Claude | connector / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Grok | connector / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Gemini | import-code / pasted | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

| Meta AI | pasted / connector if available | <url> | <branch/ref> | <sha> | <items or none> | <what was reachable / what wasn't> |

```



\## 16. Sprint Backlog



Backlog items are not active sprint work. Active sprint detail is in §4. IFT uses this section to debate scope, sequence, and feasibility before an item is promoted to active status in §4. Order in this table is not a commitment to sequence. Proposed roadmap source: `docs/ROADMAP.md`; this section remains the backlog input and does not authorize roadmap implementation by itself. B-13+ entries are roadmap proposals unless §4 or the current prompt explicitly promotes them. Unlisted B-NN IDs remain unassigned.



| Backlog ID | Candidate scope | Notes |

|---|---|---|

| B-01 | Maintain `CRM-CONTRACT.md` | Present in `main`; keep it aligned when entity names, routes, statuses, registries, or adapter signatures change. |

| B-02 | Local gate script maintenance | Present in `main` as `scripts/local-gate.ps1` and `scripts/local-gate.sh`; keep both mirrored with §9. |

| B-03 | Lint/typecheck script maintenance | Present in `main`; both scripts are part of the §9 gate. |

| B-04 | Dealer order and area CRUD | Currently seeded/browsable only. Deferred. |

| B-05 | `/deals/\[id]` detail route | Replace drawer-only deal flow with a full route while preserving board drag-and-drop. README currently lists this as a limitation. |

| B-06 | Global search expansion | Current top search routes to contacts only. Deferred. |

| B-07 | Persistent forecast scenarios | Current simulator is transparent and non-persistent. Deferred. |

| B-08 | Postgres cutover readiness | SQLite remains the local default. `lib/prisma.ts` has a DATABASE_URL-based Postgres branch and `npm run prisma:postgres` performs schema-push prep, but a default-runtime cutover and CI matrix remain deferred. |

| B-09 | External AI provider integration | Deterministic local summarizer/routing/analyst remains default. Deferred. |

| B-10 | Auth, permissions, multi-tenancy | Replaces README "no authentication" limitation. Significant scope; likely spans multiple sprints when promoted. |

| B-11 | CI mirror of local gate | CI may mirror §9 but never replaces it. The local PowerShell gate stays authoritative. |

| B-12 | Deployment configuration | No deployment target or hosting workflow is in current scope. Deferred. |

| B-13 | Roadmap principle governance | Keep contract-first, deterministic-default, hermetic-gate, feature-flag, RBAC-before-agentic-writes, and eval-before-expansion rules visible in roadmap docs. |

| B-14 | Tooling hygiene | Maintain passing `lint` and `typecheck` scripts and keep generated `*.tsbuildinfo` ignored. Present in `main`; audit during Sprint 5. |

| B-15 | Roles, permissions, ownership, and sharing | Define object/action permission matrix, owner conventions, and share conventions after B-10 promotion. |

| B-16 | Organization and tenant boundary | Add org/membership convention when multitenancy is promoted; keep single-org demo mode. |

| B-17 | Products, price books, and line items | Product, PriceBook, PriceBookEntry, OpportunityLineItem; opportunity value becomes line-item rollup. |

| B-18 | Quotes and quote export | Quote and QuoteLine, draft PDF/export, later email send through a promoted provider. |

| B-19 | Events and calendar | Event model, `/calendar`, and meeting activity links. Calendar sync remains separate deferred integration work. |

| B-20 | Validation and workflow rules | Deterministic rule AST, never `eval`; assignment/workflow rules trigger through `crmClient` and log side effects. |

| B-21 | Approval processes and scheduled sweeps | Approval steps, pending approvals, stage-change gates, and hermetic catch-up jobs with injected clock. |

| B-22 | CSV import UI | Wire existing CSV helpers into an import preview UI with validation before mutation. |

| B-23 | CSV dedupe preview | Optional read-only duplicate preview before import mutation. |

| B-24 | CSV export UI | Export list-page data through existing helpers without external dependencies. |

| B-25 | AI deterministic scaffold and eval harness | Provider port, deterministic provider, recorded provider, prompt registry skeleton, and eval harness. No live external provider calls. |

| B-26 | REST/Bulk API and webhooks | API keys, object endpoints over `crmClient`, bulk import/export, local webhook test sink, and replay fixtures. |

| B-27 | Transactional email | Stub provider default, templates, and later send/log email after explicit provider promotion. |

| B-28 | Report builder | Persist report definitions: object, fields, filters, grouping, and charts. |

| B-29 | Dashboard builder | Persist dashboard cards from saved reports. |

| B-34 | Retrieval/RAG foundation | Index allowed records only after identity/RBAC/tenant filters exist. |

| B-37 | Observability and backups | Structured logs, request IDs, AI telemetry, backup/restore tests. |

| B-38 | Responsive/mobile/accessibility | Mobile pass, accessibility checks, dashboard/table usability. |

| B-39 | Custom field metadata | `FieldDefinition` plus `customFields` JSON; core fields immutable. |

| B-40 | Record types and layout-lite | Admin-configurable field sections per object/type. |

| B-41 | Service queue assignment | Queue assignment for cases with deterministic rules and audit. |

| B-42 | Service SLA timers | SLA timers with injected clock and hermetic tests. |

| B-43 | Knowledge article model | Knowledge Article model and service workflows. |

| B-47 | Roadmap canon | Add and maintain roadmap, AI roadmap, architecture, eval, and security/privacy docs; keep PLAN updates proposal-only unless explicitly promoted. |

| B-48 | QA/blocker reconciliation | Reconcile stale SUMMARY/BLOCKERS files and verify visual/test-id/demo-path blockers after recent app/component changes. |

| B-49 | Audit event model | Audit taxonomy for user, record, AI, import, routing, and workflow actions. |

| B-50 | Saved views | Saved filters, sorts, and columns per object and user/org. |

| B-51 | Filter/query compiler | Shared filter AST compiled to Prisma and reused by lists, reports, exports, and natural-language filters. |

| B-52 | Bulk actions | Assign owner, update status/stage, create tasks, export selected, and audit every action. |

| B-53 | Routing simulator | Deterministic "what would route where?" simulator using hypothetical quotas, area coverage, and lead batches. |

| B-54 | Routing fairness and explanation | Deterministic metrics for pace gap, saturation, lead quality proxy, and SLA risk; later AI narrative. |

| B-55 | Dealer capacity windows | Dealer capacity calendars, blackout windows, and daily caps. |

| B-56 | Lead disposition and SLA | Routed, accepted, contacted, won/lost, returned, stale; escalation tasks. |

| B-57 | Pacing snapshots | Persist monthly/daily routing and pacing snapshots for trend reports. |

| B-58 | Campaign members and influence | CampaignMember, campaign ROI, and opportunity influence-lite. |

| B-59 | Prompt registry | Prompt ID, version, owner, input schema, output schema, and eval fixture IDs. |

| B-60 | Structured AI outputs | Zod validation for every AI output; invalid output is recoverable UI error. |

| B-61 | AI run log | User/org, prompt ID, provider/model, hashes, token/cost, result, and action outcome. |

| B-62 | AI action registry | Explicit CRM tools such as create task, log activity, draft email, update stage, and assign lead. |

| B-63 | RAG service | Tenant/RBAC-filtered retrieval over allowed records only. |

| B-64 | AI eval suite | Golden tests for summaries, routing explanations, scoring, natural-language filters, RAG answers, and tool plans. |

| B-65 | AI cost/privacy controls | Per-org limits, provider policy, redaction, and prompt-injection defenses. |

| B-66 | Gmail/Graph/calendar sync | Mock-only gate; token and secrets design first. |

| B-67 | Salesforce import | CSV mapping first, API sync later. |

| B-68 | Dependency and security modernization | Track future `npm audit` findings and package-major upgrade paths without weakening the local gate. Sprint 34 completed the non-major refresh, safe transitive containment, and Vitest 4 compatibility pass; current Codex evidence reports `npm audit --json` at 0 vulnerabilities. |



\## 17. Decision Log



\*\*Retention policy.\*\* PLAN.md §17 is the Recent Decision Log. It retains:



\- all decisions from the active sprint,

\- all decisions from the prior two completed sprints,

\- any still-active architectural, ownership, workflow, or contract decision that remains in force until changed.



Older decisions move to `docs/decisions.md` at the close of each sprint, when a completed sprint drops out of the prior-two window. Archived decisions are reference history only; they do not bind agents or IFT unless explicitly re-promoted into §17 as an active rule. No separate `DECISIONS-ARCHIVE.md` is created; that name is reserved for a future migration only if `docs/decisions.md` is later deprecated by explicit project decision.



\*\*Entry format:\*\*



```markdown

\### YYYY-MM-DD — IFT Round X (or "Run decision")

\*\*Decision:\*\* <one-line summary>

\*\*Rationale:\*\* <why this decision was made>

\*\*Alternatives rejected:\*\* <other options considered and why rejected>

\*\*Sections changed:\*\* <PLAN.md § references and/or CRM-CONTRACT.md references>

\*\*Open questions handled:\*\* <questions closed by this decision, or "none">

```



\---

\### 2026-05-28 — Run decision (Sprint 55 completion and Sprint 56 planning)

\*\*Decision:\*\* Mark S55-F1, S55-F2, and S55-F3 as done on `main`, set the active sprint field to "Sprint 56 queued for codex," and queue S56-F1 through S56-F3 as the next Codex track.

\*\*Rationale:\*\* The current `main` history contains the dealer-capacity contract, capacity-aware simulator, and capacity-window operator-surface implementation/report commits, and the current rollover baseline full local gate is green with zero active Codex blockers. PLAN.md and the backlog still listed Sprint 55 as queued, so this rollover reconciles completion and promotes a read-only B-57 pacing snapshot readiness scope without adding persistence, live routing changes, or new route boundaries.

\*\*Alternatives rejected:\*\* Leaving Sprint 55 queued, because repo-local commits and the local gate already establish completion; promoting permanent non-goal items from README Known Limitations, because the current rollover explicitly excludes auth, deployment, external AI, geocoding, Postgres default, persistent forecast scenarios, dealer-order/area CRUD, live `/deals/[id]`, and global search expansion; promoting persistent routing/pacing snapshot storage, because read-only snapshot contracts and packets can prepare the trend-review surface without schema or background-job risk.

\*\*Sections changed:\*\* §1, §4, §17.

\*\*Open questions handled:\*\* Current Sprint 55 Codex status and the next Codex sprint scope.


\### 2026-05-28 — Run decision (Sprint 54 completion and Sprint 55 planning)

\*\*Decision:\*\* Mark S54-F1, S54-F2, and S54-F3 as done on `main`, set the active sprint field to "Sprint 55 queued for codex," and queue S55-F1 through S55-F3 as the next Codex track.

\*\*Rationale:\*\* The current `main` history contains the routing fairness metric-contract, review-packet, and operator-surface implementation/report commits, and the current rollover baseline full local gate is green with zero active Codex blockers. PLAN.md and the backlog still listed Sprint 54 as queued, so this rollover reconciles completion and promotes the next B-55 dealer capacity window scope as read-only simulator readiness without changing live routing or pacing behavior.

\*\*Alternatives rejected:\*\* Leaving Sprint 54 queued, because repo-local commits and the local gate already establish completion; promoting permanent non-goal items from README Known Limitations, because the current rollover explicitly excludes auth, deployment, external AI, geocoding, Postgres default, persistent forecast scenarios, dealer-order/area CRUD, live `/deals/[id]`, and global search expansion; promoting persistent routing/pacing snapshots, because capacity-window simulation can be validated without adding saved scenarios or new snapshot storage.

\*\*Sections changed:\*\* §1, §4, §17.

\*\*Open questions handled:\*\* Current Sprint 54 Codex status and the next Codex sprint scope.


\### 2026-05-28 — Run decision (Sprint 53 completion and Sprint 54 planning)

\*\*Decision:\*\* Mark S53-F1, S53-F2, and S53-F3 as done on `main`, set the active sprint field to "Sprint 54 queued for codex," and queue S54-F1 through S54-F3 as the next Codex track.

\*\*Rationale:\*\* The current `main` history contains the routing simulator review-packet, operator-surface, and guardrail-coverage implementation/report commits, and the latest Codex report records green full local-gate evidence with zero active Codex blockers. PLAN.md and the backlog still listed Sprint 53 as queued, so this rollover reconciles completion and promotes the next read-only B-54 routing fairness/explanation scope without changing routing or pacing behavior.

\*\*Alternatives rejected:\*\* Leaving Sprint 53 queued, because repo-local commits and the local gate already establish completion; promoting permanent non-goal items from README Known Limitations, because the current rollover explicitly excludes auth, deployment, external AI, geocoding, Postgres default, persistent forecast scenarios, dealer-order/area CRUD, live `/deals/[id]`, and global search expansion.

\*\*Sections changed:\*\* §1, §4, §17.

\*\*Open questions handled:\*\* Current Sprint 53 Codex status and the next Codex sprint scope.


\### 2026-05-28 — Run decision (Sprint 52 completion)

\*\*Decision:\*\* Mark S52-F1 and S52-F2 as done on `main` and set the active sprint field to "Sprint 52 complete; next scope not selected."

\*\*Rationale:\*\* The current `main` history contains the routing simulator input-contract and read-only evaluator implementation/report commits, and the latest Codex reports record green local-gate evidence for both Sprint 52 features. Keeping Sprint 52 listed as queued caused coordination drift for the next autonomous loop.

\*\*Alternatives rejected:\*\* Leaving Sprint 52 queued, because repo-local commits and the local gate already establish completion; adding a Sprint 53 entry in this reconciliation pass, because new sprint activation still requires explicit planning scope.

\*\*Sections changed:\*\* §1, §4, §17; `README.md`; `docs/ROADMAP.md`; `docs/FEATURE-BACKLOG.md`; `docs/PROJECT-CONTROL.md`.

\*\*Open questions handled:\*\* Current Sprint 52 status and whether this reconciliation pass should activate a new feature scope.


\### 2026-05-27 — Run decision (Sprint 49 completion)

\*\*Decision:\*\* Mark S49-F1, S49-F2, and S49-F3 as done on `main` and set the active sprint field to "Sprint 49 complete; next scope not selected."

\*\*Rationale:\*\* The current `main` history contains the saved report definition, preview runner, and operator surface implementation/report commits, and the latest Codex report records a green full local gate for Sprint 49. Keeping Sprint 49 listed as queued caused coordination drift during repo review.

\*\*Alternatives rejected:\*\* Leaving Sprint 49 queued until a later prompt, because repo-local evidence and the local gate already establish completion; selecting a new sprint in this review pass, because the prompt asked for repo review/optimization rather than new feature promotion.

\*\*Sections changed:\*\* §1, §4, §17; `README.md`; `docs/ROADMAP.md`; `docs/FEATURE-BACKLOG.md`; `docs/PROJECT-CONTROL.md`.

\*\*Open questions handled:\*\* Current Sprint 49 status and whether this optimization pass should activate a new feature scope.


\### 2026-05-24 — Run decision (Sprint 33 and roadmap readiness)

\*\*Decision:\*\* Record S33-F1 and S33-F2 as done, keep S33-F3 as the next queued loop target, and add B-68 for dependency/security modernization after repo-local and internet-backed audit review.

\*\*Rationale:\*\* S33-F1 has an implementation and report commit on `main`; the S33-F2 local service/test files pass the full local gate and match the queued Sprint 33 scope. `npm audit` still reports moderate transitive issues, but the available fixes involve package-major movement and should be handled as a planned modernization pass after the current feature loop rather than forced during a readiness update.

\*\*Alternatives rejected:\*\* Leaving S33-F2 as untracked dirty state before launching the loop, because the loop pre-flight would treat it as unexpected and may stash valid sprint work; running `npm audit fix --force`, because that would downgrade or major-upgrade core toolchain packages without a targeted compatibility pass.

\*\*Sections changed:\*\* §1, §4, §16, §17; `CRM-CONTRACT.md`; roadmap/control/backlog docs; Codex reports.

\*\*Open questions handled:\*\* Current Sprint 33 progress, next loop target, and how to track dependency advisories discovered during readiness review.



\### 2026-05-22 — Run decision (execution topology)

\*\*Decision:\*\* Make worktree path the topology switch: `C:\\dev\\salesforce-lite-crm` is single-agent full-repo mode, while `C:\\dev\\salesforce-lite-crm-codex`, `C:\\dev\\salesforce-lite-crm-claude`, `C:\\dev\\salesforce-lite-crm-grok`, `/c/dev/salesforce-lite-crm-grok`, and `C:\\dev\\salesforce-lite-crm-gemini` are parallel multi-agent mode with ownership zones enforced.

\*\*Rationale:\*\* Some fixes require moving across app, component, service, test, script, and documentation boundaries together. In the root worktree, serializing work through one active agent prevents parts of the same project from drifting too far ahead while preserving the existing multi-agent workflow when dedicated worktrees are used.

\*\*Alternatives rejected:\*\* Keeping Codex on the repo root in parallel mode, because it makes path-based intent ambiguous; always enforcing ownership zones, because it blocks coherent repo-wide fixes during single-agent runs; removing the ownership matrix entirely, because it is still useful when multiple agent-specific worktrees run in parallel.

\*\*Sections changed:\*\* §1, §3, §5, §6, §8, §13, §17; `AGENTS.md`; worktree, autonomy, prompt, and project-control docs/scripts.

\*\*Open questions handled:\*\* How agents decide whether ownership zones are advisory or mandatory; where parallel Codex work should run; how to avoid cross-zone blocking during single-agent root work.



\### 2026-05-20 — Run decision (roadmap canon)

\*\*Decision:\*\* Adopt the expanded roadmap canon as proposal-only planning material and make Sprint 5 the recommended next sprint without activating feature implementation.

\*\*Rationale:\*\* The roadmap consolidates contract-first rules, deterministic defaults, hermetic gate requirements, required promotion decisions, AI safety sequencing, and B-NN grounded backlog IDs while preserving `CRM-CONTRACT.md` as the shipped product contract.

\*\*Alternatives rejected:\*\* Promoting Sprint 5 implementation immediately in §4, because the current prompt asks to add roadmap material and the roadmap's own B-47 scope says PLAN updates should remain proposal-only; changing `CRM-CONTRACT.md`, because no implemented entity, route, model, feature flag, adapter signature, schema, or seed behavior changed.

\*\*Sections changed:\*\* §1, §4, §16, §17; `docs/ROADMAP.md`; `docs/AI-ROADMAP.md`; `docs/ARCHITECTURE.md`; `docs/EVALS.md`; `docs/SECURITY-PRIVACY.md`.

\*\*Open questions handled:\*\* Sprint 5 recommended scope, required promotion decisions, AI safety sequencing, and roadmap companion-document ownership.



\### 2026-05-20 — Run decision (local-gate prose)

\*\*Decision:\*\* Align PLAN local-gate prose with the current package validation scripts.

\*\*Rationale:\*\* The current prompt, `package.json`, `docs/LOCAL-GATE.md`, and `scripts/local-gate.ps1` all include `npm run lint` and `npm run typecheck`, while PLAN §9 and §11 still contained older warnings that those scripts did not exist.

\*\*Alternatives rejected:\*\* Leaving the stale warnings in place would keep future agents choosing between contradictory gate instructions; removing lint/typecheck from the actual gate would weaken current validation and conflict with higher-priority repo-local evidence.

\*\*Sections changed:\*\* §1, §9, §11, §16, §17.

\*\*Open questions handled:\*\* Whether agents may run and report `lint` and `typecheck` when the scripts exist in the current tree.



\### 2026-05-18 — Run decision

\*\*Decision:\*\* Bootstrap R8 bounded executor and R9 managed autonomy queue wrapper in one Codex run.

\*\*Rationale:\*\* The executor substrate and manager wrapper are complementary: R8 supplies bounded launches, prompt snapshots, STOP controls, status/log paths, and static Sprint 4 prompts, while R9 adds validated queue dispatch, model availability, failover handoffs, reviewer-only support, and IFT proposal drafting without automating merges or IFT approval.

\*\*Alternatives rejected:\*\* Landing R8 and R9 in separate prompts for this run, because the current prompt explicitly authorizes a combined bootstrap; automating IFT finalization or merges, because human approval remains the safety boundary; committing runtime run-state, because supervisor state belongs outside the repo or under ignored paths.

\*\*Sections changed:\*\* §6, §9, §13, §17.

\*\*Open questions handled:\*\* How unattended agents stop, how same-command repairs are bounded, how a completed sprint quiesces, how optional spend reporting is recorded, and how the combined R8/R9 bootstrap is captured without duplicate decision entries.



\### 2026-05-17 — IFT Round 9

\*\*Decision:\*\* Adopt canonical `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` templates.

\*\*Rationale:\*\* No repo templates existed. New schemas separate gate status from agent claims, require safe next actions, and keep reports as single-prompt snapshots with history in git.

\*\*Rejected:\*\* Nonexistent prior format; append-log reports.

\*\*Sections changed:\*\* §13.

\*\*Handled:\*\* R4 §13 templates.



\### 2026-05-17 — IFT Round 9

\*\*Decision:\*\* Use tiered Decision Log retention: §17 keeps active sprint, prior two completed sprints, and active rules; older entries move to `docs/decisions.md`.

\*\*Rationale:\*\* Prevents prompt bloat while preserving full history in git.

\*\*Rejected:\*\* Append-only forever; entry-count cap; top-level `DECISIONS-ARCHIVE.md`.

\*\*Sections changed:\*\* §17, §5, §11.

\*\*Handled:\*\* R4 §17 retention.



\### 2026-05-17 — Run decision

\*\*Decision:\*\* Store `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md` at each worktree root and rewrite them every prompt.

\*\*Rationale:\*\* Root paths are consistent and visible; git preserves history.

\*\*Rejected:\*\* `reports/` subdirectory; append-with-anchors.

\*\*Sections changed:\*\* §13.

\*\*Handled:\*\* R10 §13 path/cadence.



\### 2026-05-17 — IFT Round 21 (Claude)

\*\*Decision:\*\* Add Sprint 4 non-goals to §4 and a "no invented product contract if `CRM-CONTRACT.md` is absent" rule to §8.

\*\*Rationale:\*\* Scope and contract guards needed to live in agent-critical sections.

\*\*Rejected:\*\* Relying only on §11/§16; adding a §9 gate table at this round.

\*\*Sections changed:\*\* §4, §8, §17.

\*\*Handled:\*\* Scope creep; contract-gap invention.



\### 2026-05-17 — IFT Round 23 (Claude)

\*\*Decision:\*\* Set §3 git identity to `repo-configured`; replace speculative Sprint 5–8 backlog with README-based `B-NN` IDs; keep IFT ANSWER to the PLAN.md deliverable only.

\*\*Rationale:\*\* Removes fabricated canonical details and speculative roadmap framing.

\*\*Rejected:\*\* Keeping `dealermedia.local`; dropping §16.

\*\*Sections changed:\*\* §3, §16, §17.

\*\*Handled:\*\* Fabricated identity; speculative backlog; ANSWER boundary.



\### 2026-05-17 — IFT Round 24 (Claude)

\*\*Decision:\*\* Remove stale worktree-status column; add missing-worktree blocker rule; use verified generic §4 feature names; check worktree existence before `git status`; add proportional §9 gate table; reorder §16 neutrally.

\*\*Rationale:\*\* Avoids stale state, unverifiable UI claims, ambiguous git errors, and excessive gate burden.

\*\*Rejected:\*\* Timestamped worktree status; unverifiable UI names; full gate for every change; treating reporting as Sprint 4 product work.

\*\*Sections changed:\*\* §1, §3, §4, §6, §9, §16, §17.

\*\*Handled:\*\* Worktree staleness; UI assertion risk; missing-path behavior; gate proportionality.



\### 2026-05-17 — IFT Round 25 (Claude)

\*\*Decision:\*\* Define blocker types in §10: `ownership`, `gate`, `contract`, `dependency`; map missing worktree/path/setup/package/script/config issues to `dependency`; cross-reference from §13.

\*\*Rationale:\*\* Prevents inconsistent blocker classification across agents.

\*\*Rejected:\*\* New `worktree` type; implicit mapping; moving definitions to §13.

\*\*Sections changed:\*\* §1, §3, §6, §10, §13, §17.

\*\*Handled:\*\* Blocker-type ambiguity.



\### 2026-05-17 — IFT Round 26 (Claude)

\*\*Decision:\*\* Add current-run prompt to §2 hierarchy with explicit-exception rule; expand §5 shared/contract files to include `package-lock.json` and framework configs; name `node scripts/ensure-sqlite-db.mjs` in §9; add global search as a §4 non-goal and B-12 deployment backlog item.

\*\*Rationale:\*\* Closes gaps around one-run exceptions, config ownership, postinstall clarity, and global-search drift.

\*\*Rejected:\*\* Collapsing config zones; adding prescriptive §14 IFT schema; only mentioning global search in §11.

\*\*Sections changed:\*\* §1, §2, §4, §5, §9, §10, §16, §17.

\*\*Handled:\*\* Prompt exceptions; config ownership; postinstall transparency; global-search boundary.



\### 2026-05-17 — IFT Round 27 (Claude)

\*\*Decision:\*\* Split §6 into implementation commit and separate report-only commit. Gate failures skip implementation commit but still rewrite/commit reports. §7 adds report-only commit format; §8 requires implementation SHAs in SUMMARY and report commit status; §13 clarifies `Commits this prompt` excludes the report-only commit.

\*\*Rationale:\*\* Ensures reports are committed every prompt, including failed gates, without mixing implementation and reporting changes.

\*\*Rejected:\*\* Combining implementation and report commits; pushing without report commits; changing §17 retention; collapsing §5 zones; adding §14 fallback schema.

\*\*Sections changed:\*\* §1, §6, §7, §8, §13, §17.

\*\*Handled:\*\* Report commit ordering; gate-failure report path.



\### 2026-05-17 — IFT Round 28 (Claude)

\*\*Decision:\*\* Three repo-verified corrections. Add `prisma.config.ts` to the shared/contract zone (verified present at repo root). Add `.gitignore` to the shared/contract zone. Remove the false `.\\gate-output\\` gitignored claim from §9 — verified absent from `.gitignore`, which lists only `node\_modules`, `.next`, `dist`, `coverage`, `playwright-report`, `test-results`, `.env`, `.env.local`, `dev-server.log`, and the `prisma/dev.db\*` family. Gate-failure evidence now lives directly in `BLOCKERS.<agent>.md`. Add a §5 row clarifying that report-file \*contents\* are owned by the producing agent while the \*schema\* follows §13, and a note that `next-env.d.ts` is Next.js auto-generated and not subject to ownership rules.

\*\*Rationale:\*\* Closes a real gap (a load-bearing config file with no zone) and removes a false assertion (gitignored gate-output path). The report-file contents-vs-schema distinction was previously implicit; making it explicit prevents an agent from interpreting §5 as forbidding it from writing its own reports.

\*\*Rejected:\*\* Wide-table §5 restructuring with a new "shared shell" category (introduces ambiguity over `app/layout.tsx` without a named failure mode); dropping `lib/types/`; dropping `prisma.config.ts`; restructuring §§1–11 beyond the smallest necessary change.

\*\*Sections changed:\*\* §1, §5, §6, §7, §9, §17.

\*\*Handled:\*\* Missing `prisma.config.ts` zone assignment; false gate-output gitignore claim; implicit report-contents ownership; phantom `next-env.d.ts`.



\### 2026-05-17 — IFT Round 29 (Claude)

\*\*Decision:\*\* Three named failure-mode fixes adopted from peer review. (1) \*\*§6 step 7 + trailing paragraph:\*\* the `gate` BLOCKERS entry now records the list of uncommitted implementation paths left in the worktree, and a new rule defines how step 4 on the next prompt treats that dirty state — the open `gate` blocker covers it when the current prompt explicitly references the resolution; otherwise step 4 records the unchanged state and no duplicate blocker is filed. (2) \*\*§14 Convergence criteria:\*\* replace the "three of five models converge" stopping rule with evidence-based criteria (no unadopted material peer improvement, no load-bearing unsupported claim, remaining disagreement not load-bearing); explicit note that peer agreement is a stopping signal only when the substance is independently grounded, and round termination is recorded as a run decision in §17 rather than as convergence. (3) \*\*§15 Platform capability note:\*\* remove hard-coded per-vendor connector capability claims (live code access, commit history, import size, etc.) in favor of recorded current reachability per session; the Connector Context Checklist already carries the operational load. Verified against `.gitignore`, the repo root tree, `package.json` scripts, and the README on `main` this turn; no factual claim in §§1–11 conflicts with repo state.

\*\*Rationale:\*\* §14's old criterion contradicted this PLAN's own anti-majority discipline (§11 IFT rules and the IFT prompt itself); §15's hard-coded capability claims age out as platforms change and create stale-default risk even with a session-verify hedge; §6's failed-gate path left an undefined cross-prompt state that would either trap the agent at step 4 or generate duplicate `gate` blockers.

\*\*Rejected:\*\* Dropping the R27 entry in favor of a renumbered R57/R58 label (labeling inconsistency for the Claude track); deeper restructuring of §6 or §15; per-model trust weighting at adjudication (no empirical support); adding a verbalized-confidence layer to BLOCKERS evidence (literature flags this as miscalibrated).

\*\*Sections changed:\*\* §1, §6, §10, §13, §14, §15, §17.

\*\*Handled:\*\* Cross-prompt failed-gate dirty state; §14 majority-stopping rule vs IFT anti-majority principle; §15 hard-coded capability drift.



\### 2026-05-17 — IFT Round 30 (Claude)

\*\*Decision:\*\* Single wording-consistency fix. §6 step 11 changes from "this report-only commit does not need to list itself in `Commits this prompt`" to "this report-only commit must not list itself in `Commits this prompt`"; §13's parallel cadence-paragraph clause makes the matching change from "does not list itself" to "must not list itself". The exclusion of the report-only commit from `Commits this prompt` now reads as prohibitive in both sections rather than permissive in §6 and declarative in §13.

\*\*Rationale:\*\* §11's trailing line designates §§1–11 as the CLI agent's sole operational reference. An agent reading only step 11's prior permissive wording without §13's clarification could reasonably interpret listing the report-only commit as optional and produce inconsistent SUMMARY reports across prompts. Aligning step 11 to prohibitive removes the gap at essentially zero length cost.

\*\*Alternatives rejected:\*\* ChatGPT R59's relabeling of R27/R28/R29 → R57/R58/R59 (loses Claude-track decision-log history that is load-bearing for the report-only commit split settlement). Grok R59's §14 return to majority-based convergence and §15 hard-coded per-vendor capability claims (both regressions on the R29 settlement). Gemini R59's structural reorganization of §5 with a "shared shell" category (introduces ambiguity over `app/layout.tsx` without a named failure mode). Meta AI R2's omission of `prisma.config.ts` (repo-verified false in R28). Bumping version to 3.0 (sub-version change too small; round captured in §17 instead).

\*\*Sections changed:\*\* §6, §13, §17.

\*\*Open questions handled:\*\* §6 step 11 / §13 wording parity for report-only commit exclusion.

