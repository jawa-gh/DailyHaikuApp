import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import {
  buildImagePrompt,
  isArtStyle,
  DEFAULT_ART_STYLE,
  type ArtStyle,
} from './prompts';
import {
  spendForImage,
  refundImage,
  InsufficientFundsError,
} from './lib/user-doc';

const openaiKey = defineSecret('OPENAI_API_KEY');

interface GenerateImageRequest {
  lines: [string, string, string];
  theme: string;
  /**
   * Art style pack. Selects the medium and composition paragraphs of the
   * image prompt. Unknown / absent values fall back to the original sumi-e
   * look, so older clients keep getting exactly what they always got.
   */
  style?: ArtStyle;
}

interface GenerateImageResponse {
  base64Data: string;
  mimeType: string;
}

export const generateHaikuImage = onCall<
  GenerateImageRequest,
  Promise<GenerateImageResponse>
>(
  {
    region: 'europe-west3',
    secrets: [openaiKey],
    timeoutSeconds: 120,
    memory: '512MiB',
    // TEMPORARILY DISABLED — see generate-haiku.ts. iOS App Attest isn't
    // configured yet; enforcing here rejects iOS calls as `unauthenticated`.
    // Re-enable only once iOS logs show `app: VALID`.
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to generate an image.');
    }
    const uid = request.auth.uid;

    const data = request.data ?? ({} as Partial<GenerateImageRequest>);
    const lines = data.lines;
    const theme = data.theme;

    if (
      !Array.isArray(lines) ||
      lines.length !== 3 ||
      !lines.every((l) => typeof l === 'string')
    ) {
      throw new HttpsError('invalid-argument', 'lines must be an array of three strings.');
    }
    if (typeof theme !== 'string' || theme.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'theme is required.');
    }

    // Validate against our own list rather than trusting the client, so a
    // tampered build can't inject an arbitrary prompt fragment. An unknown
    // style is not an error — it degrades to the default look.
    const style: ArtStyle = isArtStyle(data.style)
      ? data.style
      : DEFAULT_ART_STYLE;

    try {
      await spendForImage(uid);
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        throw new HttpsError('failed-precondition', 'Not enough credits to generate an image.');
      }
      console.error('spendForImage failed:', error);
      throw new HttpsError('internal', 'Failed to charge for image.');
    }

    try {
      const openai = new OpenAI({ apiKey: openaiKey.value() });
      const prompt = buildImagePrompt(
        lines as [string, string, string],
        theme,
        style,
      );

      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      });

      const b64 = response.data?.[0]?.b64_json;
      if (typeof b64 !== 'string' || b64.length === 0) {
        throw new Error('OpenAI returned no image data');
      }

      return { base64Data: b64, mimeType: 'image/png' };
    } catch (error) {
      await refundImage(uid).catch((refundErr) => {
        console.error(
          'CRITICAL: refund failed, user was charged for a failed image.',
          { uid, refundErr, originalError: error },
        );
      });
      console.error('Image generation failed:', error);
      throw new HttpsError('internal', 'Failed to generate image.');
    }
  },
);
