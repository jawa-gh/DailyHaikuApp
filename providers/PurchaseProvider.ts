import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase';

// RevenueCat *public* SDK keys, configured per platform.
//
// These are designed to be embedded in the app — they aren't secrets in the
// way a server API key is. They live in env vars (not source) so dev / preview
// / production builds can use different keys (sandbox `test_*` vs production
// `appl_*` / `goog_*`) without touching code.
//
// For local dev: set EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
// in `.env`. For EAS builds: set as EAS secrets or under `env` in `eas.json`.
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

const STARTER_PACK_ID = 'haiku_4_starter';

// Hard ceiling on how long we'll wait for RevenueCat to return offerings.
// The SDK can hang indefinitely when the App Store Connect ↔ RevenueCat link
// is misconfigured or products aren't yet available — without this cap the
// purchase screen sits on "Loading packages…" forever with no signal.
const OFFERINGS_TIMEOUT_MS = 15_000;

/**
 * Lifecycle of the RevenueCat offerings fetch. Drives the purchase screen so
 * it can distinguish "still loading" from "couldn't load" / "nothing to show"
 * and render an actionable error + retry instead of an infinite spinner.
 */
export type OfferingsStatus = 'loading' | 'ready' | 'empty' | 'error';

interface UserState {
  credits: number;
  dailyFreeUsed: boolean;
  dailyFreeDate: string;
}

const DEFAULT_USER_STATE: UserState = {
  credits: 0,
  dailyFreeUsed: false,
  dailyFreeDate: '',
};

