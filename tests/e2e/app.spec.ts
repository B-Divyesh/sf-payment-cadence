import { test, expect, type Page } from '@playwright/test';
import axe from 'axe-core';

const today = () => new Date().toISOString().slice(0, 10);

async function addInvoice(page: Page, suffix: string, options: Partial<Record<'client' | 'email' | 'number' | 'amount' | 'dueDate' | 'note', string>> = {}) {
  await page.getByRole('button', { name: /Add (your first )?invoice/ }).first().click();
  await page.getByLabel('Client name').fill(options.client ?? `Client ${suffix}`);
  await page.getByLabel('Client email').fill(options.email ?? `client-${suffix}@example.com`);
  await page.getByLabel('Invoice number').fill(options.number ?? `INV-${suffix}`);
  await page.getByLabel('Amount').fill(options.amount ?? '100.00');
  await page.getByLabel('Due date').fill(options.dueDate ?? today());
  if (options.note) await page.getByLabel('Relationship note').fill(options.note);
  await page.getByRole('button', { name: 'Add to cadence' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

async function goTo(page: Page, name: 'Today' | 'Invoices' | 'Cadence' | 'Settings') {
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).click();
}

test('@claim:demo-sandbox loads sample invoices in isolated storage', async ({ page }) => {
  await page.goto('/');
  await addInvoice(page, 'REAL', { client: 'Real Studio' });
  await page.goto('/demo');
  await expect(page.locator('.demo-banner')).toContainText('Demo — sample data, nothing is saved');
  await expect(page.getByText('Acorn Architecture')).toBeVisible();
  await addInvoice(page, 'DEMO', { client: 'Demo-only Studio' });
  await page.goto('/');
  await expect(page.getByText('Real Studio')).toBeVisible();
  await expect(page.getByText('Demo-only Studio')).toHaveCount(0);
  await page.goto('/demo');
  await expect(page.getByText('Demo-only Studio')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Demo-only Studio')).toHaveCount(0);
  await expect(page.getByText('Acorn Architecture')).toBeVisible();
});

test('@claim:due-queue-drafts shows a due invoice with an editable stage draft', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1, name: 'Today’s payment reminders' })).toBeVisible();
  await page.locator('article', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Review draft' }).click();
  await expect(page.getByLabel('Message')).toContainText('Acorn Architecture');
  await expect(page.getByLabel('Subject')).toHaveValue(/AC-204/);
});

test('@claim:edit-templates-context saves editable reminder words and private context', async ({ page }) => {
  await page.goto('/demo');
  await goTo(page, 'Cadence');
  await page.getByLabel('Step name').first().fill('Gentle first reminder');
  await page.getByRole('button', { name: 'Save this step' }).first().click();
  await expect(page.locator('#toast')).toContainText('Cadence step saved.');
  await goTo(page, 'Invoices');
  await page.locator('tr', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Relationship note').fill('Asked for the scope again.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#toast')).toContainText('Invoice updated.');
  await page.reload();
  await goTo(page, 'Cadence');
  await expect(page.getByLabel('Step name').first()).toHaveValue('Gentle first reminder');
  await goTo(page, 'Today');
  await expect(page.getByText('Asked for the scope again.')).toBeVisible();
});

test('@claim:history-pause-paid preserves reminder history, pauses, and paid status', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('article', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Review draft' }).click();
  await page.getByRole('button', { name: 'I sent it' }).click();
  await goTo(page, 'Invoices');
  await expect(page.locator('tr', { hasText: 'Acorn Architecture' }).getByText(/Last sent .*A friendly check-in/)).toBeVisible();
  await page.locator('tr', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Mark paid' }).click();
  await expect(page.getByText('Paid', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reopen' }).click();
  await goTo(page, 'Today');
  await page.locator('article', { hasText: 'Haven Ceramics' }).getByRole('button', { name: 'Pause' }).click();
  await page.getByLabel('Why are you pausing? Optional').fill('They asked for Friday.');
  await page.getByRole('button', { name: 'Pause reminders' }).click();
  await expect(page.getByText(/Paused until/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Paused until/)).toBeVisible();
});

test('@claim:review-before-send keeps copy and email draft actions under user review', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/demo');
  await page.locator('article', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Review draft' }).click();
  await page.getByLabel('Subject').fill('A personal payment check-in');
  await page.getByLabel('Message').fill('Hi Acorn Architecture,\n\nPlease confirm your payment date.');
  await page.getByRole('button', { name: 'Copy message' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Subject: A personal payment check-in\n\nHi Acorn Architecture,\n\nPlease confirm your payment date.');
  await expect(page.getByRole('button', { name: 'Open email draft' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'I sent it' })).toBeVisible();
});

test('@claim:no-automatic-send does not mark a reminder sent when it is copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/demo');
  await page.locator('article', { hasText: 'Acorn Architecture' }).getByRole('button', { name: 'Review draft' }).click();
  await page.getByRole('button', { name: 'Copy message' }).click();
  await expect(page.getByRole('button', { name: 'I sent it' })).toBeVisible();
  await expect(page.getByText('Nothing was sent.')).toBeVisible();
});

test('@claim:backup-import exports a backup and restores it after local deletion', async ({ page }) => {
  await page.goto('/demo');
  await goTo(page, 'Settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const backup = await download;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete all local data' }).click();
  await goTo(page, 'Invoices');
  await expect(page.getByText('No invoices yet')).toBeVisible();
  await goTo(page, 'Settings');
  await page.getByLabel('Import backup').setInputFiles(backupPath!);
  await expect(page.getByText('Imported 3 invoices.')).toBeVisible();
  await goTo(page, 'Invoices');
  await expect(page.getByText('Acorn Architecture')).toBeVisible();
});

test('@claim:csv-export downloads an invoice row for each sample invoice', async ({ page }) => {
  await page.goto('/demo');
  await goTo(page, 'Settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = await download;
  const contents = await csv.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf8');
  });
  expect(contents.split('\n')).toHaveLength(4);
  expect(contents).toContain('"Acorn Architecture"');
});

test('@claim:delete-local-data removes every sample invoice after confirmation', async ({ page }) => {
  await page.goto('/demo');
  await goTo(page, 'Settings');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete all local data' }).click();
  await goTo(page, 'Invoices');
  await expect(page.getByText('No invoices yet')).toBeVisible();
});

test('@claim:offline-reload works after the first sample visit', async ({ page, context }) => {
  await page.goto('/demo');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Acorn Architecture')).toBeVisible();
  await expect(page.getByText(/Offline — your workspace still works/)).toBeVisible();
});

test('@claim:responsive-reflow keeps populated workspace and legal pages within a 390px viewport at 200% text', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'This claim measures the mobile text enlargement path.');
  for (const route of ['/demo', '/privacy', '/terms']) {
    await page.goto(route);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.goto('/demo');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const mark = page.locator('.today-mark');
  await expect.poll(() => mark.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= window.innerWidth;
  })).toBe(true);
});

