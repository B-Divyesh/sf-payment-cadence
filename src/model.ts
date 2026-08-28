export type StageTemplate = {
  id: string;
  afterDays: number;
  name: string;
  tone: string;
  subject: string;
  body: string;
};

export type ReminderEvent = {
  id: string;
  at: string;
  stageId: string;
  stageName: string;
  kind: 'copied' | 'email-opened' | 'sent';
};

export type Invoice = {
  id: string;
  client: string;
  email: string;
  number: string;
  amount: number;
  currency: string;
  dueDate: string;
  note: string;
  pausedUntil: string;
  pauseNote: string;
  status: 'active' | 'paid';
  createdAt: string;
  updatedAt: string;
  history: ReminderEvent[];
};

export type Settings = {
  businessName: string;
  senderName: string;
  templates: StageTemplate[];
};

export const defaultTemplates: StageTemplate[] = [
  {
    id: 'due', afterDays: 0, name: 'A friendly check-in', tone: 'Due today',
    subject: 'Quick check-in on invoice {{invoice}}',
    body: 'Hi {{client}},\n\nJust a friendly check-in that invoice {{invoice}} for {{amount}} is due today. If payment is already on its way, please disregard this note.\n\nIf you need me to resend anything, I’m happy to help.\n\nThanks,\n{{sender}}'
  },
  {
    id: 'week', afterDays: 7, name: 'A clear reminder', tone: '7 days overdue',
    subject: 'Reminder: invoice {{invoice}}',
    body: 'Hi {{client}},\n\nI’m following up on invoice {{invoice}} for {{amount}}, which was due on {{dueDate}}. Could you let me know when I should expect payment?\n\nIf there’s a question or issue I can help resolve, please tell me.\n\nThanks,\n{{sender}}'
  },
  {
    id: 'fortnight', afterDays: 14, name: 'A direct follow-up', tone: '14 days overdue',
    subject: 'Follow-up needed: invoice {{invoice}}',
    body: 'Hi {{client}},\n\nI’m checking in again about invoice {{invoice}} for {{amount}}, due {{dueDate}}. Please reply with the expected payment date, or let me know if something is holding it up.\n\nI value our work together and would appreciate an update.\n\nThanks,\n{{sender}}'
  }
];

export const defaultSettings: Settings = {
  businessName: '',
  senderName: '',
  templates: defaultTemplates
};

export function localDate(date = new Date()): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to = localDate()): number {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

export function stageFor(invoice: Invoice, templates: StageTemplate[], today = localDate()): StageTemplate | undefined {
  const overdue = daysBetween(invoice.dueDate, today);
  return [...templates].sort((a, b) => b.afterDays - a.afterDays).find((stage) => overdue >= stage.afterDays);
}

export function isPaused(invoice: Invoice, today = localDate()): boolean {
  return Boolean(invoice.pausedUntil && invoice.pausedUntil >= today);
}

export function needsAttention(invoice: Invoice, templates: StageTemplate[], today = localDate()): boolean {
  if (invoice.status !== 'active' || isPaused(invoice, today)) return false;
  const stage = stageFor(invoice, templates, today);
  return Boolean(stage && !invoice.history.some((event) => event.kind === 'sent' && event.stageId === stage.id));
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function fillTemplate(text: string, invoice: Invoice, sender: string): string {
  const replacements: Record<string, string> = {
    client: invoice.client,
    invoice: invoice.number,
    amount: formatMoney(invoice.amount, invoice.currency),
    dueDate: formatDate(invoice.dueDate),
    sender: sender || 'Your name'
  };
  return text.replace(/\{\{(client|invoice|amount|dueDate|sender)\}\}/g, (_, key: string) => replacements[key]);
}

export function invoiceStatus(invoice: Invoice, templates: StageTemplate[], today = localDate()): string {
  if (invoice.status === 'paid') return 'Paid';
  if (isPaused(invoice, today)) return `Paused until ${formatDate(invoice.pausedUntil)}`;
  const days = daysBetween(invoice.dueDate, today);
  if (days < 0) return `Due in ${Math.abs(days)} day${days === -1 ? '' : 's'}`;
  if (needsAttention(invoice, templates, today)) return days === 0 ? 'Ready today' : `Ready · ${days} day${days === 1 ? '' : 's'} overdue`;
  return days === 0 ? 'Due today · prepared' : `${days} day${days === 1 ? '' : 's'} overdue · prepared`;
}
