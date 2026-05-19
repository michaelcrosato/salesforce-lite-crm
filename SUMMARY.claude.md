Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — action error-handling parity + dashboard description
Branch: claude/autonomy
Status: active
Commits this prompt: 45a5398 — [claude] S4-F2: broaden dashboard description to cover analyst and dealer ops surfaces; aed2ea2 — [claude] S4-F2: add Prisma error handling to account create/update actions; b382f36 — [claude] S4-F2: add Prisma error handling to deal create/update/move actions; 8be5bd7 — [claude] S4-F2: add Prisma error handling to lead create/status actions
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T07:16:30-08:00

### Completed this prompt

- `/dashboard` `PageHeader` description previously read "A live view
  of accounts, contacts, pipeline, and sales follow-up." which
  undersold the page (it shows Analyst Panel + Dealer Ops + Today's
  Focus in addition to the basic CRUD KPIs). Broadened to "Pipeline
  health, dealer routing, deterministic analyst actions, and today's
  focus." This mirrors the actual visible cards/section titles on the
  page (Analyst Panel, Dealer Ops Focus, Today's Focus, Pipeline by
  Stage chart) and uses noun-phrase form consistent with peer list
  pages.
- Added `Prisma.PrismaClientKnownRequestError` try/catch wrapping to
  the three server-action files that lacked it, matching the
  established pattern already present in `app/contacts/actions.ts`,
  `app/tasks/actions.ts`, `app/cases/actions.ts`, and
  `app/campaigns/actions.ts`:
  - `app/accounts/actions.ts` — `createAccountAction`,
    `updateAccountAction`
  - `app/deals/actions.ts` — `createDealAction`, `updateDealAction`,
    `moveDealAction` (the `$transaction` block is wrapped)
  - `app/leads/actions.ts` — `createLeadAction` (lead.create call;
    `routeLead` continues to run after, see note), `updateLeadStatusAction`
- Each file gained a local `prismaErrorMessage(error: unknown)`
  helper that maps `P2002` unique-constraint failures to "A record
  with that unique value already exists." and falls back to an
  entity-specific generic ("The account/deal/lead could not be
  saved.") for any other Prisma error. This mirrors the contacts
  pattern exactly except for the entity-name suffix in the generic
  message.
- Happy-path behavior is unchanged: each action still returns
  `{ ok: true, message }` on success and runs the existing
  `revalidatePath()` calls. Only the previously-uncaught Prisma
  error path now resolves to an `ActionResult` instead of an
  unhandled exception bubble; this matches what the form components
  already expect (since they handle `ok: false` toasts for the four
  entities that already had error handling).
- Note on `createLeadAction`: I kept `routeLead` outside the try/catch
  so that routing failures continue to fall through to the existing
  `Lead created but not routed: <reason>` branch rather than being
  remapped to a generic save-failure message. The original code's
  semantics for routing-step errors are preserved.

### Verification

- `npm run build` → SUCCESS (32 routes; no new dependencies, no
  TypeScript regressions; `Prisma` namespace import resolves
  cleanly).
- `npm run test`  → 162 passed / 162 total (Vitest, 25 files). No
  test consumed the previously-uncaught error path, so adding the
  catch does not change any existing test assertion.
- `git status --short` clean before each implementation commit
  aside from the carry-forward `tsconfig.tsbuildinfo` artifact.

### S4-F2 cumulative progress on `claude/autonomy`

Implementation commits on this branch since `cc00d6c` (20 total
including this prompt):

| SHA | Subject |
|---|---|
| `e0f138c` | refresh root metadata description to match README framing |
| `468fb4a` | specify report empty-state titles per report |
| `ca0f472` | align /deals/new description with page Deal terminology |
| `2b7f8da` | reframe orders/areas empty-state copy as deferred not demo |
| `07a19cb` | add loading skeletons for account/contact/report detail pages |
| `642ed78` | drop stakeholders term from /contacts description |
| `0fba7d3` | add custom 404 page with dashboard and accounts links |
| `0a33253` | add Apply button to /accounts filter form |
| `bd6468a` | clarify forecast formula with grouping and unicode operators |
| `a93f85a` | broaden /leads/[id] description to cover full page surface |
| `2098a38` | add title template to root metadata |
| `dba0fce` | add per-page metadata titles for distinct browser tabs |
| `0632bfd` | dynamic generateMetadata titles for detail pages |
| `63d9ff9` | add metadata titles for entity creation pages |
| `c175bbe` | add metadata titles for excluded route placeholders |
| `45a5398` | broaden dashboard description |
| `aed2ea2` | Prisma error handling on account actions |
| `b382f36` | Prisma error handling on deal actions |
| `8be5bd7` | Prisma error handling on lead actions |

Nine categories of polish:
1. metadata + product framing alignment
2. copy precision on form/empty/header surfaces
3. perceived-perf parity (loading skeletons)
4. graceful 404 boundary
5. interactive filter parity
6. internal documentation clarity
7. complete browser tab title coverage
8. **NEW** server-action error-handling parity across all entities
9. plus prior testid/header/case work from earlier prompts.

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued`; the local gate
has been green for every commit. The visual QA sweep is materially
complete for the Claude-owned surface and now extends into
server-action reliability parity. The next sprint rollover prompt
should consider promoting S4-F2 to `done`.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
that gate un-skipping `e2e/demo-path.spec.ts`. Those live in Grok's
zone; no action from Claude this prompt.

### Next action

S4-F2 is materially complete on the Claude-owned surface across
both visual coherence (metadata, copy, skeletons, 404, filter Apply
button) and code-quality parity (server-action error handling).
Best next move: re-read other agents' SUMMARY/BLOCKERS for any new
S4-F2 ask before continuing to micro-polish.

### Scope confirmation

No cross-ownership edits: YES (all four edited files live in
`app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — server actions still return the same
`ActionResult` shape on every code path; the catch block adds
graceful error mapping for paths that previously bubbled
uncaught).
