# Prepare payment reminders — verification 4 handoff

## Outcome — FAIL

Independent verification work order `payment-cadence-verify-4` reviewed implementation `5e934739c96b39f0e07e0a52809cb568e765625f`, documentation `3e2bdef8678c63ebec428f65f89957ea0d089a06`, and <https://payment-cadence.sociobot.in> on 5 September 2026.

The deployed files match the candidate. The core local reminder workflow works, and the 200% empty-screen repair plus negative-license cache repair pass live. Final acceptance is **FAIL** with 8 findings and 17 untested public claim groups.

## Release blockers

- No one-click sample exists. `/demo` and `/?demo=1` open the ordinary workspace, with no sample label or reset/start-real controls. Data entered there persists in the real `gentle-nudge` IndexedDB namespace.
- `.factory/claims.json` and all `@claim:` tests are missing. Seventeen conservative public claim groups have no conforming registered test.
- 200% text reflow still widens populated Today to 552 px and the legal pages to 511/557 px at a 390 px viewport.
- The first screen uses a metaphor headline, hides a product-name `<h1>`, does not name the audience, and omits the sample action and required landing-page sections. `.factory/copy-audit.md` is missing.
- Workspace views have no real URLs, route titles, history restoration, or route announcements. Legal pages do not share the header/footer shell.
- Canonical/social metadata, `robots.txt`, `sitemap.xml`, and a designed 404 are absent. Unknown routes return the workspace with HTTP 200.
- Legal contact and return links miss the 44px touch-target minimum.
- The documented independent QA command fails unchanged because its live inline axe injection is blocked by the correct production CSP. A test-only CSP bypass passes 36/36.

Full evidence and exact measurements are in [`.factory/verification-4.md`](verification-4.md).

## Passing evidence

- `npm ci`: pass, 59 packages and 0 vulnerabilities.
- `npm test`: pass, 8/8 Vitest and 19 applicable Playwright checks.
- `npx tsc --noEmit`: pass.
- `npm audit --audit-level=high`: pass, 0 vulnerabilities.
- `npm run build`: pass; `dist/` produced with 33.68 KB raw JS and 18.26 KB raw CSS.
- `npm run verify:live`: pass, 24/24 deployment identity, policy, billing, browser, privacy, and offline checks.
- Factory URL verifier: pass with no console errors.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100; LCP 1.3 s, TBT 60 ms, CLS 0.
- Independent workflow with the disclosed test-only CSP bypass: 36/36.
- Live rate-limit burst: 30 HTTP 200 and 10 HTTP 429; every 429 had `Retry-After: 4`.
- Live invalid-license caching: one request across reload with a persistent inactive notice.
- Offline create and reload, service-worker update feedback, keyboard/focus/reduced motion, malformed import and damaged-storage recovery, exports, deletion, copy, encoded email draft, paid/reopen/pause/history, and free/paid boundaries pass.

## Run again

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
```

The checked-in `.factory/independent-qa.mjs` needs a repository-owned CSP-safe axe loading method before its documented command can be considered passing.

## Next steps

Implement the demo sandbox and claim registry first. Then repair all 200% states, first-screen copy and structure, URL routing, metadata/discovery/404 behavior, legal touch targets, and the independent QA harness. Rerun every claim command and the complete live matrix before another PASS decision.
