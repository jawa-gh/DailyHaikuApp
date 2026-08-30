// Haiku generator. Calls the `generateHaiku` Cloud Function, which proxies
// OpenAI server-side so the API key never ships in the client bundle.
//
// The function decides the tier internally based on the authoritative
// daily-free / credit state in Firestore:
//   - free slot available  → gpt-4o-mini (no credit charged)
//   - free slot used       → gpt-4o      (1 credit deducted)
//
// `language` is forwarded to the server so the haiku is composed in the
// user's UI language with examples calibrated for that language. `voice`
// selects a poet voice pack; the server validates it and falls back to the
// classic voice if it doesn't recognise the id.
//
// Falls back to a curated haiku when the call fails (offline, function down,
// auth lapsed) so the app never blocks on a network error.

import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';
import {
  INSUFFICIENT_CREDITS,
  NOT_AUTHENTICATED,
  isFailedPrecondition,
  isUnauthenticatedCode,
} from '@/utils/errors';
import type { Language } from '@/i18n';
import { DEFAULT_POET_VOICE, type PoetVoiceId } from '@/constants/packs';

interface GenerateHaikuResponse {
  line1: string;
  line2: string;
  line3: string;
  usedFree: boolean;
}

const callGenerateHaiku = httpsCallable<
  { theme: string; language: Language; voice: PoetVoiceId },
  GenerateHaikuResponse
>(functions, 'generateHaiku');

/**
 * Ensure a fresh Firebase ID token is cached before invoking the callable.
 *
 * On iOS we saw the function receive `auth: MISSING` for users who were
 * signed in — meaning httpsCallable found no token to attach at call time.
 * Pre-fetching the token here (a) hardens against a stale-token / refresh
 * race so the subsequent callable picks up the cached token, and (b) logs a
 * precise reason when the token genuinely can't be obtained, so we can tell
 * "currentUser is null" (session/persistence problem) apart from a failing
 * token refresh (the error message reveals the cause).
 */
async function ensureFreshIdToken(): Promise<void> {
  const current = auth.currentUser;
  if (!current) {
    console.warn('[haiku-generator] auth.currentUser is null at call time');
    return;
  }
  try {
    await current.getIdToken(/* forceRefresh */ true);
  } catch (error) {
    console.warn('[haiku-generator] getIdToken() failed:', error);
  }
}

export async function generateHaiku(
  theme: string,
  language: Language = 'en',
  voice: PoetVoiceId = DEFAULT_POET_VOICE,
): Promise<[string, string, string]> {
  try {
    await ensureFreshIdToken();
    const { data } = await callGenerateHaiku({ theme, language, voice });
    if (
      typeof data?.line1 !== 'string' ||
      typeof data?.line2 !== 'string' ||
      typeof data?.line3 !== 'string'
    ) {
      console.warn('[haiku-generator] Function returned malformed haiku', data);
      return getFallbackHaiku(theme);
    }
    return [data.line1.trim(), data.line2.trim(), data.line3.trim()];
  } catch (error) {
    // User isn't signed in (or auth token didn't make it to the function) —
    // surface as a typed error so the UI can force a sign-in instead of
    // silently returning a curated fallback the user can't influence.
    if (isUnauthenticatedCode(error)) {
      throw new Error(NOT_AUTHENTICATED);
    }
    // Server explicitly refused because the user has no free slot and no
    // credits — surface so the UI can route to /purchase.
    if (isFailedPrecondition(error)) {
      throw new Error(INSUFFICIENT_CREDITS);
    }
    // Network / internal failure — fall back to a curated haiku rather than
    // blocking the user entirely. This is the only path that should ever
    // produce a fallback haiku.
    console.warn('[haiku-generator] Function call failed, using fallback:', error);
    return getFallbackHaiku(theme);
  }
}

function getFallbackHaiku(theme: string): [string, string, string] {
  const fallbacks: Record<string, [string, string, string][]> = {
    spring: [
      ['Cherry blossoms fall', 'Soft petals on morning wind', 'New life stirs below'],
      ['Rain taps on the roof', 'Seedlings push through warming earth', 'The world blooms again'],
    ],
    summer: [
      ['Heat shimmers on sand', 'Cicadas drone in tall grass', 'Long shadows at dusk'],
      ['Sunlight on the lake', 'Dragonflies trace golden paths', 'Warmth holds everything'],
    ],
    autumn: [
      ['Leaves spiral earthward', 'Amber light through thinning trees', 'Silence settles in'],
      ['Crisp air bites my cheek', 'Geese carve arcs across grey skies', 'Harvest moon rises'],
    ],
    winter: [
      ['Snow blankets the field', 'Footprints vanish one by one', 'Stillness everywhere'],
      ['Frost on window panes', 'Breath curls in the morning cold', 'Firelight flickers warm'],
    ],
    nature: [
      ['Moss on ancient stone', 'A stream whispers through the ferns', 'Time bends to the green'],
      ['Tall pines hold the sky', 'Their roots drink from hidden springs', 'Wind hums through the bark'],
    ],
    ocean: [
      ['Waves crash on the shore', 'Salt and foam dissolve the hour', 'Tides erase the sand'],
      ['Beneath the surface', 'Light fragments in turquoise shards', 'Fish dart through the blue'],
    ],
    mountain: [
      ['Peak above the clouds', 'Stone remembers ancient fire', 'Eagles ride the wind'],
      ['Mist clings to the ridge', 'A path winds through weathered rock', 'Sky meets earth in grey'],
    ],
    rain: [
      ['Drops on lotus leaves', 'Each one holds a tiny sky', 'Thunder in the hills'],
      ['Puddles mirror clouds', 'Umbrellas bloom like flowers', 'Streets gleam silver wet'],
    ],
    night: [
      ['Stars prick through the dark', 'An owl calls across the field', 'Moonlight paints the lake'],
      ['Lantern by the path', 'Crickets pulse their evening song', 'Darkness wraps the wood'],
    ],
    dawn: [
      ['First light on the ridge', 'Dew trembles on spider silk', 'Birds begin their song'],
      ['Horizon turns gold', 'Shadows pull back from the hills', 'A new day arrives'],
    ],
  };

  const themeHaikus = fallbacks[theme] || fallbacks['nature'];
  const idx = Math.floor(Math.random() * themeHaikus.length);
  return themeHaikus[idx];
}
