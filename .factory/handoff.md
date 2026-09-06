# Review 1 handoff

## Outcome

**FAIL.** Review 1 found one mobile first-screen layout finding and zero untested public claims at <https://payment-cadence.sociobot.in>.

Production implementation SHA: `aaa6ec8a86b3ffeff6f942d045b090d23d1a92a9` (including implementation commit `b3df5ff`). Documentation/verification SHA: `7b87876e6044a9c5d64458c6d33115be214d776a` before this review report commit. The deployed product image is the implementation SHA.

## What is shipped

- A local-first PWA for independent service providers to prepare and review payment reminders before sending them.
- A one-click, isolated three-invoice demo with a persistent sample label, reset, and start-real action.
- Editable cadence templates and private context, reviewed copy/email-draft output, explicit sent confirmation, pause notes, paid/reopen, history, JSON/CSV ownership tools, recovery, offline reload, and update notice.
- Free limits of five active invoices and three editable steps; the USD 18 one-time Plus capability is tested through 25 active invoices and five steps. No claim says unlimited.
- Documented deep links and legal pages, an intentional HTTP 404, self-hosted assets, no analytics, and Sociobot-hosted checkout/license verification only when a license is supplied.

## How to run and verify

From a clean dependency install:

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
QA_DIR="$PWD" node .factory/independent-qa.mjs
```

Review 1 results:

- `npm test`: 8 Vitest checks and 44 Playwright checks passed; 2 intended project-specific checks skipped.
- All 18 declared claim commands passed separately. There are 18 unique claim IDs and 18 unique source tags.
- TypeScript, high-severity audit, and production build passed; `dist/` exists.
- `npm run verify:live`: 30/30 passed, including designed HTTP 404, skip focus, distinct demo title, intact desktop headline, offline reload, metadata, billing offer, and deployed-asset identity.
- `QA_DIR="$PWD" node .factory/independent-qa.mjs`: 22/22 passed with no console, page, or failed-request errors.
- Playwright Axe found zero serious or critical violations. Fresh desktop and phone browsers showed the job and audience, and both loaded the persistent three-invoice demo; the phone sample action clipping is the finding recorded below.
- Fresh Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, and 81 KiB transferred.
- Build sizes: JavaScript 40,596 bytes raw / 13.37 kB gzip; CSS 21,921 bytes raw / 5.69 kB gzip; font 18,096 bytes; mobile AVIF 8,789 bytes.

Detailed review evidence is in `.factory/review-1.md` and `/tmp/payment-cadence-review-1-evidence/`.

## Billing and known gap

The production catalog lists Gentle Nudge Plus at US $18 once. Checkout returns the hosted Sociobot/Dodo redirect, and a fresh 40-request verification burst produced 30 HTTP 200 / 10 HTTP 429 responses with `Retry-After` on every 429. No purchase or charge was made.

At a fresh 390×844 phone viewport, the landing-page **Try it with sample data** action is only 30.61 px visible out of its 46 px height before scrolling (top 813.39 px; bottom 859.39 px). The next repair should move or compact the phone first screen so the complete action and its 44 px target are visible with the job and audience. The only intentionally unperformed action remains a real paid transaction; hosted checkout, public catalog metadata, controlled valid-license behavior, and the live rate-limit boundary were verified without charging a card.
