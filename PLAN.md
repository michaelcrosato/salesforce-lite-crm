\# PLAN.md



\## 1. Document Control



| Field | Value |

|---|---|

| Version | 2.9D |

| Last updated | 2026-05-17 |

| Active sprint | Repo readiness pass active by current prompt; Sprint 4 queued |

| CRM-CONTRACT.md version | Present at repo root on this branch. Until merged everywhere, branches without it treat `README.md`, `PLAN.md`, and `docs/decisions.md` as interim references and must not invent a replacement product contract. |

| Editor | Collaborative. Agents may edit this file when the current prompt or repo work calls for it. |



\## 2. Source of Truth Hierarchy



When two sources disagree, the higher wins:



1\. Local PowerShell gate output (§9)

2\. The current run prompt (authoritative for assigned feature, branch, and any explicit one-run scope exception)

3\. `PLAN.md` and `CRM-CONTRACT.md`

4\. Per-agent `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`

5\. IFT recommendations from chat LLMs

6\. `docs/decisions.md` (historical reference; not binding unless re-promoted into §17)



If the current prompt conflicts with file ownership or a durable rule in this plan, treat the prompt as the active scope for this run, document the exception in SUMMARY/BLOCKERS when material, and keep moving. IFT can propose changes to (3). It cannot override (1). Agents may edit (3) when the prompt or repo work calls for it.



\## 3. Agent Roster



This table records configured worktree paths. It is not proof that the directories currently exist on disk.



| Agent | Model | Worktree | Branch prefix | Git identity | Report files |

|---|---|---|---|---|---|

| Codex | GPT-5.5 (Codex CLI) | `C:\\dev\\salesforce-lite-crm` | `codex/` | repo-configured | `SUMMARY.codex.md`, `BLOCKERS.codex.md` |

| Claude | Anthropic (Claude Code) | `C:\\dev\\salesforce-lite-crm-claude` | `claude/` | repo-configured | `SUMMARY.claude.md`, `BLOCKERS.claude.md` |

| Grok | xAI (Grok CLI) | `C:\\dev\\salesforce-lite-crm-grok` | `grok/` | repo-configured | `SUMMARY.grok.md`, `BLOCKERS.grok.md` |

| Gemini | Google (Gemini CLI) | `C:\\dev\\salesforce-lite-crm-gemini` | `gemini/` | repo-configured | `SUMMARY.gemini.md`, `BLOCKERS.gemini.md` |



Roster rules:



\- Each agent works in its own local worktree and pushes only to branches under its own prefix.

\- If a listed worktree does not exist at the expected path, create it when feasible or file a `dependency` blocker per §10 with the exact missing path.

\- No agent rebases `main`, force-pushes, amends pushed commits, or merges another agent's branch.

\- Update this table in the same change that intentionally changes a worktree, branch prefix, or report filename.

\- Worktree setup, inspection, and recovery commands live in `docs/WORKTREE-SETUP.md` and `scripts/check-worktrees.ps1`. Do not create or overwrite worktrees unless branch names are defined here or passed explicitly to the helper script.



\## 4. Current Sprint



\*\*Current prompt scope — Repo Readiness\*\*

Status: active for this run. Scope is repo hygiene, PLAN/README alignment, agent coordination docs, prompt folders, helper scripts, report files, safe local artifact cleanup, drift scans, and the local gate. This pass does not build product features or expand product scope.

\*\*Sprint 4 — Demo Data Tuning \& Visual QA\*\*



Goal: harden the five-minute demo path using existing product scope. Do not add new product features unless the current prompt or this section makes that scope explicit.



| Feature | Owner | Status | Acceptance summary |

|---|---|---|---|

| S4-F1 — Demo seed tuning | Codex | queued | Seeded data supports the README demo path: Vancouver lead routing (`V5K 0A1`), behind-pace dealer orders, stale high-value deals, low-health dealer accounts, and deterministic analyst actions. No schema expansion unless the current prompt or contract scope calls for it. |

| S4-F2 — Route visual QA | Claude | queued | Demo-critical routes render coherently: `/dashboard`, `/leads`, `/orders`, `/orders/\[id]`, `/areas`, `/forecast`, `/accounts`, `/contacts`, and `/deals`. Visual fixes must not change business logic. |

| S4-F3 — Component polish | Grok | queued | Shared components used in the demo have stable spacing, readable empty states, deterministic ordering, and no broken links or orphaned actions. |

| S4-F4 — Demo smoke and gate hardening | Gemini | queued | Tests/e2e support the README demo path. Local gate commands are documented accurately and failures are captured in `BLOCKERS.gemini.md`. Subject to §3 worktree availability. |



\*\*Sprint 4 non-goals\*\* (do not bundle into any S4-F\* work without an explicit current prompt or §4 update):



