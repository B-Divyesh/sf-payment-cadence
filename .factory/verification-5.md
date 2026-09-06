# Prepare payment reminders — independent verification 5

## Verdict — FAIL

Verified on 6 September 2026 against implementation candidate `1a3c7505cfa8be12954870502d033d2dbf84a685`, documentation/QA commit `daed0dc7ce3c0d7223cfdf23f8dd95e5468d1d66`, and <https://payment-cadence.sociobot.in>.

The job is to prepare and review payment reminders before sending them. The audience is independent service providers. Before scrolling, fresh desktop and phone browsers showed the job headline **Prepare payment reminders before you send**, named independent service providers, and presented **Try it with sample data** as the primary action.

The repaired implementation is deployed: all 24 public files from a clean build match production byte for byte. The product works end to end, including the isolated sample, realistic drafts, reset, persistence, exports, offline use, and billing allowance. Acceptance still fails with **5 findings** and **6 untested or incompletely tested public claim groups**.

## Findings

### P2 — Unknown URLs still return HTTP 200 instead of the designed 404 response

- `GET /not-a-page` and `GET /qa-missing-route` returned HTTP 200 with the ordinary SPA entry document.
- JavaScript later renders a useful in-app **Page not found** screen with a home link, and `/404.html` exists. The missing part is the HTTP 404 response required for an unknown address.
- `npm run verify:live` failed its `designed HTTP 404` check with detail `200`.
- This does not classify a deliberate 404 as an error. The defect is that the live host never emits that deliberate 404.

Evidence: `live/report.json`, `route-statuses.txt`, and `live-phone-routes.json` in the verification evidence directory.

### P2 — The skip link does not move keyboard focus to the main landmark

- On a fresh live desktop page, the first Tab focuses **Skip to main content** with a visible 3 px `#145d78` outline.
- Pressing Enter changes the URL to `/#main`, but focus remains on the skip link instead of moving to `<main id="main">`.
- The same result occurs against the clean local candidate in the broad regression harness.
- Cause confirmed by inspection: the global internal-link handler intercepts the fragment link and prevents the browser's normal skip-link behavior.

Evidence: `skip-link.json`; `npm run verify:live` reported `keyboard skip target` false; `broad-regression.json` reported `skip link targets main` false.

### P2 — The demo route does not have its required route title

- After `/demo` settles, `document.title` is **Gentle Nudge — prepare payment reminders**.
- The site-structure contract requires a distinct demo title such as **Demo — Gentle Nudge**.
- `/settings`, `/privacy`, `/terms`, and the in-app not-found view do set distinct titles correctly.

Evidence: `live-phone-routes.json`.

### P2 — Six public claim components lack complete one-to-one claim tests

All 18 declared commands exit successfully, and the registry has 18 unique IDs with 18 unique source tags. The following public assertions are still unlisted or incompletely asserted by their tagged test:

1. **The sample opens three realistic invoices.** This exact quantitative statement appears on the landing page and in the README but has no registry claim of its own. Other tests incidentally encounter three rows.
2. **Free includes three editable reminder steps.** This exact quantitative statement appears on the landing page, Settings, and in the README but is not a registered claim.
3. **Open an email draft before sending.** `@claim:review-before-send` only checks that the button is visible; it never activates it or inspects the recipient, subject, and encoded body.
4. **Reminder history, pause notes, and paid status persist.** `@claim:history-pause-paid` checks history before reload, reopens the paid invoice before reload, and checks only the paused date after reload. It does not prove persisted history, paid state, or the pause note as claimed.
5. **Delete all local workspace data.** `@claim:delete-local-data` checks only that the invoice view is empty. It does not edit and then verify removal of templates/settings and history.
6. **Plus supports unlimited active invoices.** `@claim:plus-limits` creates six invoices. That proves the free limit is exceeded, not an unlimited claim. The copy should use a tested practical limit or the test must exercise a stated boundary.

