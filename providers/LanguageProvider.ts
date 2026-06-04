import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Language, getTranslations, Translations, DATE_LOCALES } from '@/i18n';

const LANGUAGE_KEY = 'app_language';

async function loadLanguage(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && ['en', 'de', 'fr', 'es'].includes(stored)) {
      return stored as Language;
    }
    return 'en';
  } catch (error) {
    console.error('Failed to load language:', error);
    return 'en';
  }
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('en');

  const languageQuery = useQuery({
    queryKey: ['language'],
    queryFn: loadLanguage,
  });

  useEffect(() => {
    if (languageQuery.data) {
      setLanguageState(languageQuery.data);
    }
  }, [languageQuery.data]);

  const setLanguage = useCallback(async (lang: Language) => {
    console.log('Setting language to:', lang);
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t: Translations = useMemo(() => getTranslations(language), [language]);

  const dateLocale = useMemo(() => DATE_LOCALES[language], [language]);

  return {
    language,
    setLanguage,
    t,
    dateLocale,
    isLoading: languageQuery.isLoading,
  };
});
