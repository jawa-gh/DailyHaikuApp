export const SYLLABLE_PATTERN = [5, 7, 5] as const;

export type HaikuLines = [string, string, string];

export interface HaikuDraft {
  line1_syllables: string;
  line1: string;
  line2_syllables: string;
  line2: string;
  line3_syllables: string;
  line3: string;
}

const DRAFT_KEYS = [
  'line1_syllables',
  'line1',
  'line2_syllables',
  'line2',
  'line3_syllables',
  'line3',
] as const;

// Ranks a split that doesn't spell out its line below any honest miscount.
const UNVERIFIABLE_LINE_PENALTY = 10;

const syllableField = (count: number) => ({
  type: 'string',
  description: `The line split into its counted syllables with " | " between them. Exactly ${count} segments.`,
});

// Property order is generation order: each split comes before its line, so the
// model plans the count while composing instead of reporting it afterwards.
export const HAIKU_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    line1_syllables: syllableField(SYLLABLE_PATTERN[0]),
    line1: { type: 'string' },
    line2_syllables: syllableField(SYLLABLE_PATTERN[1]),
    line2: { type: 'string' },
    line3_syllables: syllableField(SYLLABLE_PATTERN[2]),
    line3: { type: 'string' },
  },
  required: [...DRAFT_KEYS],
  additionalProperties: false,
};

export function parseDraft(content: string | null | undefined): HaikuDraft {
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }
  const parsed = JSON.parse(content);
  for (const key of DRAFT_KEYS) {
    if (typeof parsed?.[key] !== 'string' || parsed[key].trim() === '') {
      throw new Error(`OpenAI returned a malformed haiku (${key})`);
    }
  }
  return parsed as HaikuDraft;
}

const lettersOnly = (text: string) =>
  text.normalize('NFC').toLowerCase().replace(/[^\p{L}]/gu, '');

export function countSyllables(split: string): number {
  return split.split('|').filter((segment) => /\p{L}/u.test(segment)).length;
}

function lineCounts(draft: HaikuDraft): [number, number, number] {
  return [
    countSyllables(draft.line1_syllables),
    countSyllables(draft.line2_syllables),
    countSyllables(draft.line3_syllables),
  ];
}

/** 0 means a verified 5-7-5; higher is further off. */
export function formError(draft: HaikuDraft): number {
  const lines = [draft.line1, draft.line2, draft.line3];
  const splits = [draft.line1_syllables, draft.line2_syllables, draft.line3_syllables];
  const counts = lineCounts(draft);

  return lines.reduce((total, line, i) => {
    if (lettersOnly(line) !== lettersOnly(splits[i])) {
      return total + UNVERIFIABLE_LINE_PENALTY;
    }
    return total + Math.abs(counts[i] - SYLLABLE_PATTERN[i]);
  }, 0);
}

const cleanLine = (line: string) => line.replace(/\s+/g, ' ').trim();

export interface CheckedHaiku {
  lines: HaikuLines;
  counts: [number, number, number];
  error: number;
  attempts: number;
}

/**
 * Returns the first verified 5-7-5, or the closest attempt once `maxAttempts`
 * is spent. Throws only if every attempt failed outright, so the caller can
 * refund; a near-miss is still a haiku the user was charged for.
 */
export async function generateWithSyllableCheck(
  attempt: () => Promise<HaikuDraft>,
  maxAttempts: number,
): Promise<CheckedHaiku> {
  let best: { draft: HaikuDraft; error: number } | null = null;
  let lastFailure: unknown = null;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const draft = await attempt();
      const error = formError(draft);
      if (!best || error < best.error) {
        best = { draft, error };
      }
      if (error === 0) break;
    } catch (failure) {
      lastFailure = failure;
    }
  }

  if (!best) {
    throw lastFailure ?? new Error('No haiku attempt ran');
  }

  return {
    lines: [cleanLine(best.draft.line1), cleanLine(best.draft.line2), cleanLine(best.draft.line3)],
    counts: lineCounts(best.draft),
    error: best.error,
    attempts,
  };
}
