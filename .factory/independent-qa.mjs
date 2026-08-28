import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

if (!process.env.QA_DIR) throw new Error('QA_DIR is required');
const { chromium } = await import(`${process.env.QA_DIR}/node_modules/playwright/index.mjs`);
const dist = `${process.env.QA_DIR}/dist`;
const axeSource = await readFile(`${process.env.QA_DIR}/node_modules/axe-core/axe.min.js`, 'utf8');
const report = { checks: [], consoleErrors: [], pageErrors: [], failedRequests: [], requests: [], downloads: {}, screenshots: [] };
const record = (name, pass, evidence = '') => report.checks.push({ name, pass: Boolean(pass), evidence });
const visible = async (locator, timeout = 3000) => { try { await locator.waitFor({ state: 'visible', timeout }); return true; } catch { return false; } };
const errorsFor = (page) => {
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('requestfailed', (request) => report.failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`));
  page.on('request', (request) => report.requests.push(request.url()));
};

let swRevision = 1;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    let path = normalize(join(dist, relative));
    if (!path.startsWith(dist)) throw new Error('bad path');
    try { if ((await stat(path)).isDirectory()) path = join(path, 'index.html'); } catch { path = join(dist, 'index.html'); }
    let body = await readFile(path);
    if (pathname === '/sw.js' && swRevision > 1) body = Buffer.concat([body, Buffer.from(`\n// independent-qa-revision-${swRevision}\n`)]);
    response.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    response.end(body);
  } catch (error) { response.writeHead(500); response.end(String(error)); }
});
await new Promise((resolve) => server.listen(4199, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const base = 'http://127.0.0.1:4199';
const today = new Date().toISOString().slice(0, 10);

async function addInvoice(page, suffix, overrides = {}) {
  await page.getByRole('button', { name: /Add (your first )?invoice/ }).first().click();
  await page.getByLabel('Client name').fill(overrides.client || `Client ${suffix}`);
  await page.getByLabel('Client email').fill(overrides.email || `client${suffix}@example.com`);
  await page.getByLabel('Invoice number').fill(overrides.number || `INV-${suffix}`);
  await page.getByLabel('Amount').fill(overrides.amount || '100.00');
  await page.getByLabel('Due date').fill(overrides.dueDate || today);
  if (overrides.note) await page.getByLabel(/Relationship note/).fill(overrides.note);
  await page.getByRole('button', { name: 'Add to cadence' }).click();
}

// Core workflow, validation, persistence, output, export, pause, paid/reopen, and privacy.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await context.newPage(); errorsFor(page);
  await page.goto(base, { waitUntil: 'networkidle' });
  record('semantic shell', await page.locator('html[lang="en"] main').count() === 1 && await page.locator('h1').count() === 1, await page.title());
  record('empty state', await page.getByText('Nothing sends automatically').isVisible());
  await page.keyboard.press('Tab');
  const skipFocused = await page.evaluate(() => document.activeElement?.classList.contains('skip-link') && getComputedStyle(document.activeElement).transform === 'none');
  record('keyboard skip link and visible focus', skipFocused, await page.evaluate(() => getComputedStyle(document.activeElement).outline));
  await page.keyboard.press('Enter');
  record('skip link targets main', await page.evaluate(() => document.activeElement?.id === 'main'));
  await page.getByRole('button', { name: 'Add your first invoice' }).click();
  record('dialog initial focus', await page.evaluate(() => document.activeElement?.getAttribute('name') === 'client'));
  await page.getByLabel('Client name').fill('Northstar & Sons <Priority>');
  await page.getByLabel('Client email').fill('not-an-email');
  await page.getByLabel('Invoice number').fill('NS-001');
  await page.getByLabel('Amount').fill('0');
  await page.getByRole('button', { name: 'Add to cadence' }).click();
  record('invalid invoice blocked', await page.locator('dialog[open]').count() === 1 && Boolean(await page.getByLabel('Client email').evaluate((el) => el.validationMessage)), await page.getByLabel('Amount').evaluate((el) => el.validationMessage));
  await page.getByLabel('Client email').fill('accounts@example.com');
  await page.getByLabel('Amount').fill('0.01');
  await page.getByLabel(/Relationship note/).fill('Accounts team changed this month.');
  await page.getByRole('button', { name: 'Add to cadence' }).click();
  record('boundary invoice accepted and escaped', await visible(page.getByText('Northstar & Sons <Priority>', { exact: true })) && await page.locator('img[src="x"]').count() === 0);
  await page.getByRole('button', { name: 'Review draft' }).click();
  record('draft is filled and editable', (await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue()).includes('Northstar & Sons <Priority>') && (await page.getByRole('textbox', { name: 'To', exact: true }).inputValue()) === 'accounts@example.com');
  await page.getByLabel('Subject').fill('Personal check-in');
  await page.getByLabel('Message').fill('A reviewed message.');
  await page.getByRole('button', { name: 'Copy message' }).click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()) === 'Subject: Personal check-in\n\nA reviewed message.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  record('copy output', clipboard === 'Subject: Personal check-in\n\nA reviewed message.', clipboard);
  record('copy does not mark sent', await page.getByRole('button', { name: 'I sent it' }).isVisible());
  await page.getByRole('button', { name: 'I sent it' }).click();
  record('explicit sent confirmation advances queue', await visible(page.getByText('No drafts are waiting.')));
  await page.reload({ waitUntil: 'networkidle' });
  record('sent state persists', await visible(page.getByText('No drafts are waiting.')));
  await page.getByRole('button', { name: 'Invoices' }).click();
  record('sent history visible', await visible(page.getByText(/Last sent .*A friendly check-in/)));
  await page.getByRole('button', { name: 'Mark paid' }).click();
  record('mark paid', await visible(page.getByText('Paid', { exact: true })));
  await page.getByRole('button', { name: 'Reopen' }).click();
  record('reopen', await visible(page.getByRole('button', { name: 'Mark paid' })));
  await page.getByRole('button', { name: 'Today' }).click();
  await addInvoice(page, 'PAUSE', { dueDate: today, note: 'Client requested Friday.' });
  await page.locator('article').filter({ hasText: 'Client PAUSE' }).getByRole('button', { name: 'Pause' }).click();
  const minPause = await page.getByLabel('Pause until').getAttribute('min');
  await page.getByLabel(/Why are you pausing/).fill('Client requested Friday.');
  await page.getByRole('button', { name: 'Pause reminders' }).click();
  record('pause removes invoice from ready queue', Boolean(minPause) && await visible(page.getByText(/Paused until/)));
  await page.getByRole('button', { name: 'Cadence' }).click();
  const days = page.getByLabel('Days after due').first();
  await days.fill('121');
  await page.getByRole('button', { name: 'Save this step' }).first().click();
  record('template max boundary enforced', Boolean(await days.evaluate((el) => el.validationMessage)));
  await days.fill('120');
  await page.getByLabel('Step name').first().fill('Patient follow-up');
  await page.getByRole('button', { name: 'Save this step' }).first().click();
  await visible(page.getByText('Cadence step saved.'));
  await page.reload();
  await page.getByRole('button', { name: 'Cadence' }).click();
  const editedTemplate = page.locator('.template-sheet').filter({ has: page.locator('input[name="name"][value="Patient follow-up"]') });
  record('template edit persists', await editedTemplate.count() === 1 && await editedTemplate.locator('input[name="afterDays"]').inputValue() === '120');
  await page.getByRole('button', { name: 'Settings' }).click();
  const jsonDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export backup' }).click(); const json = await jsonDownload; await json.saveAs('/tmp/gentle-nudge-qa-backup.json');
  const csvDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export CSV' }).click(); const csv = await csvDownload; await csv.saveAs('/tmp/gentle-nudge-qa.csv');
  const jsonText = await readFile('/tmp/gentle-nudge-qa-backup.json', 'utf8'); const csvText = await readFile('/tmp/gentle-nudge-qa.csv', 'utf8');
  report.downloads = { jsonBytes: jsonText.length, csvBytes: csvText.length };
  record('JSON export usable', JSON.parse(jsonText).invoices.length === 2);
  record('CSV export usable and quotes fields', csvText.includes('"Northstar & Sons <Priority>"') && csvText.split('\n').length === 3);
  page.once('dialog', (dialog) => dialog.dismiss()); await page.getByRole('button', { name: 'Delete all local data' }).click();
  await page.getByRole('button', { name: 'Invoices' }).click();
  record('delete-all cancellation preserves data', await page.locator('tbody tr').count() === 2);
  await page.getByRole('button', { name: 'Settings' }).click(); page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Delete all local data' }).click();
  await visible(page.getByText('All local workspace data was deleted.'));
  await page.getByRole('button', { name: 'Invoices' }).click(); record('confirmed delete-all clears data', await visible(page.getByText('No invoices yet')));
  await page.getByRole('button', { name: 'Settings' }).click(); await page.getByLabel('Import backup').setInputFiles('/tmp/gentle-nudge-qa-backup.json');
  await visible(page.getByText('Imported 2 invoices.')); await page.getByRole('button', { name: 'Invoices' }).click();
  record('valid backup restores data', await page.locator('tbody tr').count() === 2);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Import backup').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  record('obviously invalid import recovers', await visible(page.getByText('That file is not a Gentle Nudge backup.')));
  const firstParty = report.requests.filter((url) => new URL(url).origin !== base);
  record('normal use has no third-party HTTP requests', firstParty.length === 0, firstParty.join(', '));
  await page.screenshot({ path: '/tmp/gentle-nudge-desktop.png', fullPage: true }); report.screenshots.push('/tmp/gentle-nudge-desktop.png');
  await context.close();
}

