import './style.css';
import './contrast.css';
import './responsive.css';
import { clearWorkspace, loadWorkspace, setValue } from './db';
import {
  defaultSettings, daysBetween, fillTemplate, formatDate, formatMoney, invoiceStatus,
  isPaused, localDate, needsAttention, stageFor,
  type Invoice, type Settings, type StageTemplate
} from './model';

type View = 'today' | 'invoices' | 'templates' | 'settings';
type Draft = { invoiceId: string; stageId: string; subject: string; body: string };

const app = document.querySelector<HTMLDivElement>('#app')!;
let invoices: Invoice[] = [];
let settings: Settings = structuredClone(defaultSettings);
let view: View = 'today';
let draft: Draft | null = null;
let unlocked = false;
let loadError = '';
const e = (value: unknown) => String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function isLegalPage() { return location.pathname.startsWith('/privacy') || location.pathname.startsWith('/terms'); }

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = kind === 'privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} — Gentle Nudge`;
  app.innerHTML = `
    <header class="legal-head"><a class="brand-link" href="/" aria-label="Gentle Nudge home"><span class="brand-mark" aria-hidden="true">✉</span> Gentle Nudge</a></header>
    <main id="main" class="legal-page">
      <p class="eyebrow">Plain-language ${privacy ? 'privacy' : 'terms'}</p>
      <h1>${privacy ? 'Your reminders stay yours.' : 'A workspace, not a collections service.'}</h1>
      ${privacy ? `
        <p class="lede">Gentle Nudge stores invoice details, client contact details, notes, templates, and reminder history in IndexedDB on this device. We do not receive or read that information.</p>
        <h2>What leaves your device</h2><p>Nothing during normal use. If you buy or verify a license, the license token is sent to Sociobot’s billing API. Checkout is hosted by Sociobot/Dodo, the merchant of record. Opening an email draft passes the recipient, subject, and body to the email app you choose.</p>
        <h2>Your control</h2><p>You can export your workspace as JSON or invoices as CSV at any time, import a backup, and permanently delete all local data from Settings. Removing browser storage also removes it.</p>
        <h2>Offline and service worker</h2><p>The app shell is cached for offline use. No analytics, ad trackers, third-party scripts, or remote fonts run in this app.</p>
        <h2>Contact</h2><p>Privacy questions can be sent to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `
        <p class="lede">Gentle Nudge helps you prepare payment reminder drafts. You decide what to write, when to follow up, and whether to send.</p>
        <h2>Your responsibility</h2><p>Review every draft for accuracy, tone, contract terms, and local law. Gentle Nudge does not send messages, collect debts, predict payment, or provide legal or financial advice.</p>
        <h2>Purchase</h2><p>Gentle Nudge Plus is a one-time US $18 purchase. Sociobot/Dodo is the merchant of record and handles checkout and refunds. A refund or chargeback revokes the associated license. The free tier remains available without purchase.</p>
        <h2>Availability and data</h2><p>The software is provided “as is.” Your workspace is stored locally, so you are responsible for exporting backups. We may update the app while preserving the core human-review workflow.</p>
        <h2>Contact</h2><p>Questions can be sent to <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`}
      <p class="legal-updated">Effective 28 August 2026 · <a href="/">Return to the app</a></p>
    </main>`;
}

function shell() {
  const attention = invoices.filter((invoice) => needsAttention(invoice, settings.templates));
  app.innerHTML = `
    <div id="offline-banner" class="offline-banner" role="status" ${navigator.onLine ? 'hidden' : ''}>Offline — your workspace still works on this device.</div>
    <header class="masthead">
      <a href="/" class="wordmark" aria-label="Gentle Nudge, today"><span class="brand-mark" aria-hidden="true">✉</span><span><strong>Gentle Nudge</strong><small>Human-approved reminders</small></span></a>
      <nav aria-label="Workspace">
        ${navButton('today', `Today${attention.length ? ` <span class="count">${attention.length}</span>` : ''}`)}
        ${navButton('invoices', 'Invoices')}${navButton('templates', 'Cadence')}${navButton('settings', 'Settings')}
      </nav>
      <button class="button primary compact" data-action="add">Add invoice</button>
    </header>
    <main id="main" tabindex="-1">
      <div class="page-head"><p class="eyebrow">${view === 'today' ? formatDate(localDate()) : sectionEyebrow()}</p><h1>Gentle Nudge</h1></div>
      <div id="view">${renderView()}</div>
    </main>
    <footer><p>Private by default. Stored on this device.</p><div><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Original AI-assisted artwork</span></div></footer>
    <div id="toast" class="toast" role="status" aria-live="polite" aria-atomic="true"></div>
    <div id="dialog-root"></div>`;
}

function navButton(target: View, label: string) {
  return `<button class="nav-button" data-view="${target}" ${view === target ? 'aria-current="page"' : ''}>${label}</button>`;
}

function sectionEyebrow() {
  return ({ invoices: 'Every open thread', templates: 'Your words, at your pace', settings: 'Local data & access', today: '' } as Record<View, string>)[view];
}

function renderView(): string {
  if (loadError) return `<section class="error-state" role="alert"><p class="eyebrow">Storage problem</p><h2>Your workspace could not open.</h2><p>${e(loadError)}</p><button class="button secondary" data-action="reload">Try again</button></section>`;
  if (view === 'today') return renderToday();
  if (view === 'invoices') return renderInvoices();
  if (view === 'templates') return renderTemplates();
  return renderSettings();
}

function renderToday(): string {
  if (!invoices.length) return `
    <section class="welcome">
      <div class="welcome-copy"><p class="eyebrow">A calmer way to follow up</p><h2>Keep the relationship.<br><em>Lose the dread.</em></h2><p>Build a considerate cadence, see who needs attention, and review every word before it leaves your hands.</p><button class="button primary" data-action="add">Add your first invoice</button><p class="reassurance"><span aria-hidden="true">●</span> Nothing sends automatically</p></div>
      <picture class="hero-art"><source type="image/avif" srcset="/assets/gentle-nudge-landscape-640.avif 640w, /assets/gentle-nudge-landscape-960.avif 960w" sizes="(max-width: 640px) 100vw, 55vw"><source type="image/webp" srcset="/assets/gentle-nudge-landscape-640.webp 640w, /assets/gentle-nudge-landscape-960.webp 960w" sizes="(max-width: 640px) 100vw, 55vw"><img src="/assets/gentle-nudge-landscape-960.jpg" srcset="/assets/gentle-nudge-landscape-640.jpg 640w, /assets/gentle-nudge-landscape-960.jpg 960w" sizes="(max-width: 640px) 100vw, 55vw" width="960" height="640" alt="A surreal paper landscape where an envelope rests on three coral stepping stones beneath a blue moon" decoding="async" fetchpriority="high"></picture>
    </section>`;
  const active = invoices.filter((i) => i.status === 'active');
  const ready = active.filter((i) => needsAttention(i, settings.templates)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const paused = active.filter((i) => isPaused(i));
  const upcoming = active.filter((i) => daysBetween(i.dueDate) < 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return `
    <section class="today-intro"><div><h2>${ready.length ? `${ready.length} thoughtful follow-up${ready.length === 1 ? '' : 's'} to prepare` : 'You’re caught up.'}</h2><p>${ready.length ? 'These have reached their next cadence step. Review each one in your own voice.' : 'Nothing has reached its next step today. Your upcoming dates are below.'}</p></div><div class="today-mark" aria-hidden="true"><span>${ready.length}</span><small>ready</small></div></section>
    <div class="cadence-track" aria-hidden="true"><span></span><i></i><i></i><i></i></div>
    <section aria-labelledby="ready-heading"><div class="section-title"><h2 id="ready-heading">Ready to prepare</h2><span>${ready.length}</span></div>${ready.length ? `<div class="invoice-list">${ready.map(invoiceCard).join('')}</div>` : `<div class="quiet-state"><span aria-hidden="true">✓</span><p>No drafts are waiting. That is a good kind of quiet.</p></div>`}</section>
    ${(paused.length || upcoming.length) ? `<section class="later-section" aria-labelledby="later-heading"><div class="section-title"><h2 id="later-heading">Later on the path</h2><span>${paused.length + upcoming.length}</span></div><div class="mini-list">${[...paused, ...upcoming].slice(0, 5).map((i) => `<button data-action="edit" data-id="${i.id}"><span><strong>${e(i.client)}</strong><small>${e(i.number)}</small></span><span>${e(invoiceStatus(i, settings.templates))}</span></button>`).join('')}</div></section>` : ''}`;
}

function invoiceCard(invoice: Invoice): string {
  const stage = stageFor(invoice, settings.templates)!;
  return `<article class="invoice-slip">
    <div class="slip-main"><p class="stage-label"><span aria-hidden="true">○</span>${e(stage.name)}</p><h3>${e(invoice.client)}</h3><p>${e(invoice.number)} · ${e(formatMoney(invoice.amount, invoice.currency))}</p>${invoice.note ? `<p class="client-note">“${e(invoice.note)}”</p>` : ''}</div>
    <div class="slip-meta"><span>${daysBetween(invoice.dueDate) === 0 ? 'Due today' : `${daysBetween(invoice.dueDate)} days overdue`}</span><small>Due ${e(formatDate(invoice.dueDate))}</small></div>
    <div class="slip-actions"><button class="button primary" data-action="draft" data-id="${invoice.id}">Review draft</button><button class="button text" data-action="pause" data-id="${invoice.id}">Pause</button></div>
  </article>`;
}

function renderInvoices(): string {
  const sorted = [...invoices].sort((a, b) => (a.status === b.status ? a.dueDate.localeCompare(b.dueDate) : a.status === 'active' ? -1 : 1));
  return `<section class="workspace-title"><div><h2>Invoices</h2><p>Dates and context stay on this device.</p></div><button class="button primary" data-action="add">Add invoice</button></section>
    ${sorted.length ? `<div class="table-wrap"><table><thead><tr><th>Client & invoice</th><th>Amount</th><th>Due</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${sorted.map(invoiceRow).join('')}</tbody></table></div>` : `<div class="empty-inline"><h2>No invoices yet</h2><p>Add one to start a private, review-first cadence.</p><button class="button primary" data-action="add">Add invoice</button></div>`}`;
}

function invoiceRow(invoice: Invoice): string {
  const lastSent = invoice.history.filter((event) => event.kind === 'sent').at(-1);
  return `<tr><td><strong>${e(invoice.client)}</strong><small>${e(invoice.number)} · ${e(invoice.email)}</small></td><td class="number">${e(formatMoney(invoice.amount, invoice.currency))}</td><td>${e(formatDate(invoice.dueDate))}</td><td><span class="status ${invoice.status === 'paid' ? 'success' : needsAttention(invoice, settings.templates) ? 'ready' : ''}">${e(invoiceStatus(invoice, settings.templates))}</span>${invoice.pauseNote && isPaused(invoice) ? `<small>${e(invoice.pauseNote)}</small>` : ''}${lastSent ? `<small>Last sent ${e(new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(lastSent.at)))} · ${e(lastSent.stageName)}</small>` : ''}</td><td><div class="row-menu"><button class="button text" data-action="edit" data-id="${invoice.id}">Edit</button><button class="button text" data-action="toggle-paid" data-id="${invoice.id}">${invoice.status === 'paid' ? 'Reopen' : 'Mark paid'}</button></div></td></tr>`;
}

function renderTemplates(): string {
  return `<section class="workspace-title"><div><h2>Your cadence</h2><p>Each step becomes available only when its date arrives. You still review and send.</p></div></section>
    <div class="template-list">${[...settings.templates].sort((a,b) => a.afterDays-b.afterDays).map((stage, index) => `
      <form class="template-sheet" data-template="${stage.id}"><div class="step-number">${String(index + 1).padStart(2, '0')}</div><div class="template-fields">
        <div class="template-head"><label>Step name<input name="name" value="${e(stage.name)}" required></label><label>Days after due<input name="afterDays" type="number" min="0" max="120" value="${stage.afterDays}" required></label></div>
        <label>Subject<input name="subject" value="${e(stage.subject)}" required></label><label>Message<textarea name="body" rows="8" required>${e(stage.body)}</textarea></label>
        <div class="template-foot"><p>Use: <code>{{client}}</code> <code>{{invoice}}</code> <code>{{amount}}</code> <code>{{dueDate}}</code> <code>{{sender}}</code></p><button class="button secondary" type="submit">Save this step</button></div>
      </div></form>`).join('')}</div>
    ${unlocked ? `<button class="button secondary" data-action="add-stage" ${settings.templates.length >= 5 ? 'disabled' : ''}>Add another step</button>` : `<aside class="upgrade-strip"><div><p class="eyebrow">Gentle Nudge Plus</p><h2>Need a longer cadence?</h2><p>Unlock up to five steps and unlimited active invoices with a one-time US $18 purchase.</p></div><a class="button primary" href="https://api.sociobot.in/api/v1/products/payment-cadence/checkout">Unlock Plus</a></aside>`}`;
}

function renderSettings(): string {
  return `<div class="settings-grid">
    <section><h2>Your sign-off</h2><p>Used only to fill <code>{{sender}}</code> in drafts.</p><form id="profile-form"><label>Your name<input name="senderName" value="${e(settings.senderName)}" autocomplete="name"></label><label>Business name <span>Optional</span><input name="businessName" value="${e(settings.businessName)}" autocomplete="organization"></label><button class="button secondary" type="submit">Save details</button></form></section>
    <section><h2>Gentle Nudge Plus</h2>${unlocked ? `<p class="license-state success"><span aria-hidden="true">✓</span> Plus is active on this device.</p><p>You have unlimited active invoices and up to five cadence steps.</p>` : `<p>Free includes three editable steps and up to five active invoices. Plus removes that limit and adds two more steps.</p><p><strong>US $18 once.</strong> No subscription.</p><a class="button primary" href="https://api.sociobot.in/api/v1/products/payment-cadence/checkout">Buy Plus</a><form id="license-form"><label>Have a license? Paste it here<input name="license" autocomplete="off" spellcheck="false"></label><button class="button secondary" type="submit">Restore purchase</button></form>`}<p id="license-note" class="form-note" role="status"></p></section>
    <section class="data-section"><h2>Your data</h2><p>Export a full backup for this app, or a spreadsheet-friendly invoice list. Import replaces nothing: records with the same ID are updated.</p><div class="button-cluster"><button class="button secondary" data-action="export-json">Export backup</button><button class="button secondary" data-action="export-csv">Export CSV</button><label class="button secondary file-button">Import backup<input id="import-file" type="file" accept="application/json"></label></div><button class="danger-link" data-action="delete-all">Delete all local data</button></section>
    <section><h2>What this app never does</h2><ul class="promise-list"><li>Sends or schedules an email</li><li>Connects to your bank or invoice account</li><li>Scores clients or predicts payment</li><li>Uses collection threats</li></ul></section>
  </div>`;
}

function invoiceDialog(invoice?: Invoice) {
  const editing = Boolean(invoice);
  const root = document.querySelector('#dialog-root')!;
  root.innerHTML = `<dialog class="dialog"><form method="dialog" class="dialog-close"><button value="cancel" aria-label="Close dialog">×</button></form><form id="invoice-form" data-id="${invoice?.id ?? ''}"><p class="eyebrow">${editing ? 'Update context' : 'A new thread'}</p><h2>${editing ? 'Edit invoice' : 'Add an invoice'}</h2><p class="dialog-intro">Only the details needed to prepare a reminder. Everything stays on this device.</p><div class="form-grid"><label>Client name<input name="client" value="${e(invoice?.client)}" required autofocus></label><label>Client email<input name="email" type="email" value="${e(invoice?.email)}" required></label><label>Invoice number<input name="number" value="${e(invoice?.number)}" required></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" value="${invoice?.amount ?? ''}" required></label><label>Currency<select name="currency">${['USD','EUR','GBP','INR','CAD','AUD'].map((c) => `<option ${invoice?.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Due date<input name="dueDate" type="date" value="${invoice?.dueDate ?? localDate()}" required></label><label class="full">Relationship note <span>Optional</span><textarea name="note" rows="3">${e(invoice?.note)}</textarea><small>For your eyes only, e.g. “Accounts team changed this month.”</small></label></div><p class="form-error" role="alert"></p><div class="dialog-actions">${editing ? `<button class="danger-link" type="button" data-action="delete-invoice" data-id="${invoice!.id}">Delete invoice</button>` : '<span></span>'}<button class="button secondary" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">${editing ? 'Save changes' : 'Add to cadence'}</button></div></form></dialog>`;
  showDialog(root.querySelector('dialog')!);
}

function pauseDialog(invoice: Invoice) {
  const root = document.querySelector('#dialog-root')!;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  root.innerHTML = `<dialog class="dialog small-dialog"><form method="dialog" class="dialog-close"><button value="cancel" aria-label="Close dialog">×</button></form><form id="pause-form" data-id="${invoice.id}"><p class="eyebrow">Make room for context</p><h2>Pause ${e(invoice.client)}</h2><label>Pause until<input name="pausedUntil" type="date" min="${localDate(tomorrow)}" value="${invoice.pausedUntil || localDate(tomorrow)}" required></label><label>Why are you pausing? <span>Optional</span><textarea name="pauseNote" rows="3">${e(invoice.pauseNote)}</textarea></label><p class="form-note">This note stays private. The invoice will leave Today until this date.</p><div class="dialog-actions"><span></span><button class="button secondary" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Pause reminders</button></div></form></dialog>`;
  showDialog(root.querySelector('dialog')!);
}

function draftDialog(invoice: Invoice) {
  const stage = stageFor(invoice, settings.templates);
  if (!stage) return;
  draft = { invoiceId: invoice.id, stageId: stage.id, subject: fillTemplate(stage.subject, invoice, settings.senderName), body: fillTemplate(stage.body, invoice, settings.senderName) };
  const root = document.querySelector('#dialog-root')!;
  root.innerHTML = `<dialog class="dialog draft-dialog"><form method="dialog" class="dialog-close"><button value="cancel" aria-label="Close dialog">×</button></form><div class="draft-layout"><aside><p class="eyebrow">${e(stage.tone)}</p><h2>${e(invoice.client)}</h2><dl><div><dt>Invoice</dt><dd>${e(invoice.number)}</dd></div><div><dt>Amount</dt><dd>${e(formatMoney(invoice.amount, invoice.currency))}</dd></div><div><dt>Due</dt><dd>${e(formatDate(invoice.dueDate))}</dd></div></dl>${invoice.note ? `<div class="private-note"><strong>Private context</strong><p>${e(invoice.note)}</p></div>` : ''}<p class="human-note"><span aria-hidden="true">✦</span> Nothing sends until you choose your email app.</p></aside><form id="draft-form"><p class="eyebrow">Review every word</p><label>To<input value="${e(invoice.email)}" readonly></label><label>Subject<input name="subject" value="${e(draft.subject)}" required></label><label>Message<textarea name="body" rows="14" required>${e(draft.body)}</textarea></label><p class="form-note">Edit freely. Your changes affect this draft only.</p><div class="draft-actions"><button class="button secondary" type="button" data-action="copy-draft">Copy message</button><button class="button primary" type="button" data-action="email-draft">Open email draft</button><button class="button text sent-button" type="button" data-action="mark-sent">I sent it</button></div></form></div></dialog>`;
  showDialog(root.querySelector('dialog')!);
}

function showDialog(dialog: HTMLDialogElement) {
  dialog.addEventListener('close', () => { dialog.remove(); draft = null; });
  dialog.showModal();
}

function toast(message: string) {
  const node = document.querySelector<HTMLDivElement>('#toast');
  if (!node) return;
  node.textContent = message; node.classList.add('show');
  window.setTimeout(() => node.classList.remove('show'), 3200);
}

async function persistInvoices() { await setValue('invoices', invoices); }
async function persistSettings() { await setValue('settings', settings); }

function rerender(announcement?: string) { shell(); if (announcement) toast(announcement); }

document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-view]');
  if (!button) return;
  if (button.dataset.view) { view = button.dataset.view as View; shell(); document.querySelector<HTMLElement>('#main')?.focus(); return; }
  const action = button.dataset.action;
  const invoice = invoices.find((item) => item.id === button.dataset.id);
  if (action === 'add') {
    if (!unlocked && invoices.filter((i) => i.status === 'active').length >= 5) { view = 'settings'; rerender('Free supports five active invoices. Unlock Plus or mark one paid.'); return; }
    invoiceDialog();
  }
  if (action === 'edit' && invoice) invoiceDialog(invoice);
  if (action === 'pause' && invoice) pauseDialog(invoice);
  if (action === 'draft' && invoice) draftDialog(invoice);
  if (action === 'close-dialog') button.closest('dialog')?.close();
  if (action === 'reload') location.reload();
  if (action === 'toggle-paid' && invoice) { invoice.status = invoice.status === 'paid' ? 'active' : 'paid'; invoice.updatedAt = new Date().toISOString(); await persistInvoices(); rerender(invoice.status === 'paid' ? `${invoice.client} marked paid.` : `${invoice.client} reopened.`); }
  if (action === 'delete-invoice' && invoice && confirm(`Delete ${invoice.client} · ${invoice.number}? This cannot be undone.`)) { invoices = invoices.filter((i) => i.id !== invoice.id); await persistInvoices(); button.closest('dialog')?.close(); rerender('Invoice deleted.'); }
  if (action === 'copy-draft') await outputDraft('copied');
  if (action === 'email-draft') await outputDraft('email-opened');
  if (action === 'mark-sent') await markSent();
  if (action === 'add-stage' && unlocked && settings.templates.length < 5) { const count = settings.templates.length + 1; settings.templates.push({ id: crypto.randomUUID(), afterDays: settings.templates.at(-1)!.afterDays + 14, name: `Follow-up ${count}`, tone: 'Later follow-up', subject: 'Following up: invoice {{invoice}}', body: 'Hi {{client}},\n\nI’m following up again about invoice {{invoice}} for {{amount}}, due {{dueDate}}. Please let me know the expected payment date.\n\nThanks,\n{{sender}}' }); await persistSettings(); rerender('Cadence step added.'); }
  if (action === 'export-json') download('gentle-nudge-backup.json', JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), invoices, settings }, null, 2), 'application/json');
  if (action === 'export-csv') exportCsv();
  if (action === 'delete-all' && confirm('Delete every invoice, note, template change, and reminder history from this device? This cannot be undone.')) { await clearWorkspace(); invoices = []; settings = structuredClone(defaultSettings); rerender('All local workspace data was deleted.'); }
});

document.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement;
  if (!form.matches('#invoice-form, #pause-form, #profile-form, #license-form, .template-sheet')) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === 'invoice-form') {
    const existing = invoices.find((i) => i.id === form.dataset.id);
    const now = new Date().toISOString();
    const record: Invoice = { id: existing?.id ?? crypto.randomUUID(), client: String(data.get('client')).trim(), email: String(data.get('email')).trim(), number: String(data.get('number')).trim(), amount: Number(data.get('amount')), currency: String(data.get('currency')), dueDate: String(data.get('dueDate')), note: String(data.get('note')).trim(), pausedUntil: existing?.pausedUntil ?? '', pauseNote: existing?.pauseNote ?? '', status: existing?.status ?? 'active', createdAt: existing?.createdAt ?? now, updatedAt: now, history: existing?.history ?? [] };
    if (!record.client || !record.email || !record.number || record.amount <= 0 || !record.dueDate) return;
    invoices = existing ? invoices.map((i) => i.id === record.id ? record : i) : [...invoices, record];
    await persistInvoices(); form.closest('dialog')?.close(); rerender(existing ? 'Invoice updated.' : 'Invoice added to your cadence.');
  }
  if (form.id === 'pause-form') { const invoice = invoices.find((i) => i.id === form.dataset.id)!; invoice.pausedUntil = String(data.get('pausedUntil')); invoice.pauseNote = String(data.get('pauseNote')).trim(); invoice.updatedAt = new Date().toISOString(); await persistInvoices(); form.closest('dialog')?.close(); rerender(`${invoice.client} paused until ${formatDate(invoice.pausedUntil)}.`); }
  if (form.id === 'profile-form') { settings.senderName = String(data.get('senderName')).trim(); settings.businessName = String(data.get('businessName')).trim(); await persistSettings(); rerender('Your sign-off was saved.'); }
  if (form.classList.contains('template-sheet')) { const stage = settings.templates.find((s) => s.id === form.dataset.template)!; stage.name = String(data.get('name')).trim(); stage.afterDays = Number(data.get('afterDays')); stage.subject = String(data.get('subject')).trim(); stage.body = String(data.get('body')).trim(); await persistSettings(); rerender('Cadence step saved.'); }
  if (form.id === 'license-form') { const token = String(data.get('license')).trim(); if (token) { localStorage.setItem('sb_license:payment-cadence', token); await verifyLicense(token, true); } }
});

document.addEventListener('change', async (event) => {
  const input = event.target as HTMLInputElement;
  if (input.id !== 'import-file' || !input.files?.[0]) return;
  try {
    const parsed = JSON.parse(await input.files[0].text()) as { invoices?: Invoice[]; settings?: Settings };
    if (!Array.isArray(parsed.invoices) || !parsed.settings?.templates) throw new Error('That file is not a Gentle Nudge backup.');
    const merged = new Map(invoices.map((i) => [i.id, i])); parsed.invoices.forEach((i) => merged.set(i.id, i));
    invoices = [...merged.values()]; settings = parsed.settings; await Promise.all([persistInvoices(), persistSettings()]); rerender(`Imported ${parsed.invoices.length} invoice${parsed.invoices.length === 1 ? '' : 's'}.`);
  } catch (error) { toast(error instanceof Error ? error.message : 'The backup could not be imported.'); }
  input.value = '';
});

async function outputDraft(kind: 'copied' | 'email-opened') {
  if (!draft) return;
  const form = document.querySelector<HTMLFormElement>('#draft-form')!;
  draft.subject = String(new FormData(form).get('subject')); draft.body = String(new FormData(form).get('body'));
  const invoice = invoices.find((i) => i.id === draft!.invoiceId)!;
  const stage = settings.templates.find((s) => s.id === draft!.stageId)!;
  invoice.history.push({ id: crypto.randomUUID(), at: new Date().toISOString(), stageId: stage.id, stageName: stage.name, kind }); await persistInvoices();
  if (kind === 'copied') { try { await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`); toast('Message copied. Nothing was sent.'); } catch { toast('Copy was blocked. Select the message and copy it manually.'); } }
  else { location.href = `mailto:${encodeURIComponent(invoice.email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`; toast('Email draft opened. Return here to mark it sent.'); }
}

