# Prepare payment reminders — review 1

## Verdict — FAIL

Reviewed on 6 September 2026 against implementation candidate `aaa6ec8a86b3ffeff6f942d045b090d23d1a92a9`, documentation/QA commit `7b87876e6044a9c5d64458c6d33115be214d776a`, and <https://payment-cadence.sociobot.in>.

**Final verdict: FAIL — 1 finding and 0 untested public claims.**

Gentle Nudge prepares payment reminders for human review before an independent service provider sends them. On fresh 1440×900 desktop and 390×844 phone browsers, before scrolling, the landing page stated the job in the heading **Prepare payment reminders before you send** and named independent service providers in the supporting sentence. The desktop primary action, **Try it with sample data**, was fully visible. On phone, that action is clipped before scrolling; this finding is below.

## Finding

### P2 — The phone first screen clips the required sample action

- At a fresh 390×844 phone viewport, the main sample action starts at y=813.39 px and ends at y=859.39 px. Only 30.61 px of its 46 px target is visible before scrolling.
- The action text is visibly cut at the bottom of the viewport. The image, label, job heading, and audience sentence consume the screen before the complete first action is available.
- This misses the work-order and plain-words requirement to state the job, audience, and first action before scrolling. It also leaves less than the 44 px visible touch-target area at the initial phone viewport.
- The action works after a short scroll and enters the isolated demo correctly, so this is a first-screen mobile layout defect rather than a broken demo path.

Evidence: `/tmp/payment-cadence-review-1-evidence/live-phone-landing.png`; fresh browser measurement `{ "top": 813.390625, "bottom": 859.390625, "height": 46, "visible": 30.609375 }` at 390×844.

## Product and demo checks

- The one-click sample opens `/demo` and shows Acorn Architecture, Haven Ceramics, and Juniper Learning with realistic amounts, due dates, private context, ready drafts, and a later reminder stage.
- The persistent label reads **Demo — sample data, nothing is saved**. **Reset demo** reseeds only the sample, and **Start for real** leaves the demo namespace. The isolated real/demo workflow passed from a fresh context.
- The exact edited mail draft was exercised: `accounts@acorn.example`, the edited subject, and the multiline edited body were encoded in the `mailto:` payload. Copying or opening a draft leaves the separate **I sent it** action available.
- History, paid status, and a pause note survived reload. Invalid input, US $0.01, the 120-day cadence boundary, quoted CSV, JSON backup/import, damaged-storage recovery, and confirmed full workspace deletion passed.
- A recorded valid license response allowed 25 active invoices and five reminder steps. Public copy accurately says “at least 25 active invoices”; it does not promise unlimited invoices.

## Commands and public claims

| Check | Result |
| --- | --- |
| Clean `npm ci` | PASS — 59 packages, 0 vulnerabilities |
| `npx tsc --noEmit` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` produced |
| `npm test` | PASS — 8 Vitest checks and 44 Playwright checks; 2 intended project skips |
| Every one of the 18 commands in `.factory/claims.json`, run separately | PASS |
| Claim registry/source-tag cardinality | PASS — 18 unique IDs and 18 unique `@claim:` tags |
| `QA_DIR="$PWD" node .factory/independent-qa.mjs` | PASS — 22/22, no console, page, or failed-request errors |
| `npm run verify:live` | PASS — 30/30 |
| Fresh mobile Lighthouse 13.4.1 | PASS — Performance 100, Accessibility 100, Best Practices 100 |

The Lighthouse run measured FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, and 81 KiB transferred. The fresh build emits 40,596 bytes raw / 13.37 kB gzip JavaScript and 21,921 bytes raw / 5.69 kB gzip CSS.

All public copy that makes a product claim has a matching declared sandbox test. The 18 claims include the exact sample count, free limit and step count, mail-draft payload, reload persistence, deletion scope, offline reload, privacy boundaries, and the Plus boundary. **Untested public claims: 0.**

## Live, accessibility, privacy, and PWA checks

- The live identity verifier matched the fresh build’s shell, service worker, manifest, and hashed JS/CSS assets. No stale product bundle was found.
- `/`, `/demo`, `/invoices`, `/cadence`, `/settings`, `/privacy`, `/terms`, `/404.html`, discovery files, and the manifest returned their intended responses. `/not-a-page` returned deliberate HTTP 404 with the designed page; that expected 404 is not a finding.
- Direct `/demo` has title **Demo — Gentle Nudge**. The desktop heading keeps **reminders** on one line. Keyboard Enter on the skip link focuses `<main id="main">`.
- Fresh live Axe runs on landing and demo found zero serious or critical violations. Phone 200% reflow for demo, Privacy, and Terms passed; no horizontal document overflow or under-44px visible target was found after the page content is in view. The clipped initial CTA is recorded separately above.
- Reduced-motion behavior, dialog focus, route heading focus/announcement, back navigation, legal shared shell, offline reload, and the update path passed.
- Normal and demo flows made same-origin requests only. No analytics, tracking, remote fonts/scripts, bank or invoice-provider connection, client profiling, payment prediction, collection threats, or automatic sending was found. License verification is the only app-initiated external request and occurs only after a license is supplied.
- CSP, anti-framing, permissions, referrer, nosniff, HSTS, canonical/social metadata, robots, sitemap, manifest, MIME, and cache checks passed.

## Billing boundary

The catalog lists Gentle Nudge Plus at USD 18 once, and the checkout endpoint returned the hosted checkout redirect. No purchase or charge was made. A fresh 40-request invalid-license verification burst returned 30 HTTP 200 responses and 10 HTTP 429 responses; all 429 responses supplied `Retry-After` (2 or 3 seconds).

This is a static local-first PWA. Backend tenant isolation, backend restart persistence, backend health, and CLI/library/desktop consumer-artifact checks do not apply.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Checkout unavailable | Repaired — catalog and hosted checkout redirect pass |
| Malformed backup could brick the workspace | Repaired — invalid/incomplete data is rejected; damaged storage has recovery/reset |
| License verification delayed the free shell | Repaired — free UI is available while verification is pending |
| App and legal touch targets below 44 px | Repaired for in-view controls — phone target checks pass |
| Security, cache, MIME, and anti-framing policy incomplete | Repaired — live policy and asset checks pass |
| Verification endpoint lacked 429/`Retry-After` | Repaired — current burst is 30×200 / 10×429 with `Retry-After` |
| 200% text reflow failed | Repaired — populated demo and legal routes fit at 390 px/200% |
| Invalid license verdict was reverified immediately | Repaired — cached verdict behavior passes |
| One-click isolated sample absent | Repaired — live sample, reset, and real/demo isolation pass |
| Claims registry and claim evidence absent/incomplete | Repaired — 18/18 declared commands pass and cover the formerly missing outcomes |
| First screen did not name job, audience, or action | Partly repaired — desktop meets the contract; phone clips the complete action before scrolling (current P2) |
| Workspace routes/history/shared legal shell absent | Repaired — routes, titles, history, focus announcements, and shared shell pass |
| Metadata, discovery files, designed 404, and independent QA command missing/broken | Repaired — all current checks pass |
| Verification 5 HTTP-200 unknown route, skip focus, demo title, desktop word break | Repaired — each passes fresh live verification |

## Evidence

- Repository report: `.factory/review-1.md`
- Evidence copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Detailed temporary evidence: `/tmp/payment-cadence-review-1-evidence/`

**Final verdict: FAIL — 1 finding, 0 untested public claims.**
