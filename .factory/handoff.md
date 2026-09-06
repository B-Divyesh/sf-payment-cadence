# Repair 4 handoff

## Outcome

**PASS.** The five Verification 5 findings and all six incomplete claim groups are repaired and deployed at <https://payment-cadence.sociobot.in>.

Production implementation SHA: `aaa6ec8a86b3ffeff6f942d045b090d23d1a92a9` (including implementation commit `b3df5ff`). This handoff is a later documentation-only change; the deployed product image remains the implementation SHA above.

## What changed

- Replaced the catch-all host fallback with explicit workspace rewrites. Unknown paths now serve the designed page with HTTP 404, while every documented deep link returns HTTP 200.
- Made same-document fragment navigation focus its target. Enter on **Skip to main content** now focuses `<main id="main">`.
- Set `/demo` to **Demo — Gentle Nudge**, including direct loads and demo navigation.
- Stopped the desktop headline from splitting ordinary words and added a browser range check for **reminders**.
- Expanded claim outcomes to prove the exact three-invoice sample, three editable free steps, complete encoded email-draft payload, persisted history/paid/pause-note state, complete IndexedDB deletion, and a tested Plus boundary of 25 active invoices plus five steps.
- Replaced the unbounded public invoice wording with the tested statement **at least 25 active invoices**. The paid behavior remains available and no application cap was added.
- Added a deployment-style local preview server so browser tests observe known-route 200s and unknown-route 404s before release.
- Bumped the app and service-worker cache version to 1.1.1.

## Verification

Run from a clean dependency install:

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
QA_DIR="$PWD" node .factory/independent-qa.mjs
```

Results:

- `npm test`: 8 Vitest tests and 44 Playwright checks passed; 2 expected project-specific checks skipped.
- All 18 commands in `.factory/claims.json` passed when run separately.
- TypeScript passed; audit found 0 vulnerabilities; `dist/` was produced.
- `npm run verify:live`: 30/30 passed, including HTTP 404, skip focus, demo title, headline wrapping, offline reload, metadata, billing offer, and build identity.
- Independent QA: 22/22 passed with no console, page, or failed-request errors.
- Factory URL check: HTTP 200, 573 ms network-idle load, one `<h1>`, one `<main>`, `lang="en"`, complete alt text, labeled buttons, and no console errors.
- Playwright axe found 0 serious or critical issues on demo and legal routes. The standalone axe CLI could not start because its downloaded ChromeDriver 152 did not match the pinned Chromium 145; the allowed Playwright axe path passed.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100; FCP 1.0 s, LCP 1.3 s, TBT 90 ms, CLS 0, 81 KiB transferred.
- Build sizes: JavaScript 40,596 bytes raw / 13.37 kB gzip; CSS 21,921 bytes raw / 5.69 kB gzip; font 18,096 bytes; mobile AVIF 8,789 bytes.
- All 24 public files match the deployed product byte for byte.

Fresh 1440×900 and 390×844 live browsers showed the job, audience, and sample action before scrolling. Both entered the three-invoice demo, showed the persistent sample label, reset demo-only changes, and returned to an untouched real workspace. The current screenshots, Lighthouse JSON, URL report, and live verification report are in `/work/.evidence/payment-cadence-repair-4/`.

## Billing and evidence

The production catalog still lists Gentle Nudge Plus at US $18 once. The product checkout returns the hosted Sociobot/Dodo redirect; no purchase or charge was made. Public offer metadata is in `.factory/billing-offer.json` and copied to `/work/.evidence/billing-offer.json`.

The verb-first catalog description is 47 characters and copied to `/work/.evidence/catalog-description.txt`.

## Known gaps

No product defect is known. A real paid transaction was not performed; checkout, catalog metadata, license verification behavior, and the controlled valid-license path were verified without charging a card.
