# Independent verification 2 — FAIL

Verified on 28 August 2026 against candidate `c3faf013295913237c4763414c48a154f7aeabea` and <https://payment-cadence.sociobot.in>.

The candidate and its live deployment pass the product, accessibility, privacy, PWA, build, and deployment-identity checks. The previous checkout, import-validation, startup, touch-target, and response-policy defects are repaired. The release still fails the explicit acceptance contract because the production license-verification endpoint did not rate-limit a large rapid burst.

## Defects

### P1 — Production license verification has no observable rate limit

- Endpoint: `GET https://api.sociobot.in/api/v1/products/payment-cadence/verify?license=<invalid-token>`.
- A sequential burst sent 250 requests in 2.769 seconds: all 250 returned HTTP 200.
- A separate concurrent burst sent 300 requests in 2.229 seconds: all 300 returned HTTP 200.
- Across 550 rapid requests, the first HTTP 429 threshold was **not reached**. No response included `Retry-After` or any `X-RateLimit-*` header.
- A normal invalid-token response was otherwise correct: HTTP 200, `cache-control: no-store`, production-origin CORS, and `{ "valid": false, "reason": "invalid", "expires_at": null }`.
- Impact: the public token-verification surface lacks the required observable abuse control, increasing brute-force and service-exhaustion exposure. The work order explicitly requires a burst to produce 429 plus `Retry-After`, so this is release-blocking even though the static application remains usable.
- Required repair: enforce a bounded per-client/IP limit on the shared Sociobot verification route, return 429 with a meaningful `Retry-After`, and rerun this audit. This fix belongs to the billing API, not this static bundle.

No other product defects were found.

## Candidate and live identity

- Checkout was clean before installation and exactly at `c3faf013295913237c4763414c48a154f7aeabea`; `origin/main` and the remote `main` ref matched before this report.
- A fresh `npm run build` produced 18 public files. All 18, excluding the host-only `staticwebapp.config.json`, returned HTTP 200 live and were byte-identical to `dist/`.
- Representative SHA-256 matches:
  - `index.html`: `72d38b778a9e5846b2ac883377c4ea544a0d40b275f252c17d6f0b5bdda8debd`
  - `sw.js`: `e1d5a8f91789c0bc891d5ec44b5720609bb82021367735f5a430e3b364702ef9`
  - `manifest.webmanifest`: `2599d765ee9f132a2433d011a68240b6b85b28282244d4cad8c2bf8d5704bd11`
  - `main-D-49JtDb.js`: `fc9ef15173057cd05dd7c16362444ca771413e62c4c643366c4cc45b92427664`
  - `main-BIC4ydJ6.css`: `5788d17ed1dbbf6c560f057f272cd335c69bab8ab087e47ceb8dbfef3dbce492`
- HTTPS root returned 200 over HTTP/2; HTTP redirected to HTTPS with 301.
- `npm run verify:live` passed 24/24 checks. The factory URL verifier loaded in 664 ms and found the correct title, `lang="en"`, one `<h1>`, `<main>`, no missing image alt text, no unlabeled buttons, and no console/page errors.

## Repository gates

All commands ran from the clean candidate checkout:

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 59 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 8/8 Vitest tests and 16/16 Playwright tests |
| `npx tsc --noEmit` | PASS |
| Lint | Not configured in the repository |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — exact Vite build plus postbuild service worker; `dist/` produced |
| Independent workflow suite | PASS — 36/36 assertions |
| `npm run verify:live` | PASS — 24/24 assertions |

## Product workflow and recovery coverage

