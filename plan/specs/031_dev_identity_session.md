# 031 — Developer Identity Session Switcher & Multi-user Mock Harness

- **Wave:** Wave 7 — Identity & Authorization Foundations
- **Status:** [x] Done
- **Scores:** Impact 5/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** —
- **Scope gate:** Design a lightweight developer identity session switcher component and API (`getCurrentUser`, `getCurrentUserId`, `getCurrentSession`) to mock multi-user roles/permissions safely in the local SQLite DB without external OAuth dependencies. Use a `dev_user_id` cookie to manage the active mock user. Default to Ava Patel (`user-ava`) if no cookie is set. Add a visual developer session switcher widget at the bottom of the desktop navigation sidebar to allow seamless runtime role/user hot-swapping.
- **Related:** `lib/session.ts`, `components/session-switcher.tsx`, `components/app-shell.tsx`, `app/reports/actions.ts`

## Description & Expected Impact
To support authorization (RBAC) and record ownership in subsequent waves without pulling in heavy external OAuth dependencies, we require a lightweight, robust developer identity harness. This harness will leverage a simple browser cookie (`dev_user_id`) to mock the active user context across all Next.js Server Components, Server Actions, and Route Handlers. 

By default, if the cookie is not present, we will fallback to the seeded user "Ava Patel" (`user-ava`) to ensure the application remains fully functional and backward-compatible without forcing initial login. A clean visual session switcher widget at the bottom of the sidebar will allow operators and developers to instantly switch between the three seeded users (Ava Patel [sales], Marcus Chen [sales], and Elena Ramirez [manager]) in real-time, instantly shifting their role context.

Expected Impact:
- Foundation for secure, role-based access control (RBAC), multi-user record filtering, and ownership.
- Zero-friction developer ergonomics for hot-swapping roles and testing user-specific flows.
- 100% backward compatible, requiring zero external services or configurations.

## Definition of Done & Acceptance Criteria
- [x] Implement `lib/session.ts` containing `getCurrentUserId()`, `getCurrentUser()`, and a helper `setCurrentUserId(userId)` / `clearCurrentUserId()`.
- [x] Support falling back to `user-ava` when no cookie is set.
- [x] Create a visual component `components/session-switcher.tsx` rendering the active mock user's name, email, and role, plus a dropdown or trigger list to switch context.
- [x] Embed the `SessionSwitcher` component at the bottom of the desktop sidebar in `components/app-shell.tsx`.
- [x] Integrate a Server Action in `lib/session.ts` to set/delete the `dev_user_id` cookie and trigger `revalidatePath("/")` for instantaneous updates.
- [x] Replace hardcoded `"user-ava"` actor user IDs in `app/reports/actions.ts` and campaign members operations with the dynamically resolved current user ID.
- [x] Create unit tests in `tests/session.test.ts` validating setting, getting, and falling back of mock session users.
- [x] Ensure that `npm run agent:check` passes completely green.

## Implementation Approach
1. **Create `lib/session.ts`**:
   - Use `cookies` from `next/headers` to read/write `dev_user_id`.
   - Provide an in-memory test override so Vitest tests (which lack the Next.js header runtime context) can mock the current active user ID cleanly.
   - Define a fallback default ID (`user-ava`).
   - Define `setCurrentUserAction` as a server action to set the cookie and revalidate.
2. **Create `components/session-switcher.tsx`**:
   - Fetch the current user on the server (or pass it down) and render details.
   - Use a simple client form or Server Action wrapper to handle user selection.
3. **Modify `components/app-shell.tsx`**:
   - Import and render `SessionSwitcher` at the bottom of the sidebar section.
4. **Refactor existing mock actor IDs**:
   - Update `app/reports/actions.ts` constants to dynamically resolve via `getCurrentUserId()`.
5. **Add tests**:
   - Implement `tests/session.test.ts` to assert all session behaviors and test mock overrides.

## Test Strategy
- **Unit Tests**: Implement `tests/session.test.ts` checking fallback, custom mock IDs, and DB user resolution.
- **Verification Gate**: Run `npm run agent:check` to verify no compilation/linting/test regressions.
