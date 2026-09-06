# Gentle Nudge

Gentle Nudge helps independent service providers prepare payment reminders before they send them.

Try the product at <https://payment-cadence.sociobot.in/demo>. The sample opens three realistic invoices in an isolated workspace. It never reads or changes your real workspace.

## What it does

- Shows due and overdue invoices with stage-specific drafts to review.
- Lets you edit reminder templates and private client context.
- Keeps reminder history, paid status, and pause notes on the device.
- Copies a reviewed draft or opens an email draft. Nothing sends automatically.
- Exports JSON backups and CSV invoice lists. You can delete all local data.
- Works offline after the first visit.
- Keeps normal workspace activity on the product origin. It loads no analytics, trackers, remote fonts, or third-party scripts.
- Does not connect to banks or invoice providers. It does not profile clients, predict payment, or use collection threats.

Free includes five active invoices and three editable reminder steps. Gentle Nudge Plus is US $18 once with no subscription. Plus supports at least 25 active invoices and up to five reminder steps.

## Run locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The free workspace has no environment variables. License verification contacts the Sociobot billing API only after a license is supplied.

## Test and build

```sh
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build
npm run verify:live
```

Every public product claim is listed in [`.factory/claims.json`](.factory/claims.json). Run an individual claim from a clean checkout with its documented command, for example:

```sh
npm run test:claims -- --grep @claim:demo-sandbox
```

Playwright is pinned to `1.58.2`. Run `npx playwright install chromium` on a machine that does not already have its browser.

## Deploy

Publish `dist/` to the static host. `public/staticwebapp.config.json` supplies the history fallback, designed 404 rewrite, security headers, and cache policy. The generated service worker precaches the built shell.

## Privacy and product limits

The demo uses `demo:gentle-nudge` IndexedDB. Real data uses `gentle-nudge` IndexedDB. See [the demo sandbox](.factory/demo.md), [privacy](/privacy), [terms](/terms), [the visual system and asset provenance](.factory/design.md), and [the factory handoff](.factory/handoff.md).

## License

MIT — see [LICENSE](LICENSE).
