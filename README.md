# Gentle Nudge

Gentle Nudge is a private, local-first workspace for independent service providers who want consistent payment follow-up without handing their client relationship to an automated collections bot.

Add invoice dates and relationship context, shape an editable three-step cadence, review each reminder, then copy it or open it as an email draft. Nothing sends automatically. Invoices, templates, notes, and reminder history live in IndexedDB on the device and can be exported or deleted at any time.

Live: <https://payment-cadence.sociobot.in>

## What v1 includes

- Due-today and overdue queue with stage-specific drafts
- Editable, jurisdiction-neutral templates and per-invoice context notes
- Pause-until dates, paid/reopen state, and reminder history
- Copy and `mailto:` draft output with an explicit “I sent it” confirmation
- JSON backup/import, CSV export, and full local deletion
- Installable offline PWA with responsive desktop and 390px layouts
- Free workspace for five active invoices; one-time US $18 Plus license for unlimited active invoices and up to five cadence steps
- Plain-language `/privacy/` and `/terms/` pages

## Run locally

Requires Node.js 22+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables or external services are required for the free app. License verification uses the Sociobot billing API only when a license is present.

## Test and build

```sh
npm test        # unit + Chromium desktop/390px + offline + axe checks
npx tsc --noEmit
npm run build   # reproducible static output in dist/
npm run preview # preview dist/ locally
npm run verify:live # deployed identity, headers, checkout, browser, axe, and offline checks
```

Playwright is pinned to `1.58.2`. The factory image already provides its Chromium browser; elsewhere run `npx playwright install chromium` once if needed.

Static deployment must publish `dist/` with history/direct-path fallback enabled for convenience; independent `privacy/index.html` and `terms/index.html` files are included. The generated service worker precaches the built, hashed shell. `public/staticwebapp.config.json` carries the production security, MIME, and cache policy for Azure Static Web Apps.

## Privacy and limits

There is no analytics, tracking, bank access, invoice-provider connection, client profiling, or automatic email. The only network request initiated by app logic is license verification after a user supplies or purchases a license. Users should review reminder wording for their agreements and jurisdiction.

See [the product brief](.factory/brief.json), [the visual system and asset provenance](.factory/design.md), and [the factory handoff](.factory/handoff.md).

## License

MIT — see [LICENSE](LICENSE).
