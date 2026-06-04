// HTTP function invoked by RevenueCat when a purchase event happens.
//
// Setup (in the RevenueCat dashboard):
//   Webhook URL:   https://europe-west3-dailyhaikuandroidios.cloudfunctions.net/revenuecatWebhook
//   Authorization: <set this to the value of the REVENUECAT_WEBHOOK_AUTH secret>
//
// We dedup on event.id (RevenueCat retries on 5xx with the same id), so this
// handler can safely be invoked multiple times for the same event.

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { grantCredits } from './lib/user-doc';

const webhookAuth = defineSecret('REVENUECAT_WEBHOOK_AUTH');

const STARTER_PACK_ID = 'haiku_4_starter';

const PRODUCT_CREDITS: Record<string, number> = {
  haiku_2_credits: 2,
  haiku_6_credits: 6,
  haiku_10_credits: 10,
  [STARTER_PACK_ID]: 4,
};

// Only these event types result in granting credits. Everything else
// (RENEWAL, EXPIRATION, BILLING_ISSUE, TEST etc.) is acknowledged with 200
// so RevenueCat doesn't keep retrying.
const PURCHASE_EVENTS = new Set([
  'INITIAL_PURCHASE', // first-time non-consumable (starter pack)
  'NON_RENEWING_PURCHASE', // consumable purchase
]);

interface RevenueCatEvent {
  event?: {
    type?: string;
    id?: string;
    transaction_id?: string;
    product_id?: string;
    app_user_id?: string;
    original_app_user_id?: string;
  };
  api_version?: string;
}

export const revenuecatWebhook = onRequest(
  {
    region: 'europe-west3',
    secrets: [webhookAuth],
  },
  async (req, res) => {
    // The Authorization header value is set by you in the RC dashboard and
    // matches the REVENUECAT_WEBHOOK_AUTH secret. Anyone who can't produce
    // the right header gets rejected.
    if (req.headers.authorization !== webhookAuth.value()) {
      console.warn('Unauthorized webhook call from', req.ip);
      res.status(401).send('Unauthorized');
      return;
    }

    const body = req.body as RevenueCatEvent;
    const event = body?.event;
    if (!event || !event.type) {
      res.status(400).send('Bad request: missing event');
      return;
    }

    if (!PURCHASE_EVENTS.has(event.type)) {
      console.log(`Skipping non-purchase event type: ${event.type}`);
      res.status(200).send('OK (skipped)');
      return;
    }

    const productId = event.product_id;
    const uid = event.app_user_id;
    const eventId = event.id;

    if (!productId || !uid || !eventId) {
      console.error('Webhook event missing required fields:', event);
      res.status(400).send('Missing required fields');
      return;
    }

    const credits = PRODUCT_CREDITS[productId];
    if (credits === undefined) {
      console.warn(`Unknown product in webhook: ${productId} (event ${eventId})`);
      // Acknowledge so RC stops retrying. We've logged for follow-up.
      res.status(200).send('OK (unknown product)');
      return;
    }

    try {
      const result = await grantCredits(
        uid,
        credits,
        eventId,
        productId === STARTER_PACK_ID,
      );
      console.log('Webhook processed:', {
        eventId,
        uid,
        productId,
        credits,
        result,
      });
      res.status(200).send('OK');
    } catch (error) {
      console.error('Failed to grant credits in webhook:', error, { event });
      // Return 5xx so RevenueCat retries. The dedup transaction in
      // grantCredits ensures retries are safe.
      res.status(500).send('Internal error');
    }
  },
);
