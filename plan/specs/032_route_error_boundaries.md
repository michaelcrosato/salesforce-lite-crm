# Spec 032 — Route Error Boundaries

## Description & Expected Impact

Add `error.tsx` boundary files to all CRM entity routes so that a server-side
render failure (e.g. a bad Prisma query, a missing relation, a thrown
`notFound()` in a sub-component) is caught and presented per-route instead of
cascading to the root error boundary and wiping the entire shell. This is a
standard Next.js App Router resilience pattern.

**Impact 4 · Feasibility 5 · Risk Low · Fit 5 → Score 16**

## Scope-gate

- Routes only; no product features, no auth, no deployment.
- Each `error.tsx` is a `"use client"` component; identical structure to the
  existing `app/error.tsx` but scoped to its route segment.

## Definition of Done

- [x] Every `app/<entity>/` directory that contains `page.tsx` also has an
      `error.tsx` client component.
- [x] The error boundary renders the entity name, an error digest (when
      available), a Reset button, and a Reload button.
- [x] `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`
      all pass.

## Implementation Approach

1. Create a shared `components/route-error-boundary.tsx` client component that
   accepts an `entityLabel` prop and re-exports the standard
   `{ error, reset }` signature.
2. In each `app/<entity>/error.tsx`, re-export the shared component with the
   appropriate label.

## Test Strategy

- Build verification: `npm run build` confirms every error.tsx compiles.
- Existing E2E tests remain green (error boundaries are invisible on happy path).
