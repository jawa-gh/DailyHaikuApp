import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Share,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, RefreshCw, Share2, Lock, Sparkles, Palette, X, ChevronRight, BookOpen, ImageIcon, PenLine, Feather } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useHaikus } from '@/providers/HaikuProvider';
import { useAuth } from '@/providers/AuthProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SEASON_THEMES, SELECTABLE_THEMES, formatDate, getTodayDateString } from '@/constants/haiku-themes';
import { HAIKU_CREDIT_COST } from '@/types/auth';
import { isInsufficientCredits, isNotAuthenticated } from '@/utils/errors';
import HaikuExplainer from '@/components/HaikuExplainer';

// Caps the readable content column so it doesn't stretch edge-to-edge on wide
// canvases (iPad / iPadOS 26 resizable windows). Larger than any phone width,
// so it's a no-op on phones and only kicks in on tablets.
const CONTENT_MAX_WIDTH = 480;

// LayoutAnimation drives the expand/collapse of the "What is a haiku?" section.
// On old-architecture Android it must be explicitly enabled; the guard makes
// this a no-op on the New Architecture (where the method is absent) and iOS.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todayHaiku, isGenerating, isLoading, generateTodayHaiku, toggleFavorite } = useHaikus();
  const { isAuthenticated, needsSignUp } = useAuth();
  const { canGenerate, canGenerateForFree, needsCredits, credits, packages } = usePurchases();

  // Cheapest package's localized price string (e.g. "€4.99"), used for the
  // "starting at …" hint in the out-of-credits banner. null while RevenueCat
  // is still loading offerings or on web where purchases aren't available.
  const lowestPriceString =
    packages.length > 0
      ? [...packages].sort((a, b) => a.product.price - b.product.price)[0].product.priceString
      : null;
  const { t, dateLocale } = useLanguage();

  const [topicModalVisible, setTopicModalVisible] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [showHaikuInfo, setShowHaikuInfo] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const line1Anim = useRef(new Animated.Value(0)).current;
  const line2Anim = useRef(new Animated.Value(0)).current;
  const line3Anim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  // Drives the "What is a haiku?" chevron rotation (0 = ▸ collapsed, 1 = ▾).
  const infoChevronAnim = useRef(new Animated.Value(0)).current;

  const toggleHaikuInfo = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    // Animate the height change as the explainer mounts/unmounts.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowHaikuInfo((prev) => {
      const next = !prev;
      Animated.timing(infoChevronAnim, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [infoChevronAnim]);

  // Guards the mount-time auto-generate so it fires at most once per
  // authenticated session. A failing call toggles `isGenerating` true→false,
  // which re-runs the effect below; without this guard that re-fires the call
  // endlessly — burning OpenAI quota and, since an earlier version routed to
  // /auth on failure, stacking login screens in an infinite loop.
  const autoGenerateAttempted = useRef(false);

  // Re-arm the guard whenever the user (re-)authenticates, so a fresh sign-in
  // triggers a fresh attempt.
  useEffect(() => {
    if (isAuthenticated) {
      autoGenerateAttempted.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Auto-generate today's haiku once, when signed in and none exists yet.
    // This is a PASSIVE convenience — on failure we log and stop. We do NOT
    // navigate from here: an earlier version routed to /auth on failure,
    // which looped forever when the function rejected an authenticated caller
    // (e.g. an App Check misconfiguration). Manual generation via the buttons
    // still routes to /auth or /purchase as appropriate.
    if (
      !todayHaiku &&
      !isGenerating &&
      !isLoading &&
      isAuthenticated &&
      !autoGenerateAttempted.current
    ) {
      autoGenerateAttempted.current = true;
      generateTodayHaiku().catch((error) => {
        console.error('Auto-generate failed:', error);
      });
    }
  }, [todayHaiku, isGenerating, isLoading, isAuthenticated, generateTodayHaiku]);

  useEffect(() => {
    if (todayHaiku) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      line1Anim.setValue(0);
      line2Anim.setValue(0);
      line3Anim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.stagger(200, [
          Animated.timing(line1Anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(line2Anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(line3Anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [todayHaiku?.id]);

  useEffect(() => {
    if (!canGenerateForFree && todayHaiku) {
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 400,
        delay: 1200,
        useNativeDriver: true,
      }).start();
    }
  }, [canGenerateForFree, todayHaiku]);

  const handleRefresh = async () => {
    if (!canGenerate) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      if (needsSignUp) {
        router.push('/auth');
      } else if (needsCredits) {
        router.push('/purchase');
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await generateTodayHaiku(true);
    } catch (error) {
      if (isNotAuthenticated(error)) {
        // Function rejected because the caller isn't signed in. Force sign-in
        // rather than silently falling back to a curated haiku.
        router.push('/auth');
        return;
      }
      if (isInsufficientCredits(error)) {
        // Server says no free slot + no credits. Client state may have been
        // stale — the Firestore subscription will catch up shortly, but route
        // the user to /purchase now so they're not stuck.
        router.push('/purchase');
        return;
      }
      console.error('Failed to generate haiku:', error);
    }
  };

  const openTopicModal = useCallback((customMode: boolean) => {
    if (!isAuthenticated) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      router.push('/auth');
      return;
    }
    if (!canGenerate) {
      if (needsCredits) {
        router.push('/purchase');
      }
      return;
    }
    setSelectedTheme(null);
    setCustomTopic('');
    setIsCustomMode(customMode);
    setTopicModalVisible(true);
  }, [isAuthenticated, canGenerate, needsCredits]);

  const handleOpenTopicPicker = useCallback(() => {
    openTopicModal(false);
  }, [openTopicModal]);

  const handleOpenPrompt = useCallback(() => {
    openTopicModal(true);
  }, [openTopicModal]);

  const handleGenerateWithTopic = useCallback(async () => {
    if (!canGenerate) return;

    setTopicModalVisible(false);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const topic = isCustomMode ? customTopic.trim() : undefined;
      const theme = !isCustomMode && selectedTheme ? selectedTheme : undefined;
      await generateTodayHaiku(true, theme, topic);
    } catch (error) {
      if (isNotAuthenticated(error)) {
        router.push('/auth');
        return;
      }
      if (isInsufficientCredits(error)) {
        router.push('/purchase');
        return;
      }
      console.error('Failed to generate haiku with topic:', error);
    }
  }, [canGenerate, isCustomMode, customTopic, selectedTheme, scaleAnim, generateTodayHaiku]);

  const handleToggleFavorite = () => {
    if (!todayHaiku) return;
    if (!isAuthenticated) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      router.push('/auth');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(todayHaiku.id);
  };

  const handleShare = async () => {
    if (!todayHaiku) return;
    if (!isAuthenticated) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      router.push('/auth');
      return;
    }
    const text = `${todayHaiku.lines[0]}\n${todayHaiku.lines[1]}\n${todayHaiku.lines[2]}\n\n— Daily Haiku`;
    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCreateImage = () => {
    if (!todayHaiku) return;
    if (!isAuthenticated) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      router.push('/auth');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/haiku-image',
      params: {
        line1: todayHaiku.lines[0],
        line2: todayHaiku.lines[1],
        line3: todayHaiku.lines[2],
        theme: todayHaiku.theme,
        haikuId: todayHaiku.id,
      },
    });
  };

  const canSubmitTopic = isCustomMode ? customTopic.trim().length > 0 : selectedTheme !== null;

  const getThemeLabel = (key: string): string => {
    return (t.themes as Record<string, string>)[key] || key;
  };

  const themeInfo = todayHaiku ? SEASON_THEMES[todayHaiku.theme] : null;

  // Show the "What is a haiku?" explainer in every state except the initial
  // loading spinner — including the signed-out and empty states, so newcomers
  // can learn what a haiku is before signing in. (It used to live in Settings,
  // reachable to everyone; gating it on `todayHaiku` alone would hide it from
  // logged-out users entirely.)
  const showHaikuExplainer = !((isLoading || isGenerating) && !todayHaiku);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t.today.title}</Text>
            <Text style={styles.headerDate}>{formatDate(getTodayDateString(), dateLocale)}</Text>
          </View>
          {isAuthenticated && (
            <View style={styles.creditsBadge}>
              <Sparkles size={12} color={Colors.accent} />
              <Text style={styles.creditsCount}>{credits}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {(isLoading || isGenerating) && !todayHaiku ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>{t.today.composing}</Text>
          </View>
        ) : todayHaiku ? (
          <Animated.View
            style={[
              styles.haikuCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {themeInfo && (
              <View style={styles.themeTag}>
                <Text style={styles.themeEmoji}>{themeInfo.emoji}</Text>
                <Text style={styles.themeLabel}>{getThemeLabel(todayHaiku.theme)}</Text>
              </View>
            )}

            {!themeInfo && todayHaiku.theme && (
              <View style={styles.themeTag}>
                <Text style={styles.themeEmoji}>✏️</Text>
                <Text style={styles.themeLabel}>{getThemeLabel(todayHaiku.theme) || todayHaiku.theme}</Text>
              </View>
            )}

            <View style={styles.haikuLines}>
              <Animated.Text style={[styles.haikuLine, { opacity: line1Anim }]}>
                {todayHaiku.lines[0]}
              </Animated.Text>
              <View style={styles.lineDivider} />
              <Animated.Text style={[styles.haikuLine, { opacity: line2Anim }]}>
                {todayHaiku.lines[1]}
              </Animated.Text>
              <View style={styles.lineDivider} />
              <Animated.Text style={[styles.haikuLine, { opacity: line3Anim }]}>
                {todayHaiku.lines[2]}
              </Animated.Text>
            </View>

            <View style={styles.brushStroke} />
          </Animated.View>
        ) : !isAuthenticated ? (
          // Logged-out empty state. Auto-generate is gated on auth, so when
          // the user lands here without a haiku, we surface the sign-in CTA
          // instead of leaving the screen blank.
          <View style={styles.signInPromptContainer}>
            <View style={styles.signInPromptIcon}>
              <Feather size={36} color={Colors.accent} />
            </View>
            <Text style={styles.signInPromptTitle}>
              {t.today.signInPromptTitle}
            </Text>
            <Text style={styles.signInPromptDescription}>
              {t.today.signInPromptDescription}
            </Text>
            <TouchableOpacity
              style={styles.signInPromptButton}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
              testID="today-empty-signin"
            >
              <Text style={styles.signInPromptButtonText}>{t.today.signIn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Authenticated but no haiku for today — auto-generate either hasn't
          // run yet or failed. Always offer an explicit generate action so the
          // screen is never a dead end. handleRefresh routes to /auth or
          // /purchase if the server rejects.
          <View style={styles.signInPromptContainer}>
            <View style={styles.signInPromptIcon}>
              <Feather size={36} color={Colors.accent} />
            </View>
            <Text style={styles.signInPromptTitle}>{t.today.emptyTitle}</Text>
            <Text style={styles.signInPromptDescription}>
              {t.today.emptyDescription}
            </Text>
            <TouchableOpacity
              style={styles.signInPromptButton}
              onPress={handleRefresh}
              activeOpacity={0.85}
              testID="today-empty-generate"
            >
              <Text style={styles.signInPromptButtonText}>
                {t.today.generateHaiku}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isAuthenticated && todayHaiku && !isGenerating && (
          <View style={styles.topicRow}>
            <TouchableOpacity
              style={styles.topicButton}
              onPress={handleOpenTopicPicker}
              activeOpacity={0.7}
              testID="topic-picker-button"
            >
              <Palette size={16} color={Colors.sage} />
              <Text style={styles.topicButtonText}>{t.today.chooseATopic}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={handleOpenPrompt}
              activeOpacity={0.7}
              testID="prompt-haiku-button"
            >
              <PenLine size={16} color={Colors.accent} />
              <Text style={styles.promptButtonText}>{t.today.promptAHaiku}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isAuthenticated && todayHaiku && (
          <TouchableOpacity
            style={styles.topicButtonLocked}
            onPress={() => router.push('/auth')}
            activeOpacity={0.7}
            testID="topic-picker-locked"
          >
            <Lock size={14} color={Colors.textMuted} />
            <Text style={styles.topicButtonLockedText}>{t.today.signUpToChoose}</Text>
          </TouchableOpacity>
        )}

        {!canGenerateForFree && todayHaiku && (
          <Animated.View
            style={[
              styles.limitBanner,
              {
                opacity: bannerAnim,
                transform: [
                  {
                    translateY: bannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {needsSignUp ? (
              <TouchableOpacity
                style={styles.limitBannerTouchable}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
                testID="signup-banner"
              >
                <Lock size={16} color={Colors.accent} />
                <View style={styles.limitBannerTextWrap}>
                  <Text style={styles.limitBannerTitle}>{t.today.signUpForMore}</Text>
                  <Text style={styles.limitBannerSub}>{t.today.freeLimitReached}</Text>
                </View>
                <View style={styles.limitBannerAction}>
                  <Text style={styles.limitBannerActionText}>{t.today.signUp}</Text>
                </View>
              </TouchableOpacity>
            ) : needsCredits ? (
              <TouchableOpacity
                style={styles.limitBannerTouchable}
                onPress={() => router.push('/purchase')}
                activeOpacity={0.7}
                testID="purchase-banner"
              >
                <Sparkles size={16} color={Colors.accent} />
                <View style={styles.limitBannerTextWrap}>
                  <Text style={styles.limitBannerTitle}>{t.today.getMoreHaikus}</Text>
                  {lowestPriceString && (
                    <Text style={styles.limitBannerSub}>
                      {t.today.startingAt} {lowestPriceString}
                    </Text>
                  )}
                </View>
                <View style={styles.limitBannerAction}>
                  <Text style={styles.limitBannerActionText}>{t.today.buy}</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        )}

        {showHaikuExplainer && (
          <View style={styles.infoSection}>
            <TouchableOpacity
              style={styles.infoToggle}
              onPress={toggleHaikuInfo}
              activeOpacity={0.7}
              testID="haiku-info-toggle"
            >
              <View style={styles.infoToggleLeft}>
                <BookOpen size={16} color={Colors.sage} />
                <Text style={styles.infoToggleLabel}>{t.today.whatIsHaiku}</Text>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: infoChevronAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg'],
                      }),
                    },
                  ],
                }}
              >
                <ChevronRight size={18} color={Colors.textMuted} />
              </Animated.View>
            </TouchableOpacity>

            {showHaikuInfo && (
              <View style={styles.infoContent}>
                <HaikuExplainer />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {todayHaiku && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 90 }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            testID="favorite-button"
          >
            {!isAuthenticated ? (
              <Lock size={22} color={Colors.textMuted} />
            ) : (
              <Heart
                size={22}
                color={todayHaiku.isFavorite ? Colors.accent : Colors.textSecondary}
                fill={todayHaiku.isFavorite ? Colors.accent : 'none'}
              />
            )}
            <Text style={[styles.actionLabel, !isAuthenticated && styles.actionLabelLocked, todayHaiku.isFavorite && isAuthenticated && styles.actionLabelActive]}>
              {t.today.save}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.refreshButton,
              !canGenerate && styles.refreshButtonLocked,
            ]}
            onPress={handleRefresh}
            activeOpacity={0.7}
            disabled={isGenerating}
            testID="refresh-button"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : !canGenerate ? (
              <Lock size={22} color={Colors.white} />
            ) : (
              <RefreshCw size={24} color={Colors.white} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCreateImage}
            activeOpacity={0.7}
            testID="image-button"
          >
            {!isAuthenticated ? (
              <Lock size={22} color={Colors.textMuted} />
            ) : (
              <ImageIcon size={22} color={Colors.textSecondary} />
            )}
            <Text style={[styles.actionLabel, !isAuthenticated && styles.actionLabelLocked]}>{t.today.image}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
            testID="share-button"
          >
            {!isAuthenticated ? (
              <Lock size={22} color={Colors.textMuted} />
            ) : (
              <Share2 size={22} color={Colors.textSecondary} />
            )}
            <Text style={[styles.actionLabel, !isAuthenticated && styles.actionLabelLocked]}>{t.today.share}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={topicModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTopicModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setTopicModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.today.chooseTopic}</Text>
              <TouchableOpacity
                onPress={() => setTopicModalVisible(false)}
                hitSlop={12}
                testID="close-topic-modal"
              >
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeTab, !isCustomMode && styles.modeTabActive]}
                onPress={() => setIsCustomMode(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, !isCustomMode && styles.modeTabTextActive]}>{t.today.themes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, isCustomMode && styles.modeTabActive]}
                onPress={() => setIsCustomMode(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, isCustomMode && styles.modeTabTextActive]}>{t.today.custom}</Text>
              </TouchableOpacity>
            </View>

            {!isCustomMode ? (
              <ScrollView
                style={styles.themesScroll}
                contentContainerStyle={styles.themesGrid}
                showsVerticalScrollIndicator={false}
              >
                {SELECTABLE_THEMES.map((themeKey) => {
                  const theme = SEASON_THEMES[themeKey];
                  const isSelected = selectedTheme === themeKey;
                  return (
                    <TouchableOpacity
                      key={themeKey}
                      style={[styles.themeChip, isSelected && styles.themeChipSelected]}
                      onPress={() => {
                        setSelectedTheme(themeKey);
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                      }}
                      activeOpacity={0.7}
                      testID={`theme-chip-${themeKey}`}
                    >
                      <Text style={styles.themeChipEmoji}>{theme.emoji}</Text>
                      <Text style={[styles.themeChipLabel, isSelected && styles.themeChipLabelSelected]}>
                        {getThemeLabel(themeKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.customInputContainer}>
                <Text style={styles.customHint}>
                  {t.today.customHint}
                </Text>
                <TextInput
                  style={styles.customInput}
                  value={customTopic}
                  onChangeText={setCustomTopic}
                  placeholder={t.today.customPlaceholder}
                  placeholderTextColor={Colors.textMuted}
                  maxLength={80}
                  autoFocus
                  testID="custom-topic-input"
                />
                <Text style={styles.charCount}>{customTopic.length}/80</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateButton, !canSubmitTopic && styles.generateButtonDisabled]}
              onPress={handleGenerateWithTopic}
              activeOpacity={0.7}
              disabled={!canSubmitTopic || isGenerating}
              testID="generate-with-topic"
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Sparkles size={18} color={Colors.white} />
                  <Text style={styles.generateButtonText}>
                    {t.today.generateHaiku}
                    {!canGenerateForFree && ` · ${HAIKU_CREDIT_COST} ${HAIKU_CREDIT_COST === 1 ? t.haikuImage.credit : t.haikuImage.credits}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  creditsCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  // Outer ScrollView style. Fills the vertical space between header and the
  // action row, capped to the readable content column on wide canvases.
  content: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  // Inner content container. `flexGrow: 1` + `justifyContent: 'center'` gives
  // us the original "vertically centered haiku card" feel when there's room,
  // AND makes the ScrollView fall back to scrolling when there isn't —
  // critical on short iPadOS windows where the haiku card + topic row + limit
  // banner combined exceed the available height. The previous View with
  // `justifyContent: 'center'` mathematically centered overflowing children,
  // which pushed the limit banner DOWN into the action row below it — the
  // exact "buttons overlapped and cut off on iPad" bug Apple flagged.
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  signInPromptContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 14,
  },
  signInPromptIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  signInPromptTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  signInPromptDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  signInPromptButton: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  signInPromptButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  haikuCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  themeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginBottom: 28,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  themeEmoji: {
    fontSize: 14,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  haikuLines: {
    alignItems: 'center',
    gap: 6,
  },
  haikuLine: {
    fontSize: 20,
    lineHeight: 32,
    color: Colors.ink,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  lineDivider: {
    width: 24,
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
  brushStroke: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginTop: 28,
    width: 60,
    alignSelf: 'center',
    opacity: 0.6,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  topicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  topicButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.sage,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  promptButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  topicButtonLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topicButtonLockedText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  limitBanner: {
    marginTop: 20,
  },
  limitBannerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  limitBannerTextWrap: {
    flex: 1,
  },
  limitBannerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  limitBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  limitBannerAction: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  limitBannerActionText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  infoSection: {
    marginTop: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoToggleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  infoContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  actionLabelActive: {
    color: Colors.accent,
  },
  actionLabelLocked: {
    color: Colors.textMuted,
  },
  refreshButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonLocked: {
    backgroundColor: Colors.textMuted,
    shadowColor: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 24,
    // 90% (was 80%) gives more room on short windows — iPad split view / a
    // resized iPadOS 26 window can be as short as ~500pt, where 80% wasn't
    // enough for handle + header + toggle + themes + Generate button stacked.
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.text,
  },
  themesScroll: {
    // flex: 1 (was maxHeight: 280) lets the themes list shrink/grow to fit
    // the modal's remaining space, so the Generate button below it stays on
    // screen even when the window is short (iPad split view / Stage Manager).
    flex: 1,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  themeChipSelected: {
    borderColor: Colors.sage,
    backgroundColor: Colors.sageLight,
  },
  themeChipEmoji: {
    fontSize: 16,
  },
  themeChipLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  themeChipLabelSelected: {
    color: Colors.ink,
    fontWeight: '600' as const,
  },
  customInputContainer: {
    marginBottom: 8,
  },
  customHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  customInput: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowColor: Colors.textMuted,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
