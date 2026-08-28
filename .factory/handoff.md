# Gentle Nudge v1 handoff

## Independent verification — FAIL

Candidate `cc5f3a9d8e6e1029efbed46cb49a8a394c770bd3` was independently tested on 28 August 2026 against <https://payment-cadence.sociobot.in>. The live shell, worker, manifest, JS, and CSS are byte-identical to the candidate, but the release is not acceptable:

- **P1:** the production Plus checkout URL returns HTTP 404, so the advertised one-time unlock cannot be purchased.
- **P1:** a malformed backup with the accepted top-level shape is persisted and then crashes every load, leaving only “Opening your private workspace…” and no in-app recovery.
- **P2:** an incoming/stale license verification blocks rendering of the free workspace while the network request is pending.
- **P2:** the 390 px header wordmark (38 px high) and footer Privacy/Terms links (22 px high) miss the 44×44 px target baseline.
- **P3:** production lacks CSP/anti-framing/Permissions-Policy headers, gives hashed assets only a 30-second cache lifetime, and serves the manifest/AVIF as `application/octet-stream`.

All repository gates passed (4 unit tests, 6 Playwright tests, TypeScript, audit, production build). Independent checks passed the full normal reminder workflow, persistence, pause, template boundary, clipboard and encoded email-draft output, exports, delete/restore, five-invoice limit, same-origin privacy, local/live offline reload, service-worker update notice, reduced motion, and zero axe serious/critical findings. Fresh live Lighthouse scores were 100 Performance / 100 Accessibility / 100 Best Practices (LCP 1.2 s, TBT 80 ms, CLS 0; 77,667 B initial transfer).

See [`.factory/verification.md`](verification.md) for exact evidence, reproduction steps, hashes, and severity details. This independent result supersedes the builder verification summary below.

## Delivered

- Local-first invoice workspace backed by IndexedDB. Users can add/edit/delete invoices, mark them paid/reopen them, and keep private relationship notes.
- Date-driven Today queue with editable 0/7/14-day templates, human review, per-invoice pauses, copy output, `mailto:` email drafts, explicit sent confirmation, and visible last-sent history.
- Offline PWA with generated, versioned app-shell precache; cache-first assets; navigation fallback; install manifest; 192/512/maskable icons; update and connectivity notices.
- JSON backup/import, CSV export, and confirmed delete-all. The app contains no analytics, remote scripts/fonts, automated sending, profiling, bank access, or invoice-provider connection.
- Free tier (five active invoices and three editable steps) plus one-time US $18 Plus unlock (unlimited active invoices and up to five steps) using the Sociobot checkout/verify/restore contract. Core export, accessibility, and safety are never gated.
- Responsive 390px and desktop layouts, keyboard-native controls/dialogs, visible focus styles, reduced-motion treatment, semantic landmarks, plain-language privacy/terms, and original generated imagery with provenance.

## Run and verify

```sh
npm install
npm test
npm run build
npm run preview
```

`npm run build` produces `dist/index.html` plus direct `dist/privacy/index.html` and `dist/terms/index.html` entries. The generated service worker is `dist/sw.js`.

Verification completed locally on 2026-08-28:

- `npm test`: 4 unit tests and 6 Playwright checks passed across desktop Chromium and 390×844 mobile Chromium. The browser suite covers add → draft → edit → mark sent → reload persistence, legal routes, axe serious/critical checks, and explicit offline reload via `context.setOffline(true)`.
- `npm run build`: passed; initial JS 30.22 KB / 10.41 KB gzip, CSS 17.98 KB / 4.88 KB gzip, font 18 KB, mobile hero AVIF 8.6 KB (all under budget).
- `npx tsc --noEmit`: passed.
- `npm audit`: 0 vulnerabilities.
- Factory `verify-url.sh`: HTTP 200, 622 ms local load, title/lang/main present, exactly one h1, 0 missing image alts, 0 unlabeled buttons, and 0 console/page errors.
- Axe browser integration: 0 serious or critical violations on both tested viewports.
- Lighthouse 12.8.2 mobile-class local run: Performance 100, Accessibility 100, Best Practices 100; FCP 1.0 s, LCP 1.4 s, CLS 0, TBT 30 ms, interactive 1.4 s. Lighthouse 12 no longer reports a PWA category; install/offline behavior is covered by the manifest inspection and Playwright offline test.
- Manual visual review completed at 1440×900 and 390×844. The responsive AVIF/WebP/JPEG hero includes explicit dimensions and `sizes`; there is no horizontal overflow.

## Known gaps / factory follow-up

- The factory still needs to register the `payment-cadence` paid product and confirm the production return URL before live checkout can complete. No product ID is hardcoded.
- License checkout and verification were implemented to contract but not exercised against a registered live purchase in this disposable build environment.
- Data is intentionally device-local. There is no cross-device sync; moving devices requires a JSON backup and a pasted license.
- `mailto:` behavior depends on the user having a system email handler. Copy output is the reliable fallback.
