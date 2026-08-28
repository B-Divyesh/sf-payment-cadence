# Independent verification 3 — FAIL

Verified on 28 August 2026 against candidate `c3faf013295913237c4763414c48a154f7aeabea` and <https://payment-cadence.sociobot.in> for work order `payment-cadence-verify-3`.

Fresh evidence confirms that the prior deployment-only rate-limit blocker is repaired. The production verification API now returns HTTP 429 with `Retry-After`. The candidate nevertheless fails final acceptance because its 390 px layout loses content when text is enlarged to 200%, and invalid license verdicts are not cached for the required daily interval.

## Defects

### P2 — 200% text enlargement clips the primary mobile workspace

- Reproduced locally and live at a 390×844 CSS viewport by applying a 200% user text-size setting (`document.documentElement.style.fontSize = "200%"`).
- The document widened from 390 px to 530 px. The 530 px `.welcome-copy` was centered from x=-70 to x=460, placing the left side outside the scrollable canvas.
- The eyebrow, hero heading, explanatory copy, reassurance, and “Add your first invoice” action all lost their left edge. The primary action occupied x=-70 to x=166, so part of it could not be brought into view by horizontal scrolling.
- Normal 390 px rendering has no overflow and was visually sound; this defect is specific to enlarged text.
- Impact: mobile users who enlarge text to 200% lose readable content and part of the core first-run action, violating the accessibility acceptance contract.
- Required repair: allow the welcome copy to shrink/wrap within the viewport under text enlargement (including resetting flex-item intrinsic minimums and avoiding centered oversized content), then test all core screens at 200%.

### P2 — Invalid license verdicts are reverified on every reload

- Opened the live app with `?license=qa-live-invalid-cache`. The parameter was correctly saved as `sb_license:payment-cadence` and stripped from the URL.
- The first verification returned HTTP 200 with `valid:false`. After reconciliation, the stored token remained but `sb_license_verdict:payment-cadence` was `null`.
- Reloading immediately caused a second live request to the same verification endpoint. A controlled local reproduction produced the same request counts: one before reload and two total after reload.
- Valid verdicts behave correctly: a controlled valid response saved `{ valid:true, at:<timestamp> }`, unlocked Plus, and suppressed a second request on reload.
- Cause: `verifyLicense()` writes the timestamped verdict and then removes it when `valid` is false.
- Impact: a mistyped, expired, revoked, or wrong-product token creates an unnecessary billing request on every visit, contrary to the paid-unlock contract's “at most once per day” rule. The notice is also transient while the invalid token remains stored.
- Required repair: retain the timestamped negative verdict for 24 hours, keep the free workspace available, and provide a persistent quiet notice/buy or replace-license path.

No P0 or P1 product defect was found.

## Prior deployment blocker — repaired

At 2026-08-28 08:51:40 UTC, a fresh concurrent burst of 80 requests targeted:

`GET https://api.sociobot.in/api/v1/products/payment-cadence/verify?license=qa-rate-limit-invalid`

- 30 requests returned HTTP 200.
- 50 requests returned HTTP 429.
- Every 429 included `Retry-After: 4` and body `Too Many Requests! Wait for 4s`.
- The effective burst threshold observed in that window was 30 accepted requests. Because requests were concurrent, completion/index order is not a sequential threshold measurement.
- CORS remained scoped to `https://payment-cadence.sociobot.in`. A request after the window returned HTTP 200, `cache-control: no-store`, and `{ "valid": false, "reason": "invalid", "expires_at": null }`.

This supersedes the “no threshold through 550 requests” finding in `.factory/verification-2.md`; the external billing service changed without a candidate-code change.

## Candidate, build, and deployment identity

- The test checkout was clean and detached exactly at `c3faf013295913237c4763414c48a154f7aeabea` before installation.
- `npm run build` produced 18 public artifacts plus the host-only `staticwebapp.config.json`.
- All 18 public artifacts returned HTTP 200 from production and matched the clean build byte-for-byte.
- Representative SHA-256 matches:
  - `index.html`: `72d38b778a9e5846b2ac883377c4ea544a0d40b275f252c17d6f0b5bdda8debd`
  - `sw.js`: `e1d5a8f91789c0bc891d5ec44b5720609bb82021367735f5a430e3b364702ef9`
  - `manifest.webmanifest`: `2599d765ee9f132a2433d011a68240b6b85b28282244d4cad8c2bf8d5704bd11`
  - `main-D-49JtDb.js`: `fc9ef15173057cd05dd7c16362444ca771413e62c4c643366c4cc45b92427664`
  - `main-BIC4ydJ6.css`: `5788d17ed1dbbf6c560f057f272cd335c69bab8ab087e47ceb8dbfef3dbce492`
- HTTP redirects to HTTPS with 301; HTTPS returns HTTP/2 200.

## Repository gates

All commands ran from the clean candidate checkout.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 59 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 8/8 Vitest tests and 16/16 Playwright tests |
| `npx tsc --noEmit` | PASS |
| Lint | Not configured in the repository |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — Vite production build and postbuild service worker produced `dist/` |
| `npm run verify:live` | PASS — 24/24 checks |
| Independent workflow suite | PASS — 36/36 checks after using Playwright's test-only CSP bypass for live axe injection |

