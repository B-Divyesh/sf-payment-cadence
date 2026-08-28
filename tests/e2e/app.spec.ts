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
