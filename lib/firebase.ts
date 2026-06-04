import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  // getReactNativePersistence is exported from firebase/auth's react-native build
  // but isn't in the public type declarations. Metro resolves the RN entry point.
  // @ts-ignore
  getReactNativePersistence,
} from 'firebase/auth';
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import {
  initializeAppCheck,
  CustomProvider,
} from 'firebase/app-check';
import rnAppCheck from '@react-native-firebase/app-check';
// Project-specific Firebase client config (apiKey, projectId, etc.). Kept in
// a gitignored file so the public repo doesn't ship our project identity —
// copy `firebaseConfig.example.js` to `firebaseConfig.js` and fill in your
// own values when setting up a fresh checkout.
import { firebaseConfig } from '@/firebaseConfig';

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// On web, `getAuth` uses browser persistence by default.
// On native, wire AsyncStorage so the user stays signed in across launches.
// `initializeAuth` throws if called twice (e.g. Fast Refresh) — fall back to `getAuth`.
let _auth: Auth;
if (Platform.OS === 'web') {
  _auth = getAuth(app);
} else {
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(app);
  }
}

export const auth = _auth;

// Cloud Functions are deployed to europe-west3 — pin the client to the same
// region so SDK calls hit the right endpoint instead of the default us-central1.
export const functions: Functions = getFunctions(app, 'europe-west3');

// Firestore — used for the per-user credit / daily-free state document.
// Read by the client (subscription) and written exclusively by Cloud Functions
// via the Admin SDK; security rules in firestore.rules block client writes.
//
// Named database "dailyhaiku" (not the (default) database). Both client SDK
// and the Admin SDK in functions/ must pass this ID — see
// functions/src/lib/firestore.ts for the server-side equivalent.
export const db: Firestore = getFirestore(app, 'dailyhaiku');

// ────────────────────────────────────────────────────────────────────────────
// App Check
// ────────────────────────────────────────────────────────────────────────────
//
// The Firebase JS SDK can't get App Attest (iOS) or Play Integrity (Android)
// tokens by itself, so we use @react-native-firebase/app-check as a sidecar
// that handles the native attestation, then bridge its tokens into the JS SDK
// via a CustomProvider. The JS SDK then attaches the token automatically to
// every callable function call.
//
// Web is intentionally not wired up here (would need a reCAPTCHA site key).
// If web becomes a target, add a ReCaptchaV3Provider branch.

let rnAppCheckReady: Promise<void> | null = null;

function reportAppCheckError(context: string, error: unknown): void {
  console.warn(`[firebase] App Check ${context}:`, error);
}

// In dev builds, you can pin a debug token via env var instead of reading the
// auto-generated one out of native logs. Generate any UUID, set it in .env as
// EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN, and register the same UUID in
// Firebase Console → App Check → your app → ⋮ → Manage debug tokens.
const APP_CHECK_DEBUG_TOKEN = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN;

// Kill switch for debugging. Set EXPO_PUBLIC_DISABLE_APP_CHECK=true in .env
// to bypass App Check entirely (no native init, no JS SDK token attachment).
// Use this only to isolate whether a call failure is App Check related; with
// this on, function-side enforcement must also be disabled or calls will be
// rejected.
const APP_CHECK_DISABLED =
  process.env.EXPO_PUBLIC_DISABLE_APP_CHECK === 'true';

// App Check is OFF by default. App Attest rejects this app with "app not
// registered" despite every documented requirement being met (Team ID,
// bundle ID, GOOGLE_APP_ID, App Attest registration, appattest-environment
// entitlement). Until that's resolved we ship without client App Check — no
// failed-attestation latency, no user-facing errors — and keep
// enforceAppCheck:false on the Cloud Functions. Auth + server-side credit
// checks still gate every call, so the security loss is bounded.
//
// To re-enable once the registration issue is fixed:
//   1. set EXPO_PUBLIC_ENABLE_APP_CHECK=true (eas.json env / EAS secret), rebuild
//   2. confirm `app: VALID` in `firebase functions:log` on both platforms
//   3. flip enforceAppCheck back to true in functions/src/generate-*.ts
const APP_CHECK_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_APP_CHECK === 'true';

