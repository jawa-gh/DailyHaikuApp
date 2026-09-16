// Art style packs.
//
// This file is the CLIENT half of the pack definitions: ids and display
// metadata. The actual prompt text lives server-side in
// `functions/src/prompts.ts` so it can be tuned without shipping a new build.
//
// The two halves are joined only by these string ids — `functions/` is a
// separate npm package and can't import from `@/`. If you add a pack, add it
// in BOTH places or the server will silently fall back to the default.
//
// Human-readable labels are not here either; they're translated, so they live
// in `i18n/translations/*` under `artStyles.*`.
//
// Styles are FREE and deliberately ungated. Users already pay per generation
// in credits; a second paywall on top of that is friction for little revenue,
// and styles cost nothing extra to serve. They exist to make a credit worth
// more, not to be sold separately. Don't add entitlement checks here.

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
}

// `sumi` reproduces the artwork prompt this app shipped with, so it must stay
// the default — existing artwork and new artwork then look consistent.
export const ART_STYLES: Pack<ArtStyleId>[] = [
  { id: 'sumi', emoji: '🖌️' },
  { id: 'watercolor', emoji: '💧' },
  { id: 'ukiyoe', emoji: '🎴' },
  { id: 'cyanotype', emoji: '🟦' },
  { id: 'charcoal', emoji: '⚫' },
  { id: 'goldleaf', emoji: '✨' },
];

export const DEFAULT_ART_STYLE: ArtStyleId = 'sumi';

export function isArtStyleId(value: unknown): value is ArtStyleId {
  return ART_STYLES.some((s) => s.id === value);
}
