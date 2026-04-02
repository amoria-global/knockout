/**
 * IndexedDB utility for persisting booking wizard drafts.
 * Saves/restores wizard state so users can resume where they left off.
 */

const DB_NAME = 'knockout_booking';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface BookingDraft {
  currentSlide: number;
  quickBrief: {
    eventDate: string;
    eventLocation: string;
    budgetMin: number;
    budgetMax: number;
    inclusivityPrefs: string[];
  } | null;
  selectedPhotographerId: string | null;
  selectedPackageId: string | null;
  paymentMilestone: {
    option: 'full' | 'half' | 'thirty';
    milestones: { label: string; percentage: number; amount: number }[];
  } | null;
  eventDetails: {
    title: string;
    description: string;
    eventType: string;
    startTime: string;
    endTime: string;
    guestCount: number | null;
    notes: string;
    organizer: string;
    tags: string[];
    groupDiscount: number;
    venueName: string;
  } | null;
  updatedAt: number;
}

function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft: BookingDraft): Promise<void> {
  if (!isAvailable()) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...draft, updatedAt: Date.now() }, DRAFT_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Silent — draft persistence is best-effort
  }
}

export async function loadDraft(): Promise<BookingDraft | null> {
  if (!isAvailable()) return null;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
    const result = await new Promise<BookingDraft | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as BookingDraft | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!result) return null;
    // Expire stale drafts
    if (Date.now() - result.updatedAt > EXPIRY_MS) {
      await clearDraft();
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  if (!isAvailable()) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Silent
  }
}
