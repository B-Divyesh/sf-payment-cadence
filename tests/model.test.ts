import { describe, expect, it } from 'vitest';
import { defaultTemplates, fillTemplate, needsAttention, stageFor, type Invoice } from '../src/model';

const invoice: Invoice = {
  id: 'one', client: 'Acme Studio', email: 'hello@example.com', number: 'INV-42', amount: 1200,
  currency: 'USD', dueDate: '2026-08-01', note: '', pausedUntil: '', pauseNote: '', status: 'active',
  createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', history: []
};

describe('cadence', () => {
  it('chooses the latest reached stage', () => {
    expect(stageFor(invoice, defaultTemplates, '2026-08-10')?.id).toBe('week');
    expect(stageFor(invoice, defaultTemplates, '2026-08-20')?.id).toBe('fortnight');
  });
  it('stops requesting a stage after it is marked sent', () => {
    const sent = { ...invoice, history: [{ id: 'e', at: '2026-08-10', stageId: 'week', stageName: 'A clear reminder', kind: 'sent' as const }] };
    expect(needsAttention(sent, defaultTemplates, '2026-08-10')).toBe(false);
  });
  it('honors client pauses', () => {
    expect(needsAttention({ ...invoice, pausedUntil: '2026-08-12' }, defaultTemplates, '2026-08-10')).toBe(false);
  });
  it('fills a draft without inventing information', () => {
    expect(fillTemplate('Hi {{client}} — {{invoice}} — {{sender}}', invoice, 'Mina')).toBe('Hi Acme Studio — INV-42 — Mina');
  });
});
