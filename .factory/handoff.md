# Gentle Nudge independent QA handoff

## Outcome — FAIL

Independent verification work order `payment-cadence-verify-3` tested candidate `c3faf013295913237c4763414c48a154f7aeabea` and <https://payment-cadence.sociobot.in> on 28 August 2026.

The prior deployment-only blocker is repaired: a fresh 80-request verification burst produced 30 HTTP 200 responses and 50 HTTP 429 responses, all 429s carrying `Retry-After: 4`. Final acceptance remains **FAIL** because two application defects reproduce locally and live.

## Release-blocking defects

- **P2 — Mobile content is lost at 200% text size.** At 390×844 with text enlarged to 200%, document width becomes 530 px and the centered 530 px welcome copy begins at x=-70. The hero heading, supporting copy, reassurance, and primary first-invoice action lose their left edge outside the scrollable canvas.
- **P2 — Negative license verdicts bypass the daily cache.** An invalid token is retained but its timestamped verdict is deleted. Both controlled local testing and the real live endpoint received a second verification request on immediate reload, violating the “at most once per day” paid-unlock contract. Valid verdict caching works.

No P0 or P1 defect was found. Full evidence and reproduction details are in [`.factory/verification-3.md`](verification-3.md).

## Passing evidence

- Clean checkout exactly matched the candidate before testing.
- `npm ci`: pass, 59 packages, 0 vulnerabilities.
- `npm test`: pass, 8 Vitest and 16 Playwright tests.
- `npx tsc --noEmit`: pass; no lint command is configured.
- `npm audit --audit-level=high`: pass, 0 vulnerabilities.
- `npm run build`: pass; exact `dist/` produced.
- Independent workflow suite: 36/36 pass; live verifier: 24/24 pass.
- All 18 public build artifacts matched production byte-for-byte.
- Core reminder, template, pause, history, paid/reopen, export/import/delete/recovery, free-limit, mailto/copy, keyboard-only, persistence, and invalid-input paths passed.
- Normal desktop and 390 px mobile layouts passed visual review, 44 px target, focus, overflow, reduced-motion, and stable-state axe checks; axe serious/critical findings: 0.
- Offline mutation/reload, live offline reload, service-worker update feedback, manifest parsing, and installability passed.
- Privacy/outbound-request checks and production security/MIME/cache policies passed; normal use made no third-party requests.
- Lighthouse 13.4.1 mobile: Performance 99, Accessibility 100, Best Practices 100; LCP 1.3 s, TBT 90 ms, CLS 0; 79,643 transferred bytes and zero third-party requests.
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

## Boundaries and next steps

- This is a static local-first PWA; library/CLI packaging, backend concurrency/health, and sign-in/Entra checks do not apply. The production billing verification endpoint was rate-limit tested.
- A real paid checkout was not completed. The catalog price and hosted checkout redirect passed.
- Repair the two P2 issues, add regressions for 200% text reflow and negative-verdict caching, redeploy, and rerun independent verification.
