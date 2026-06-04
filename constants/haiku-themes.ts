export const SEASON_THEMES: Record<string, { label: string; emoji: string }> = {
  spring: { label: 'Spring', emoji: '🌸' },
  summer: { label: 'Summer', emoji: '☀️' },
  autumn: { label: 'Autumn', emoji: '🍂' },
  winter: { label: 'Winter', emoji: '❄️' },
  nature: { label: 'Nature', emoji: '🌿' },
  ocean: { label: 'Ocean', emoji: '🌊' },
  mountain: { label: 'Mountain', emoji: '⛰️' },
  rain: { label: 'Rain', emoji: '🌧️' },
  night: { label: 'Night', emoji: '🌙' },
  dawn: { label: 'Dawn', emoji: '🌅' },
  love: { label: 'Love', emoji: '❤️' },
  solitude: { label: 'Solitude', emoji: '🧘' },
  city: { label: 'City', emoji: '🏙️' },
  forest: { label: 'Forest', emoji: '🌲' },
  stars: { label: 'Stars', emoji: '✨' },
  tea: { label: 'Tea', emoji: '🍵' },
  journey: { label: 'Journey', emoji: '🚶' },
  silence: { label: 'Silence', emoji: '🤫' },
  custom: { label: 'Custom', emoji: '✏️' },
};

export const SELECTABLE_THEMES = [
  'spring', 'summer', 'autumn', 'winter',
  'nature', 'ocean', 'mountain', 'rain',
  'night', 'dawn', 'love', 'solitude',
  'city', 'forest', 'stars', 'tea',
  'journey', 'silence',
] as const;

export type SelectableTheme = typeof SELECTABLE_THEMES[number];

export function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function getRandomTheme(): string {
  const themes = Object.keys(SEASON_THEMES);
  return themes[Math.floor(Math.random() * themes.length)];
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(dateStr: string, locale: string = 'en-US'): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