// One-time diagnostic so you can verify the env var actually reached the
// bundle. If you see "NONE" or the wrong UUID prefix, Metro hasn't picked up
// the new .env value — restart with `npx expo start --clear`.
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // eslint-disable-next-line no-console
  console.log(
    '[firebase] App Check config:',
    APP_CHECK_DISABLED
      ? 'DISABLED (kill switch)'
      : APP_CHECK_DEBUG_TOKEN
        ? `debug token ${APP_CHECK_DEBUG_TOKEN.slice(0, 8)}...`
        : 'NO debug token in env',
  );
}

if (APP_CHECK_ENABLED && Platform.OS !== 'web' && !APP_CHECK_DISABLED) {
  rnAppCheckReady = (async () => {
    try {
      const provider = rnAppCheck().newReactNativeFirebaseAppCheckProvider();
      provider.configure({
        android: {
          // 'debug' uses the debug provider in dev — register the token (set
          // via EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN, or auto-generated and
          // printed to logcat) in Firebase Console → App Check → Debug tokens.
          // 'playIntegrity' is the production provider on Android.
          provider: __DEV__ ? 'debug' : 'playIntegrity',
          ...(__DEV__ && APP_CHECK_DEBUG_TOKEN
            ? { debugToken: APP_CHECK_DEBUG_TOKEN }
            : {}),
        },
        apple: {
          // Pure App Attest (iOS 14+, always available on our supported OS
          // range). We deliberately drop the DeviceCheck fallback: it requires
          // a separately-configured .p8 key in Firebase, and an unconfigured
          // fallback reports as "app not registered" — masking whether App
          // Attest itself is fine. With pure appAttest, any failure is a real
          // App Attest error.
          provider: __DEV__ ? 'debug' : 'appAttest',
          ...(__DEV__ && APP_CHECK_DEBUG_TOKEN
            ? { debugToken: APP_CHECK_DEBUG_TOKEN }
            : {}),
        },
      });
      await rnAppCheck().initializeAppCheck({
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      // Don't break the app on App Check init failure — calls will still
      // succeed against functions with enforceAppCheck: false. Once you flip
      // enforcement on the function side, init failures become hard errors
      // visible as failed-precondition / unauthenticated in the call.
      reportAppCheckError('RNFirebase init failed', error);
    }
  })();

  const customProvider = new CustomProvider({
    getToken: async () => {
      if (rnAppCheckReady) await rnAppCheckReady;
      try {
        const result = await rnAppCheck().getToken();
        // RNFirebase doesn't expose the token's TTL; assume the standard 1
        // hour. The JS SDK will request a refresh when this expires.
        return {
          token: result.token,
          expireTimeMillis: Date.now() + 60 * 60 * 1000,
        };
      } catch (error) {
        // This is where App Attest failures land — the error message names
        // the actual cause (attestation unsupported, entitlement rejected,
        // network, etc.). Surface it, then rethrow so the SDK sends no token.
        reportAppCheckError('getToken failed', error);
        throw error;
      }
    },
  });

  try {
    initializeAppCheck(app, {
      provider: customProvider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // initializeAppCheck throws if called twice (Fast Refresh re-imports);
    // safe to ignore.
    console.warn('[firebase] JS SDK App Check init skipped:', error);
  }
}

// Optional local emulator wiring for development. Set
// EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR=true in .env and start the emulator
// (`npm run serve` in functions/) to point the app at localhost.
if (
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true'
) {
  // 10.0.2.2 is the Android emulator's loopback to the host machine; iOS sim
  // and web hit localhost directly.
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  connectFunctionsEmulator(functions, host, 5001);
  connectFirestoreEmulator(db, host, 8080);
}

export default app;
