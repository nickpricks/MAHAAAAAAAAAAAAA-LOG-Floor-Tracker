import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from "firebase/firestore";
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
export const db = getFirestore(app);

/**
 * Authenticates the user anonymously and retrieves their full history from Firestore.
 * If mapping a local UUID to the cloud bucket, we ensure the cloud knows about this user.
 */
export async function initializeFirebaseSession(uuid: string): Promise<Record<string, DailyRecord> | null> {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    // We use the local UUID as the primary document key to link the device to the cloud.
    // In a prod app, we might just use the Firebase `user.uid`, but keeping our UUID allows
    // easier hash routing logic and sharing links.
    
    // Fetch user's existing data from Firestore
    const userRecordsRef = collection(db, `users/${uuid}/logs`);
    const snapshot = await getDocs(userRecordsRef);
    
    if (snapshot.empty) {
      return null;
    }

    const cloudRecords: Record<string, DailyRecord> = {};
    snapshot.forEach(doc => {
      cloudRecords[doc.id] = doc.data() as DailyRecord;
    });
    
    return cloudRecords;
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    return null;
  }
}

/**
 * Syncs a single daily record to the cloud.
 */
export async function syncRecordToCloud(uuid: string, dateStr: string, record: DailyRecord) {
  if (!uuid) return;
  try {
    const recordRef = doc(db, `users/${uuid}/logs`, dateStr);
    await setDoc(recordRef, record, { merge: true });
  } catch (error) {
    console.error("Firebase Sync Error:", error);
  }
}

/**
 * Mass syncs multiple records (useful for initial migration of existing local storage).
 */
export async function syncAllLocalToCloud(uuid: string, records: Record<string, DailyRecord>) {
  if (!uuid || Object.keys(records).length === 0) return;
  try {
    const batch = writeBatch(db);
    Object.values(records).forEach(record => {
      const recordRef = doc(db, `users/${uuid}/logs`, record.dateStr);
      batch.set(recordRef, record, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Firebase Batch Sync Error:", error);
  }
}
