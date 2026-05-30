# Spec 034 — Loading Skeletons for Missing Routes

## Description & Expected Impact

Add `loading.tsx` files to the 13 routes that currently lack them. These
loading states improve perceived performance during server-side rendering and
prevent blank flashes on slow connections. Form pages (`/new`, `/edit`) get
minimal skeleton loaders; detail pages get content-area skeletons.

**Impact 3 · Feasibility 5 · Risk Low · Fit 5 → Score 15**

## Scope-gate

- Loading UI only; no data fetching, no product features.
- Reuses existing skeleton component patterns from `components/ui/skeleton.tsx`.

## Definition of Done

- [x] Every route with `page.tsx` also has `loading.tsx`.
- [x] `npm run lint` · `npm run typecheck` · `npm run build` pass.

## Implementation Approach

1. Create a `FormLoadingSkeleton` component in existing UI primitives for
   form pages (card with 4–6 skeleton lines).
2. Each `loading.tsx` exports a default function returning the appropriate
   skeleton layout.

## Test Strategy

- Build verification: `npm run build` confirms every loading.tsx compiles.
- Existing E2E tests remain green.