/** Today as YYYY-MM-DD in UTC — must match the server's `getTodayUtc()`. */
function getTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export const [PurchaseProvider, usePurchases] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userState, setUserState] = useState<UserState>(DEFAULT_USER_STATE);
  const [offeringsStatus, setOfferingsStatus] = useState<OfferingsStatus>('loading');
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  // Set true once init() finished its work (configure() succeeded OR we
  // discovered there's no API key). Used to decide when to fetch offerings.
  // Distinct from `isReady` because we don't want to attempt offerings when
  // configure was skipped due to a missing key.
  const [isConfigured, setIsConfigured] = useState(false);

  // Initialize RevenueCat once.
  useEffect(() => {
    async function init() {
      if (Platform.OS === 'web') {
        setIsReady(true);
        setOfferingsStatus('empty');
        return;
      }

      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        const apiKey =
          Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

        if (!apiKey) {
          const envVar = `EXPO_PUBLIC_REVENUECAT_${Platform.OS === 'ios' ? 'IOS' : 'ANDROID'}_KEY`;
          console.warn(
            `[PurchaseProvider] No RevenueCat key for ${Platform.OS} — set ${envVar} ` +
              `in .env (or eas.json env). Purchases will not work until configured.`,
          );
          setOfferingsStatus('error');
          setOfferingsError(`Missing ${envVar}`);
          setIsReady(true);
          return;
        }

        await Purchases.configure({ apiKey });
        setIsConfigured(true);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        setOfferingsStatus('error');
        setOfferingsError(error instanceof Error ? error.message : 'RevenueCat init failed');
        setIsReady(true);
      }
    }

    init();
  }, []);

  // Identify user with RevenueCat. The Firebase UID we pass becomes the
  // app_user_id RevenueCat sends on webhook events, which the function uses
  // to look up the right user doc when granting credits.
  useEffect(() => {
    if (!isReady || Platform.OS === 'web') return;

    async function identify() {
      try {
        if (user) {
          const info = await Purchases.logIn(user.id);
          setCustomerInfo(info.customerInfo);
        } else {
          await Purchases.logOut();
          setCustomerInfo(null);
        }
      } catch (error) {
        console.error('Failed to identify user with RevenueCat:', error);
      }
    }

    identify();
  }, [isReady, user]);

  // Fetch available offerings. Wrapped in useCallback so the purchase screen
  // can call it again as a "Try again" action when the first fetch errored.
  const reloadOfferings = useCallback(async () => {
    if (Platform.OS === 'web') {
      setOfferingsStatus('empty');
      return;
    }
    setOfferingsStatus('loading');
    setOfferingsError(null);
    try {
      // Cap the SDK call. If the App Store Connect ↔ RevenueCat link is
      // broken, or no products are linked yet, RevenueCat can sit there
      // indefinitely — the purchase screen used to show "Loading…" forever.
      const offerings = await Promise.race([
        Purchases.getOfferings(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Offerings request timed out')),
            OFFERINGS_TIMEOUT_MS,
          ),
        ),
      ]);

      const available = offerings.current?.availablePackages ?? [];
      setPackages(available);
      if (available.length === 0) {
        // Either no `current` offering set in the RevenueCat dashboard, or it
        // has no packages, or products aren't linked to App Store Connect.
        console.warn(
          '[PurchaseProvider] RevenueCat returned no available packages. ' +
            'Check that there is a "current" offering in the RevenueCat dashboard ' +
            'and that products are linked to App Store Connect / Play Console.',
        );
        setOfferingsStatus('empty');
      } else {
        setOfferingsStatus('ready');
      }
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
      setOfferingsStatus('error');
      setOfferingsError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  // Kick off the offerings fetch once the SDK is configured. We intentionally
  // gate on `isConfigured` (not just `isReady`) so a missing-key build doesn't
  // call getOfferings() on an unconfigured SDK (which would throw and then
  // surface as a generic error to the user).
  useEffect(() => {
    if (!isConfigured) return;
    reloadOfferings();
  }, [isConfigured, reloadOfferings]);

  // Subscribe to the per-user state document in Firestore. The server is the
  // sole writer (rules block client writes), so this is the authoritative
  // source for credits + daily-free state. Updates from successful generations
  // and from the RevenueCat webhook arrive here within ~ms.
  useEffect(() => {
    if (!user) {
      setUserState(DEFAULT_USER_STATE);
      return;
    }

    const ref = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserState({
            credits: typeof data.credits === 'number' ? data.credits : 0,
            dailyFreeUsed: data?.dailyFree?.used ?? false,
            dailyFreeDate: data?.dailyFree?.date ?? '',
          });
        } else {
          // Doc not yet created — server will lazy-create on first generation
          // or on first webhook-triggered credit grant.
          setUserState(DEFAULT_USER_STATE);
        }
      },
      (error) => {
        console.error('Failed to subscribe to user doc:', error);
      },
    );

    return unsubscribe;
  }, [user]);

  // Listen for customer info updates (RevenueCat side) — used for the
  // hasStarterPack flag that hides the starter card after purchase.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    // Wrap in a block — removeCustomerInfoUpdateListener returns a boolean,
    // and a useEffect cleanup must return void.
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  // Purchase a package. RevenueCat handles the App Store / Play Store call
  // and emits a webhook event to our `revenuecatWebhook` Cloud Function,
  // which is the only thing that grants credits. We do NOT add credits here
  // — that path is bypassable on a jailbroken client.
  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (Platform.OS === 'web') {
      throw new Error('Purchases are not available on web');
    }

    setIsPurchasing(true);
    try {
      const result = await Purchases.purchasePackage(pkg);
      setCustomerInfo(result.customerInfo);
      // Credits arrive via the Firestore subscription once the webhook fires
      // (typically 1–3s after the store call returns).
      return result;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  /**
   * Re-sync entitlements from the store. Required by App Store guideline
   * 3.1.1 because we sell a non-consumable (the starter pack).
   *
   * Note what this can and cannot do: consumable credit packs are NOT
   * restorable — the store doesn't replay them, and they don't need to be,
   * since the webhook already granted those credits server-side and
   * `grantCredits` is idempotent. What restore actually recovers is the
   * non-consumable starter pack, which flips `hasStarterPack` and drops the
   * starter card from the purchase list.
   *
   * Returns the refreshed CustomerInfo (null on web) so callers can tell a
   * successful restore from "this account never bought anything".
   */
  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (Platform.OS === 'web') return null;

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }, []);

  const canGenerateForFree = useMemo(() => {
    const today = getTodayUtc();
    if (userState.dailyFreeDate !== today) return true;
    return !userState.dailyFreeUsed;
  }, [userState]);

  const canGenerate = useMemo(() => {
    if (canGenerateForFree) return true;
    if (isAuthenticated && userState.credits > 0) return true;
    return false;
  }, [canGenerateForFree, isAuthenticated, userState.credits]);

  const needsCredits = useMemo(() => {
    return !canGenerateForFree && isAuthenticated && userState.credits <= 0;
  }, [canGenerateForFree, isAuthenticated, userState.credits]);

  // True once the user owns the non-consumable starter pack, per RevenueCat.
  // The purchase screen uses this to drop the starter card from the list.
  const hasStarterPack = useMemo(() => {
    return (
      customerInfo?.allPurchasedProductIdentifiers?.includes(STARTER_PACK_ID) ??
      false
    );
  }, [customerInfo]);

  return {
    isReady,
    packages,
    offeringsStatus,
    offeringsError,
    reloadOfferings,
    customerInfo,
    credits: userState.credits,
    isPurchasing,
    canGenerateForFree,
    canGenerate,
    needsCredits,
    hasStarterPack,
    purchasePackage,
    restorePurchases,
    // spendCredit / markDailyFreeUsed are intentionally NOT exposed — those
    // operations now happen server-side inside the generation Cloud Functions
    // via Firestore transactions. Clients no longer mutate credit state.
  };
});
