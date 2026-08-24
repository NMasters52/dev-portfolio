# Issue #23 verification

Date: 2026-08-24

## Automated checks

- `npm test` — 48 tests passed. Vitest file parallelism is disabled because the existing Astro build tests share `.astro` prerender output.
- `ASTRO_TELEMETRY_DISABLED=1 npm run typecheck` — zero errors, warnings, or hints.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build` — seven static routes built successfully.
- `git diff --check` — clean.
- `npm run github:snapshot` was run with the authenticated local GitHub session to create the checked-in artifact. The artifact contains a 365-day calendar, rolling 90-day totals, and four curated repository records.

## Generator evidence

`src/lib/github-snapshot.test.ts` covers successful normalization, incomplete and malformed contribution data, malformed REST records, rate limiting without retry, transient retry, timeout, partial failure, atomic writes, retained artifacts, and no-op writes when only `generatedAt` changes.

## Browser QA

The local static preview was opened at `http://127.0.0.1:4322/`. The rendered page was checked directly for the activity region, current freshness disclosure, accessible calendar label, daily-values disclosure, four repository cards, and absence of bearer text or a client `api.github.com` path. The page rendered without a runtime GitHub request.

The reduced-motion rule and responsive breakpoints are present in `src/styles/global.css`. A dedicated browser viewport override was unavailable in the local browser session, so narrow-width visual QA remains an explicit follow-up rather than a claim of completion.
