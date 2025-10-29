import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Package, Event } from './api';

interface ParcelBoxDB extends DBSchema {
  packages: {
    key: string;
    value: Package;
    indexes: { 'by-device': string; 'by-date': string };
  };
  events: {
    key: string;
    value: Event;
    indexes: { 'by-device': string; 'by-type': string; 'by-date': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<ParcelBoxDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ParcelBoxDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ParcelBoxDB>('parcel-box-db', 1, {
    upgrade(db) {
      // Packages store
      if (!db.objectStoreNames.contains('packages')) {
        const packageStore = db.createObjectStore('packages', {
          keyPath: 'id',
        });
        packageStore.createIndex('by-device', 'deviceId');
        packageStore.createIndex('by-date', 'tsDetected');
      }

      // Events store
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', {
          keyPath: 'id',
        });
        eventStore.createIndex('by-device', 'deviceId');
        eventStore.createIndex('by-type', 'type');
        eventStore.createIndex('by-date', 'ts');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Package operations
export async function savePackages(packages: Package[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('packages', 'readwrite');
  await Promise.all(packages.map((pkg) => tx.store.put(pkg)));
  await tx.done;
}

export async function getPackages(limit = 50): Promise<Package[]> {
  const db = await getDB();
  const packages = await db.getAllFromIndex('packages', 'by-date');
  return packages.reverse().slice(0, limit);
}

// Event operations
export async function saveEvents(events: Event[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('events', 'readwrite');
  await Promise.all(events.map((evt) => tx.store.put(evt)));
  await tx.done;
}

export async function getEvents(limit = 100): Promise<Event[]> {
  const db = await getDB();
  const events = await db.getAllFromIndex('events', 'by-date');
  return events.reverse().slice(0, limit);
}

// Settings operations
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const value = await db.get('settings', key);
  return value?.value ?? defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}
