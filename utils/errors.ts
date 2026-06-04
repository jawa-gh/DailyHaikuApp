// Shared error sentinels used across the client to signal specific server-side
// rejection reasons. Throwing `new Error(INSUFFICIENT_CREDITS)` lets call sites
// distinguish "user has no free slot and no credits" from generic network or
// internal failures, so they can route to /purchase instead of showing a
// generic error or falling back to a curated haiku.

export const INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS';
export const NOT_AUTHENTICATED = 'NOT_AUTHENTICATED';

/**
 * True if the error came back from a callable Cloud Function with a
 * `failed-precondition` HttpsError code. The Firebase SDK reports this as
 * either `failed-precondition` or `functions/failed-precondition` depending
 * on version — we match both.
 */
export function isFailedPrecondition(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  return typeof code === 'string' && code.includes('failed-precondition');
}

export function isInsufficientCredits(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  return (err as { message?: string }).message === INSUFFICIENT_CREDITS;
}

/**
 * True if the error came back from a callable Cloud Function with an
 * `unauthenticated` HttpsError code — the user isn't signed in (or their
 * Firebase auth token isn't being attached for some reason).
 */
export function isUnauthenticatedCode(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  return typeof code === 'string' && code.includes('unauthenticated');
}

export function isNotAuthenticated(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  return (err as { message?: string }).message === NOT_AUTHENTICATED;
}
