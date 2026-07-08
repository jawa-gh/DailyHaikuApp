// Explains what a haiku is — the art form, the 5-7-5 structure, and a
// canonical Bashō example. Previously lived inline in Settings; now surfaced
// from the Today screen (collapsible, below the day's haiku) where the reader
// is actually looking at haikus. Copy still lives under the `settings.*`
// translation keys — the strings didn't change, only where they're shown.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, Hash, Feather } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

export default function HaikuExplainer() {
  const { t } = useLanguage();

  return (
    <View>
      <View style={styles.block}>
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: '#1E2A36' }]}>
            <BookOpen size={18} color={Colors.text} />
          </View>
          <Text style={styles.title}>{t.settings.japaneseArtForm}</Text>
        </View>
        <Text style={styles.description}>{t.settings.haikuDescription}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.block}>
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: Colors.sageLight }]}>
            <Hash size={18} color={Colors.sage} />
          </View>
          <Text style={styles.title}>{t.settings.syllableStructure}</Text>
        </View>
        <Text style={styles.description}>{t.settings.syllableDescription}</Text>
        <View style={styles.syllableRows}>
          <View style={styles.syllableRow}>
            <View style={styles.syllableBadge}>
              <Text style={styles.syllableBadgeText}>5</Text>
            </View>
            <Text style={styles.syllableLabel}>{t.settings.syllablesFirstLine}</Text>
          </View>
          <View style={styles.syllableRow}>
            <View style={[styles.syllableBadge, { backgroundColor: Colors.accent }]}>
              <Text style={styles.syllableBadgeText}>7</Text>
            </View>
            <Text style={styles.syllableLabel}>{t.settings.syllablesSecondLine}</Text>
          </View>
          <View style={styles.syllableRow}>
            <View style={styles.syllableBadge}>
              <Text style={styles.syllableBadgeText}>5</Text>
            </View>
            <Text style={styles.syllableLabel}>{t.settings.syllablesThirdLine}</Text>
          </View>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.block}>
        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
            <Feather size={18} color={Colors.accent} />
          </View>
          <Text style={styles.title}>{t.settings.example}</Text>
        </View>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleLine}>{t.settings.exampleLine1}</Text>
          <Text style={styles.exampleLine}>{t.settings.exampleLine2}</Text>
          <Text style={styles.exampleLine}>{t.settings.exampleLine3}</Text>
          <Text style={styles.exampleAuthor}>{t.settings.exampleAuthor}</Text>
        </View>
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
  syllableRows: {
    marginLeft: 48,
    marginTop: 12,
    gap: 8,
  },
  syllableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syllableBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syllableBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  syllableLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  exampleCard: {
    marginLeft: 48,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  exampleLine: {
    fontSize: 15,
    fontStyle: 'italic' as const,
    color: Colors.ink,
    lineHeight: 24,
    textAlign: 'center',
  },
  exampleAuthor: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
