// Authoritative credit and daily-free state. All credit mutations go through
// these transactional helpers — Firestore security rules block direct writes
// from clients, so the server is the only writer.

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db } from './firestore';

export const HAIKU_CREDIT_COST = 1;
export const IMAGE_CREDIT_COST = 2;

/**
 * Credits handed to a brand-new account so it can try the paid features once
 * before deciding whether to buy: two custom haikus on the premium model, or
 * one piece of artwork. The daily free haiku is separate and unaffected.
 *
 * Keep in sync with SIGNUP_BONUS_CREDITS in `types/auth.ts`, which only exists
 * so the sign-in screen can name the number without hardcoding it.
 */
export const SIGNUP_BONUS_CREDITS = 2;

export interface UserDoc {
  credits: number;
  dailyFree: { date: string; used: boolean };
  starterClaimed: boolean;
  /**
   * Set the moment the doc is created, so the signup bonus can never be paid
   * twice — not by a retried transaction, and not by a later code path that
   * also lazily creates the doc.
   */
  signupBonusGranted: boolean;
  updatedAt: Timestamp;
}

const DEFAULT_USER: Omit<UserDoc, 'updatedAt'> = {
  credits: 0,
  dailyFree: { date: '', used: false },
  starterClaimed: false,
  signupBonusGranted: false,
};

/**
 * Add the signup bonus if this account hasn't had it yet, otherwise return the
 * state untouched. Keyed on `signupBonusGranted`, so it pays out exactly once
 * per account and is safe to call from any transaction.
 *
 * This covers BOTH populations with one rule:
 *   - brand-new accounts (no doc yet) start from DEFAULT_USER and get the bonus
 *   - accounts that predate the feature have a doc with no `signupBonusGranted`
 *     field, which is falsy, so they get it on their next touch too
 *
 * `grantSignupBonus` below is the eager path that makes the credits show up on
 * app open. Applying it in the spend paths as well is a deliberate safety net:
 * if that call never lands (offline, cold start failure), the user still gets
 * their credits the moment they try to use the app — and gets them BEFORE the
 * sufficiency check, so the bonus is immediately spendable.
 */
function applySignupBonusIfDue(
  state: Omit<UserDoc, 'updatedAt'>,
): Omit<UserDoc, 'updatedAt'> {
  if (state.signupBonusGranted) return state;
  return {
    ...state,
    credits: (state.credits ?? 0) + SIGNUP_BONUS_CREDITS,
    signupBonusGranted: true,
  };
}

function readState(snap: { exists: boolean; data: () => unknown }) {
  return applySignupBonusIfDue(
    snap.exists
      ? (snap.data() as UserDoc)
      : { ...DEFAULT_USER },
  );
}

/**
 * Eagerly pay the signup bonus, creating the user doc if needed. Called once
 * per due account by the client right after sign-in / on app open, so the
 * credits badge and the one-time hint don't have to wait for a generation.
 *
 * Idempotent: a second call is a no-op that reports `granted: false`.
 */