test('@claim:free-limit blocks a sixth active invoice without Plus', async ({ page }) => {
  await page.goto('/');
  for (let index = 1; index <= 5; index += 1) await addInvoice(page, String(index), { dueDate: '2099-12-31' });
  await page.getByRole('button', { name: 'Add invoice' }).first().click();
  await expect(page.getByText(/Free supports five active invoices/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Plus' })).toBeVisible();
});

test('@claim:plus-limits supports six active invoices and five cadence steps with an active license', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/payment-cadence/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) }));
  await page.goto('/?license=sample-plus');
  await goTo(page, 'Settings');
  await expect(page.getByText('Plus is active on this device.')).toBeVisible();
  await goTo(page, 'Today');
  for (let index = 1; index <= 6; index += 1) await addInvoice(page, String(index), { dueDate: '2099-12-31' });
  await goTo(page, 'Cadence');
  await page.getByRole('button', { name: 'Add another step' }).click();
  await page.getByRole('button', { name: 'Add another step' }).click();
  await expect(page.locator('.template-sheet')).toHaveCount(5);
  await goTo(page, 'Invoices');
  await expect(page.locator('tbody tr')).toHaveCount(6);
});

test('@claim:plus-price shows the one-time US $18 offer and hosted checkout action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Plus costs US $18 once. No subscription.')).toBeVisible();
  const buy = page.getByRole('link', { name: 'Buy Plus for US $18' });
  await expect(buy).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/payment-cadence/checkout');
});

test('@claim:local-only-data keeps normal workspace actions on the product origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await addInvoice(page, 'PRIVATE', { client: 'Private Studio' });
  await goTo(page, 'Settings');
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});

test('@claim:no-third-party-trackers loads the sample without third-party scripts, fonts, or network requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});

test('@claim:product-limits keeps bank connections, client scoring, collection threats, and automatic sending out of the workspace', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'Settings');
  await expect(page.getByRole('list')).toContainText('Sends or schedules an email');
  await expect(page.getByRole('list')).toContainText('Connects to your bank or invoice account');
  await expect(page.getByRole('list')).toContainText('Scores clients or predicts payment');
  await expect(page.getByRole('list')).toContainText('Uses collection threats');
});

test('@claim:license-request-boundary contacts the billing API only after a license is supplied', async ({ page }) => {
  const billingRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin === 'https://api.sociobot.in') billingRequests.push(request.url());
  });
  await page.goto('/');
  await expect.poll(() => billingRequests).toEqual([]);
  await page.route('https://api.sociobot.in/api/v1/products/payment-cadence/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) }));
  await page.goto('/?license=claim-license');
  await expect.poll(() => billingRequests).toHaveLength(1);
  expect(billingRequests[0]).toContain('/verify?license=claim-license');
});

test('routes have distinct titles, restore with browser history, announce the new heading, and provide a designed in-app 404', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gentle Nudge — prepare payment reminders');
  await goTo(page, 'Settings');
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page).toHaveTitle('Settings — Gentle Nudge');
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeFocused();
  await expect(page.locator('#route-status')).toContainText('Settings loaded.');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Prepare payment reminders before you send' })).toBeVisible();
  await page.goto('/not-a-page');
  await expect(page).toHaveTitle('Page not found — Gentle Nudge');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
});

test('legal pages share the site shell, meet touch targets, and have route metadata', async ({ page }) => {
  for (const [route, title] of [['/privacy', 'Privacy — Gentle Nudge'], ['/terms', 'Terms — Gentle Nudge']] as const) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('header nav')).toBeVisible();
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const targets = await page.locator('a').evaluateAll((links) => links.filter((link) => {
      const box = link.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
    }).map((link) => link.textContent?.trim()));
    expect(targets).toEqual([]);
  }
});

test('has no serious or critical axe violations in sample workspace and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => await (window as typeof window & { axe: typeof axe }).axe.run());
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
