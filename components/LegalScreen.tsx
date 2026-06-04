// Shared renderer for static legal documents (Privacy Policy, Terms of
// Service). Each LegalSection is a typed segment array — paragraph, bullets,
// or subheading — rendered with consistent typography.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type {
  LegalDocument,
  LegalSection,
  LegalSegment,
} from '@/constants/legal/privacy';

// Caps the reading column on wide canvases (iPad / iPadOS 26 resizable
// windows). Apple reviewers always open the Privacy Policy and Terms of
// Service screens — paragraph text that runs the full 1180pt width of an
// iPad looks "crowded" and was a factor in App Review rejections.
const CONTENT_MAX_WIDTH = 640;

interface LegalScreenProps {
  document: LegalDocument;
  testID?: string;
}

export default function LegalScreen({ document, testID }: LegalScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID={testID}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID={`${testID ?? 'legal'}-close`}
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{document.title}</Text>
        <Text style={styles.lastUpdated}>{document.lastUpdated}</Text>

        {document.draftBanner && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftBannerText}>{document.draftBanner}</Text>
          </View>
        )}

        {document.sections.map((section, idx) => (
          <Section key={idx} section={section} isFirst={idx === 0} />
        ))}
      </ScrollView>
    </View>
  );
}

function Section({
  section,
  isFirst,
}: {
  section: LegalSection;
  isFirst: boolean;
}) {
  return (
    <View
      style={[
        styles.section,
        isFirst && !section.heading && styles.firstLeadSection,
      ]}
    >
      {section.heading && <Text style={styles.heading}>{section.heading}</Text>}
      {section.segments.map((seg, segIdx) => (
        <Segment key={segIdx} segment={seg} />
      ))}
    </View>
  );
}

function Segment({ segment }: { segment: LegalSegment }) {
  if (segment.type === 'paragraph') {
    return <Text style={styles.body}>{segment.text}</Text>;
  }
  if (segment.type === 'subheading') {
    return <Text style={styles.subheading}>{segment.text}</Text>;
  }
  // bullets
  return (
    <View style={styles.bullets}>
      {segment.items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  lastUpdated: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  draftBanner: {
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  draftBannerText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  section: {
    marginTop: 28,
  },
  firstLeadSection: {
    // The section without a heading immediately under the title is the lead;
    // pull it slightly closer to the lastUpdated line.
    marginTop: 18,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginTop: 14,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  bullets: {
    marginTop: 8,
    gap: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 22,
    width: 12,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    flex: 1,
  },
});
