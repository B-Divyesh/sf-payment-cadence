import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test('adds an invoice, prepares a draft, and persists the sent step', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByRole('button', { name: 'Add your first invoice' }).click();
  await page.getByLabel('Client name').fill('Northstar Studio');
  await page.getByLabel('Client email').fill('accounts@example.com');
  await page.getByLabel('Invoice number').fill('NS-104');
  await page.getByLabel('Amount').fill('850');
  await page.getByLabel('Due date').fill(new Date().toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Add to cadence' }).click();
  await expect(page.getByText('Northstar Studio')).toBeVisible();
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.getByLabel('Message')).toContainText('Northstar Studio');
  await page.getByLabel('Message').fill('Hi Northstar Studio,\n\nA personal follow-up.\n\nThanks');
  await page.getByRole('button', { name: 'I sent it' }).click();
  await expect(page.getByText('No drafts are waiting.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('No drafts are waiting.')).toBeVisible();
});

test('has no serious accessibility violations and works offline after first load', async ({ page, context }) => {
  await page.goto('/');
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => await (window as typeof window & { axe: typeof axe }).axe.run());
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Gentle Nudge' })).toBeVisible();
  await expect(page.getByText(/Offline — your workspace still works/)).toBeVisible();
});

test('legal pages have the expected landmarks', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.goto('/terms/');
  await expect(page).toHaveTitle(/Terms/);
});

test('rejects an incomplete backup without changing persistent data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const poison = {
    invoices: [{ id: 'bad', status: 'active', dueDate: '2020-01-01' }],
    settings: {
      senderName: '', businessName: '',
      templates: [{ id: 'due', afterDays: 0, name: 'Due', tone: 'Due', subject: 'x', body: 'x' }]
    }
  };
  await page.getByLabel('Import backup').setInputFiles({
    name: 'malformed-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(poison))
  });
  await expect(page.locator('#toast')).toContainText('Nothing was imported');
  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByText('Nothing sends automatically')).toBeVisible();
});

test('offers an in-app recovery path for previously damaged storage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('gentle-nudge', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('workspace', 'readwrite');
      transaction.objectStore('workspace').put([{ id: 'bad', status: 'active', dueDate: '2020-01-01' }], 'invoices');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your workspace could not open.' })).toBeVisible();
  const recovery = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery copy' }).click();
  expect((await recovery).suggestedFilename()).toBe('gentle-nudge-recovery.json');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset local workspace' }).click();
  await expect(page.getByText('Nothing sends automatically')).toBeVisible();
});

test('renders the free workspace before license verification returns', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/payment-cadence/verify?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  });
  await page.goto('/?license=qa-token', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('main')).toBeVisible({ timeout: 500 });
  await expect(page.getByText('Nothing sends automatically')).toBeVisible({ timeout: 500 });
  expect(await page.evaluate(() => localStorage.getItem('sb_license:payment-cadence'))).toBe('qa-token');
  expect(new URL(page.url()).searchParams.has('license')).toBe(false);
});

test('caches an invalid license verdict for a day and keeps a replace-license path', async ({ page }) => {
  let requests = 0;
  await page.route('https://api.sociobot.in/api/v1/products/payment-cadence/verify?*', async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  });
  await page.goto('/?license=qa-invalid-cache');
  await expect.poll(() => requests).toBe(1);
  const verdict = await page.evaluate(() => JSON.parse(localStorage.getItem('sb_license_verdict:payment-cadence') || 'null'));
  expect(verdict).toMatchObject({ token: 'qa-invalid-cache', valid: false });
  expect(typeof verdict.at).toBe('number');
  await page.reload();
  await page.waitForTimeout(250);
  expect(requests).toBe(1);
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#license-note')).toContainText('This license is not active');
  await expect(page.getByRole('link', { name: 'Buy Plus' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore purchase' })).toBeVisible();
});

test('keeps every primary mobile workspace screen usable at 200% text size', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'This regression reproduces the 390px mobile text-size setting.');
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const assertReflow = async () => {
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  };
  const assertReachable = async (locator: ReturnType<typeof page.getByRole>) => {
    await locator.scrollIntoViewIfNeeded();
    await expect.poll(() => locator.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.left >= 0 && box.right <= window.innerWidth;
    })).toBe(true);
  };
  await assertReflow();
  await assertReachable(page.getByRole('button', { name: 'Add your first invoice' }));
  await page.getByRole('button', { name: 'Add your first invoice' }).click();
  await assertReflow();
  await assertReachable(page.getByLabel('Client name'));
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Cadence' }).click();
  await assertReflow();
  await page.getByRole('button', { name: 'Settings' }).click();
  await assertReflow();
  await assertReachable(page.getByRole('button', { name: 'Restore purchase' }));
});

test('uses the registered Sociobot checkout for both Plus purchase links', async ({ page }) => {
  const checkout = 'https://api.sociobot.in/api/v1/products/payment-cadence/checkout';
  await page.goto('/');
  await page.getByRole('button', { name: 'Cadence' }).click();
  await expect(page.getByRole('link', { name: 'Unlock Plus' })).toHaveAttribute('href', checkout);
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('link', { name: 'Buy Plus' })).toHaveAttribute('href', checkout);
});

test('all visible controls meet the 44px target minimum', async ({ page }) => {
  await page.goto('/');
  const smallTargets = await page.locator('a,button,input,select,textarea').evaluateAll((elements) => elements
    .filter((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && (bounds.width < 44 || bounds.height < 44);
    })
    .map((element) => ({ label: element.textContent?.trim(), bounds: element.getBoundingClientRect().toJSON() })));
  expect(smallTargets).toEqual([]);
});
