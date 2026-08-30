import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Sparkles, Check, CreditCard, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Caps the content column on wide canvases (iPad / iPadOS 26 resizable
// windows). Larger than any phone width, so it's a no-op on phones.
const CONTENT_MAX_WIDTH = 480;

export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const {
    credits,
    packages,
    hasStarterPack,
    purchasePackage,
    isPurchasing,
    offeringsStatus,
    offeringsError,
    reloadOfferings,
    restorePurchases,
  } = usePurchases();
  const { t } = useLanguage();

  // Hide the non-consumable starter pack once the user owns it — re-purchase
  // would be a no-op at the store and we already prevent double-grants in the
  // provider, but the cleanest UX is to drop it from the list entirely.
  const displayedPackages = useMemo(() => {
    return packages.filter(
      (pkg) => !(pkg.product.identifier === 'haiku_4_starter' && hasStarterPack),
    );
  }, [packages, hasStarterPack]);

  const [selectedIndex, setSelectedIndex] = useState<number>(
    displayedPackages.length > 1 ? 1 : 0,
  );

  // Keep selectedIndex valid when the package list changes (initial load,
  // or starter being filtered out after purchase).
  useEffect(() => {
    if (
      displayedPackages.length > 0 &&
      selectedIndex >= displayedPackages.length
    ) {
      setSelectedIndex(displayedPackages.length - 1);
    }
  }, [displayedPackages.length, selectedIndex]);

  // Mirror the live `credits` value into a ref so the purchase handler can
  // poll for changes after the App Store call returns. Credits are granted
  // server-side by the RevenueCat webhook, which arrives asynchronously
  // (typically 1–3 s after purchasePackage resolves).
  const creditsRef = useRef(credits);
  useEffect(() => {
    creditsRef.current = credits;
  }, [credits]);

  // Local "purchase pipeline in progress" flag covering both the App Store
  // call and the subsequent webhook wait. Disables the button and keeps the
  // spinner visible until credits actually arrive (or we time out).
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const handleSelect = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIndex(index);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    const pkg = displayedPackages[selectedIndex];
    if (!pkg) return;

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setIsProcessing(true);
    const startingCredits = creditsRef.current;

    try {
      await purchasePackage(pkg);

      // Wait for the RevenueCat webhook to grant credits server-side and the
      // Firestore subscription in PurchaseProvider to push the new balance
      // back into `credits`. Poll the ref every 200 ms with a 10 s ceiling
      // so we never block the user indefinitely on a webhook outage.
      const deadline = Date.now() + 10_000;
      while (
        creditsRef.current === startingCredits &&
        Date.now() < deadline
      ) {
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      }
      const creditsArrived = creditsRef.current !== startingCredits;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          creditsArrived
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
      }

      if (creditsArrived) {
        Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
          setTimeout(() => router.back(), 600);
        });
      } else {
        // Webhook didn't post within 10 s. The App Store charge succeeded
        // (purchasePackage didn't throw) so credits will arrive eventually —
        // tell the user that and close.
        Alert.alert(
          t.purchase.creditsArrivingTitle,
          t.purchase.creditsArrivingMessage,
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      Alert.alert(t.purchase.purchaseFailed, t.purchase.purchaseFailedMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // App Store guideline 3.1.1 requires a restore path because the starter
  // pack is a non-consumable. Consumable credits are deliberately not part of
  // this — see restorePurchases() in PurchaseProvider for why.
  const handleRestore = async () => {
    if (!isAuthenticated) {
      // Entitlements are keyed on the Firebase uid we pass to Purchases.logIn,
      // so there's nothing meaningful to restore onto an anonymous session.
      router.replace('/auth');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRestoring(true);
    try {
      const info = await restorePurchases();
      const foundSomething =
        (info?.allPurchasedProductIdentifiers?.length ?? 0) > 0;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          foundSomething
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
      }

      Alert.alert(
        foundSomething ? t.purchase.restored : t.purchase.nothingToRestore,
        foundSomething
          ? t.purchase.restoredMessage
          : t.purchase.nothingToRestoreMessage,
      );
    } catch (err) {
      console.error('Restore failed:', err);
      Alert.alert(t.purchase.restoreFailed, t.purchase.restoreFailedMessage);
    } finally {
      setIsRestoring(false);
    }
  };

  const selected = displayedPackages[selectedIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="purchase-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.sparkleIcon}>
            <Sparkles size={28} color={Colors.accent} />
          </View>
          <Text style={styles.title}>{t.purchase.title}</Text>
          <Text style={styles.subtitle}>
            {t.purchase.subtitle}
          </Text>
          {credits > 0 && (
            <View style={styles.currentCredits}>
              <Text style={styles.creditsText}>
                {t.purchase.youHave} {credits} {credits !== 1 ? t.purchase.creditsRemaining : t.purchase.creditRemaining}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.packages}>
          {displayedPackages.map((pkg, index) => {
            const isStarter = pkg.product.identifier === 'haiku_4_starter';
            const isBestValue = pkg.product.identifier === 'haiku_10_credits';
            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  selectedIndex === index && styles.packageCardSelected,
                ]}
                onPress={() => handleSelect(index)}
                activeOpacity={0.7}
                testID={`package-${pkg.identifier}`}
              >
                {isStarter && (
                  <View style={styles.starterBadge}>
                    <Text style={styles.starterBadgeText}>{t.purchase.starter}</Text>
                  </View>
                )}
                {isBestValue && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueBadgeText}>{t.purchase.bestValue}</Text>
                  </View>
                )}
                <View style={styles.packageContent}>
                  <View style={styles.packageLeft}>
                    <View
                      style={[
                        styles.radio,
                        selectedIndex === index && styles.radioSelected,
                      ]}
                    >
                      {selectedIndex === index && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.packageQuantity}>
                      {pkg.product.title}
                    </Text>
                  </View>
                  <Text style={styles.packagePrice}>
                    {pkg.product.priceString}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {displayedPackages.length === 0 && offeringsStatus === 'loading' && (
            <View style={styles.loadingPackages}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={styles.loadingText}>{t.purchase.loadingPackages}</Text>
            </View>
          )}

          {displayedPackages.length === 0 && offeringsStatus !== 'loading' && (
            // Error or empty — give the user a way out instead of the
            // indefinite "Loading…" the screen used to show when the
            // RevenueCat ↔ App Store Connect link or offering is misconfigured.
            <View style={styles.loadingPackages}>
              <Text style={styles.errorTitle}>
                {offeringsStatus === 'error'
                  ? t.purchase.couldNotLoadPackages
                  : t.purchase.noPackagesAvailable}
              </Text>
              {offeringsStatus === 'error' && offeringsError && (
                <Text style={styles.errorDetail} numberOfLines={3}>
                  {offeringsError}
                </Text>
              )}
              <TouchableOpacity
                style={styles.retryButton}
                onPress={reloadOfferings}
                activeOpacity={0.7}
                testID="retry-offerings"
              >
                <RefreshCw size={14} color={Colors.text} />
                <Text style={styles.retryText}>{t.purchase.tryAgain}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
            <TouchableOpacity
              style={[styles.purchaseButton, (isPurchasing || isProcessing || !selected) && styles.purchaseButtonDisabled]}
              onPress={handlePurchase}
              disabled={isPurchasing || isProcessing || !selected}
              activeOpacity={0.8}
              testID="purchase-confirm"
            >
              {isPurchasing || isProcessing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Animated.View style={[styles.purchaseContent, { opacity: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                  <CreditCard size={20} color={Colors.white} />
                  <Text style={styles.purchaseText}>
                    {t.purchase.purchaseFor} {selected?.product.priceString ?? ''}
                  </Text>
                </Animated.View>
              )}
              <Animated.View
                style={[
                  styles.checkOverlay,
                  {
                    opacity: checkAnim,
                    transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                  },
                ]}
              >
                <Check size={24} color={Colors.white} />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring || isPurchasing || isProcessing}
            activeOpacity={0.7}
            hitSlop={8}
            testID="restore-purchases"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <Text style={styles.restoreText}>{t.purchase.restorePurchases}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  currentCredits: {
    marginTop: 14,
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  creditsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.sage,
  },
  packages: {
    gap: 12,
    marginTop: 32,
  },
  packageCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  packageCardSelected: {
    borderColor: Colors.ink,
  },
  starterBadge: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  starterBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  bestValueBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  bestValueBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.background,
    letterSpacing: 1,
  },
  packageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.ink,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.ink,
  },
  packageQuantity: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  loadingPackages: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 16,
  },
  // Deliberately quiet — required by App Store review, but it shouldn't
  // compete with the purchase button. Fixed height so swapping the label for
  // the spinner doesn't shift the layout.
  restoreButton: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  purchaseButton: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  purchaseText: {
    color: Colors.blackLight,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  checkOverlay: {
    position: 'absolute' as const,
  },
});
