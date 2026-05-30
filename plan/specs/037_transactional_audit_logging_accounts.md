# Spec 037 — Transactional Audit Logging for Accounts Actions

## Description & Expected Impact

Ensure data-integrity and audit compliance for Accounts by executing both the Account mutations (`create`/`update`) and their corresponding `recordAuditEvent` within a single Prisma transaction using `prisma.$transaction`. If either the Account write or the Audit Event write fails, the entire transaction must roll back, ensuring zero data-drift.

**Impact 4 · Feasibility 5 · Risk Low · Fit 5 → Score 16**

## Scope-gate

- Enforce transactional safety on Account creation and updates inside `app/accounts/actions.ts` using `prisma.$transaction`.
- Do not modify other action files or Zod schemas.

## Definition of Done

- [x] `createAccountAction` in `app/accounts/actions.ts` wraps the Account creation and its corresponding audit log write within a `prisma.$transaction` block.
- [x] `updateAccountAction` in `app/accounts/actions.ts` wraps the Account update (including fetching the existing record to detect status changes) and its corresponding audit log write within a `prisma.$transaction` block.
- [x] Direct call to global `recordAuditEvent` inside these actions is replaced by `tx.auditEvent.create` using `buildAuditEventCreateData(...)` inside the transaction.
- [x] Transaction rollback behavior is verified via targeted integration tests where a failure during the audit event write rolls back the Account creation/update.
- [x] `npm run agent:check` passes completely green.

## Implementation Approach

1. Import `buildAuditEventCreateData` in `app/accounts/actions.ts` from `@/lib/services/auditEvents`.
2. Inside `createAccountAction`, wrap `prisma.account.create` and the audit event write in `prisma.$transaction(async (tx) => { ... })`.
3. Replace `recordAuditEvent` with `tx.auditEvent.create({ data: buildAuditEventCreateData(...) })`.
4. Inside `updateAccountAction`, wrap `prisma.account.findUniqueOrThrow`, `prisma.account.update`, and `tx.auditEvent.create` in `prisma.$transaction(async (tx) => { ... })`.

## Test Strategy

- Add integration tests in `tests/api/accountsTransactionSafety.test.ts` to assert that:
  - Account creation successfully commits both the Account and AuditEvent records in normal path.
  - Account update successfully commits both records and registers status changes in normal path.
  - If the transaction fails during the Audit Event write, the Account record is rolled back and not persisted.
