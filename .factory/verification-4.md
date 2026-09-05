# Prepare payment reminders — independent verification 4

## Verdict — FAIL

Verified on 5 September 2026 against implementation candidate `5e934739c96b39f0e07e0a52809cb568e765625f`, documentation commit `3e2bdef8678c63ebec428f65f89957ea0d089a06`, and <https://payment-cadence.sociobot.in>.

The core reminder workspace works, the two repairs in `5e93473` pass live, and the deployed files match the candidate. Acceptance still fails with **8 findings** and **17 untested public claim groups**. The required sample sandbox and claim registry do not exist. Additional 200% reflow, plain-language first-screen, routing, site metadata, legal touch-target, and verification-command defects remain.

The job is to prepare and review payment reminders before the user sends them. The audience is independent service providers managing late invoices. The required first action is “Try it with sample data.” The live first action is instead “Add your first invoice,” so a new visitor must enter real-looking data before seeing useful output.

## Findings

### P1 — The required one-click sample and isolated demo do not exist

- There is no “Try it with sample data” action on the first screen.
- Both `/demo` and `/?demo=1` open the ordinary empty workspace. Neither route loads sample invoices.
- There is no persistent “Demo — sample data, nothing is saved” label, “Reset demo,” or “Start for real” action.
- A fresh phone context opened `/?demo=1`, added `Demo Leak Studio`, and then opened `/`. The invoice remained visible. IndexedDB contained the ordinary `gentle-nudge` database, proving that the purported demo URL writes the real workspace namespace.
- `.factory/demo.md` is missing.

This blocks the required setup-free evaluation path and can make a visitor believe test data is isolated when it is not.

### P1 — Public claims have no registry or claim tests

`.factory/claims.json` is missing and the repository contains no `@claim:` tests. Therefore there were zero declared claim commands to run. A conservative copy audit found these **17 distinct public claim groups** without the required one-to-one registered test:

1. Due-today and overdue queues produce stage-specific drafts.
2. Templates and client context notes are editable.
3. Pause, paid/reopen, and reminder history persist.
4. Copy and email-draft output preserve a human review step.
5. Nothing sends automatically.
6. JSON backup and import work.
7. CSV export works.
8. All local data can be deleted.
9. The app is installable and works offline after a visit.
10. Desktop and 390px layouts are responsive.
11. The free workspace supports five active invoices.
12. Plus supports unlimited active invoices and five cadence steps.
13. Plus costs US $18 once with no subscription.
14. Workspace data stays in IndexedDB on the device and is not received by the service.
15. No analytics, trackers, third-party scripts, or remote fonts run.
16. The app does not connect to banks or invoice providers, profile clients, predict payment, or use collection threats.
17. License verification is the only app-initiated network request after a license is supplied.

General regression tests incidentally exercise many of these behaviors, but they do not satisfy the claims contract: each public claim must be listed and have exactly one tagged sandbox test. Untested claim count: **17**.

### P2 — 200% text reflow still loses content outside the repaired empty screen

At a 390×844 phone viewport with the root text size set to 200%:

- The repaired empty screen stays at 390/390 CSS px.
- After adding a due-today invoice, the document widens to 552 px. The “1 ready” marker is positioned from x=476 to x=548 and is clipped from the initial viewport.
- `/privacy/` widens to 511 px and `/terms/` to 557 px because their large headings retain unwrapped intrinsic width.
- The invoice table uses its expected horizontal data-table scroller; that exception is not counted as a separate defect.

The new regression test covers the welcome screen, invoice form, Cadence, and Settings, but it never covers populated Today, Privacy, or Terms. Evidence: `/work/.evidence/payment-cadence-verify-4/phone-populated-200.png`, `phone-privacy-200.png`, and `phone-terms-200.png`.

### P2 — The first screen does not state the job, audience, and sample action in plain words