This is a claims-contract failure even though the corresponding implementation paths appear to work. Untested claim count: **6**.

### P3 — The desktop job headline breaks a word into a single-letter line

- At the required 1440×900 desktop viewport, the first-screen heading renders `reminder` on one line and the final `s` at the start of the next line.
- Character-range measurements put the first eight letters of **reminders** at y=323 and the final `s` at y=414.
- The heading has `overflow-wrap: anywhere`, added as a global reflow safeguard. The result weakens first-screen readability at a normal desktop size.

Evidence: `live-desktop-landing.png` and `desktop-headline-wrap.json`.

No P0 or P1 defect was found.

## Candidate and deployment identity

- Implementation reviewed: `1a3c7505cfa8be12954870502d033d2dbf84a685` (`fix: add isolated demo and route contract`).
- Documentation/QA reviewed: `23d9994` followed by `daed0dc7ce3c0d7223cfdf23f8dd95e5468d1d66`.
- `origin/main` matched `daed0dc7ce3c0d7223cfdf23f8dd95e5468d1d66` before verification.
- A detached clean worktree at `daed0dc` was used for installation, build, tests, and artifact comparison.
- All 24 public build files, excluding the host-only `staticwebapp.config.json`, returned HTTP 200 and matched production byte for byte.
- Root HTTPS returned HTTP 200 with the expected CSP, anti-framing, Permissions-Policy, referrer policy, and MIME/cache behavior.

The bundle deployment is current. The remaining HTTP 404 behavior is a live host/configuration outcome, not evidence that the old JavaScript bundle is still deployed.

