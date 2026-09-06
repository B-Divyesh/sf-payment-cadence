import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

if (!process.env.QA_DIR) throw new Error('QA_DIR is required');
const { chromium } = await import(`${process.env.QA_DIR}/node_modules/playwright/index.mjs`);
const dist = `${process.env.QA_DIR}/dist`;
const axeSource = await readFile(`${process.env.QA_DIR}/node_modules/axe-core/axe.min.js`, 'utf8');
const report = { checks: [], consoleErrors: [], pageErrors: [], failedRequests: [] };
const record = (name, pass, evidence = '') => report.checks.push({ name, pass: Boolean(pass), evidence });

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2'
};

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    let path = normalize(join(dist, relative));
    if (!path.startsWith(dist)) throw new Error('invalid path');
    try {
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    } catch {
      path = join(dist, 'index.html');
    }
    response.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    response.end(await readFile(path));
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain' });
    response.end(String(error));
  }
});
await new Promise((resolve) => server.listen(4199, '127.0.0.1', resolve));

const base = 'http://127.0.0.1:4199';
const today = new Date().toISOString().slice(0, 10);
const browser = await chromium.launch({ headless: true });

function observe(page, requests) {
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('requestfailed', (request) => report.failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`));
  page.on('request', (request) => requests.push(request.url()));
}

async function addInvoice(page, suffix, options = {}) {
  await page.getByRole('button', { name: /Add (your first )?invoice/ }).first().click();
  await page.getByLabel('Client name').fill(options.client || `Client ${suffix}`);
  await page.getByLabel('Client email').fill(options.email || `client-${suffix}@example.com`);
  await page.getByLabel('Invoice number').fill(options.number || `INV-${suffix}`);
  await page.getByLabel('Amount').fill(options.amount || '100.00');
  await page.getByLabel('Due date').fill(options.dueDate || today);
  await page.getByRole('button', { name: 'Add to cadence' }).click();
  await page.locator('dialog[open]').waitFor({ state: 'detached' });
}

async function route(page, name) {
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).click();
}

// The one-click sample must visibly work and remain separate from ordinary data.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await context.newPage();
  const requests = []; observe(page, requests);
  await page.goto(base);
  record('plain landing headline and sample action', await page.getByRole('heading', { level: 1, name: 'Prepare payment reminders before you send' }).isVisible() && await page.getByRole('link', { name: 'Try it with sample data' }).isVisible());
  await addInvoice(page, 'REAL', { client: 'Real workspace client' });
  await page.goto(`${base}/demo`);
  record('demo banner and populated sample', await page.locator('.demo-banner').isVisible() && await page.getByText('Acorn Architecture').isVisible() && await page.getByText('Haven Ceramics').isVisible());
  await addInvoice(page, 'DEMO', { client: 'Demo-only client' });
  await page.goto(base);
  record('demo cannot change real data', await page.getByText('Real workspace client').isVisible() && await page.getByText('Demo-only client').count() === 0);
  await page.goto(`${base}/demo`);
  record('demo data persists only in demo namespace', await page.getByText('Demo-only client').isVisible());
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === 'Sample data was reset.');
  record('reset demo reseeds the sample', await page.getByText('Demo-only client').count() === 0 && await page.getByText('Acorn Architecture').isVisible());

  await page.locator('article', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Review draft' }).click();
  await page.getByLabel('Subject').fill('A reviewed payment note');
  await page.getByLabel('Message').fill('Hi Acorn Architecture,\n\nPlease confirm the payment date.');
  await page.getByRole('button', { name: 'Copy message' }).click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()) === 'Subject: A reviewed payment note\n\nHi Acorn Architecture,\n\nPlease confirm the payment date.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  record('editable copy output and explicit sent control', copied === 'Subject: A reviewed payment note\n\nHi Acorn Architecture,\n\nPlease confirm the payment date.' && await page.getByRole('button', { name: 'I sent it' }).isVisible());
  await page.getByRole('button', { name: 'I sent it' }).click();
  await route(page, 'Invoices');
  record('sent history persists in workspace', await page.locator('tr', { hasText: 'Acorn Architecture' }).getByText(/Last sent/).isVisible());
  await route(page, 'Cadence');
  await page.getByLabel('Step name').first().fill('First reviewed reminder');
  await page.getByRole('button', { name: 'Save this step' }).first().click();
  await page.waitForFunction(() => document.querySelector('#toast')?.textContent === 'Cadence step saved.');
  await page.reload();
  record('editable cadence persists', await page.getByLabel('Step name').first().inputValue() === 'First reviewed reminder');
  await route(page, 'Settings');
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = await csvDownload;
  const csvText = await csv.createReadStream().then(async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf8');
  });
  record('CSV export contains sample invoice rows', csvText.includes('"Acorn Architecture"') && csvText.split('\n').length === 4);
  record('normal local flow makes no external requests', requests.every((url) => new URL(url).origin === base), requests.filter((url) => new URL(url).origin !== base).join(', '));
  await context.close();
}

// Routing, titles, reflow, legal targets, accessibility, and offline behavior each use fresh contexts.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, bypassCSP: true });
  const page = await context.newPage();
  const requests = []; observe(page, requests);
  await page.goto(`${base}/demo`);
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => (await window.axe.run()).violations.filter((violation) => ['serious', 'critical'].includes(violation.impact)));
  record('demo axe serious and critical', axe.length === 0, axe.map((violation) => violation.id).join(', '));
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  record('populated demo 200 percent reflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.goto(`${base}/privacy`);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const privacyTargets = await page.locator('a').evaluateAll((links) => links.filter((link) => {
    const box = link.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
  }).length);
  record('privacy 200 percent reflow and legal touch targets', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth) && privacyTargets === 0);
  await page.goto(`${base}/terms`);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  record('terms 200 percent reflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.goto(`${base}/demo`);
  await page.waitForFunction(() => navigator.serviceWorker?.controller);
  await context.setOffline(true);
  await page.reload();
  record('demo offline reload', await page.getByText('Acorn Architecture').isVisible() && await page.getByText(/Offline — your workspace still works/).isVisible());
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = []; observe(page, requests);
  await page.goto(base);
  await route(page, 'Settings');
  record('settings route title and focus announcement', await page.title() === 'Settings — Gentle Nudge' && await page.getByRole('heading', { level: 1, name: 'Settings' }).evaluate((node) => document.activeElement === node) && await page.locator('#route-status').textContent() === 'Settings loaded.');
  await page.goBack();
  record('back restores landing route', new URL(page.url()).pathname === '/' && await page.getByRole('heading', { level: 1, name: 'Prepare payment reminders before you send' }).isVisible());
  await page.goto(`${base}/not-a-page`);
  record('designed in-app unknown route', await page.title() === 'Page not found — Gentle Nudge' && await page.getByRole('link', { name: 'Go to the home page' }).isVisible());
  await page.goto(`${base}/privacy`);
  record('legal shared shell and title', await page.title() === 'Privacy — Gentle Nudge' && await page.locator('header nav').isVisible() && await page.locator('footer').getByText('Built by Param Factory').isVisible());
  await context.close();
}

// The deployed page is inspected with CSP bypass only for the QA-owned axe injection.
{
  const live = 'https://payment-cadence.sociobot.in';
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, bypassCSP: true });
  const page = await context.newPage();
  const requests = []; observe(page, requests);
  await page.goto(`${live}/demo`, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => (await window.axe.run()).violations.filter((violation) => ['serious', 'critical'].includes(violation.impact)));
  record('live demo semantic shell and axe', await page.locator('html[lang="en"] main').count() === 1 && await page.locator('h1').count() === 1 && axe.length === 0);
  record('live demo title and sample label', await page.title() === 'Gentle Nudge — prepare payment reminders' && await page.locator('.demo-banner').isVisible());
  record('live demo first-party load', requests.every((url) => new URL(url).origin === live), requests.filter((url) => new URL(url).origin !== live).join(', '));
  await context.close();
}

await browser.close();
await new Promise((resolve) => server.close(resolve));
console.log(JSON.stringify(report, null, 2));
if (report.checks.some((check) => !check.pass) || report.consoleErrors.length || report.pageErrors.length) process.exitCode = 1;
