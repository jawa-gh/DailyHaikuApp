import React from 'react';
import LegalScreen from '@/components/LegalScreen';
import { PRIVACY_POLICY } from '@/constants/legal/privacy';
import { useLanguage } from '@/providers/LanguageProvider';

export default function PrivacyScreen() {
  const { language } = useLanguage();
  const document = PRIVACY_POLICY[language] ?? PRIVACY_POLICY.en;
  return <LegalScreen document={document} testID="privacy" />;
}
