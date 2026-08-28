# Gentle Nudge release-repair handoff

## Outcome

Release repair `payment-cadence-repair-1` resolves every blocker reported in verifier commit `00e91d8b2409d69178f0fc56fdc7531d242409d3` against candidate `cc5f3a9d8e6e1029efbed46cb49a8a394c770bd3`. The repaired static PWA is deployed at <https://payment-cadence.sociobot.in>.

## Repairs

- Registered and enabled the production `payment-cadence` billing product as **Gentle Nudge Plus**, a one-time **US $18** purchase. The required Sociobot checkout endpoint now returns HTTP 303 to `checkout.dodopayments.com`; no payment provider is embedded in the app.
- Added complete runtime validation for imported invoices, reminder histories, settings, and cadence templates. The verifier’s incomplete-invoice payload is rejected before any write, and valid merged imports are saved in one IndexedDB transaction.
- Added an in-app recovery state for data damaged by an older build: users can download the raw recovery JSON, then explicitly confirm a local reset.
- Made license startup non-blocking. Incoming tokens are stored and removed from the URL, a cached valid verdict is applied synchronously, the free shell renders, and network reconciliation continues in the background.
- Expanded the masthead wordmark and footer legal links to at least 44×44 CSS px without changing the product-specific editorial layout.
- Added `staticwebapp.config.json` with CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, Permissions-Policy, immutable one-year asset/font caching, no-store service-worker caching, and correct Web Manifest/AVIF MIME mappings. The host config is excluded from the service-worker precache.
- Added repeatable live verification plus exact unit/browser regressions for every application-side finding.

## Verification evidence — 28 August 2026 UTC

Clean local gates:

- `npm ci`: 59 packages installed; 0 vulnerabilities.
- `npm test`: 8/8 Vitest tests and 16/16 Playwright tests passed across desktop Chromium and 390×844 mobile Chromium.
- `npx tsc --noEmit`: passed. No separate lint tool is configured.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- `npm run build`: passed and produced `dist/index.html`, direct privacy/terms entries, manifest, icons, and versioned `sw.js`.
- Independent verifier suite: 36/36 checks passed with zero console errors, page errors, or failed requests. This includes the exact malformed import, the original successful workflows, axe, reduced motion, offline reload, and the service-worker update toast.

Targeted regression coverage:

- `tests/backup.test.ts`: complete backups accepted; verifier poison payload rejected; malformed history/template records rejected; static response policy asserted.
- `tests/e2e/app.spec.ts`: rejected imports survive reload without changing storage; pre-existing damaged IndexedDB exposes recovery download/reset; a 1.2-second license response cannot delay `<main>`; both purchase links use the Sociobot endpoint; every visible target is at least 44×44 px.

Deployed checks:

- `npm run verify:live`: 24/24 checks passed for byte identity, headers/MIME/cache, billing catalog and checkout, desktop/mobile axe, console, request privacy, keyboard skip navigation, 390px targets/overflow, and offline reload.
- Factory `verify-url.sh`: HTTP 200 in 780 ms; title, `lang`, one `<h1>`, and `<main>` present; zero missing alts, unlabeled buttons, console errors, or page errors.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, interactive 1.2 s; 5 requests, 0 third-party requests, 57,117 transferred bytes.
- Live local/build identity matched SHA-256 for `index.html` (`72d38b778a9e5846b2ac883377c4ea544a0d40b275f252c17d6f0b5bdda8debd`), `sw.js` (`e1d5a8f91789c0bc891d5ec44b5720609bb82021367735f5a430e3b364702ef9`), manifest, hashed JS, and hashed CSS.
- Live response checks: CSP/anti-framing/Permissions-Policy present; hashed JS is `public, max-age=31536000, immutable`; manifest is `application/manifest+json`; AVIF is `image/avif`.
- Build budgets: JS 33.50 KB raw / 11.35 KB gzip; CSS 18.14 KB raw / 4.91 KB gzip; font 18.10 KB; 640px AVIF 8.79 KB; total `dist/` 254,797 bytes.
- Live screenshots at 1440×900 and 390×844 were visually reviewed with no clipping or horizontal overflow.

## Run and verify

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
```

Deployment command:

```sh
/opt/fleet/lib/deploy-static.sh payment-cadence /work/repo/dist
```

## Known boundaries / next steps

- Data remains intentionally device-local. Cross-device movement uses JSON backup/import and license paste.
- `mailto:` requires a configured system email handler; copy remains the reliable fallback.
- Live catalog and hosted-checkout creation were verified without completing a real card charge. Webhook grant/revocation behavior remains owned by the shared Sociobot billing service rather than this static repository.
- No library/CLI consumer package or backend concurrency/health surface exists for this static PWA, so those checks are not applicable.
