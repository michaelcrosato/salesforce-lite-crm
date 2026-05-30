# Spec 036 — Accessibility: ARIA Roles for Tabs and Progress Bars

## Description & Expected Impact

Add proper ARIA attributes to interactive UI elements that currently lack
semantic roles. This improves screen reader support without changing visual
design.

**Impact 3 · Feasibility 5 · Risk Low · Fit 5 → Score 15**

## Scope-gate

- ARIA attributes only; no layout or style changes.

## Definition of Done

- [x] `components/detail-timeline-tabs.tsx` container has `role="tablist"` and
      each tab button has `role="tab"` + `aria-selected`.
- [x] `components/pacing-bar.tsx` progress bar has `role="progressbar"` +
      `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`.
- [x] `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`
      all pass.

## Implementation Approach

Small, targeted edits to two component files.

## Test Strategy

- Existing component tests and E2E tests remain green.
