# Spec 033 — Page Metadata for List & Form Routes

## Description & Expected Impact

Add static `metadata` exports to all list pages and form pages that currently
rely on the root layout default. The root layout uses a `template` of
`"%s | Salesforce Lite CRM"`, so each page just needs to export a `title`
string. This sets the correct browser tab title and improves internal
navigation clarity.

**Impact 3 · Feasibility 5 · Risk Low · Fit 5 → Score 15**

## Scope-gate

- Metadata only; no layout changes, no product features.
- Detail `[id]` pages that already export `generateMetadata` are excluded.

## Definition of Done

- [x] Every `app/<entity>/page.tsx` list page exports
      `export const metadata: Metadata = { title: "<Entity>" }`.
- [x] Every `app/<entity>/new/page.tsx` form page exports
      `export const metadata: Metadata = { title: "New <Entity>" }`.
- [x] Remaining pages (`dashboard`, `forecast`, `knowledge`, `search`,
      `command-palette`, `activities`) also export metadata.
- [x] `npm run lint` · `npm run typecheck` · `npm run build` pass.

## Implementation Approach

Mechanical: add a 2-line `export const metadata` block near the top of each
file, after imports.

## Test Strategy

- Build-time verification only; metadata is validated by the Next.js compiler.
