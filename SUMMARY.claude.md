Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — contact status label parity on account detail
Branch: claude/autonomy
Status: active
Commits this prompt: 18b15c0 — [claude] S4-F2: render Contact status with CONTACT_STATUS_LABELS on account detail
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T07:50:00-08:00

### Completed this prompt

- `/accounts/[id]/page.tsx` Related Contacts sub-table rendered the
  raw lowercase `contact.status` ("active" / "inactive") in the
  Status column Badge, while every other status surface in the app
  renders through its labels map for proper capitalization. The
  Contact entity already has `CONTACT_STATUS_LABELS` exported from
  `@/lib/crm-constants` ("Active" / "Inactive"), used correctly by
  `/contacts/[id]/page.tsx` Contact Summary card.
- Fixed by importing `CONTACT_STATUS_LABELS` and `type ContactStatus`
  in `/accounts/[id]/page.tsx` and rendering
  `CONTACT_STATUS_LABELS[contact.status as ContactStatus] ?? contact.status`
  in the Related Contacts table Badge. Fallback to raw value
  preserves graceful behavior if Prisma ever returns an
  out-of-enum string (defensive).
- This brings the Account detail's Contact-status display into
  parity with all other entity-status surfaces in `app/**`
  (verified: `LEAD_STATUS_LABELS` on /leads + /leads/[id],
  `DEALER_ORDER_STATUS_LABELS` on /orders + /orders/[id],
  `STAGE_LABELS` on /accounts/[id] Related Deals + /contacts/[id]
  Related Deals + /deals, `ACTIVITY_TYPE_LABELS` on /activities).

### Verification

- `npm run build` → SUCCESS (32 routes).
- `npm run test`  → 162 passed / 162 total (Vitest, 25 files).
- `git status --short` clean before the implementation commit
  aside from the carry-forward `tsconfig.tsbuildinfo` artifact.

### S4-F2 cumulative progress on `claude/autonomy`

Latest implementation commit:
- `18b15c0` Contact status label parity on account detail

Total Claude-zone S4-F2 implementation commits on this branch: 31
across 14 LOOP iterations.

Eleven categories of polish stable; this commit fits category #2
(copy / label precision).

### Reconciliation note

`origin/main` is 12 commits ahead of this branch's base with merges
from `gemini/autonomy` and `grok/autonomy`. Trial merge produced a
conflict on `app/layout.tsx` (competing description updates).
Merge is operator scope per `prompts/shared/MERGE.md`.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
that gate un-skipping `e2e/demo-path.spec.ts`. Those live in Grok's
zone; no action from Claude this prompt.

### Next action

Iterate further if more high-value Claude-zone polish surfaces, or
stand by for SPRINT-ROLLOVER prompt to promote S4-F2 to `done`.

### Scope confirmation

No cross-ownership edits: YES (single file edited in `app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — uses already-exported status labels from
`@/lib/crm-constants`).
