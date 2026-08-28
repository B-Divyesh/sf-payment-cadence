import type { Invoice, Settings } from './model';
import { defaultSettings } from './model';

const DB_NAME = 'gentle-nudge';
const DB_VERSION = 1;
const STORE = 'workspace';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

export async function getValue<T>(key: string, fallback: T): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result ?? fallback);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function setValue<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadWorkspace(): Promise<{ invoices: Invoice[]; settings: Settings }> {
  const [invoices, settings] = await Promise.all([
    getValue<Invoice[]>('invoices', []),
    getValue<Settings>('settings', structuredClone(defaultSettings))
  ]);
  return { invoices, settings };
}

export async function clearWorkspace(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}
