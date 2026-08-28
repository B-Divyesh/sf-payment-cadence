# Independent verification — FAIL

Verified on 28 August 2026 against candidate `cc5f3a9d8e6e1029efbed46cb49a8a394c770bd3` and <https://payment-cadence.sociobot.in>.

The release fails acceptance. The free reminder workflow is useful and largely polished, the live files match the candidate, and all repository quality gates pass. However, the advertised one-time purchase is unavailable in production and a malformed import can poison persistent local data so the app no longer opens. Both are release-blocking.

## Defects

### P1 — Plus purchase is unavailable in production

- Both “Unlock Plus” and “Buy Plus” link to `https://api.sociobot.in/api/v1/products/payment-cadence/checkout`.
- A fresh GET at 2026-08-28 06:26 UTC returned HTTP 404 with `{"error":"enabled factory product","status":404}`.
- Impact: nobody can buy the advertised US $18 unlock, so unlimited invoices and the fourth/fifth cadence stages cannot be obtained through the required billing flow.
- The verification endpoint itself is reachable: an invalid test token returned HTTP 200, `{ "valid": false, "reason": "invalid", "expires_at": null }`, with the expected production-origin CORS header and `cache-control: no-store`.

### P1 — A malformed backup can permanently brick the local workspace

- Start from a fresh browser profile, open Settings, and import JSON with the accepted top-level shape but an incomplete invoice, for example:

```json
{
  "invoices": [{ "id": "bad", "status": "active", "dueDate": "2020-01-01" }],
  "settings": {
    "senderName": "",
    "businessName": "",
    "templates": [{ "id": "due", "afterDays": 0, "name": "Due", "tone": "Due", "subject": "x", "body": "x" }]
  }
}
```

- The import is accepted and persisted. After reload, the page remains on “Opening your private workspace…” and emits `Cannot read properties of undefined (reading 'some')` because the imported invoice lacks `history`.
- There is no in-app recovery once rendering fails. Clearing site storage recovers the UI but discards the user's local workspace.
- Fully invalid `{}` input is rejected cleanly, and a valid exported backup restores correctly; validation is simply too shallow for accepted records.

### P2 — License verification can block the entire free app

- With `?license=qa-token`, the token is correctly stored under `sb_license:payment-cadence` and removed from the address bar.
- When the verification response was deliberately held for 750 ms, the document still had no `<main>` and displayed only “Opening your private workspace…”. `init()` awaits the network verification before rendering the shell.
- This violates the paid-unlock contract that verification must never block the free experience. A slow or hanging billing request can leave a returning buyer without access to even free/local functionality.

### P2 — Three mobile links miss the 44×44 px target minimum

At a 390×844 CSS viewport, computed visible target boxes were:

- Header wordmark: 236×38 px.
- Footer Privacy: 51×22 px.
- Footer Terms: 41×22 px.

The rest of the visible controls met the minimum. This contradicts both the acceptance accessibility baseline and `.factory/design.md`.

### P3 — Production response policy and caching are incomplete

- Present on the document: HSTS, `referrer-policy: strict-origin-when-cross-origin`, and `x-content-type-options: nosniff`.
- Missing: Content-Security-Policy, an anti-framing policy (`frame-ancestors` or `x-frame-options`), and Permissions-Policy.
- All files, including content-hashed JS/CSS/assets, use `cache-control: public, must-revalidate, max-age=30`; hashed assets are not served with the requested long-lived immutable policy.
- `manifest.webmanifest` and AVIF assets are served as `application/octet-stream`. Chromium still parsed the manifest with zero errors and rendered the image, so this is a deployment correctness/hardening issue rather than an install blocker.

## Candidate and deployment identity

- Clean detached checkout: `cc5f3a9d8e6e1029efbed46cb49a8a394c770bd3`; clean before install and unchanged after the gates.
- `origin/main` was the same candidate before this report was committed.
- Live `index.html`, `sw.js`, `manifest.webmanifest`, hashed JS, and hashed CSS were byte-identical to a fresh production build. Representative SHA-256 values:
  - `index.html`: `dff178259fbda073b936285f07f0d7d3611907f23fccd84cabc563e3b487a1f6`
  - `sw.js`: `08bee2ae69f6db02a01ee519b6ae1eb7ffed9cd089b12dcf3c22086e3a04877c`
  - `main-OKQ_HF0S.js`: `52d78819d07bf7ff082d9e1988c222ebae66ab16d9d76ee7fcf301e2ec9c2303`
  - `main-aQX2Z2wH.css`: `178366052ae6adc76c6513cfd9fb594e81c64e653b4a96ba55404d6086528169`
