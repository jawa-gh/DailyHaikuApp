import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Clock, ChevronRight, LogOut, User, Sparkles, CreditCard, Hash, Globe, Shield, FileText, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { ABOUT_CONTENT } from '@/constants/about';
import Colors from '@/constants/colors';
import { useHaikus } from '@/providers/HaikuProvider';
import { useAuth } from '@/providers/AuthProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { requestNotificationPermissions } from '@/utils/notifications';
import { LANGUAGES, Language } from '@/i18n';

const HOUR_OPTIONS = [6, 7, 8, 9, 10, 12, 18, 20, 21];

// Caps the content column on wide canvases (iPad / iPadOS 26 resizable
// windows). Larger than any phone width, so it's a no-op on phones; on a
// tablet the entire settings list — including the descriptive paragraphs in
// the About section — sits in a single centered column instead of stretching
// edge-to-edge.
const CONTENT_MAX_WIDTH = 600;

// Privacy and Terms are rendered as in-app screens (app/privacy.tsx,
// app/terms.tsx) that read from constants/legal/. Apple and Google still
// require a public-web privacy URL on the store listing — set that on the
// listing page itself, not here.

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, clearLocalData } = useHaikus();
  const { user, isAuthenticated, logout, deleteAccount, isDeletingAccount } = useAuth();
  const { credits } = usePurchases();
  const { t, language, setLanguage } = useLanguage();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const handleNotificationToggle = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          t.settings.permissionsRequired,
          t.settings.permissionsMessage,
          [{ text: t.settings.ok }]
        );
        return;
      }
    }

    await updateSettings({ notificationsEnabled: value });
  };

  const handleTimeSelect = async (hour: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updateSettings({ notificationHour: hour, notificationMinute: 0 });
    setShowTimePicker(false);
  };

  const handleLanguageSelect = async (lang: Language) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setLanguage(lang);
    setShowLanguagePicker(false);
  };

  const handleLogout = () => {
    Alert.alert(t.settings.signOut, t.settings.signOutConfirm, [
      { text: t.settings.cancel, style: 'cancel' },
      {
        text: t.settings.signOut,
        style: 'destructive',
        onPress: async () => {
          await logout();
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.settings.deleteAccountConfirmTitle,
      t.settings.deleteAccountConfirmMessage,
      [
        { text: t.settings.cancel, style: 'cancel' },
        {
          text: t.settings.deleteAccountConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              // Server deletes the auth user + Firestore data; on success the
              // user is signed out (isAuthenticated flips false). Then wipe the
              // local archive so a later sign-in doesn't surface old haikus.
              await deleteAccount();
              await clearLocalData();
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {
              Alert.alert(
                t.settings.deleteAccountFailed,
                t.settings.deleteAccountFailedMessage,
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.account}</Text>
          <View style={styles.card}>
            {isAuthenticated && user ? (
              <>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
                      <User size={18} color={Colors.accent} />
                    </View>
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowLabel}>{user.name}</Text>
                      <Text style={styles.rowHint}>
                        {t.settings.signedInWith} {user.provider === 'apple' ? t.settings.apple : t.settings.google}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push('/purchase')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: Colors.sageLight }]}>
                      <Sparkles size={18} color={Colors.sage} />
                    </View>
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowLabel}>{t.settings.haikuCredits}</Text>
                      <Text style={styles.rowHint}>
                        {credits} {credits !== 1 ? t.settings.creditsRemaining : t.settings.creditRemaining}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                  testID="logout-button"
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: '#3A1A1A' }]}>
                      <LogOut size={18} color="#E85454" />
                    </View>
                    <Text style={[styles.rowLabel, { color: '#E85454' }]}>{t.settings.signOut}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                  disabled={isDeletingAccount}
                  testID="delete-account-button"
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: '#3A1A1A' }]}>
                      <Trash2 size={18} color="#E85454" />
                    </View>
                    <Text style={[styles.rowLabel, { color: '#E85454' }]}>
                      {t.settings.deleteAccount}
                    </Text>
                  </View>
                  {isDeletingAccount && (
                    <ActivityIndicator size="small" color="#E85454" />
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
                testID="signin-button"
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
                    <User size={18} color={Colors.accent} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowLabel}>{t.settings.signInSignUp}</Text>
                    <Text style={styles.rowHint}>{t.settings.unlockUnlimited}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.language}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setShowLanguagePicker(!showLanguagePicker)}
              activeOpacity={0.7}
              testID="language-picker"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#1A2540' }]}>
                  <Globe size={18} color="#6EA8FE" />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>{t.settings.languageLabel}</Text>
                  <Text style={styles.rowHint}>
                    {currentLang?.flag} {currentLang?.nativeLabel}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {showLanguagePicker && (
              <View style={styles.languageGrid}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageChip,
                      language === lang.code && styles.languageChipActive,
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                    activeOpacity={0.7}
                    testID={`lang-${lang.code}`}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <View style={styles.languageTextWrap}>
                      <Text
                        style={[
                          styles.languageNative,
                          language === lang.code && styles.languageNativeActive,
                        ]}
                      >
                        {lang.nativeLabel}
                      </Text>
                      <Text style={styles.languageEnglish}>{lang.label}</Text>
                    </View>
                    {language === lang.code && (
                      <View style={styles.languageCheck}>
                        <Text style={styles.languageCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.purchase}</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push('/purchase')}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: '#2A2418' }]}>
                    <CreditCard size={18} color={Colors.accent} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowLabel}>{t.settings.buyHaikuCredits}</Text>
                    <Text style={styles.rowHint}>{t.settings.startingAtPerHaiku}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
                  <Bell size={18} color={Colors.accent} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>{t.settings.dailyReminder}</Text>
                  <Text style={styles.rowHint}>{t.settings.dailyReminderHint}</Text>
                </View>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: Colors.divider, true: Colors.accentLight }}
                thumbColor={settings.notificationsEnabled ? Colors.accent : Colors.textMuted}
                testID="notification-toggle"
              />
            </View>

            {settings.notificationsEnabled && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: Colors.sageLight }]}>
                      <Clock size={18} color={Colors.sage} />
                    </View>
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowLabel}>{t.settings.deliveryTime}</Text>
                      <Text style={styles.rowHint}>
                        {formatTime(settings.notificationHour, settings.notificationMinute)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {showTimePicker && (
                  <View style={styles.timeGrid}>
                    {HOUR_OPTIONS.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeChip,
                          settings.notificationHour === hour && styles.timeChipActive,
                        ]}
                        onPress={() => handleTimeSelect(hour)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            settings.notificationHour === hour && styles.timeChipTextActive,
                          ]}
                        >
                          {formatTime(hour, 0)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.about}</Text>
          <View style={[styles.card, styles.aboutDescriptionCard]}>
            {(() => {
              const about = ABOUT_CONTENT[language] ?? ABOUT_CONTENT.en;
              return (
                <>
                  {about.draftBanner && (
                    <View style={styles.aboutDraftBanner}>
                      <Text style={styles.aboutDraftBannerText}>
                        {about.draftBanner}
                      </Text>
                    </View>
                  )}
                  {about.lead && (
                    <Text style={styles.aboutLead}>{about.lead}</Text>
                  )}
                  {about.blocks.map((block, blockIdx) => (
                    <View
                      key={blockIdx}
                      style={[
                        styles.aboutBlock,
                        blockIdx === 0 && !about.lead && styles.aboutBlockFirst,
                      ]}
                    >
                      {block.heading && (
                        <Text style={styles.aboutHeading}>{block.heading}</Text>
                      )}
                      {block.segments.map((seg, segIdx) => {
                        if (seg.type === 'paragraph') {
                          return (
                            <Text key={segIdx} style={styles.aboutParagraph}>
                              {seg.text}
                            </Text>
                          );
                        }
                        if (seg.type === 'bullets') {
                          return (
                            <View key={segIdx} style={styles.aboutBullets}>
                              {seg.items.map((item, itemIdx) => (
                                <View key={itemIdx} style={styles.aboutBulletRow}>
                                  <Text style={styles.aboutBulletDot}>•</Text>
                                  <Text style={styles.aboutBulletText}>{item}</Text>
                                </View>
                              ))}
                            </View>
                          );
                        }
                        return (
                          <Text key={segIdx} style={styles.aboutCallout}>
                            {seg.text}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </>
              );
            })()}
          </View>
          <View style={[styles.card, styles.aboutMetaCard]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.overlay }]}>
                  <Hash size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>{t.settings.version}</Text>
                </View>
              </View>
              <Text style={styles.versionValue}>{APP_VERSION}</Text>
            </View>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/privacy')}
              activeOpacity={0.7}
              testID="settings-privacy"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.overlay }]}>
                  <Shield size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>{t.settings.aboutPrivacyPolicy}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/terms')}
              activeOpacity={0.7}
              testID="settings-terms"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.overlay }]}>
                  <FileText size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>{t.settings.aboutTermsOfService}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          {t.settings.footer}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTextWrap: {
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  rowHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  versionValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  aboutDescriptionCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  aboutMetaCard: {
    marginTop: 12,
  },
  aboutDraftBanner: {
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  aboutDraftBannerText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
    lineHeight: 17,
  },
  aboutLead: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  aboutBlock: {
    marginTop: 18,
  },
  aboutBlockFirst: {
    marginTop: 0,
  },
  aboutHeading: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  aboutParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  aboutBullets: {
    marginTop: 8,
    gap: 4,
  },
  aboutBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aboutBulletDot: {
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 22,
    width: 12,
  },
  aboutBulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    flex: 1,
  },
  aboutCallout: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.sage,
    marginTop: 12,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.overlay,
  },
  timeChipActive: {
    backgroundColor: Colors.ink,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.white,
  },
  languageGrid: {
    padding: 12,
    gap: 8,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.overlay,
  },
  languageChipActive: {
    backgroundColor: Colors.sageLight,
    borderWidth: 1.5,
    borderColor: Colors.sage,
  },
  languageFlag: {
    fontSize: 22,
  },
  languageTextWrap: {
    flex: 1,
  },
  languageNative: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  languageNativeActive: {
    fontWeight: '600' as const,
    color: Colors.ink,
  },
  languageEnglish: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  languageCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageCheckText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    paddingVertical: 16,
  },
});
