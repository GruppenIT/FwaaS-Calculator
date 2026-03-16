# Deferred Items

Pre-existing TypeScript errors discovered during 01-03 execution. These are out of scope for this plan (they exist in unrelated components not touched by plan 01-03).

## Pre-existing TypeScript Errors (not caused by 01-03)

**data-table.tsx:99** — `exactOptionalPropertyTypes` error: `SortState | undefined` not assignable to `SortState`. Passing `sortState={sortState}` where `sortState` can be undefined.

**modal.tsx:40, modal.tsx:51** — `exactOptionalPropertyTypes` error: motion `transition` prop type mismatch (`ease: string` not assignable to `Easing | Easing[]`).

These should be fixed in a future plan that audits `data-table.tsx` and `modal.tsx`.
