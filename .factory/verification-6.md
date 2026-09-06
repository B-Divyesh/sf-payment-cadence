# Prepare payment reminders — independent verification 6

## Verdict — PASS

Verified on 6 September 2026 against implementation candidate `aaa6ec8a86b3ffeff6f942d045b090d23d1a92a9`, documentation/handoff commit `7ee02524deeb1c0eecff05341d09f7a847cca394`, and <https://payment-cadence.sociobot.in>.

**Final verdict: PASS — 0 findings and 0 untested public claims.**

Gentle Nudge's job is to prepare payment reminders for review before the provider sends them. It is for independent service providers following up on late invoices. In fresh 1440×900 desktop and 390×844 phone browsers, before scrolling, the page showed the heading **Prepare payment reminders before you send**, named independent service providers in the supporting sentence, and showed **Try it with sample data** as the first action. The action led directly to the populated three-invoice demo.

## Product and demo checks

- The demo showed Acorn Architecture, Haven Ceramics, and Juniper Learning, with realistic amounts, due dates, private context, ready drafts, and a later reminder stage.
- The persistent label read **Demo — sample data, nothing is saved** and included **Reset demo** and **Start for real**. Reset reseeded the sample; the isolated demo/real-storage workflow passed in the claim test.
- The reviewed Acorn email draft test edited the subject and body, then asserted the complete encoded mail-draft recipient (`accounts@acorn.example`), subject, and multiline body. The explicit **I sent it** control remained available; copying or opening a draft did not send anything.
- History, paid status, and a pause note survived reload. Export/import, quoted CSV, full workspace deletion, invalid-backup rejection, damaged-storage recovery, invalid form inputs, US $0.01, the 120-day boundary, and the five-free-invoice boundary all passed.
- With a recorded valid license response, the Plus test created 25 active invoices and reached five reminder steps. This precisely supports the public wording “at least 25 active invoices,” rather than an untested unlimited claim.

## Quality gates and public claims

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 59 packages installed, 0 vulnerabilities |
| `npm test` | PASS — 8 Vitest checks; 44 Playwright checks passed with 2 intentional project skips |
| `npx tsc --noEmit` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` produced |
| All 18 commands from `.factory/claims.json`, each run separately | PASS |
| Claim registry/source-tag cardinality | PASS — 18 claims, 18 unique IDs, 18 unique `@claim:` tags |
| `QA_DIR="$PWD" node .factory/independent-qa.mjs` | PASS — 22/22; no console, page, or failed-request errors |
| `npm run verify:live` | PASS — 30/30 |
| Lighthouse 13.4.1 mobile | PASS — Performance 96, Accessibility 100, Best Practices 100 |

The fresh mobile Lighthouse run measured FCP 1.0 s, LCP 1.4 s, TBT 240 ms, CLS 0, and 81 KiB transferred. The built primary JavaScript is 40,596 bytes raw / 13.37 kB gzip; CSS is 21,921 bytes raw / 5.69 kB gzip. These meet the static-product budgets.

Every public claim has one declared sandbox command and an observable assertion. No claim-like public copy lacked a matching registry entry. In particular, the formerly incomplete sample quantity, exact free-step quantity, email payload, reload persistence, full-delete scope, and Plus invoice boundary are now registered and exercised.

## Live, accessibility, privacy, and PWA checks

- The live identity verifier matched the built `index.html`, service worker, manifest, and primary hashed JS/CSS assets; no stale application bundle was detected.
- `/`, `/demo`, `/invoices`, `/cadence`, `/settings`, `/privacy`, `/terms`, `/404.html`, discovery files, and the manifest returned their intended successful status. A fresh `GET /not-a-page` returned HTTP **404** with the designed message. This expected deliberate 404 is not a finding.
- The direct `/demo` title was **Demo — Gentle Nudge**. The desktop heading kept **reminders** on one line. Keyboard Enter on the visible skip link moved focus to `<main id="main">`.
- Live desktop and phone Axe runs found zero serious or critical violations. The phone check found no horizontal overflow or visible target under 44px. The independent mobile check also covered 200% text on populated demo, Privacy, and Terms.
- Route headings, titles, focus movement, live announcement, back navigation, legal shared shell, reduced motion, native validation, and dialog focus behavior passed.
- Dedicated fresh contexts demonstrated service-worker-controlled offline reload, including the visible offline notice. The update flow is covered by the repository suite.
- Fresh normal and demo requests were same-origin only. There were no analytics, trackers, remote fonts/scripts, bank or invoice-provider connections, client profiling, payment prediction, collection threats, or automatic sending. License verification remains the only application-initiated external request and only occurs after a license is supplied.
- Live CSP, anti-framing, permissions, referrer, nosniff, HSTS, MIME, cache, canonical/social metadata, robots, sitemap, manifest, and PWA checks passed.

## Billing boundary

The public catalog lists Gentle Nudge Plus at USD 18.00; checkout returned the expected hosted checkout redirect. No purchase or charge was made. A 40-request public verification burst returned 30 HTTP 200 responses and 10 HTTP 429 responses; every 429 supplied `Retry-After: 4`. This static PWA has no product backend, tenant, health, server-restart, CLI, library, or desktop-artifact surface; those checks do not apply.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Checkout unavailable; malformed backup could brick workspace; license verification delayed free UI | Repaired and passing |
| Small touch targets; incomplete security/cache/MIME policy; missing verification rate limit | Repaired and passing |
| 200% text clipping; invalid license verdict reverified; missing sample sandbox | Repaired and passing |
| Missing claims registry; first-screen job/audience/action; non-addressable routes/shared legal shell | Repaired and passing |
| Missing metadata/discovery/designed 404; failing documented QA command | Repaired and passing |
| Verification 5 HTTP-200 unknown route, skip-link focus, demo title, desktop word break | Repaired and passing |
| Verification 5 incomplete quantity/email/persistence/delete/Plus claim evidence | Repaired and passing |

## Evidence

- Repository report: `.factory/verification-6.md`
- Evidence copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Live verifier report and desktop/phone screenshots: `/work/.evidence/payment-cadence-verify-6/live/`
- Independent QA JSON: `/work/.evidence/payment-cadence-verify-6/independent-qa.json`
- Lighthouse JSON: `/work/.evidence/payment-cadence-verify-6/lighthouse.json`