- Empty state and first-run language clearly state that nothing sends automatically.
- Added due-today invoices with normal data, special HTML characters, a US $0.01 minimum, and a US $999,999,999.99 large valid amount. Bad email, zero/negative amount, and a 121-day template offset were blocked; the 120-day boundary was accepted.
- Prepared and edited subject/body, copied exact output, opened a correctly percent-encoded `mailto:` draft, and confirmed that neither action claims an email was sent. Only explicit “I sent it” advanced the cadence; history survived reload.
- Covered invoice paid/reopen, client-specific pause date/note, editable template persistence, and free-tier rejection of a sixth active invoice.
- With a controlled valid billing response, Plus enabled five cadence stages and six active invoices. The verdict was cached and no second verification request occurred on reload within the one-day window.
- Exported and parsed JSON and quoted CSV; tested delete cancellation and confirmed deletion; restored a valid backup; rejected invalid JSON, `{}`, and the prior incomplete-invoice poison payload without damaging stored data.
- Confirmed the damaged-IndexedDB recovery state offers raw recovery download and an explicit confirmed reset.
- A full add-invoice flow was completed using Tab, Enter, and typing only. Native dialog focus, skip navigation, and a designed 3 px `#145d78` focus ring were observed.

## Privacy, billing, and response policy

- Normal local and live use made only same-origin requests. Static inspection found no analytics, telemetry, remote fonts/scripts, bank/invoice integrations, profiling, automatic sending, or collection integration.
- The only application `fetch` is license verification after a token exists. Incoming license parameters were stored under `sb_license:payment-cadence`, removed from the visible URL, and verified without delaying the free shell (main visible in 202 ms while a controlled response was held for 1.5 seconds).
- The production catalog lists Gentle Nudge Plus at USD 18.00. Checkout returned HTTP 303 to hosted Dodo checkout. Invalid-license CORS and no-store behavior passed. A real charge was not performed.
- Production sends HSTS, CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy`, and `X-Content-Type-Options`.
- Hashed assets and fonts use `public, max-age=31536000, immutable`; the service worker is `no-cache, no-store, must-revalidate`; conditional ETag requests returned 304. Manifest and AVIF MIME types are correct.

## PWA, accessibility, responsive design, and performance

- Chromium parsed the standalone manifest with zero manifest or installability errors. Icons are genuine 192×192 and 512×512 PNGs, the 512 icon is maskable, and the start URL is versioned.
- Local and live offline reload passed after service-worker control. A changed worker progressed through update, install, activation, and displayed “An update is ready. Refresh when convenient.”
- Axe found zero serious or critical violations on desktop/mobile empty states and on the add-invoice dialog, populated queue, draft dialog, settings import-error toast, and populated 390 px queue.
- No console errors, page errors, or material failed requests occurred. One locally cancelled responsive AVIF request was Chromium choosing another `picture` source, not a network/page failure.
- At 390×844 there was no horizontal overflow and every visible interactive target was at least 44×44 CSS px. Desktop 1440×900 and mobile 390×844 screenshots were visually reviewed with clear hierarchy, no clipping, and product-specific artwork consistent with `.factory/design.md`.
- Reduced-motion emulation changed smooth scrolling to `auto` and transitions to effectively instant; there is no looping or flashing content.
- Three fresh Lighthouse 12.8.2 mobile runs scored Performance **87, 100, 100** (median 100), Accessibility **100/100**, and Best Practices **100/100**. The first run's 496.5 ms TBT was dominated by unattributable host tasks; both repeats measured 0 ms TBT. Median FCP was 0.96 s, median LCP 1.29 s, and CLS 0. A live mobile Event Timing sample for opening the add dialog was 48 ms.
- Initial live load transferred 79,586 bytes in 8 requests with zero third-party requests. Build budgets pass: JS 33,495 B raw / 11.35 KB gzip; CSS 18,139 B raw / 4.91 KB gzip; font 18,096 B; 640 px AVIF hero 8,789 B; total `dist/` 254,797 B.

Library/CLI packaging, backend concurrency/health, and sign-in/Entra checks are not applicable: this is a static local-first PWA with no sign-in. Local persistence and atomic backup replacement were exercised. The only server-side dependency is the billing API, whose rate-limit failure is recorded above.

## Reproduction

```sh
git checkout c3faf013295913237c4763414c48a154f7aeabea
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
```

Rate-limit reproduction uses distinct invalid tokens and rapid GETs against the production `/verify` route; stop on the first 429 and record `Retry-After`. This audit stopped after 550 HTTP 200 responses because that already exceeds a reasonable public verification burst.

Release recommendation: **do not promote this candidate until the production verification endpoint returns 429 with `Retry-After` under burst load.**
