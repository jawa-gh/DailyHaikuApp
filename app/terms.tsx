import React from 'react';
import LegalScreen from '@/components/LegalScreen';
import { TERMS_OF_SERVICE } from '@/constants/legal/terms';
import { useLanguage } from '@/providers/LanguageProvider';

export default function TermsScreen() {
  const { language } = useLanguage();
  const document = TERMS_OF_SERVICE[language] ?? TERMS_OF_SERVICE.en;
  return <LegalScreen document={document} testID="terms" />;
}