- The only `<h1>` is the visually hidden product name, “Gentle Nudge,” rather than a job headline.
- The visible headline is “Keep the relationship. Lose the dread.” It is metaphorical and does not name payment reminders.
- “A calmer way to follow up” is a mood label. The screen does not name independent service providers.
- The screen supplies only one of the required three facts and no adjacent explanation of what the first action does.
- The landing page has no three-step “How it works,” limits/privacy section in the required order, or visible paid-tier section.
- `.factory/copy-audit.md` is missing.

This fails the attached plain-words and standard landing-page contracts even though the product artwork and visual identity are distinctive.

### P2 — Workspace navigation is not addressable or history-aware

- Today, Invoices, Cadence, and Settings are buttons that replace markup in memory. They have no real URLs.
- Moving from Today to Settings leaves the URL `/`, the title `Gentle Nudge — thoughtful payment reminders`, the `<h1>` “Gentle Nudge,” and `history.length` unchanged.
- Browser back/forward cannot restore a workspace section. No route-specific title or `<h1>` announcement is made.
- Privacy and Terms use a different header with no navigation and no footer, contrary to the required common shell. The app footer also omits “Built by Param Factory” and a version/build ID.

Focus does move to `<main>` after an in-app view change, but that does not repair the missing routes, titles, history, or announcements.

### P2 — Required metadata, discovery files, and the designed 404 are absent

- Root has no canonical link, Open Graph metadata, Twitter card metadata, or Apple touch icon declaration.
- The legal entry documents have no meta description or route metadata beyond their titles.
- `/robots.txt` and `/sitemap.xml` return HTTP 200 with the app HTML rather than their required formats.
- `/404` and a random unknown path return HTTP 200 with the ordinary workspace. There is no designed 404 page or way back because no 404 is rendered.

A deliberate HTTP 404 would be expected and would not be a defect. The defect is that the required 404 structure is missing and unknown routes masquerade as the app.

### P2 — Legal-page links miss the 44px touch target minimum

In a fresh 390×844 phone context:

- `privacy@sociobot.in`: 161.77×19 px.
- `support@sociobot.in`: 164.48×19 px.
- “Return to the app”: bounding height 43.80 px on both legal pages.

The app-shell controls pass the 44px check. This finding is limited to Privacy and Terms.

### P3 — A documented clean-checkout QA command fails unchanged

The handoff tells a verifier to run:

```sh
QA_DIR="$PWD" node .factory/independent-qa.mjs
```

From the clean candidate this exits 1 at the live axe injection because production correctly blocks inline scripts with `script-src 'self'`. A temporary test-only `bypassCSP: true` change lets all 36 checks pass, but that is not the documented command. The handoff mentions the workaround elsewhere, yet the runnable command remains incomplete.

## Candidate and deployment identity

- Clean candidate checkout: `5e934739c96b39f0e07e0a52809cb568e765625f`.
- Documentation reviewed: `3e2bdef8678c63ebec428f65f89957ea0d089a06`.
- `origin/main` matched the documentation commit before this report.
- `npm run verify:live` passed 24/24, including byte identity for `index.html`, `sw.js`, `manifest.webmanifest`, hashed JS, and hashed CSS.
- Root returned HTTP 200 over HTTPS with no console or page errors.

The later handoff-only commit does not change the product image, so `5e93473` is the implementation candidate.

## Quality gates

All repository commands ran from a fresh detached candidate clone after installing the documented prerequisites.

