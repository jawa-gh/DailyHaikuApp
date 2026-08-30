// Poet voice and art style packs.
//
// This file is the CLIENT half of the pack definitions: ids, display metadata
// and whether a pack is premium. The actual prompt text lives server-side in
// `functions/src/prompts.ts` so it can be tuned without shipping a new build.
//
// The two halves are joined only by these string ids — `functions/` is a
// separate npm package and can't import from `@/`. If you add a pack, add it
// in BOTH places or the server will silently fall back to the default.
//
// Human-readable labels are not here either; they're translated, so they live
// in `i18n/translations/*` under `voices.*` and `artStyles.*`.

export type PoetVoiceId =
  | 'classic'
  | 'basho'
  | 'issa'
  | 'buson'
  | 'modern'
  | 'minimal';

export type ArtStyleId =
  | 'sumi'
  | 'ukiyoe'
  | 'watercolor'
  | 'cyanotype'
  | 'charcoal'
  | 'goldleaf';

export interface Pack<Id extends string> {
  id: Id;
  emoji: string;
  /** Reserved for the paid tier — see STYLE_PACKS_REQUIRE_PURCHASE below. */
  premium: boolean;
}

// `classic` reproduces the haiku prompt this app shipped with; `sumi` does the
// same for artwork. Both must stay free and stay the default, so nobody's
// existing experience changes when packs land.
export const POET_VOICES: Pack<PoetVoiceId>[] = [
  { id: 'classic', emoji: '🪶', premium: false },
  { id: 'modern', emoji: '🌆', premium: false },
  { id: 'basho', emoji: '🥾', premium: true },
  { id: 'issa', emoji: '🐌', premium: true },
  { id: 'buson', emoji: '🎨', premium: true },
  { id: 'minimal', emoji: '⚪', premium: true },
];

export const ART_STYLES: Pack<ArtStyleId>[] = [
  { id: 'sumi', emoji: '🖌️', premium: false },
  { id: 'watercolor', emoji: '💧', premium: false },
  { id: 'ukiyoe', emoji: '🎴', premium: true },
  { id: 'cyanotype', emoji: '🟦', premium: true },
  { id: 'charcoal', emoji: '⚫', premium: true },
  { id: 'goldleaf', emoji: '✨', premium: true },
];

export const DEFAULT_POET_VOICE: PoetVoiceId = 'classic';
export const DEFAULT_ART_STYLE: ArtStyleId = 'sumi';

/**
 * Master switch for monetizing the packs.
 *
 * Currently OFF: every pack is usable by everyone. The `premium` flags above
 * are already set, and the pickers already render the locked state and route
 * to /purchase — but none of that activates until there is something to sell.
 *
 * To turn packs into a paid feature:
 *   1. Create the product + a `style_packs` entitlement in RevenueCat and add
 *      it to the `current` offering (see .claude/CLAUDE.md § RevenueCat).
 *   2. Flip this to true.
 *
 * `usePurchases().hasStylePacks` already reads that entitlement, so no other
 * code needs to change. Note that the server does NOT enforce ownership —
 * packs cost nothing extra to generate, so the check is presentational. If
 * that ever stops being true, add the check in `functions/src/generate-*.ts`
 * where the comments say so.
 */
export const STYLE_PACKS_REQUIRE_PURCHASE = false;

/** RevenueCat entitlement identifier that unlocks every premium pack. */
export const STYLE_PACKS_ENTITLEMENT = 'style_packs';

export function isPackUnlocked(
  pack: { premium: boolean },
  hasStylePacks: boolean,
): boolean {
  if (!STYLE_PACKS_REQUIRE_PURCHASE) return true;
  return !pack.premium || hasStylePacks;
}

export function isPoetVoiceId(value: unknown): value is PoetVoiceId {
  return POET_VOICES.some((v) => v.id === value);
}

export function isArtStyleId(value: unknown): value is ArtStyleId {
  return ART_STYLES.some((s) => s.id === value);
}