// Free-tier active-invoice boundary.
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } }); const page = await context.newPage(); errorsFor(page); await page.goto(base);
  for (let i = 1; i <= 5; i++) await addInvoice(page, String(i), { dueDate: '2099-12-31' });
  await page.getByRole('button', { name: 'Add invoice' }).first().click();
  record('free tier stops sixth active invoice', await page.getByRole('heading', { name: 'Gentle Nudge Plus' }).isVisible() && await page.getByText(/Free supports five active invoices/).isVisible());
  await context.close();
}

// Invalid import that passes shallow validation must not poison persistent storage.
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } }); const page = await context.newPage(); errorsFor(page); await page.goto(base); await page.getByRole('button', { name: 'Settings' }).click();
  const poison = { invoices: [{ id: 'bad', status: 'active', dueDate: '2020-01-01' }], settings: { senderName: '', businessName: '', templates: [{ id: 'due', afterDays: 0, name: 'Due', tone: 'Due', subject: 'x', body: 'x' }] } };
  await page.getByLabel('Import backup').setInputFiles({ name: 'malformed-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(poison)) });
  await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(700);
  const stuck = await page.getByText('Opening your private workspace…').isVisible().catch(() => false);
  record('malformed import cannot poison workspace', !stuck, stuck ? 'Reload remains on loading state after malformed-but-shape-valid import.' : 'Recovered');
  await context.close();
}

// Mobile, axe, touch targets, reduced motion, and offline reload.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const page = await context.newPage(); errorsFor(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(base, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => await axe.run(document, { resultTypes: ['violations'] }));
  const severe = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  record('axe mobile serious/critical', severe.length === 0, severe.map((v) => `${v.id}:${v.impact}`).join(', '));
  record('mobile no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), await page.evaluate(() => `${document.documentElement.scrollWidth}/${document.documentElement.clientWidth}`));
  const smallTargets = await page.evaluate(() => [...document.querySelectorAll('a,button,input,select,textarea')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); }).map((el) => ({ text: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim(), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })));
  record('mobile visible touch targets >=44px', smallTargets.length === 0, JSON.stringify(smallTargets));
  const motion = await page.evaluate(() => ({ scroll: getComputedStyle(document.documentElement).scrollBehavior, transition: getComputedStyle(document.querySelector('.button')).transitionDuration }));
  record('reduced motion applied', motion.scroll === 'auto' && motion.transition.split(',').every((d) => parseFloat(d) <= 0.001), JSON.stringify(motion));
  await page.screenshot({ path: '/tmp/gentle-nudge-mobile.png', fullPage: true }); report.screenshots.push('/tmp/gentle-nudge-mobile.png');
  await page.waitForFunction(() => navigator.serviceWorker?.controller);
  await context.setOffline(true); await page.reload();
  record('offline reload', await page.getByRole('heading', { level: 1, name: 'Gentle Nudge' }).isVisible() && await page.getByText(/Offline — your workspace still works/).isVisible());
  await context.close();
}

