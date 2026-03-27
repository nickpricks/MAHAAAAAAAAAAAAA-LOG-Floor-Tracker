/**
 * Firebase integration and cloud synchronization utilities.
 * Handles anonymous authentication and Firestore database operations.
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, collection, writeBatch, onSnapshot, query, Unsubscribe } from "firebase/firestore";
import { DailyRecord } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyAA7FWIPFgAr72Fz1oUaFx6HfS_EqAXptU",
  authDomain: "maha-log.firebaseapp.com",
  projectId: "maha-log",
  storageBucket: "maha-log.firebasestorage.app",
  messagingSenderId: "821717807842",
  appId: "1:821717807842:web:79b7d3a580ad2928e5a4bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

/**
 * Initializes an anonymous Firebase session.
 * Data loading is handled by the onSnapshot real-time listener, not here.
 */
export const initializeFirebaseSession = async (): Promise<boolean> => {
  try {
    await signInAnonymously(auth);
    return true;
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    setSyncStatus('error');
    return false;
  }
};

/**
 * Fire-and-forget sync function. Merges a single day's record into the cloud database.
 * Thanks to Firestore's offline persistence, if this fails due to network loss, 
 * the sdk caches the mutation and replays it automatically when the user goes back online.
 */
export const syncRecordToCloud = async (userId: string, dateKey: string, record: DailyRecord) => {
  if (!userId) return;
  setSyncStatus('syncing');
  try {
    const recordRef = doc(db, `users/${userId}/logs`, dateKey);
    await setDoc(recordRef, record, { merge: true });
    setSyncStatus('synced');
  } catch (error) {
    console.error("Firebase Sync Error:", error);
    setSyncStatus('error');
  }
}

const FIRESTORE_BATCH_LIMIT = 499;

/**
 * mass syncs multiple records (useful for initial migration of existing local storage).
 */
export async function syncAllLocalToCloud(uuid: string, records: Record<string, DailyRecord>) {
  if (!uuid || Object.keys(records).length === 0) return;
  setSyncStatus('syncing');
  try {
    const entries = Object.values(records);
    for (let i = 0; i < entries.length; i += FIRESTORE_BATCH_LIMIT) {
      const chunk = entries.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach(record => {
        const recordRef = doc(db, `users/${uuid}/logs`, record.dateStr);
        batch.set(recordRef, record, { merge: true });
      });
      await batch.commit();
    }
    setSyncStatus('synced');
  } catch (error) {
    console.error("Firebase Batch Sync Error:", error);
    setSyncStatus('error');
  }
}

/**
 * Real-time subscription to a user's logs.
 * Returns an unsubscribe function.
 */
export const subscribeToUserLogs = (
  userId: string,
  onUpdate: (records: Record<string, DailyRecord>) => void
): Unsubscribe => {
  const q = query(collection(db, `users/${userId}/logs`));
  return onSnapshot(q, (snapshot) => {
    const records: Record<string, DailyRecord> = {};
    snapshot.forEach((doc) => {
      records[doc.id] = doc.data() as DailyRecord;
    });
    onUpdate(records);
  }, (error) => {
    console.error("Firestore Listen Error:", error);
    setSyncStatus('error');
  });
};

/**
 * User Settings Sync logic
 */
export type UserSettings = {
  theme?: 'light' | 'dark' | 'system';
  defaultChallenge?: string;
  email?: string;
  updatedAt?: number;
};

export const saveUserSettings = async (userId: string, settings: UserSettings) => {
  if (!userId) return;
  try {
    const settingsRef = doc(db, `users/${userId}/settings`, 'profile');
    await setDoc(settingsRef, { ...settings, updatedAt: Date.now() }, { merge: true });
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const subscribeToUserSettings = (
  userId: string,
  onUpdate: (settings: UserSettings) => void
): Unsubscribe => {
  const settingsRef = doc(db, `users/${userId}/settings`, 'profile');
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data() as UserSettings);
    }
  });
};

// Global sync state management
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';
let currentSyncStatus: SyncStatus = 'synced';
const listeners = new Set<(status: SyncStatus) => void>();

export const getSyncStatus = () => currentSyncStatus;

const setSyncStatus = (status: SyncStatus) => {
  if (currentSyncStatus === status) return;
  currentSyncStatus = status;
  listeners.forEach(l => l(status));
};

export const subscribeToSyncStatus = (listener: (status: SyncStatus) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

import { useState, useEffect } from 'react';

export const useSyncStatus = () => {
  const [status, setStatus] = useState<SyncStatus>(currentSyncStatus);
  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus(setStatus);
    return () => { unsubscribe(); };
  }, []);
  return status;
};
