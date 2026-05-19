# Codex Bug Audit and Fix Pass

## Executive Summary

- Overall risk level: Low to medium after fixes. Baseline unit tests, build, and e2e were already passing, but the audit found data-integrity bugs in form validation, nullable field clearing, and opportunity stage-history recording.
- Main issues found: blank numeric form fields were coerced to `0`; account/contact edit forms could not clear nullable values; deal stage edits through the drawer/form and `crmClient.updateOpportunity` skipped `OpportunityStageHistory`.
- Main fixes applied: hardened integer validation, mapped cleared form fields to `null`, and recorded opportunity stage history for edit-form and adapter stage changes.
- Test/build/e2e status: passing. Final validation passed for `npm run test`, `npm run build`, and `npm run test:e2e`.

## Confirmed Issues Found

### Blank numeric fields saved as zero

- Severity: High
- File(s): `lib/validation.ts`
- Problem: `requiredInteger` used `z.coerce.number()`, so empty strings and whitespace parsed as `0`.
- Impact: Clearing required numeric fields such as account health score, deal value, probability, or dealer monthly quota could silently save zero instead of returning validation errors. Optional campaign budget also treated blank input as `0`.
- Verification: Direct Zod check showed `""` and `" "` parsed as `0`; added regression tests in `tests/api/validation.test.ts`.

### Nullable edit form fields could not be cleared

- Severity: Medium
- File(s): `app/accounts/actions.ts`, `app/contacts/actions.ts`
- Problem: Blank optional form values parsed as `undefined`, and Prisma update ignores `undefined`.
- Impact: Existing account `domain`, `industry`, `city`, and `region` values, plus contact `accountId`, `email`, `phone`, and `title`, stayed unchanged when a user selected the blank/no-value form option.
- Verification: Added action-level regression tests in `tests/api/formActions.test.ts`.

### Opportunity stage history missing for edit and adapter updates

- Severity: Medium
- File(s): `app/deals/actions.ts`, `lib/crm/crmClient.ts`
- Problem: `moveDealAction` recorded `OpportunityStageHistory`, but `updateDealAction` and `updateOpportunity` did not.
- Impact: Stage changes made through the deal edit form or the shared contract adapter were absent from the contract audit trail.
- Verification: Added regression tests in `tests/api/opportunityStageHistory.test.ts` for both paths.

## Fixes Applied

### Hardened integer validation

- File(s): `lib/validation.ts`, `tests/api/validation.test.ts`
- Change made: Added blank-string preprocessing for required integers and optional non-negative integers; preserved existing min/max validation.
- Reason: Required numeric fields should reject blank input instead of converting it to `0`; optional budget should remain absent when blank.
- Validation result: `npm run test` passed with 88 tests.

### Cleared nullable fields explicitly

- File(s): `app/accounts/actions.ts`, `app/contacts/actions.ts`, `tests/api/formActions.test.ts`
- Change made: Create/update actions now write `null` for nullable values when full forms submit blanks.
- Reason: Prisma treats `undefined` as omitted, but these full edit forms need blank controls to clear existing data.
- Validation result: New action tests passed; `npm run test:e2e` passed the main CRM smoke flow.

### Recorded stage history on all confirmed stage-change paths

- File(s): `app/deals/actions.ts`, `lib/crm/crmClient.ts`, `tests/api/opportunityStageHistory.test.ts`
- Change made: Added `OpportunityStageHistory` writes when `updateDealAction` or `updateOpportunity` changes a deal stage.
- Reason: `CRM-CONTRACT.md` defines stage history as the audit trail for opportunity stage changes.
- Validation result: New history tests passed; `npm run build` passed TypeScript.

## Remaining Issues

### Contract routes not implemented in the app router

- Severity: Medium
- File(s): `CRM-CONTRACT.md`, `lib/crm/registry.ts`, `lib/services/search.ts`, `lib/services/reports.ts`, `app/`
- Reason not fixed: `/tasks`, `/cases`, and `/campaigns` are contract routes and are returned by search/report helpers, but no app-router pages exist yet. The handoff explicitly assigns those UI pages and e2e coverage to Claude after the unblock commit, so adding pages here would be feature work rather than a safe bug fix.
- Recommended next step: Implement `/tasks`, `/cases`, and `/campaigns` pages against the existing service contracts and add e2e navigation coverage.

### Adapter null-clearing semantics are not defined

- Severity: Low to medium
- File(s): `lib/validation.ts`, `lib/crm/crmClient.ts`
- Reason not fixed: Full UI form actions now clear nullable fields correctly, but partial `crmClient` update adapters still do not define an explicit way to clear nullable fields through `null`. Changing every adapter schema would be a broader API contract decision.
- Recommended next step: Add null-clearing semantics to `CRM-CONTRACT.md`, then update adapter schemas and tests consistently.

## Missing Tests

- E2E coverage for `/tasks`, `/cases`, and `/campaigns` once the UI routes exist.
- Browser-level regression for clearing account/contact nullable fields through the visible forms.
- Contract-adapter tests for explicit null clearing after the API semantics are defined.
- E2E or integration coverage for search/report links that target task, case, and campaign routes.

## Final Validation

- `npm run test`: PASS initially with 82 tests; PASS after fixes with 88 tests.
- `npm run build`: PASS initially; one intermediate FAIL from a TypeScript narrowing issue in `crmClient.updateOpportunity`; PASS after fix; final PASS.
- `npm run test:e2e`: PASS initially; PASS after fixes with 1 Playwright smoke test.
- `git diff`: PASS, reviewed before report creation.
- `git status --short`: PASS, captured below.

## Git Status

```text
 M app/accounts/actions.ts
 M app/contacts/actions.ts
 M app/deals/actions.ts
 M lib/crm/crmClient.ts
 M lib/validation.ts
 M tests/api/opportunityStageHistory.test.ts
 M tests/api/validation.test.ts
?? REVIEW.CODEX.md
?? tests/api/formActions.test.ts
```