- The live root returned HTTP 200 over HTTP/2. The factory URL verifier reported a 786 ms network-idle load, one `<h1>`, `lang="en"`, a `<main>`, complete image alt text, no unlabeled buttons, and no console/page errors on ordinary load.

## Gates and functional coverage

All commands below ran from a fresh detached clone after `npm ci`:

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 57 packages installed, 0 vulnerabilities |
| `npm test` | PASS — 4/4 Vitest tests and 6/6 Playwright tests |
| `npx tsc --noEmit` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — exact Vite production build and postbuild output in `dist/` |
| Independent browser checks | 34 PASS, 2 FAIL (malformed import and touch targets) |

The independent desktop workflow covered empty state, keyboard skip link and designed focus ring, dialog focus, invalid email/zero amount, the accepted US $0.01 boundary, output escaping, editable subject/body, clipboard output, explicit sent confirmation, refresh persistence, history, paid/reopen, a dated pause with private note, the 120-day template boundary, template persistence, and the five-active-invoice free limit. Copying did not mark a reminder sent. A separate browser check produced the correctly encoded `mailto:` URL for recipient, subject, ampersand, and multiline body; its headless `net::ERR_ABORTED` is the expected absence of an OS mail handler.

Data ownership checks covered JSON export, quoted CSV output, cancel and confirm paths for delete-all, valid backup restore, obvious invalid-file recovery, and the malformed-record failure above. Normal local and live loading made only same-origin requests. Static inspection found no analytics, tracking, remote font/script, bank, invoice-provider, auto-send, profiling, or collection integration; the only application `fetch` is license verification after a token exists.

## PWA, accessibility, responsive, and performance evidence

- Local and live offline reload passed after service-worker control, including the explicit offline status on the workspace.
- A changed worker installed and activated through `updatefound → installed → activating → activated`; the in-app “An update is ready. Refresh when convenient.” notice appeared.
- Chromium parsed the standalone manifest with zero errors. The 192×192 and 512×512 PNG icons exist, the latter declares `any maskable`, and the versioned start URL is `/?v=1`.
- Axe reported zero serious or critical findings in the repository's desktop and 390 px tests and in independent mobile/local and desktop/live runs.
- Keyboard skip navigation moved focus to main; the focused skip link had a 3 px `#145d78` ring. Dialog autofocus worked. No horizontal overflow occurred at 390 px. Desktop 1440×900 and mobile 390×844 were visually reviewed; content and the responsive hero rendered without clipping.
- Reduced-motion emulation changed smooth scrolling to `auto` and reduced transitions to 0.01 ms; no looping or flashing motion exists.
- Fresh live Lighthouse 12.8.2 mobile result: Performance 100, Accessibility 100, Best Practices 100; FCP 1.0 s, LCP 1.2 s, TBT 80 ms, CLS 0, interactive 1.3 s. There were 8 initial requests, 0 third-party requests, and 77,667 transferred bytes.
- Build budgets pass: JS 30,217 B raw / 10.41 kB gzip; CSS 17,980 B raw / 4.88 kB gzip; font 18,096 B; selected 960 px AVIF hero 20,813 B. Total `dist/` size is 249,928 B.

Library/CLI packaging and backend concurrency, persistence, and health checks are not applicable to this static local-first PWA.

## Reproduction

```sh
git checkout --detach cc5f3a9d8e6e1029efbed46cb49a8a394c770bd3
npm ci
npm test
npx tsc --noEmit
npm audit --audit-level=high
npm run build

# Independent workflow suite from the verification branch/worktree
QA_DIR=/path/to/clean/candidate node .factory/independent-qa.mjs

# Production availability defect
curl -i https://api.sociobot.in/api/v1/products/payment-cadence/checkout
```

Release recommendation: do not promote this candidate. Register/enable the billing product, validate imported records before persistence (with a recoverable error path), render the free shell before license verification completes, expand the three mobile link hit areas, and correct production security/cache/MIME policies; then rerun independent verification.