| Command or check | Result |
| --- | --- |
| `npm ci` | PASS — 59 packages; 0 vulnerabilities |
| `npm test` | PASS — 8/8 Vitest; 19 applicable Playwright checks passed; one expected desktop skip |
| `npx tsc --noEmit` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` produced |
| Declared claim commands | FAIL — registry missing; 17 untested public claim groups |
| Documented independent QA command | FAIL — CSP-blocked inline axe injection |
| Independent QA with test-only CSP bypass | PASS — 36/36; no console, page, or request errors |
| `npm run verify:live` | PASS — 24/24 |
| Factory URL verifier | PASS — 981 ms network-idle load; title/lang/main/alt/buttons/console checks pass |
| Lighthouse 13.0.1 mobile | PASS — Performance 100, Accessibility 100, Best Practices 100 |

Build output is 255,110 bytes total. Initial JS is 33.68 KB raw / 11.46 KB gzip, CSS is 18.26 KB raw / 4.94 KB gzip, the font is 18.10 KB, and the mobile AVIF is 8.79 KB. Lighthouse measured FCP 1.0 s, LCP 1.3 s, TBT 60 ms, CLS 0, and 78 KiB transferred.

## Workflow, invalid input, boundaries, and recovery

Passing evidence includes:

- Add a due-today invoice, render a populated queue, prepare and edit a realistic reminder, copy exact output, open a correctly encoded `mailto:` draft, explicitly mark sent, reload, and inspect history.
- Copy and email draft do not mark the reminder sent. The draft stayed open after the expected headless `mailto:` handoff.
- Mark paid, reopen, pause with a private note, edit a template, and persist changes.
- Reject invalid email and zero amount; accept US $0.01; accept 120 cadence days and reject 121.
- Enforce the sixth-active-invoice free boundary.
- Export valid JSON and quoted CSV; cancel and confirm delete-all; restore a valid backup; reject `{}` and the previously poisonous incomplete invoice.
- Recover from deliberately damaged IndexedDB with a recovery download and confirmed reset.
- With a controlled valid billing response, create six active invoices and reach five cadence steps. No real purchase or charge was made.

The core job works end to end. It does not offset the missing required demo, claim tests, or site/accessibility contracts.

## Accessibility, privacy, offline, and billing

- Axe found zero serious or critical issues in normal desktop and phone states and in the principal dialogs and workspace views.
- Skip navigation, visible 3px focus, dialog autofocus, Escape close, focus return, keyboard activation, and reduced-motion behavior pass.
- Normal app use has no third-party HTTP requests. Static inspection found no analytics, tracking, remote scripts/fonts, bank connection, invoice-provider connection, profiling, or automatic sending.
- After service-worker control, an invoice created offline survived an offline reload. The offline banner appeared. The update-available toast passed in the local worker-change test.
- Manifest, icons, CSP, anti-framing, Permissions-Policy, MIME types, immutable hashed-asset caching, and service-worker no-cache policy pass.
- Checkout returns HTTP 303 to the hosted Sociobot/Dodo checkout. The catalog price is USD 18.00.
- A live invalid license is stored, stripped from the URL, cached with a token-bound negative verdict, and not reverified on immediate reload. The persistent buy/replace path remains visible.
- A fresh 40-request verification burst returned 30 HTTP 200 and 10 HTTP 429 responses. Every 429 included `Retry-After: 4`.

This is a static local-first PWA. Backend tenant isolation, backend health, server restart persistence, CLI/library packaging, and desktop installation checks do not apply. The billing verification allowance and rate limit were checked because they are the only server dependency.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Checkout unavailable | Repaired — catalog and HTTP 303 hosted checkout pass |
| Malformed backup bricks workspace | Repaired — rejected without storage change; damaged-storage recovery passes |
| License check blocks free shell | Repaired — `<main>` appears before a delayed response |
| App-shell mobile links below 44px | Repaired on the app shell; new legal-page target finding recorded above |
| Security, cache, and MIME policy incomplete | Repaired — live headers and MIME/cache checks pass |
| Verification endpoint lacked 429/`Retry-After` | Repaired — 30/10 result in a 40-request burst, all 429s include `Retry-After` |
| Empty-screen 390px/200% reflow | Repaired for that screen; new populated/legal coverage gap recorded above |
| Invalid license verdict rechecked on reload | Repaired — one request across reload and a persistent inactive notice |

## Evidence

- Repository report: `.factory/verification-4.md`
- Machine-readable and copied report: `/work/.evidence/qa-result.json`, `/work/.evidence/qa-report.md`
- Screenshots and browser evidence: `/work/.evidence/payment-cadence-verify-4/`
- Lighthouse JSON: `/work/.evidence/payment-cadence-verify-4/lighthouse.json`
- Independent workflow JSON: `/work/.evidence/payment-cadence-verify-4/independent-qa.json`

**Final verdict: FAIL — 8 findings, 17 untested claims.**
