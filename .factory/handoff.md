# Gentle Nudge repair handoff

## Outcome — PASS

Repair work order `payment-cadence-repair-2` repaired every release-blocking finding in independent verification commit `3745109d66fe8d4fd4a5a346d08f879a934b4a08`, which tested candidate `c3faf013295913237c4763414c48a154f7aeabea`.

Repair commit: `5e934739c96b39f0e07e0a52809cb568e765625f` (`fix: preserve license cache and mobile text reflow`). It is pushed to `origin/main` and deployed to the existing static Azure Static Web App at <https://payment-cadence.sociobot.in>.

## Repairs

- **390 px / 200% text reflow:** The mobile welcome flex item now has an explicit zero intrinsic minimum and a viewport-bounded maximum. Its editorial heading can wrap at enlarged text sizes. The prior reproduction widened the document to 530 px and centered the copy at x=-70; the repaired live reproduction is 390/390 px with welcome copy x=16, width=358, and the first-invoice action fully reachable after normal vertical scrolling.
- **Negative license cache:** License verdicts are now token-bound and timestamped for both `valid:true` and `valid:false` results. A cached result is respected for 24 hours, including when the stored license is invalid. Replacing a token clears only the prior verdict, so a new token can be checked. The Settings screen now retains a quiet inactive-license notice alongside Buy Plus and Restore purchase rather than relying on a transient toast.

## Regression coverage

`tests/e2e/app.spec.ts` adds:

- an invalid-verdict flow that asserts the persisted `{ token, valid:false, at }` record, one verification request across a reload, and the persistent replacement/purchase path;
- a 390×844 mobile test with `document.documentElement.style.fontSize = '200%'` across welcome, invoice dialog, Cadence, and Settings. It asserts no document overflow and that the key controls are horizontally reachable.

## Verification evidence

All work was run against the repaired tree, then the deployed artifact was checked again.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — clean install, 59 packages, 0 vulnerabilities |
| `npm test` | PASS — 8/8 Vitest; 19/19 applicable Playwright checks across desktop and 390 px mobile (one desktop skip for the mobile-only 200% reflow case) |
| `npx tsc --noEmit` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` produced; JS 33.68 KB raw / 11.46 KB gzip, CSS 18.26 KB raw / 4.94 KB gzip |
| Independent workflow suite | PASS — 36/36 checks; no console errors, page errors, or failed requests |
| `npm run verify:live` after deployment | PASS — 24/24 identity, headers, cache/MIME, checkout, desktop/mobile semantic/axe, keyboard, privacy/network, and offline checks |
| Live 390×844 at 200% text | PASS — scroll width/client width 390/390; welcome x=16/width=358; first action horizontally reachable; zero console errors |
| Live billing verification burst | PASS — 40 concurrent invalid requests: 30 HTTP 200, 10 HTTP 429; every 429 supplied `Retry-After` |

The checked-in independent script injects axe inline and is correctly blocked by the product's production CSP. Its source was not changed; a temporary `/tmp` copy used Playwright `bypassCSP:true` solely for its axe injection. That complete local run passed 36/36. The regular product Playwright suite also runs axe normally against the local preview.

PWA offline reload, service-worker update feedback, keyboard-only workflow, focus behavior, reduced motion, malformed-import recovery, exports, privacy/network boundaries, plus licensing, and the existing full reminder workflow all remain covered by these suites.

## Deploy

Built `dist/` was deployed directly with the configured static target:

```sh
swa deploy ./dist --swa-config-location ./public \
  --app-name sf-payment-cadence --resource-group sociobot --env production
```

The live verification script confirmed that the deployed files match the final local build.

## Run locally

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
QA_DIR="$PWD" node .factory/independent-qa.mjs
npm run verify:live
```

## Known gaps

- No real checkout was completed; checkout redirect, catalog registration, license restore, valid/invalid cache behavior, and response-rate limits were verified without charging a card.
- Lighthouse CLI could not complete in this container because the available Playwright Chromium closes during Lighthouse's BFCache cleanup (`Target closed`). The prior independent verification recorded live Lighthouse 13.4.1 scores of Performance 99, Accessibility 100, and Best Practices 100. The deployed repair only changes the mobile wrapping guard and licensing cache; current live identity, axe, performance budgets, and all browser checks pass.
