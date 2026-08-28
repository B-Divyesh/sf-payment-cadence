# Gentle Nudge v1 handoff

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
- `npm run build`: passed; initial JS 29.84 KB / 10.34 KB gzip, CSS 17.98 KB / 4.88 KB gzip, font 18 KB, mobile hero AVIF 8.6 KB (all under budget).
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
