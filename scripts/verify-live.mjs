import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import axe from 'axe-core';

const base = process.env.VERIFY_URL || 'https://payment-cadence.sociobot.in';
const evidence = process.env.VERIFY_EVIDENCE || '/tmp/payment-cadence-live';
await mkdir(evidence, { recursive: true });

const checks = [];
const record = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
const hash = (value) => createHash('sha256').update(value).digest('hex');

const index = await readFile(new URL('../dist/index.html', import.meta.url));
const assetPaths = [...index.toString().matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)].map((match) => match[1]);
for (const path of ['/index.html', '/sw.js', '/manifest.webmanifest', ...assetPaths]) {
  const local = await readFile(new URL(`../dist${path}`, import.meta.url));
  const response = await fetch(`${base}${path}`);
  const remote = Buffer.from(await response.arrayBuffer());
  record(`live identity ${path}`, response.ok && hash(local) === hash(remote), `${response.status} ${hash(remote)}`);
}

const rootResponse = await fetch(base);
record('CSP and anti-framing policy', rootResponse.headers.get('content-security-policy')?.includes("frame-ancestors 'none'") && rootResponse.headers.get('x-frame-options') === 'DENY', rootResponse.headers.get('content-security-policy') || 'missing CSP');
record('permissions policy', rootResponse.headers.get('permissions-policy')?.includes('camera=()'), rootResponse.headers.get('permissions-policy') || 'missing');
const assetResponse = await fetch(`${base}${assetPaths[0]}`);
record('immutable hashed asset cache', assetResponse.headers.get('cache-control')?.includes('immutable'), assetResponse.headers.get('cache-control') || 'missing');
const manifestResponse = await fetch(`${base}/manifest.webmanifest`);
const avifResponse = await fetch(`${base}/assets/gentle-nudge-landscape-960.avif`);
record('manifest MIME', manifestResponse.headers.get('content-type')?.startsWith('application/manifest+json'), manifestResponse.headers.get('content-type') || 'missing');
record('AVIF MIME', avifResponse.headers.get('content-type')?.startsWith('image/avif'), avifResponse.headers.get('content-type') || 'missing');

const catalogResponse = await fetch('https://api.sociobot.in/api/v1/products');
const catalog = await catalogResponse.json();
const product = catalog.data?.find((item) => item.slug === 'payment-cadence');
record('live billing catalog', product?.price_minor === 1800 && product?.currency === 'USD', product ? `${product.name} ${product.currency} ${product.price_minor}` : 'missing');
const checkoutResponse = await fetch('https://api.sociobot.in/api/v1/products/payment-cadence/checkout', { redirect: 'manual' });
record('live hosted checkout redirect', checkoutResponse.status === 303 && checkoutResponse.headers.get('location')?.startsWith('https://checkout.dodopayments.com/'), `${checkoutResponse.status} ${checkoutResponse.headers.get('location') || ''}`);

const browser = await chromium.launch({ headless: true });
for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport, isMobile: viewport.name === 'mobile', hasTouch: viewport.name === 'mobile', bypassCSP: true });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: axe.source });
  const severe = await page.evaluate(async () => (await window.axe.run()).violations.filter((item) => ['serious', 'critical'].includes(item.impact)));
  record(`${viewport.name} semantic and axe`, await page.locator('main').count() === 1 && await page.locator('h1').count() === 1 && severe.length === 0, JSON.stringify(severe.map((item) => item.id)));
  record(`${viewport.name} console`, errors.length === 0, errors.join(' | '));
  record(`${viewport.name} first-party load`, requests.every((url) => new URL(url).origin === base), requests.filter((url) => new URL(url).origin !== base).join(', '));
  if (viewport.name === 'desktop') {
    await page.keyboard.press('Tab');
    record('keyboard skip focus', await page.evaluate(() => document.activeElement?.classList.contains('skip-link')));
    await page.keyboard.press('Enter');
    record('keyboard skip target', await page.evaluate(() => document.activeElement?.id === 'main'));
  } else {
    const smallTargets = await page.locator('a,button,input,select,textarea').evaluateAll((elements) => elements.filter((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && (bounds.width < 44 || bounds.height < 44);
    }).map((element) => element.textContent?.trim()));
    record('mobile 44px targets', smallTargets.length === 0, JSON.stringify(smallTargets));
    record('mobile no overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  }
  await page.screenshot({ path: `${evidence}/${viewport.name}.png`, fullPage: true });
  await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 10_000 });
  await context.setOffline(true);
  await page.reload();
  record(`${viewport.name} offline reload`, await page.getByRole('heading', { level: 1, name: 'Gentle Nudge' }).isVisible() && await page.getByText(/Offline — your workspace still works/).isVisible());
  await context.close();
}
await browser.close();

await writeFile(`${evidence}/report.json`, JSON.stringify({ base, checks }, null, 2));
console.log(JSON.stringify({ base, total: checks.length, passed: checks.filter((check) => check.pass).length, failed: checks.filter((check) => !check.pass) }, null, 2));
if (checks.some((check) => !check.pass)) process.exitCode = 1;
