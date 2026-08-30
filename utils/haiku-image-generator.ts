// Image generator for the haiku artwork feature. Calls the
// `generateHaikuImage` Cloud Function, which proxies OpenAI's gpt-image-1 at
// quality "high" server-side. The OpenAI key never ships in the client bundle.

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  INSUFFICIENT_CREDITS,
  NOT_AUTHENTICATED,
  isFailedPrecondition,
  isUnauthenticatedCode,
} from '@/utils/errors';
import { DEFAULT_ART_STYLE, type ArtStyleId } from '@/constants/packs';

export interface GeneratedImage {
  base64Data: string;
  mimeType: string;
}

const callGenerateImage = httpsCallable<
  { lines: [string, string, string]; theme: string; style: ArtStyleId },
  GeneratedImage
>(functions, 'generateHaikuImage');

export async function generateHaikuImage({
  lines,
  theme,
  style = DEFAULT_ART_STYLE,
}: {
  lines: [string, string, string];
  theme: string;
  /** Art style pack. Validated server-side; unknown ids fall back to sumi-e. */
  style?: ArtStyleId;
}): Promise<GeneratedImage> {
  try {
    const { data } = await callGenerateImage({ lines, theme, style });
    if (typeof data?.base64Data !== 'string' || data.base64Data.length === 0) {
      throw new Error('Image generation returned no data');
    }
    return {
      base64Data: data.base64Data,
      mimeType: data.mimeType || 'image/png',
    };
  } catch (error) {
    if (isUnauthenticatedCode(error)) {
      throw new Error(NOT_AUTHENTICATED);
    }
    // Server refused because user lacks the 2 credits needed — surface as a
    // typed error so the screen can route to /purchase rather than show a
    // generic "Generation Failed" alert.
    if (isFailedPrecondition(error)) {
      throw new Error(INSUFFICIENT_CREDITS);
    }
    throw error;
  }
}
