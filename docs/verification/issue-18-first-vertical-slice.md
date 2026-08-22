# Issue #18 verification: first vertical slice

Verified on August 22, 2026.

## Deployment

- Vercel project: `nmasters52s-projects/dev-portfolio`
- Preview deployment: `dpl_DgCBak8UWXKds8wzWZuTPGRrFSCW`
- Preview URL: `https://dev-portfolio-puauc1h20-nmasters52s-projects.vercel.app`
- Vercel reported the deployment as `READY`.
- The preview requires Vercel Deployment Protection. Authenticated `vercel curl` requests returned HTTP 200 for `/`, `/projects/disc-golf-labs/`, `/writings/small-models-strong-guardrails/`, and `/favicon.svg`.
- The Project and Writing HTML downloaded from the preview matched the locally tested production build byte for byte. Vercel adds its preview-toolbar script to the homepage HTML, so the homepage files are not byte-identical.
- The project production alias is `https://dev-portfolio-weld-nine.vercel.app`. The previously configured `https://dev-portfolio.vercel.app` belongs to an unrelated site, so this change corrects Astro's `site` value without promoting the preview to production.

The browser-tested build has no runtime content or GitHub dependency. Content is present in the generated HTML, and GitHub appears only as an external destination link.

## Automated verification

| Check | Result |
| --- | --- |
| `npm test` | Passed, 24 tests across 3 files |
| `ASTRO_TELEMETRY_DISABLED=1 npm run typecheck` | Passed, 0 errors, warnings, or hints |
| `ASTRO_TELEMETRY_DISABLED=1 npm run build` | Passed, 4 static pages generated |
| `git diff --check` | Passed |

The tests cover canonical content, ordering, Writing-authored relationship inversion, Connected Work tab behavior and scroll restoration, both detail routes, optional image and Live Site omission, unknown routes, and internal and external destinations. A new built-route assertion verifies that the favicon is declared and emitted.

## Agent-observed browser QA

These checks used the exact production build uploaded to the protected preview. The preview route and artifact checks above establish the deployment boundary. They do not turn local browser observations into direct interactive preview observations.

| Width | Layout and readability | Overflow | Navigation and keyboard | Focus |
| --- | --- | --- | --- | --- |
| 320px | Homepage, Project Details, and Writing detail reflowed to the viewport. Cards, metadata, prose, code, and links remained readable. | No horizontal document overflow on any route. No broken images. | Projects opened first. Arrow keys changed the selected tab and moved focus. Home, End, internal detail, relationship, and return destinations are covered by the behavior and route tests. | The selected tab showed a 3px solid Steel Slate outline with a visible inset selected-state rule. Link focus uses the same 3px outline. |
| 768px | The three routes retained the intended hierarchy. Detail prose measured 720px and remained within the viewport. | No horizontal document overflow on any route. No broken images. | Connected Work and all detail destinations remained present and operable. | The same visible focus treatment remained active. |
| 1440px | The homepage used the wider composition while both detail routes kept a 720px reading column. | No horizontal document overflow on any route. No broken images. | Connected Work and all detail destinations remained present and operable. | The same visible focus treatment remained active. |

Additional browser checks:

- Light mode resolved `--paper` to `#f4f1ea` and `--ink` to `#182027`.
- Dark mode resolved `--paper` to `#13181c` and `--ink` to `#eef1f2`.
- With reduced motion enabled, animation and transition durations resolved to `0.00001s`.
- Missing Project and Writing images omitted their regions without leaving empty containers.
- Disc Golf Labs omitted its unsupported Live Site action while preserving the Source Code destination.
- Browser console inspection after the favicon fix returned no warnings or errors.

## Lighthouse and measurable web vitals

Lighthouse ran against the local production server after the final build. Scores are lab evidence, not field data.

| Route | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 99 | 100 | 100 | 100 | 1.2s | 1.8s | 0 | 0ms |
| `/projects/disc-golf-labs/` | 100 | 100 | 100 | 100 | 0.8s | 0.9s | 0 | 0ms |
| `/writings/small-models-strong-guardrails/` | 100 | 100 | 100 | 100 | 0.8s | 0.9s | 0 | 0ms |

All routes meet the agreed Lighthouse performance target of 90. Lighthouse initially reported a missing `/favicon.ico` request as a console error. The explicit `/favicon.svg` declaration and emitted asset removed that failure.

## Failures, limitations, and exclusions

- Direct interactive browser QA against the unique preview URL remains unverified because Deployment Protection redirects unauthenticated browsers to Vercel login. Authenticated requests prove the preview routes and favicon serve successfully. Project and Writing artifact hashes prove those preview pages match the browser-tested production build; the homepage differs only by Vercel's preview-toolbar injection.
- Field Core Web Vitals are unavailable because this new preview has no representative traffic. Lighthouse lab metrics are recorded above.
- External destinations were verified from rendered `href` values. This pass did not claim control of the destination repositories or their availability.
- No manual theme toggle exists in this slice. System light and dark behavior were verified.
- Human subjective review beyond the agent-observed browser pass is unverified.
- GitHub activity, remaining launch records, final polish, and production promotion were not changed or verified in this slice.