\- No authentication, permissions, or multi-tenancy.

\- No deployment configuration.

\- No external AI provider integration. Summarizer remains deterministic.

\- No geocoding or territory polygons. Postal prefix matching stays.

\- No default switch from SQLite to Postgres.

\- No persistent forecast scenarios.

\- No dealer order or routing area create/edit flows.

\- No new `/deals/\[id]` route. The current drawer flow stays.

\- No global search expansion. Top search continues to route to contacts only.



Acceptance details live in `CRM-CONTRACT.md` and this section. Status updates are agent-reported in SUMMARY; only the local gate (§9) authorizes a status of `done`.



\## 5. File Ownership Matrix



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



`next-env.d.ts` is auto-generated by Next.js and not subject to ownership rules; agents do not edit it. If it appears unexpectedly modified or staged, treat as a `dependency` blocker per §10 (regenerated state mismatch).



If a listed framework config file does not actually exist in the repo, the zone rule is harmless — there is nothing to edit and no blocker to file. If a file appears to match multiple zones, the more restrictive rule wins.



Cross-cutting feature work that requires edits in two agents' zones should be decomposed in the prompt or documented in the agent report. Agents coordinate through branches, reports, and contract files.



If an agent finds it cannot complete its feature without touching another zone, the correct action is: keep the edit minimal, document the cross-zone reason in SUMMARY/BLOCKERS, and proceed when the current prompt makes the need clear. See §10.



\## 6. Execution Loop



Every CLI agent runs this on every prompt. No exceptions.



0\. Check STOP gate. If a file named `STOP` exists at the worktree root, file or update a BLOCKERS entry of type `dependency` recording the STOP, rewrite SUMMARY with Status: blocked, commit report-only per §6 step 11, push if safe, and exit. The supervisor (if used) is responsible for polling `origin/main` for a remote STOP signal; agents only check the local worktree.

1\. Read `PLAN.md` §§1–11 and `CRM-CONTRACT.md` (or its interim substitutes per §1) in full.

2\. Identify your active feature in §4. If status is not `active` or `queued` for you, treat the current prompt as the run scope and note the mismatch in SUMMARY/BLOCKERS.

3\. Confirm the local worktree exists and is the expected path from §3. If not, create or use the best available worktree when feasible; otherwise file a BLOCKERS entry per §10 (type: `dependency`).

4\. Run `git status --short` in your worktree. If unexpected uncommitted files exist (anything not in `.gitignore` that you did not introduce in this prompt), record the listing, avoid overwriting those paths, and proceed around them when possible.

5\. Confirm every file you intend to touch is in your zone per §5. If any file is in another agent's zone or a shared coordination zone, keep the edit minimal, document the reason, and proceed when needed for the assigned work.

6\. Execute the assigned work.

7\. Run the local gate per §9 — full sequence or change-type subset as appropriate. If it fails, follow the gate-failure policy in §9 before deciding whether a `gate` blocker is needed.

8\. If checks pass and implementation files changed, commit the implementation work per §7. Record the implementation commit SHA(s).

9\. Rewrite `SUMMARY.<agent>.md` per the schema in §13 (full overwrite, not append). `Commits this prompt` records the implementation commit(s) from step 8, or `none`.

10\. Rewrite `BLOCKERS.<agent>.md` per the schema in §13. If no active blockers, the file still exists with an empty `Active blockers` table.

11\. Commit changed report files as a separate report-only commit per §7. This report-only commit must not list itself in `Commits this prompt`.

12\. Push to your branch.

13\. Stop after the assigned work unless the current prompt asks you to continue into the next feature.



Sprint quiescence: if your assigned feature is `done` and no further feature is queued for you in §4, rewrite SUMMARY with `Next action: idle / awaiting next PLAN scope`, leave BLOCKERS empty unless a real blocker exists, commit report-only if needed, and exit. Do not invent the next sprint.



If a gate failure remains unresolved after the §9 repair-first policy and report files can be staged without staging failed implementation changes, commit only the report files and push that report-only commit. Leave unresolved failed implementation changes uncommitted unless the current prompt explicitly instructs otherwise. If even the report-only commit/push is blocked, record why in `BLOCKERS.<agent>.md` if possible and stop.



On the next prompt, the uncommitted implementation paths from a still-open `gate` blocker satisfy step 4's "not introduced in this prompt" check when those paths match the Evidence list of the open `gate` blocker or the current prompt otherwise makes them in scope. Do not file a duplicate `gate` blocker; keep the existing one open and note in `BLOCKERS.<agent>.md` whether the dirty state changed.



Edge cases that look novel resolve to a named section when possible. If no section covers it, make the smallest reversible call, document it, and continue.



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

\- Amend a commit you have already pushed.