// Simulate a changed service worker body and verify update feedback.
{
  const context = await browser.newContext(); const page = await context.newPage(); errorsFor(page); await page.goto(base); await page.waitForFunction(() => navigator.serviceWorker?.controller); swRevision = 2;
  const updateEvidence = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration(); const states = [];
    registration.addEventListener('updatefound', () => { states.push('updatefound'); registration.installing?.addEventListener('statechange', () => states.push(registration.installing?.state || registration.waiting?.state || registration.active?.state || 'unknown')); });
    await registration.update(); await new Promise((resolve) => setTimeout(resolve, 2500));
    const toast = document.querySelector('#toast'); return { states, toast: toast?.textContent, shown: toast?.classList.contains('show') };
  });
  record('service-worker update toast', updateEvidence.toast === 'An update is ready. Refresh when convenient.', JSON.stringify(updateEvidence));
  await context.close();
}

// Live deployment: exact visible smoke, axe, offline, and no unexpected outbound calls.
{
  const live = 'https://payment-cadence.sociobot.in'; const context = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await context.newPage(); errorsFor(page); const start = report.requests.length; await page.goto(live, { waitUntil: 'networkidle' }); await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => await axe.run(document, { resultTypes: ['violations'] }));
  record('live desktop axe serious/critical', axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).length === 0);
  const liveRequests = report.requests.slice(start); record('live normal load requests stay first-party', liveRequests.every((url) => new URL(url).origin === live), liveRequests.filter((url) => new URL(url).origin !== live).join(', '));
  await page.waitForFunction(() => navigator.serviceWorker?.controller); await context.setOffline(true); await page.reload(); record('live offline reload', await page.getByRole('heading', { level: 1, name: 'Gentle Nudge' }).isVisible());
  await context.close();
}

await browser.close(); await new Promise((resolve) => server.close(resolve));
console.log(JSON.stringify(report, null, 2));