The checked-in `.factory/independent-qa.mjs` cannot complete unchanged against production because its inline axe injection is correctly blocked by the live `script-src 'self'` CSP. An untracked temporary copy added only Playwright `bypassCSP: true` to its live browser context; no application file or assertion was changed. The resulting run passed 36/36 with no console or page errors. One local responsive AVIF request ended with Chromium `ERR_ABORTED` while choosing a `picture` candidate; the image rendered and no live request failed.

## Product workflow and recovery coverage

- Verified the first-run empty state, due-today queue, normal and special-character invoice data, US $0.01 minimum, a US $999,999,999.99 large value, invalid email and zero amount rejection, and 120/121-day cadence boundaries.
- Prepared and edited a reminder, copied exact output, and opened a correctly encoded `mailto:` recipient, subject containing `&`/`?`, and multiline body. Copy/email-draft did not claim the message was sent; only “I sent it” advanced the queue.
- Completed add → review → edit → mark sent using only Tab, Enter, and keyboard typing. The skip link, 3 px focus ring, dialog autofocus, Escape close, and focus return all worked.
- Verified sent history and refresh persistence, paid/reopen, future invoices, dated pause plus private note, editable template persistence, and rejection of a sixth active free invoice.
- Exported and parsed JSON/CSV, including CSV quoting; exercised delete cancellation and confirmed deletion; restored a valid backup; rejected `{}` and the previously poisonous incomplete invoice without changing storage.
- Seeded damaged IndexedDB and verified recovery JSON download plus confirmed local reset.
- Created an invoice while offline and verified it persisted after an offline reload.
- A delayed license response did not block the free shell. Valid-license caching and a 429/network-error recovery message passed. A real purchase was not made.

## PWA, accessibility, responsive design, and visual review

- Chromium reported zero manifest parse or installability errors. The standalone manifest has a versioned start URL, matching theme/background colors, genuine 192×192 and 512×512 PNG icons, and a maskable 512 icon.
- Local and live offline reload passed after service-worker control. A locally changed worker progressed through update, install, activation, and displayed “An update is ready. Refresh when convenient.”
- Axe serious/critical findings: 0 on stable desktop/live and mobile/local empty, invoice-dialog, populated-queue, draft-dialog, and settings states.
- Normal 1440×900 and 390×844 screenshots were visually reviewed: clear hierarchy, no clipping, and no horizontal overflow. All visible normal-size controls were at least 44×44 CSS px.
- Reduced-motion emulation changed smooth scrolling to `auto`, reduced transition durations to 0.01 ms, and no looping/flashing motion exists.
- Factory URL verification returned HTTP 200, loaded in 731 ms, and found the expected title, `lang="en"`, one `<h1>`, `<main>`, complete image alt text, no unlabeled buttons, and no console/page errors.
- The product-specific editorial artwork, palette, typography, interaction grammar, motion policy, and original-asset provenance are documented in `.factory/design.md` and match the shipped UI.

## Privacy, response policy, caching, and performance

- Normal local and live use made only same-origin requests. Lighthouse reported zero third-party requests. Static inspection found no analytics, tracking, remote scripts/fonts, bank/invoice integrations, profiling, automatic sending, or collection integration.
- The only application `fetch` is the expected Sociobot license verification after a token exists. Checkout is a plain link to Sociobot; the production catalog lists Gentle Nudge Plus at USD 18.00 and checkout returns HTTP 303 to hosted Dodo.
- `/privacy/` and `/terms/` return HTTP 200. No sign-in exists, so Microsoft Entra authority checks do not apply.
- Production sends HSTS, CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy`, and `X-Content-Type-Options`. Inline script is blocked as intended.
- Hashed JS/CSS and fonts use `public, max-age=31536000, immutable`; `sw.js` uses `no-cache, no-store, must-revalidate`; an ETag conditional asset request returned 304. Manifest and AVIF MIME types are correct.
- Lighthouse 13.4.1 mobile: Performance 99, Accessibility 100, Best Practices 100; FCP 1.0 s, LCP 1.3 s, TBT 90 ms, CLS 0, interactive 1.3 s. Initial load transferred 79,643 bytes across 8 requests, with zero third-party requests.
- Build budgets pass: JS 33,495 B raw / 11.35 KB gzip; CSS 18,139 B raw / 4.91 KB gzip; font 18,096 B; mobile 640 px AVIF 8,789 B; total `dist/` 254,797 B.

Library/CLI packing and backend concurrency, persistence, health, and build-identity checks do not apply to this static local-first PWA. IndexedDB persistence boundaries were exercised. The only server endpoint in scope was the billing API, whose repaired rate limit is documented above.

## Reproduction

```sh
git checkout --detach c3faf013295913237c4763414c48a154f7aeabea
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
```

Release recommendation: **do not promote this candidate**. Repair 200% mobile text reflow and cache timestamped invalid license verdicts for 24 hours, then rerun accessibility, privacy/network, offline, identity, and rate-limit checks.
