import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Initialize the Admin SDK once per cold start. Cloud Functions provides
// default credentials automatically via the runtime environment.
if (getApps().length === 0) {
  initializeApp();
}

// Use the named "dailyhaiku" database, not (default). Must match the
// database ID passed to getFirestore on the client (lib/firebase.ts).
export const db: Firestore = getFirestore('dailyhaiku');
