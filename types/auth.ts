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
