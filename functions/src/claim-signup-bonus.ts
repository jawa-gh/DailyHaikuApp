import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { grantSignupBonus } from './lib/user-doc';

// Pays the one-time signup bonus and reports whether this call was the one
// that did it.
//
// Why a callable rather than an auth trigger: the bonus also has to reach
// accounts that existed before the feature shipped, which an onCreate trigger
// would never fire for. One idempotent endpoint covers both populations.
//
// Why eager rather than only lazy: the spend helpers apply the bonus too, but
// only when the user generates something. That would mean an existing user sees
// the credits appear *after* they'd already spent one, and the "credits added"
// hint would arrive too late to be true. Calling this on app open makes the
// balance and the hint correct before the user does anything.
//
// The client calls this at most once per due account — it watches its own user
// doc and only calls when `signupBonusGranted` isn't already set. A second call
// is harmless regardless: the transaction no-ops and reports granted: false.

interface ClaimSignupBonusResponse {
  granted: boolean;
  credits: number;
}

export const claimSignupBonus = onCall<unknown, Promise<ClaimSignupBonusResponse>>(
  {
    region: 'europe-west3',
    // App Check enforcement is project-wide off for now (see generate-*.ts).
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to claim credits.');
    }

    try {
      return await grantSignupBonus(request.auth.uid);
    } catch (error) {
      console.error('claimSignupBonus failed for', request.auth.uid, error);
      throw new HttpsError('internal', 'Failed to claim credits.');
    }
  },
);
