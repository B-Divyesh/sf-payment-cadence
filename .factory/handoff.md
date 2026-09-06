# Payment reminder repair handoff

## Outcome

Implementation commit: 1a3c750 (fix: add isolated demo and route contract).

Gentle Nudge prepares and reviews payment reminders before an independent service provider sends them. The first action is **Try it with sample data**. It opens a realistic populated workspace without reading or changing real records.

All eight current verification findings are repaired in the implementation. The code is pushed to origin/main, but the production URL had not updated when this handoff was written. The live page still showed the previous title, “Gentle Nudge — thoughtful payment reminders”, and returned HTTP 200 for an unknown route. Treat live verification as pending factory deployment; do not treat this source commit as released until the live identity check passes.

## Changes

- Added an isolated one-click demo at /demo and ?demo=1, using the separate IndexedDB database demo:gentle-nudge.
- Seeded three realistic invoices and added the persistent demo label, **Reset demo**, and **Start for real** controls.
- Added 18 public claims in [claims.json](claims.json), each with exactly one @claim: browser test.
- Reworked the first screen with a plain job headline, named audience, sample action, three facts, workspace preview, three steps, limits, and exact Plus price.
- Added addressable workspace routes, titles, canonical updates, focus movement, live route announcements, back/forward support, shared legal shell, and a designed in-app 404.
- Added canonical, Open Graph, Twitter, and Apple-touch metadata; robots.txt; sitemap.xml; and the static-host 404 response override.
- Fixed populated Today, Privacy, Terms, and dialogs at 390px with 200% text. A hidden live region no longer widens the document, and long mobile dialogs keep their controls reachable.
- Made legal-page links 44px touch targets.
- Updated independent QA to use Playwright’s QA-only CSP bypass for live axe injection. Production CSP remains unchanged.
- Bumped the PWA cache version to gentle-nudge-1.1.0 so existing installed apps receive the new shell.
- Added the catalog description, billing-offer metadata, copy audit, demo documentation, and social/apple assets with provenance in [design.md](design.md).

## Verification

Run from a clean checkout:

~~~sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
~~~

All commands above passed locally. npm test passed 8 Vitest tests and 42 Playwright checks across desktop and mobile. Every declared command in [claims.json](claims.json) was also invoked individually; each uses an isolated fresh browser context. The claims registry count check confirmed all 18 IDs occur exactly once as a test tag.

The production-only checks below must run after the static deployment reaches the product origin:

~~~sh
npm run verify:live
QA_DIR="$PWD" node .factory/independent-qa.mjs
~~~

The independent QA command uses bypassCSP: true only in its test-owned live browser context so axe can inject. It does not weaken the deployed CSP.

## Release status and next step

The factory deployment boundary was preserved. No direct DNS, infrastructure, or billing changes were made. Once the deployment controller serves implementation 1a3c750, run the two production commands above, open /demo in fresh desktop and phone contexts, and verify the title is **Gentle Nudge — prepare payment reminders** plus the persistent demo label.

The paid offering remains a named dependency on the registered Sociobot billing product. [billing-offer.json](billing-offer.json) records the actual public one-time US $18 offer and its license-verification path. No payment flow was changed or made free.
