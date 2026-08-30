// Horizontal chip row for picking a poet voice or an art style.
//
// Shared by the topic sheet on Today and the artwork screen, which need the
// same control over two different pack lists. Locked chips are rendered but
// not selectable — they route to /purchase instead. Nothing is locked while
// STYLE_PACKS_REQUIRE_PURCHASE is false; see `constants/packs.ts`.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePurchases } from '@/providers/PurchaseProvider';
import { isPackUnlocked, type Pack } from '@/constants/packs';

interface PackPickerProps<Id extends string> {
  /** Section label shown above the row, e.g. "Poet voice". */
  label: string;
  packs: Pack<Id>[];
  selected: Id;
  onSelect: (id: Id) => void;
  /** Resolves a pack id to its translated display name. */
  getLabel: (id: Id) => string;
  testIDPrefix: string;
}

export default function PackPicker<Id extends string>({
  label,
  packs,
  selected,
  onSelect,
  getLabel,
  testIDPrefix,
}: PackPickerProps<Id>) {
  const { hasStylePacks } = usePurchases();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {packs.map((pack) => {
          const unlocked = isPackUnlocked(pack, hasStylePacks);
          const isSelected = pack.id === selected;

          return (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                !unlocked && styles.chipLocked,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                if (!unlocked) {
                  router.push('/purchase');
                  return;
                }
                onSelect(pack.id);
              }}
              activeOpacity={0.7}
              testID={`${testIDPrefix}-${pack.id}`}
            >
              {unlocked ? (
                <Text style={styles.emoji}>{pack.emoji}</Text>
              ) : (
                <Lock size={13} color={Colors.textMuted} />
              )}
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && styles.chipLabelSelected,
                  !unlocked && styles.chipLabelLocked,
                ]}
              >
                {getLabel(pack.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CHIP_HEIGHT = 34;

const styles = StyleSheet.create({
  // This row lives inside the topic sheet, directly above the themes list —
  // the sheet's height budget is tight and has caused an App Store rejection
  // before. So it is pinned to an exact height and takes no part in the flex
  // distribution: it can neither grow into the themes list's space nor shrink
  // when the sheet is squeezed on a short iPad window.
  //
  // The pinning matters because RN's ScrollView base style is
  // `flexGrow: 1, flexShrink: 1` (ScrollView.js → styles.baseHorizontal), so
  // a horizontal ScrollView dropped into a column expands vertically unless
  // told not to.
  container: {
    marginBottom: 16,
    flexGrow: 0,
    flexShrink: 0,
  },
  scroll: {
    height: CHIP_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    // Explicit height rather than vertical padding, so the row's fixed height
    // above always matches the chips exactly.
    height: CHIP_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  chipSelected: {
    borderColor: Colors.sage,
    backgroundColor: Colors.sageLight,
  },
  chipLocked: {
    opacity: 0.55,
  },
  emoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  chipLabelSelected: {
    color: Colors.ink,
    fontWeight: '600' as const,
  },
  chipLabelLocked: {
    color: Colors.textMuted,
  },
});
