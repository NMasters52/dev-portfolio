# Typography font feasibility: Necto Mono + Geist Sans

## Recommendation

**Use both and self-host the official WOFF2 files. There is no licensing or Astro/Vercel blocker.** Use Necto Mono Regular selectively for headings, navigation, labels, dates, and technical metadata; use the Geist Sans variable font for body copy and any text that needs weight hierarchy. The important design constraint is that Necto Mono is a one-style family, so faux bold/italic should be disabled rather than relied upon.

## Findings

| Question | Necto Mono | Geist Sans |
| --- | --- | --- |
| Official source | The designer/foundry page has a direct download and identifies Marco Condello as designer. | Vercel offers a ZIP download and the official `vercel/geist-font` repository; an npm package also exists. |
| License | SIL Open Font License 1.1. | SIL Open Font License 1.1. |
| Web use / self-hosting | Allowed. | Allowed. |
| Styles and weights | **One family, one style: Regular.** It is not variable. | **Nine weights**; official downloads include variable fonts as well as static files. |
| Formats | The official distributed package contains desktop and webfont files; use its supplied WOFF2 rather than converting the OTF. | Vercel explicitly offers OTF, WOFF2, and variable font files. |
| Character scope | Latin, including an extensive accented-Latin set shown in the official specimen. | Vercel reports 652 glyphs and 32 languages in the current family. |
| Attribution | No visible site credit is required merely to use the font. Keep the original license/copyright material with redistributed font files. | Same. |

Sources: [Collletttivo’s official Necto Mono specimen and download](https://www.collletttivo.it/typefaces/necto-mono), [Vercel’s official Geist font page](https://vercel.com/font), and [Vercel’s official Geist source repository](https://github.com/vercel/geist-font).

## Licensing details

Both official publishers state that their font is under the **SIL Open Font License 1.1**. The official OFL guidance explicitly permits loading OFL fonts through `@font-face`, including from the same server as the site. It also says acknowledgement is not required for ordinary use. If the font files are redistributed, retain their copyright and licensing information; the low-friction practice for this repository is to commit the upstream OFL/copyright text next to (or otherwise clearly associated with) the font assets. No footer attribution is necessary. Avoid modifying or converting either font unless the implementation also reviews the OFL's modification and Reserved Font Name rules. ([Official OFL webfont guidance](https://openfontlicense.org/how-to-use-ofl-fonts), [official OFL FAQ](https://openfontlicense.org/ofl-faq/), [official OFL text](https://openfontlicense.org/open-font-license-official-text/))

## Astro and Vercel implementation

Astro supports local WOFF2 sources directly. Its font pipeline can emit preload links and optimized fallbacks, copies built fonts to `_astro/fonts`, and gives those static assets long-lived caching. Vercel automatically caches static assets, including fonts, on its CDN. Therefore neither font needs a third-party runtime request, special server function, Vercel integration, or paid service. ([Astro custom-font guide](https://v6.docs.astro.build/en/guides/fonts/), [Vercel static-asset caching](https://vercel.com/docs/caching/cdn-cache))

Suggested implementation guardrails:

- Download both families only from their official publisher/source repository and commit the exact WOFF2 files plus their OFL material.
- Configure Necto Mono as `font-weight: 400; font-style: normal` and set `font-synthesis: none` wherever it is used. Its single cut makes it a display/metadata voice, not a flexible text family.
- Configure Geist Sans from its variable WOFF2 for the weight range actually used. One variable asset is simpler than shipping many static weights; choose static subsets only if measurement later proves them smaller for the final weight set.
- Use `font-display: swap` (or Astro's corresponding optimized default), preload only the above-the-fold faces, and retain system fallbacks to limit layout shift.
- Use WOFF2 in production; the supplied OTF files are useful for desktop design work but are unnecessary page weight.

## Risks and blockers

There are **no blockers**. The only material limitation is typographic: Necto Mono has Regular only, with no real bold or italic. If later designs require multiple weights in the mono/display role, either create hierarchy with size, case, spacing, and color or revisit the display family; do not synthesize styles.
