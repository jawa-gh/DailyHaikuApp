export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'apple';
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  haikuCredits: number;
  dailyFreeUsed: boolean;
  dailyFreeDate: string;
}

export const FREE_DAILY_LIMIT = 1;

// Cost in credits for each premium action. Kept here so the value is shared
// between PurchaseProvider (which deducts) and the screens (which check &
// display). Once the credit deduction moves to the Firebase Cloud Function,
// these become the source of truth on the server.
// Annotated as `number` (not the inferred literals 1 / 2) so screens can do
// generic singular/plural checks like `cost === 1 ? credit : credits` without
// TypeScript flagging an impossible-comparison error.
export const HAIKU_CREDIT_COST: number = 1;
export const IMAGE_CREDIT_COST: number = 2;

/**
 * Credits a brand-new account is given, for DISPLAY ONLY.
 *
 * The grant itself happens server-side when the user doc is first created —
 * see SIGNUP_BONUS_CREDITS in `functions/src/lib/user-doc.ts`, which is the
 * authoritative value. This copy exists so the sign-in screen can name the
 * number instead of hardcoding it into translated strings. **Change both.**
 */
export const SIGNUP_BONUS_CREDITS: number = 2;
