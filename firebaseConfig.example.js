// Local setup:
//   1. Copy this file to `firebaseConfig.js` (the real one is gitignored).
//   2. Replace each placeholder with the value from your Firebase project:
//      Firebase Console → Project Settings → General → Your apps → Web app.
//   3. Also download `GoogleService-Info.plist` (iOS) and `google-services.json`
//      (Android) from the same Project Settings page and place them at the
//      project root — both are also gitignored.
//
// These values are "public" per Firebase's own guidance — security comes
// from Auth + Firestore rules, not from hiding the config — but we still
// don't commit them on the public repo to keep the project identity off
// GitHub.

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
