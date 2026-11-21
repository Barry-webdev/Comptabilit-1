# Performance optimization — GSAB frontend

Branch: `perf-optimization` (base tagged `perf-base`)
Diff: `git diff perf-base..perf-optimization`

## 5 optimizations implemented

### 1. Keep-alive for Render (high priority)
- New `components/providers/KeepAliveProvider.tsx`: `'use client'` provider that pings
  `GET /api/health` immediately on mount then every 14 minutes (before Render's 15-min
  free-tier sleep) via `setInterval`. Errors are ignored (a waking server answers the next ping).
- Added `healthApi.ping()` to `lib/api.ts` (no-auth fetch, ignores errors) so the URL stays centralized.
- Mounted in `app/(protected)/layout.tsx`, wrapping the authenticated shell (only runs when logged in).

### 2. Cache for static data (high priority)
- `hooks/useClasses.ts`, `hooks/useAnneesScolaires.ts`, `hooks/useFrais.ts` now use a
  module-level cache (variable outside the hook) with a 5-minute `staleTime`.
- On mount: if the cache is fresh, the hook returns the cached data immediately (no refetch,
  no loading flash). `refetch()` forces a fresh fetch and updates the cache.
- `useFrais` cache is keyed by `anneeId` so different school years don't collide.

### 3. Dashboard optimization (medium priority)
- `app/(protected)/dashboard/page.tsx` KPIs now read directly from `useDashboardStats`
  (single aggregated API call): `encaissementsJour`, `nbPaiementsJour`,
  `encaissementsMois`, `depensesMois`, `soldeNet`, `totalEleves`.
- Removed the local recalculation of those KPIs (and the now-dead `isSameDay` helper).
  KPIs now render the real value as soon as the single `useDashboardStats` call resolves,
  instead of waiting for / showing 0 until all detail hooks load.
- The "vs mois dernier" variations are still computed from the data already fetched for the
  graphs and journal, so they add no extra API calls.
- The detail hooks (`usePaiements`, `useRecettes`, `useDepenses`, `useClasses`, `useFrais`,
  `useEleves`, `useAnneesScolaires`) are retained because the dashboard's existing rich
  features (6-month graph, per-class recovery graph, late-payment alerts, upcoming
  deadlines, operations journal) need that data; removing them would break those features,
  which the task constraints forbid. Combined with #2, repeated navigation to the dashboard
  skips refetching classes/years/fees when the cache is warm.

### 4. Loading skeletons (medium priority)
- New `components/ui/Skeleton.tsx`: generic skeleton with `animate-pulse`.
- `dashboard/page.tsx`: shows 4 KPI skeletons (`KpiCardSkeleton`) while `useDashboardStats` loads.
- `eleves/page.tsx`: full table skeleton (header + filters + rows) instead of a spinner.
- `paiements/page.tsx`: full table skeleton instead of a spinner.

### 5. Route prefetch (low priority)
- Verified `components/layout/Sidebar.tsx`: the `<Link>` entries do **not** set
  `prefetch={false}`, so Next.js 16 App Router default (`prefetch` = `null`/`'auto'`)
  applies — prefetching is enabled. No change required.

## Verification

```
npx tsc --noEmit   # from frontend/
```

Result: **0 errors** (exit code 0).
