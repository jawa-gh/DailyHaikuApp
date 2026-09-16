import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import {
  HAIKU_SYSTEM_PROMPTS,
  THEME_LABEL,
  type HaikuLanguage,
} from './prompts';

const SUPPORTED_LANGUAGES: HaikuLanguage[] = ['en', 'de', 'fr', 'es'];
import {
  spendForHaiku,
  refundHaiku,
  InsufficientFundsError,
} from './lib/user-doc';
import {
  HAIKU_RESPONSE_SCHEMA,
  generateWithSyllableCheck,
  parseDraft,
} from './lib/haiku-form';

const openaiKey = defineSecret('OPENAI_API_KEY');

// Retries are on us, not the user — they were charged once, before generation.
const MAX_HAIKU_ATTEMPTS = 3;

type Tier = 'free' | 'premium';

const TIER_CONFIG: Record<Tier, { model: string; temperature: number }> = {
  free: { model: 'gpt-4o-mini', temperature: 0.95 },
  premium: { model: 'gpt-4o', temperature: 1.1 },
};

interface GenerateHaikuRequest {
  theme: string;
  /** UI language code; haiku is generated in this language. Defaults to 'en'. */
  language?: HaikuLanguage;
}

interface GenerateHaikuResponse {
  line1: string;
  line2: string;
  line3: string;
  usedFree: boolean;
}

export const generateHaiku = onCall<
  GenerateHaikuRequest,
  Promise<GenerateHaikuResponse>
>(
  {
    region: 'europe-west3',
    secrets: [openaiKey],
    // TEMPORARILY DISABLED. iOS isn't producing App Check tokens yet (App
    // Attest needs the Apple Team ID configured in Firebase). With enforcement
    // on, iOS calls arrive with `app: MISSING` and get rejected as
    // `unauthenticated` — which the client turns into a forced /auth redirect
    // ("login despite being logged in"). Re-enable (set back to true) ONLY
    // after iOS logs show `app: VALID`. Android (Play Integrity) is already
    // working, but enforcement is all-or-nothing per function.
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to generate a haiku.');
    }
    const uid = request.auth.uid;

    const data = request.data ?? ({} as Partial<GenerateHaikuRequest>);
    const theme = data.theme;
    if (typeof theme !== 'string' || theme.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'theme is required and must be a non-empty string.');
    }

    // Pick the language-specific system prompt; fall back to English for any
    // value the client sends that isn't in our supported set.
    const language: HaikuLanguage =
      data.language && SUPPORTED_LANGUAGES.includes(data.language)
        ? data.language
        : 'en';
    const systemPrompt = HAIKU_SYSTEM_PROMPTS[language];
    const themeLabel = THEME_LABEL[language];

    // Try to spend (free slot or 1 credit). Server is the source of truth —
    // a tampered client cannot bypass this check.
    let usedFree: boolean;
    try {
      const result = await spendForHaiku(uid);
      usedFree = result.usedFree;
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        throw new HttpsError('failed-precondition', 'No free generation available and no credits remaining.');
      }
      console.error('spendForHaiku failed:', error);
      throw new HttpsError('internal', 'Failed to charge for haiku.');
    }

    // Tier follows the credit decision: free slot → cheap model, paid → premium.
    const tier: Tier = usedFree ? 'free' : 'premium';
    const { model, temperature } = TIER_CONFIG[tier];

    try {
      const openai = new OpenAI({ apiKey: openaiKey.value() });
      const haiku = await generateWithSyllableCheck(async () => {
        const response = await openai.chat.completions.create({
          model,
          temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${themeLabel}: ${theme}` },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'haiku',
              strict: true,
              schema: HAIKU_RESPONSE_SCHEMA,
            },
          },
        });
        return parseDraft(response.choices[0]?.message?.content);
      }, MAX_HAIKU_ATTEMPTS);

      if (haiku.error > 0) {
        // Counts only — lines can echo a user's custom topic.
        console.warn('Haiku missed 5-7-5 after retries', {
          language,
          model,
          attempts: haiku.attempts,
          counts: haiku.counts,
        });
      }

      return {
        line1: haiku.lines[0],
        line2: haiku.lines[1],
        line3: haiku.lines[2],
        usedFree,
      };
    } catch (error) {
      // Generation failed after we already deducted — refund so the user
      // doesn't pay for a failure they didn't see succeed.
      await refundHaiku(uid, usedFree).catch((refundErr) => {
        console.error(
          'CRITICAL: refund failed, user was charged for a failed generation.',
          { uid, usedFree, refundErr, originalError: error },
        );
      });
      console.error('Haiku generation failed:', error);
      throw new HttpsError('internal', 'Failed to generate haiku.');
    }
  },
);
