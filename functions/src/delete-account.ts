import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { db } from './lib/firestore';

// RevenueCat SECRET key (prefix `sk_`), for the server-side delete-subscriber
// REST call. Distinct from the public SDK keys in the app and from the webhook
// auth secret. Set with: firebase functions:secrets:set REVENUECAT_SECRET_KEY
const revenueCatSecretKey = defineSecret('REVENUECAT_SECRET_KEY');

// Best-effort deletion of the RevenueCat subscriber tied to this user. We pass
// the Firebase UID as the app_user_id when calling Purchases.logIn on the
// client, so it's the RC subscriber id too. Failures are logged but never
// block account deletion — RC retains some purchase data for tax/compliance
// regardless, and the user's app account + data are the priority.
async function deleteRevenueCatSubscriber(uid: string): Promise<void> {
  const key = revenueCatSecretKey.value();
  if (!key) {
    console.warn('[deleteAccount] REVENUECAT_SECRET_KEY empty — skipping RC deletion');
    return;
  }
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } },
    );
    // 200 = deleted, 404 = no such subscriber (never purchased) — both fine.
    if (!res.ok && res.status !== 404) {
      console.error(`[deleteAccount] RevenueCat deletion returned ${res.status}`);
    }
  } catch (error) {
    console.error('[deleteAccount] RevenueCat deletion failed (non-fatal):', error);
  }
}

// Account deletion. Apple (and GDPR Art. 17) require an in-app path to delete
// the account and its server-side data. Done server-side with the Admin SDK so
// it can remove the Auth user without forcing a recent re-login (which the
// client-side user.delete() would require).
//
// Local on-device data (haiku archive + generated image files) is cleared by
// the client after this resolves — see AuthProvider.deleteAccount +
// HaikuProvider.clearLocalData.

interface DeleteAccountResponse {
  success: boolean;
}

export const deleteAccount = onCall<unknown, Promise<DeleteAccountResponse>>(
  {
    region: 'europe-west3',
    secrets: [revenueCatSecretKey],
    // App Check enforcement is project-wide off for now (see generate-*.ts).
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to delete your account.');
    }
    const uid = request.auth.uid;

    try {
      // 1. Per-user state document (credits, daily-free, starterClaimed).
      await db.doc(`users/${uid}`).delete();

      // 2. RevenueCat idempotency-ledger entries that reference this user.
      const txSnap = await db
        .collection('processedTransactions')
        .where('uid', '==', uid)
        .get();
      if (!txSnap.empty) {
        const batch = db.batch();
        txSnap.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      // 3. RevenueCat subscriber (best-effort — never blocks deletion).
      await deleteRevenueCatSubscriber(uid);

      // 4. The Firebase Auth user — last, so a mid-way failure leaves the
      //    account intact and the operation safely retryable.
      await getAuth().deleteUser(uid);

      return { success: true };
    } catch (error) {
      console.error('Account deletion failed for', uid, error);
      throw new HttpsError('internal', 'Failed to delete account.');
    }
  },
);
