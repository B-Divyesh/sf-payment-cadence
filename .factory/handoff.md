# Gentle Nudge independent QA handoff

## Outcome — FAIL

Independent verification work order `payment-cadence-verify-2` tested candidate `c3faf013295913237c4763414c48a154f7aeabea` and <https://payment-cadence.sociobot.in> on 28 August 2026.

The application, build, and live deployment pass their functional, PWA, accessibility, privacy, performance, and identity checks. The earlier release defects are repaired. Final acceptance is **FAIL** because the production Sociobot license-verification endpoint did not return HTTP 429 or `Retry-After` during either a 250-request sequential burst or a 300-request concurrent burst. The observed threshold was **none through 550 rapid requests**.

## Release-blocking defect

- **P1 — Missing observable billing verification rate limit.** All 550 requests to `/api/v1/products/payment-cadence/verify` returned 200 in two bursts completed in 2.769 s and 2.229 s. No rate-limit headers appeared. Add a bounded API-side limit with 429 and `Retry-After`, then rerun independent verification.

Full evidence and reproduction details are in [`.factory/verification-2.md`](verification-2.md).

## Passing evidence

- Clean checkout exactly matched the candidate before testing.
- `npm ci`: pass, 59 packages, 0 vulnerabilities.
- `npm test`: pass, 8 Vitest and 16 Playwright tests.
- `npx tsc --noEmit`: pass; no lint command is configured.
- `npm audit --audit-level=high`: pass, 0 vulnerabilities.
- `npm run build`: pass; exact `dist/` produced.
- Independent product suite: 36/36 pass.
- Live verifier: 24/24 pass.
- All 18 public build artifacts matched the live deployment byte-for-byte.
- Factory URL verifier: HTTP 200, 664 ms load, correct semantics, no console/page errors.
- Core prepare-review-copy/email-draft-explicit-send flow, editable templates, pause notes, paid/reopen, persistence, JSON/CSV export, delete/restore, malformed import recovery, free/Plus boundaries, and license startup/cache behavior passed.
- Desktop and 390 px mobile visual review, keyboard-only creation, visible focus, reduced motion, 44 px targets, dynamic-state axe, and no-overflow checks passed. Axe serious/critical findings: 0.
- Offline reload passed locally and live; service-worker update notification and PWA installability passed.
- Production checkout redirects to hosted Dodo and the catalog price is USD 18.00. A real payment was not completed.
- Response security, MIME, CORS, ETag, and cache policies passed.
- Lighthouse mobile runs: Performance 87/100/100 (median 100), Accessibility 100/100, Best Practices 100/100; median LCP 1.29 s, CLS 0. The one low run was an unattributable-host TBT outlier; both repeats had 0 ms TBT.
- Budgets pass: 33.5 KB JS, 18.1 KB CSS, 18.1 KB font, 8.8 KB mobile AVIF, 254,797-byte `dist/`.

## Run and verify

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
```

## Boundaries and next step

- This is a static local-first PWA; library/CLI packaging, backend concurrency/health, and sign-in/Entra checks do not apply.
- Data stays in IndexedDB and moves between devices through explicit JSON backup/import. `mailto:` requires a configured email handler; copy remains the fallback.
- The static product needs no code change for the discovered blocker. Repair rate limiting in the shared production billing API, verify 429 plus `Retry-After`, then rerun the release audit.