\- Edit a file outside your zone (§5), even to fix a typo. File a blocker.

\- Merge between agent branches or into `main` without explicit current-prompt scope.

\- Make broad edits to `PLAN.md`, `CRM-CONTRACT.md`, or `docs/decisions.md` without explicit current-prompt scope.

\- Commit generated local database files, build artifacts, logs, or screenshots unless explicitly instructed.

\- Include implementation files in a report-only commit.



\## 8. Definition of Done



Every feature must satisfy all of the following before an agent may mark it `done`:



\- Local gate is green (§9). The agent has run the required check or gate subset locally and recorded the run line and exit code in the implementation commit message body.

\- `SUMMARY.<agent>.md` reflects the completed feature, and any implementation commit short SHA(s) from this prompt are recorded in its `Commits this prompt` field.

\- `BLOCKERS.<agent>.md` reflects current blocker state, even when empty.

\- Both report files are committed via the §6 step 11 report-only commit, or `BLOCKERS.<agent>.md` explains why they could not be committed.

\- Cross-zone or shared coordination edits are minimal and documented.

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

seed             -> tsx prisma/seed.ts

test             -> vitest run

test:e2e         -> npm run seed \&\& playwright test

prisma:postgres  -> node scripts/prisma-postgres.mjs

```



There are no `lint` or `typecheck` scripts; agents must not invent them or claim they passed. If they are later added, this section is updated before agents run them.



\*\*Full local setup/gate from repo root:\*\*



```powershell

npm install

if (-not (Test-Path .env)) { Copy-Item .env.example .env }

npx prisma generate

npx prisma db push

npm run seed

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



If the gate fails on `main` after a merge, handle it through a rollback, hotfix, or new IFT round as directed by the current prompt or repo workflow. Agents do not act on `main` without explicit scope. If new gate steps are added to the repo later (a lint script, a typecheck script, a secrets scan), they are added to this section before agents start running them.



\## 10. Conflict \& Boundary Policy



An agent's work hits another agent's zone, the shared/contract zone, or the planning/decision zone; or a precondition from §3 or §6 fails; or the current prompt conflicts with a durable rule in this plan. The agent does this, in order:



1\. \*\*Contain the risky edit immediately.\*\* Keep it minimal, avoid overwriting unrelated work, and prefer reversible changes.

2\. \*\*File a BLOCKERS entry\*\* per §13 with:

&#x20;  - the exact file path or precondition,

&#x20;  - the blocker type, picking exactly one of:

&#x20;    - `ownership` — work requires editing another agent's zone or a shared coordination file (§5)

&#x20;    - `gate` — a local gate command or required check (§9) failed

&#x20;    - `contract` — `CRM-CONTRACT.md` is missing or ambiguous on a load-bearing product decision

&#x20;    - `dependency` — missing worktree, missing path, missing setup prerequisite, or a package, script, or config requirement not yet represented in the repo

&#x20;  - one-line description,

&#x20;  - evidence (command output, conflicting instruction text, error message, path list, or dirty-state listing for a `gate` blocker),

&#x20;  - what needs to be resolved,

&#x20;  - what the agent will work on safely while blocked.

3\. \*\*Keep work moving where safe.\*\* Do not silently reproduce a cross-zone change in your own zone; either make the needed edit directly with documentation or leave a blocker.

4\. \*\*Resume or continue work when the current prompt, blocker evidence, or repo state provides a workable resolution.\*\*



No inter-agent merging or agent-to-agent pull requests without explicit current-prompt scope. Cross-zone fixes are allowed when they are the smallest direct way to complete the assigned work and are documented.



\## 11. Anti-Drift Rules



\*\*For CLI agents:\*\*



\- No new architecture patterns by accident. If the existing codebase uses Prisma + Server Actions + Tailwind, you do too. Propose or document alternatives through IFT or the current prompt.

\- No new external dependencies by accident. `package.json` is in the shared/contract zone. Need a library? Add it only with explicit prompt scope or file a blocker.

\- No hidden process invention. Every action you take resolves to a numbered step in §6 (Execution Loop), a protocol named elsewhere in §§1–10, or a documented YOLO exception from the current prompt.

\- Edits to `PLAN.md`, `CRM-CONTRACT.md`, or `docs/decisions.md` stay explicit, scoped, and documented.

\- No claims of `lint` or `typecheck` passing. Those scripts do not exist (§9). Do not invent them.

\- Cleanup is repo-local and conservative. Use `scripts/clean-local-artifacts.ps1` in dry-run mode first; remove only ignored/generated/local artifacts inside this repo. Leave unknown files in place and record them in BLOCKERS.



\*\*For IFT (Track B chat LLMs):\*\*



\- No overriding the local gate. A green claim from any chat LLM is not authoritative under any circumstance.

