# Issue #24 verification

Date: 2026-08-24

## Scope

Issue #23 was revised before this qualification pass. The public v1 page does not require curated repository cards. The checked-in GitHub snapshot may retain repository data for future use, but the release contract covers the static contribution graph, rolling totals, freshness disclosure, and failure-safe behavior.

## Automated checks

- `npm test` passed 48 tests across 8 files.
- `ASTRO_TELEMETRY_DISABLED=1 npm run typecheck` reported zero errors, warnings, or hints.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build` built seven static pages successfully.
- `git diff --check` passed.

## Browser QA

The production preview was served locally at `http://127.0.0.1:4322/` and inspected directly.

- At 320px, 768px, and 1440px wide, the document width matched the viewport and no horizontal overflow appeared.
- The home page rendered four Projects in the approved order, one Writing, the GitHub activity graph, rolling totals, current snapshot disclosure, About / Trust, and contact actions.
- Projects and Writings tabs switched correctly and returned to Projects with the selected state preserved.
- The theme control switched between dark and light labels and rendered the expected theme state.
- Keyboard focus was visible on links with a 3px Steel Slate outline.
- The home page and all four Project Details, Writing detail, and unknown routes rendered one main region, a useful h1, and no invalid links.
- All rendered images completed successfully with non-empty alt text. Routes without approved media omitted the image region.
- Reduced-motion emulation matched `prefers-reduced-motion: reduce`; animation and transition durations resolved to `0.00001s`, with no overflow.
- No browser console errors or warnings were recorded.
- Rendered external destinations were limited to the approved GitHub, LinkedIn, live-site, résumé, and email links. No runtime `api.github.com` request was made by the static page.

## Lighthouse and Web Vitals

Lighthouse 13.4.1 ran against the local production preview for representative pages. Scores are lab evidence.

| Page | Performance | Accessibility | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 90 | 97 | 3.3 s | 0 | 0 ms |
| RascoFX Project Details | 99 | 100 | 2.0 s | 0 | 0 ms |
| Small Models Writing | 100 | 100 | 1.5 s | 0 | 0 ms |

All representative pages meet the agreed Lighthouse performance target of 90. Field Core Web Vitals are unavailable because this portfolio does not have representative production traffic.

## Limitations

- This pass used the local production preview. It did not publish a new deployment or claim anonymous access to a protected Vercel preview.
- The release evidence does not claim a field Web Vitals result.
