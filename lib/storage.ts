import { Cat, DailyRecord } from "./types";

const CATS_KEY = "cat-health:cats";
const RECORDS_KEY = "cat-health:records";

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Cats ---

export function getCats(): Cat[] {
  return load<Cat>(CATS_KEY);
}

export function saveCat(cat: Cat): void {
  const cats = getCats();
  const idx = cats.findIndex((c) => c.id === cat.id);
  if (idx >= 0) {
    cats[idx] = cat;
  } else {
    cats.push(cat);
  }
  save(CATS_KEY, cats);
}

export function deleteCat(id: string): void {
  save(CATS_KEY, getCats().filter((c) => c.id !== id));
  save(
    RECORDS_KEY,
    load<DailyRecord>(RECORDS_KEY).filter((r) => r.catId !== id)
  );
}

// --- Records ---

export function getRecords(catId?: string): DailyRecord[] {
  const all = load<DailyRecord>(RECORDS_KEY);
  return catId ? all.filter((r) => r.catId === catId) : all;
}

export function getRecord(catId: string, date: string): DailyRecord | null {
  return getRecords(catId).find((r) => r.date === date) ?? null;
}

export function saveRecord(record: DailyRecord): void {
  const records = load<DailyRecord>(RECORDS_KEY);
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  save(RECORDS_KEY, records);
}

export function deleteRecord(id: string): void {
  save(RECORDS_KEY, load<DailyRecord>(RECORDS_KEY).filter((r) => r.id !== id));
}
