import en, { Translations } from './translations/en';
import de from './translations/de';
import fr from './translations/fr';
import es from './translations/es';

export type Language = 'en' | 'de' | 'fr' | 'es';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
];

const translations: Record<Language, Translations> = {
  en,
  de,
  fr,
  es,
};

export function getTranslations(language: Language): Translations {
  return translations[language] || en;
}

export const DATE_LOCALES: Record<Language, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
};

export type { Translations };