\- No hidden repo writes. IFT outputs proposals or patches; repo changes land through the normal local workflow.

\- No re-litigating decisions already logged in §17 of this file or in `docs/decisions.md`, unless either (a) new evidence is presented in the form of gate output, code, or a measurable outcome since the decision was logged, or (b) the current prompt explicitly opens the question for the current round. Re-promotion of an archived decision into §17 counts as opening the question.



\---

\*CLI agents: §§1–11 are your complete operational reference. Consult §13 when rewriting `SUMMARY` and `BLOCKERS` per §6 steps 9–11. §§12 and 14–17 are planning and maintenance context for chat LLMs and coordinating future work.\*



\---



\## 12. Purpose, Audience \& Operating Model



This file is the bridge between two tracks.



\*\*Track A — Execution.\*\* Four CLI agents (§3) run in parallel in their own worktrees. Each reads `PLAN.md` and `CRM-CONTRACT.md` on every prompt, executes per §§4–6, commits per §7, and writes `SUMMARY` and `BLOCKERS` per §13. Agents run unattended. They cannot see this chat or each other.



\*\*Track B — Planning (IFT).\*\* Five chat LLMs — Claude, ChatGPT, Grok, Gemini, Meta AI — run a structured debate loop in their respective web chat surfaces. Context is pasted into each model independently, then each model's draft circulates to the others for critique across 2–4 rounds until convergence. IFT is used for load-bearing decisions: sprint scope, architecture, contested merge order, domain-rule resolution, stress-testing PLAN.md changes before commit, and reviewing agent reports for weak reasoning.



\*\*Git and reports are the sync point.\*\* Track B converges → `PLAN.md` changes land through the normal repo workflow → Track A picks them up on the next prompt. Track A produces SUMMARY/BLOCKERS → Track B incorporates them if load-bearing.



\*\*The standard Track A prompt is minimal:\*\*

```text

Read PLAN.md and CRM-CONTRACT.md. Execute Sprint <N> Feature <id>. Begin.

```



The prompt may add a single line of inline context if a blocker resolution requires it. Anything more belongs in PLAN.md or CRM-CONTRACT.md.



\*\*IFT is advisory.\*\* It cannot declare tests passed, builds green, or merges safe. Only the local gate (§9) can.



\## 13. Reporting Templates



\*\*Cadence:\*\* rewrite both files in full every prompt. Snapshot of current state, not appended log. Historical state is preserved in git. Per §6 step 11, both files are then committed in a single report-only commit before push; the report-only commit must not list itself in its own `Commits this prompt` field.



\*\*Location:\*\* root of each agent's worktree. Example: `C:\\dev\\salesforce-lite-crm-claude\\SUMMARY.claude.md`.



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



`Commits this prompt` records the implementation commit(s) from §6 step 8. The report-only commit from §6 step 11 is not listed; if no implementation commit was created (e.g. a blocker-only or report-only prompt), the field is `none`.



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



Backlog items are not active sprint work. Active sprint detail is in §4. IFT uses this section to debate scope, sequence, and feasibility before an item is promoted to active status in §4. Order in this table is not a commitment to sequence.



| Backlog ID | Candidate scope | Notes |

|---|---|---|

| B-01 | Create `CRM-CONTRACT.md` | Compact product contract covering current entities, routes, invariants, non-goals, and deterministic behavior. Closes the contract-gap-invention risk in §8. |

| B-02 | Committed local gate script | For example `scripts/local-gate.ps1`, mirroring §9. Reduces drift between §9 and what agents actually run. |

| B-03 | Add `lint` and/or `typecheck` package scripts | Optional. Do not invent these in the §9 gate before they exist in `package.json`. |

| B-04 | Dealer order and area CRUD | Currently seeded/browsable only. Deferred. |

| B-05 | `/deals/\[id]` detail route | Replace drawer-only deal flow with a full route while preserving board drag-and-drop. README currently lists this as a limitation. |

| B-06 | Global search expansion | Current top search routes to contacts only. Deferred. |

| B-07 | Persistent forecast scenarios | Current simulator is transparent and non-persistent. Deferred. |

| B-08 | Postgres cutover readiness | Make `lib/prisma.ts` swap-clean between SQLite and Postgres adapters; add a CI matrix for both. SQLite remains local-default unless the current prompt or config explicitly switches. |

| B-09 | External AI provider integration | Deterministic local summarizer/routing/analyst remains default. Deferred. |

| B-10 | Auth, permissions, multi-tenancy | Replaces README "no authentication" limitation. Significant scope; likely spans multiple sprints when promoted. |

| B-11 | CI mirror of local gate | CI may mirror §9 but never replaces it. The local PowerShell gate stays authoritative. |

| B-12 | Deployment configuration | No deployment target or hosting workflow is in current scope. Deferred. |



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

