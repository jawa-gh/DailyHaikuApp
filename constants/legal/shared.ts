// Values shared across the legal documents (privacy.ts, terms.ts) so a
// single edit propagates to all of them across all four languages.

/**
 * Contact address shown in both the Privacy Policy and the Terms of Service.
 *
 * Heads up: this is a personal Gmail. For a public app, consider routing
 * through a forwarding alias (e.g. `privacy@dailyhaiku.app`) to keep the
 * inbox manageable and resist scraped-spam.
 */
export const LEGAL_CONTACT_EMAIL = 'janwagner867@gmail.com';

/**
 * Placeholder for the data-controller name and the IP-rights holder. Replace
 * before publishing — GDPR Art. 13 requires identifying the controller, and
 * the IP clause in the Terms is unenforceable without a real party named.
 */
export const LEGAL_ENTITY_NAME = 'Jan Wagner';
