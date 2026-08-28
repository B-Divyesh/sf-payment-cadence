import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BackupValidationError, parseWorkspaceBackup } from '../src/backup';
import { defaultSettings, type Invoice } from '../src/model';

const validInvoice: Invoice = {
  id: 'invoice-1',
  client: 'Northstar Studio',
  email: 'accounts@example.com',
  number: 'NS-104',
  amount: 850,
  currency: 'USD',
  dueDate: '2026-08-28',
  note: '',
  pausedUntil: '',
  pauseNote: '',
  status: 'active',
  createdAt: '2026-08-28T06:00:00.000Z',
  updatedAt: '2026-08-28T06:00:00.000Z',
  history: []
};

describe('backup validation', () => {
  it('accepts a complete exported workspace', () => {
    const parsed = parseWorkspaceBackup({ version: 1, invoices: [validInvoice], settings: defaultSettings });
    expect(parsed.invoices).toEqual([validInvoice]);
    expect(parsed.settings.templates).toHaveLength(3);
  });

  it('rejects the verifier malformed invoice before it can be persisted', () => {
    const poison = {
      invoices: [{ id: 'bad', status: 'active', dueDate: '2020-01-01' }],
      settings: {
        senderName: '', businessName: '',
        templates: [{ id: 'due', afterDays: 0, name: 'Due', tone: 'Due', subject: 'x', body: 'x' }]
      }
    };
    expect(() => parseWorkspaceBackup(poison)).toThrow(BackupValidationError);
    expect(() => parseWorkspaceBackup(poison)).toThrow('Nothing was imported');
  });

  it('rejects malformed nested history and template records', () => {
    expect(() => parseWorkspaceBackup({ invoices: [{ ...validInvoice, history: [{}] }], settings: defaultSettings })).toThrow(BackupValidationError);
    expect(() => parseWorkspaceBackup({ invoices: [validInvoice], settings: { ...defaultSettings, templates: [{ ...defaultSettings.templates[0], afterDays: 121 }] } })).toThrow(BackupValidationError);
  });
});

describe('production response policy', () => {
  const config = JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));

  it('ships security, immutable asset cache, and MIME policies with the static artifact', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
    expect(config.mimeTypes['.avif']).toBe('image/avif');
  });
});
