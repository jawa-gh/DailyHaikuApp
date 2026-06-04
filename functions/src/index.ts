// Cloud Functions for the Daily Haiku app.
//
// Deployed to: europe-west3 (Frankfurt)
//
// Secrets (set via `firebase functions:secrets:set <NAME>`):
//   OPENAI_API_KEY            — used by the haiku + image generators
//   REVENUECAT_WEBHOOK_AUTH   — value the RevenueCat webhook must send in the
//                               Authorization header (any random string you
//                               also paste into the RC dashboard)
//
// Auth: HTTPS Callable functions verify the caller's Firebase ID token
// automatically. The RevenueCat webhook is HTTP-only and uses the shared
// REVENUECAT_WEBHOOK_AUTH secret in lieu of a Firebase token.

export { generateHaiku } from './generate-haiku';
export { generateHaikuImage } from './generate-image';
export { revenuecatWebhook } from './revenuecat-webhook';
export { deleteAccount } from './delete-account';