export async function grantSignupBonus(
  uid: string,
): Promise<{ granted: boolean; credits: number }> {
  return await db.runTransaction(async (tx) => {
    const ref = db.doc(`users/${uid}`);
    const snap = await tx.get(ref);

    const current: Omit<UserDoc, 'updatedAt'> = snap.exists
      ? (snap.data() as UserDoc)
      : { ...DEFAULT_USER };

    if (current.signupBonusGranted) {
      return { granted: false, credits: current.credits ?? 0 };
    }

    const next = applySignupBonusIfDue(current);
    tx.set(
      ref,
      { ...next, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { granted: true, credits: next.credits };
  });
}

/** Today's date as YYYY-MM-DD in UTC. */
export function getTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sentinel exception for "user has neither a free slot nor enough credits". */
export class InsufficientFundsError extends Error {
  constructor() {
    super('NOT_ENOUGH_CREDITS');
    this.name = 'InsufficientFundsError';
  }
}

/**
 * Try to spend resources for a single haiku generation. Prefers the daily-free
 * slot; falls back to deducting 1 credit. Returns which one was used so the
 * caller can pick the right OpenAI model and so refunds reverse the right
 * field on failure.
 */
export async function spendForHaiku(
  uid: string,
): Promise<{ usedFree: boolean }> {
  return await db.runTransaction(async (tx) => {
    const ref = db.doc(`users/${uid}`);
    const snap = await tx.get(ref);
    const state: Omit<UserDoc, 'updatedAt'> = readState(snap);

    const today = getTodayUtc();
    const freeAvailable =
      state.dailyFree.date !== today || !state.dailyFree.used;

    if (freeAvailable) {
      tx.set(
        ref,
        {
          ...state,
          dailyFree: { date: today, used: true },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { usedFree: true };
    }

    if (state.credits < HAIKU_CREDIT_COST) {
      throw new InsufficientFundsError();
    }

    tx.set(
      ref,
      {
        ...state,
        credits: state.credits - HAIKU_CREDIT_COST,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { usedFree: false };
  });
}

/**
 * Reverse a spendForHaiku, called when OpenAI failed after the deduction
 * already committed. Idempotency is loose — the worst case if this runs twice
 * is the user gets one extra free slot or one extra credit, which we'd rather
 * have than the alternative.
 */
export async function refundHaiku(
  uid: string,
  usedFree: boolean,
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`users/${uid}`);
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const state = snap.data() as UserDoc;

    if (usedFree) {
      tx.set(
        ref,
        {
          dailyFree: { ...state.dailyFree, used: false },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      tx.set(
        ref,
        {
          credits: state.credits + HAIKU_CREDIT_COST,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  });
}

/** Spend IMAGE_CREDIT_COST credits. Throws InsufficientFundsError if short. */
export async function spendForImage(uid: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`users/${uid}`);
    const snap = await tx.get(ref);
    const state: Omit<UserDoc, 'updatedAt'> = readState(snap);

    if (state.credits < IMAGE_CREDIT_COST) {
      throw new InsufficientFundsError();
    }

    tx.set(
      ref,
      {
        ...state,
        credits: state.credits - IMAGE_CREDIT_COST,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function refundImage(uid: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`users/${uid}`);
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const state = snap.data() as UserDoc;
    tx.set(
      ref,
      {
        credits: state.credits + IMAGE_CREDIT_COST,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/**
 * Grant credits idempotently using the RevenueCat event ID as the dedup key.
 * If the same event is replayed (RC retries on 5xx, or a TRANSFER fires later),
 * we no-op rather than double-grant.
 *
 * For the non-consumable starter pack, we additionally check the user's
 * `starterClaimed` flag as belt-and-suspenders.
 */
export async function grantCredits(
  uid: string,
  amount: number,
  eventId: string,
  isStarterPack: boolean,
): Promise<{ granted: boolean; reason?: string }> {
  return await db.runTransaction(async (tx) => {
    const txRef = db.doc(`processedTransactions/${eventId}`);
    const userRef = db.doc(`users/${uid}`);

    // Both reads must come before any writes (Firestore transaction rule).
    const [txSnap, userSnap] = await Promise.all([
      tx.get(txRef),
      tx.get(userRef),
    ]);

    if (txSnap.exists) {
      return { granted: false, reason: 'already-processed' };
    }

    const state: Omit<UserDoc, 'updatedAt'> = readState(userSnap);

    if (isStarterPack && state.starterClaimed) {
      // Mark the event processed so future replays of the same event don't
      // keep reading the user doc, but don't double-credit.
      tx.set(txRef, {
        uid,
        amount: 0,
        starterAlreadyClaimed: true,
        processedAt: FieldValue.serverTimestamp(),
      });
      return { granted: false, reason: 'starter-already-claimed' };
    }

    tx.set(
      userRef,
      {
        ...state,
        credits: state.credits + amount,
        starterClaimed: state.starterClaimed || isStarterPack,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    tx.set(txRef, {
      uid,
      amount,
      isStarterPack,
      processedAt: FieldValue.serverTimestamp(),
    });

    return { granted: true };
  });
}