## Quality gates and claim commands

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 59 packages, 0 vulnerabilities |
| `npm test` | PASS — 8/8 Vitest; 41 Playwright passed and one intended desktop skip |
| `npx tsc --noEmit` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/` produced |
| 18 declared claim commands, run separately | PASS by exit status; coverage finding above |
| Claim registry/source-tag cardinality | PASS — 18 IDs, 18 unique IDs, 18 unique tags |
| `QA_DIR="$PWD" node .factory/independent-qa.mjs` | PASS — 22/22, no console/page/request errors |
| Broad workflow regression | FAIL — 35/36; only the skip target failed |
| `npm run verify:live` | FAIL — 25/27; HTTP 404 and skip target failed |
| Full live artifact identity | PASS — 24/24 files |
| Lighthouse 13.0.1 mobile | PASS — Performance 100, Accessibility 100, Best Practices 100 |

The built JS is 40,072 bytes raw / 13,172 bytes gzip. CSS is 21,880 bytes raw / 5,698 bytes gzip. The font is 18,096 bytes and the 640 px AVIF is 8,789 bytes. All are within the declared budgets. Lighthouse measured FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, and 81 KiB transferred.

## Live sample and core workflow

- A fresh live desktop browser used the visible sample action and reached `/demo` in one click.
- The persistent banner says **Demo — sample data, nothing is saved** and offers **Reset demo** and **Start for real**.
- Acorn Architecture, Haven Ceramics, and Juniper Learning were present. Their amounts, dates, context, and reminder states were realistic.
- Acorn's draft contained invoice `AC-204`, `$1,850.00`, the due date, private context, and a complete editable message.
- Editing and copying produced the exact reviewed subject and body. **I sent it** remained an explicit separate action.
- A demo-only invoice appeared after save, disappeared after **Reset demo**, and the real workspace remained empty after **Start for real**.
- IndexedDB showed separate `gentle-nudge` and `demo:gentle-nudge` databases. The complete sample flow made only same-origin requests.

## Normal, invalid, boundary, and recovery paths

Passing checks against the byte-identical clean candidate include:

- Add, edit, copy, explicitly mark sent, reload, inspect history, mark paid, reopen, pause, and persist a template edit.
- Invalid email and zero amount are blocked; US $0.01 is accepted and escaped safely.
- A cadence day value of 121 is rejected and 120 is accepted.
- A sixth active free invoice is blocked. A controlled valid license allows six active invoices and five cadence steps.
- JSON and quoted CSV exports parse correctly. Delete cancellation preserves data; confirmed deletion clears it; a valid backup restores it.
- `{}` and a structurally incomplete invoice backup are rejected without poisoning the stored workspace.
- Deliberately damaged IndexedDB shows the recovery download and reset actions; confirmed reset restores the empty workspace.
- A controlled invalid license makes one verification request across an immediate reload, keeps its inactive notice, and leaves the free shell available. With a 1.5-second verification delay, `<main>` appeared in 116 ms.

## Accessibility, mobile, offline, privacy, and routes

- Fresh 1440×900 and 390×844 live browsers were inspected before scrolling and after opening the sample.
- Axe found zero serious or critical violations on the live landing, demo, Privacy, and Terms states.
- At 390 px with 200% root text, demo, Privacy, and Terms each had zero document overflow and no visible target below 44×44 px.
- Dialog initial focus, native validation, route-change heading focus, route announcements, browser back, and reduced-motion styles pass. The skip-link exception is recorded above.
- Live and local offline reload pass after service-worker control, including the visible offline status. A changed local worker reached update/install/activate and displayed **An update is ready. Refresh when convenient.**
- Normal and demo flows made only same-origin requests. Static inspection found no analytics, trackers, remote fonts/scripts, bank or invoice-provider connection, profiling, collection behavior, or automatic sending.
- `/`, `/demo`, `/invoices`, `/cadence`, `/settings`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, the manifest, and `/404.html` load. The unknown-route status defect and demo-title defect are recorded above.

This is a static local-first PWA. Backend tenant isolation, backend restart persistence, backend health, CLI/library installation, and desktop packaging do not apply.

## Billing dependency

- The production catalog lists Gentle Nudge Plus at USD 18.00. The checkout endpoint returns HTTP 303 to the hosted Dodo checkout.
- The application contacts the billing API only when a license is supplied.
- A fresh 40-request verification burst returned 30 HTTP 200 and 10 HTTP 429 responses. Every 429 included `Retry-After`; CORS allowed only the product origin.
- No purchase or charge was made.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Checkout unavailable | Repaired — catalog price and hosted checkout redirect pass |
| Malformed backup bricks workspace | Repaired — incomplete records are rejected and reload recovers |
| License verification blocks the free shell | Repaired — current delayed-response check showed `<main>` in 116 ms |
| App-shell and legal touch targets below 44 px | Repaired — current phone checks find none |
| Security, cache, and MIME policy incomplete | Repaired — current live headers and asset behavior pass |
| Verification endpoint lacked 429/`Retry-After` | Repaired — 30/10 split in the current 40-request burst |
| Empty, populated, and legal 200% reflow failures | Repaired — all current 390 px enlarged-text checks pass |
| Invalid license verdict rechecked on reload | Repaired — current controlled check made one request across reload and kept the inactive notice |
| One-click sample and isolated demo absent | Repaired — live one-click sample, reset, and real/demo isolation pass |
| Claims registry absent | Partly repaired — registry and commands exist, but six public claim components remain incomplete |
| First screen did not state job/audience/action | Repaired — all three are visible before scrolling |
| Workspace routes/history/shared shell absent | Mostly repaired — routes, history, focus announcements, and shell pass; demo title and skip focus remain findings |
| Metadata/discovery/designed 404 absent | Mostly repaired — metadata and files pass; live unknown URLs still return 200 |
| Documented independent QA command failed | Repaired — checked-in command passes unchanged |

## Evidence

- Repository report: `.factory/verification-5.md`
- Evidence copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Detailed logs, screenshots, Lighthouse JSON, claim outputs, and browser JSON: `/work/.evidence/payment-cadence-verify-5/`

**Final verdict: FAIL — 5 findings, 6 untested or incompletely tested public claim groups.**
