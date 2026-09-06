# Verification 5 handoff

## Outcome

**FAIL — 5 findings and 6 untested or incompletely tested public claim groups.**

Implementation candidate: `1a3c7505cfa8be12954870502d033d2dbf84a685`.

Documentation/QA commit reviewed: `daed0dc7ce3c0d7223cfdf23f8dd95e5468d1d66` (following handoff commit `23d9994`).

The current production bundle is deployed. All 24 public files from a clean build match <https://payment-cadence.sociobot.in> byte for byte. No product code was changed during verification.

## Remaining findings

1. Unknown live URLs render the in-app not-found design but return HTTP 200 instead of HTTP 404.
2. The keyboard skip link receives visible focus, but Enter leaves focus on the link instead of moving it to `<main>`.
3. `/demo` retains the root title instead of using **Demo — Gentle Nudge**.
4. Six public claim components are absent from the registry or incompletely asserted: exact three-invoice sample, free three-step count, email-draft activation/output, persisted history/pause note/paid state, complete local-data deletion, and unlimited active invoices.
5. At 1440×900 the job headline breaks **reminders** between `r` and `s` because headings use `overflow-wrap: anywhere`.

See [verification-5.md](verification-5.md) for reproduction detail and evidence references.

## Verification performed

From a detached clean worktree at `daed0dc`:

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
```

The build gates pass: 8 unit tests, 41 browser checks plus one intended desktop skip, TypeScript, audit, and production build.

Every command in `.factory/claims.json` was run separately. All 18 exit successfully, but six claim components fail the required one-to-one completeness review.

Additional results:

- `QA_DIR="$PWD" node .factory/independent-qa.mjs`: 22/22 pass.
- Broad workflow regression: 35/36 pass; skip target fails.
- `npm run verify:live`: 25/27 pass; skip target and HTTP 404 fail.
- Full public artifact identity: 24/24 match.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100; LCP 1.2 s, CLS 0.
- Billing burst: 30 HTTP 200 and 10 HTTP 429; every 429 has `Retry-After`.

The live sample, reset, separate demo namespace, realistic draft, copy output, real-data isolation, 200% phone reflow, touch targets, offline reload, service-worker update notice, invalid input, numeric boundaries, export/import/delete, and malformed-backup recovery pass.

## Next steps

- Correct the host 404 behavior and verify an unknown path returns the designed page with status 404.
- Exempt fragment-only skip links from SPA routing and move focus to the main landmark.
- Set the demo route title explicitly.
- Add or narrow claim text/tests so each public assertion has one complete tagged test.
- Replace global desktop `overflow-wrap: anywhere` on the hero heading with a reflow rule that does not split normal words.
- Rerun all 18 claim commands, the broad regression, `npm run verify:live`, live phone/desktop screenshots, and the evidence export.

## Evidence

The repository report is `.factory/verification-5.md`. The copied report and machine result are `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`. Supporting artifacts are in `/work/.evidence/payment-cadence-verify-5/`.