async function markSent() {
  if (!draft) return;
  const invoice = invoices.find((i) => i.id === draft!.invoiceId)!;
  const stage = settings.templates.find((s) => s.id === draft!.stageId)!;
  invoice.history.push({ id: crypto.randomUUID(), at: new Date().toISOString(), stageId: stage.id, stageName: stage.name, kind: 'sent' }); invoice.updatedAt = new Date().toISOString(); await persistInvoices();
  document.querySelector<HTMLDialogElement>('.draft-dialog')?.close(); rerender(`${invoice.client} marked sent. The next step will wait for its date.`);
}

function download(name: string, value: string, type: string) { const url = URL.createObjectURL(new Blob([value], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function exportCsv() { const cells = (values: unknown[]) => values.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','); const rows = [cells(['Client','Email','Invoice','Amount','Currency','Due date','Status','Private note']), ...invoices.map((i) => cells([i.client,i.email,i.number,i.amount,i.currency,i.dueDate,i.status,i.note]))]; download('gentle-nudge-invoices.csv', rows.join('\n'), 'text/csv'); }

async function verifyLicense(token: string, force = false) {
  const cacheKey = 'sb_license_verdict:payment-cadence';
  const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null') as { valid: boolean; at: number } | null;
  if (cached?.valid) unlocked = true;
  if (!force && cached && Date.now() - cached.at < 86400000) return;
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/payment-cadence/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification is temporarily unavailable.');
    const result = await response.json() as { valid: boolean; reason: string };
    unlocked = result.valid; localStorage.setItem(cacheKey, JSON.stringify({ valid: result.valid, at: Date.now() }));
    if (result.valid) { rerender('Gentle Nudge Plus is active.'); }
    else { localStorage.removeItem(cacheKey); rerender('That license is no longer active. The free workspace is still available.'); }
  } catch { if (force) { const note = document.querySelector('#license-note'); if (note) note.textContent = 'Could not verify right now. Check your connection and try again.'; } }
}

async function initLicense() {
  const params = new URLSearchParams(location.search); const incoming = params.get('license');
  if (incoming) { localStorage.setItem('sb_license:payment-cadence', incoming); params.delete('license'); history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`); }
  const token = incoming || localStorage.getItem('sb_license:payment-cadence'); if (token) await verifyLicense(token, Boolean(incoming));
}

function connectivity() { const banner = document.querySelector<HTMLElement>('#offline-banner'); if (banner) banner.hidden = navigator.onLine; }
window.addEventListener('online', () => { connectivity(); toast('Back online. Your local work is unchanged.'); });
window.addEventListener('offline', connectivity);

async function registerWorker() {
  if (!('serviceWorker' in navigator) || location.port === '5173') return;
  const registration = await navigator.serviceWorker.register('/sw.js');
  registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) { toast('An update is ready. Refresh when convenient.'); } }); });
}

async function init() {
  if (isLegalPage()) { legalPage(location.pathname.startsWith('/privacy') ? 'privacy' : 'terms'); return; }
  try { ({ invoices, settings } = await loadWorkspace()); } catch (error) { loadError = error instanceof Error ? error.message : 'Local storage is unavailable. Check your browser privacy settings.'; }
  await initLicense(); shell(); await registerWorker();
}

void init();
