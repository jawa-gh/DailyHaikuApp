// Explains why signing in is required at all.
//
// Sign-in is a hard gate: `generateHaiku` rejects unauthenticated callers, so
// a visitor can't get a single haiku without an account. That's a real wall,
// and the honest reason isn't data collection — it's that each haiku costs
// money to produce, so the server needs an identity to meter the one free
// generation per day and to hold purchased credits. This component says that
// plainly, and names what the app deliberately does NOT do, which is the part
// that actually lowers the wall.
//
// Surfaced collapsed on the Today screen (signed-out only), mirroring the
// "What is a haiku?" pattern in HaikuExplainer.tsx.
//
// The privacy claims here must stay consistent with `constants/legal/privacy.ts`
// ("We do not use your data for marketing or profiling", no third-party
// marketing tools). Note the policy DOES say an email address may be received
// from the sign-in provider — so don't escalate this to "we get nothing".
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, CreditCard, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

export default function WhyAccount() {
  const { t } = useLanguage();

  return (
    <View>
      <View style={styles.block}>
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
            <Sparkles size={18} color={Colors.accent} />
          </View>
          <Text style={styles.title}>{t.whyAccount.reason1Title}</Text>
        </View>
        <Text style={styles.description}>{t.whyAccount.reason1}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.block}>
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: Colors.sageLight }]}>
            <CreditCard size={18} color={Colors.sage} />
          </View>
          <Text style={styles.title}>{t.whyAccount.reason2Title}</Text>
        </View>
        <Text style={styles.description}>{t.whyAccount.reason2}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.block}>
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: '#1E2A36' }]}>
            <Shield size={18} color={Colors.text} />
          </View>
          <Text style={styles.title}>{t.whyAccount.reason3Title}</Text>
        </View>
        <Text style={styles.description}>{t.whyAccount.reason3}</Text>
        <Text style={styles.footnote}>{t.whyAccount.footer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    padding: 16,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginLeft: 48,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  footnote: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginLeft: 48,
    marginTop: 12,
  },
});
