import type { Invoice, ReminderEvent, Settings, StageTemplate } from './model';

export type WorkspaceBackup = { invoices: Invoice[]; settings: Settings };

export class BackupValidationError extends Error {
  constructor(message = 'That file is not a complete Gentle Nudge backup. Nothing was imported.') {
    super(message);
    this.name = 'BackupValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim().length > 0;
const isDate = (value: unknown): value is string => {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const isOptionalDate = (value: unknown): value is string => value === '' || isDate(value);
const isTimestamp = (value: unknown): value is string => isString(value) && !Number.isNaN(Date.parse(value));

function isReminderEvent(value: unknown): value is ReminderEvent {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id)
    && isTimestamp(value.at)
    && isNonEmptyString(value.stageId)
    && isNonEmptyString(value.stageName)
    && ['copied', 'email-opened', 'sent'].includes(String(value.kind));
}

function isInvoice(value: unknown): value is Invoice {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.client)
    && isNonEmptyString(value.email)
    && isNonEmptyString(value.number)
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && value.amount > 0
    && isString(value.currency)
    && /^[A-Z]{3}$/.test(value.currency)
    && isDate(value.dueDate)
    && isString(value.note)
    && isOptionalDate(value.pausedUntil)
    && isString(value.pauseNote)
    && (value.status === 'active' || value.status === 'paid')
    && isTimestamp(value.createdAt)
    && isTimestamp(value.updatedAt)
    && Array.isArray(value.history)
    && value.history.every(isReminderEvent);
}

function isTemplate(value: unknown): value is StageTemplate {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id)
    && Number.isInteger(value.afterDays)
    && Number(value.afterDays) >= 0
    && Number(value.afterDays) <= 120
    && isNonEmptyString(value.name)
    && isNonEmptyString(value.tone)
    && isNonEmptyString(value.subject)
    && isNonEmptyString(value.body);
}

function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;
  return isString(value.businessName)
    && isString(value.senderName)
    && Array.isArray(value.templates)
    && value.templates.length >= 1
    && value.templates.length <= 5
    && value.templates.every(isTemplate)
    && new Set(value.templates.map((template) => template.id)).size === value.templates.length;
}

export function parseWorkspaceBackup(value: unknown): WorkspaceBackup {
  if (!isRecord(value) || !Array.isArray(value.invoices) || !isRecord(value.settings) || !Array.isArray(value.settings.templates)) {
    throw new BackupValidationError('That file is not a Gentle Nudge backup.');
  }
  if (!value.invoices.every(isInvoice)
    || new Set(value.invoices.map((invoice) => invoice.id)).size !== value.invoices.length
    || !isSettings(value.settings)
    || ('version' in value && value.version !== 1)) {
    throw new BackupValidationError();
  }
  return structuredClone({ invoices: value.invoices, settings: value.settings });
}
