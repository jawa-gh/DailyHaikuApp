import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Feather, Cherry } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Caps the content column on wide canvases (iPad / iPadOS 26 resizable
// windows). Larger than any phone width, so it's a no-op on phones.
const CONTENT_MAX_WIDTH = 480;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithApple, isSigningIn } = useAuth();
  const { t } = useLanguage();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.auth.somethingWentWrong;
      Alert.alert(t.auth.signInFailed, message);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.auth.somethingWentWrong;
      Alert.alert(t.auth.signInFailed, message);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="auth-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.brandSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.brandIcon, { transform: [{ scale: iconScale }] }]}>
            <Feather size={36} color={Colors.accent} />
          </Animated.View>
          <Text style={styles.brandTitle}>{t.auth.title}</Text>
          <Text style={styles.brandSubtitle}>
            {t.auth.subtitle}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleSignIn}
              disabled={isSigningIn}
              activeOpacity={0.8}
              testID="auth-apple"
            >
              {isSigningIn ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.appleIcon}>{'\uF8FF'}</Text>
                  <Text style={styles.appleButtonText}>{t.auth.continueWithApple}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={isSigningIn}
              activeOpacity={0.8}
              testID="auth-google"
            >
              {isSigningIn ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>{t.auth.continueWithGoogle}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View style={[styles.benefitsSection, { opacity: fadeAnim }]}>
          <Text style={styles.benefitsTitle}>{t.auth.whySignIn}</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitRow}>
              <View style={styles.benefitDotWrap}>
                <Cherry size={14} color={Colors.accent} />
              </View>
              <Text style={styles.benefitText}>{t.auth.benefit1}</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitDotWrap}>
                <Cherry size={14} color={Colors.accent} />
              </View>
              <Text style={styles.benefitText}>{t.auth.benefit2}</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitDotWrap}>
                <Cherry size={14} color={Colors.accent} />
              </View>
              <Text style={styles.benefitText}>{t.auth.benefit3}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.footerText}>
            {t.auth.termsPrefix}
            <Text style={styles.footerLink}>{t.auth.termsOfService}</Text>
            {t.auth.and}
            <Text style={styles.footerLink}>{t.auth.privacyPolicy}</Text>
          </Text>
        </View>
      </View>

      {/*
        Full-screen busy overlay shown for the entire sign-in pipeline:
        - Apple/Google native account picker (system UI sits on top of this)
        - idToken → Firebase signInWithCredential round-trip (~1–2s, the
          previously-invisible gap that prompted this overlay)
        The button's inline spinner stays in place underneath as a fallback
        for the brief moment before this mounts.
      */}
      {isSigningIn && (
        <View style={styles.signInOverlay} pointerEvents="auto" testID="auth-loading-overlay">
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.signInOverlayText}>{t.auth.signingIn}</Text>
        </View>
      )}
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
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  buttonsSection: {
    gap: 12,
    marginBottom: 40,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appleButton: {
    backgroundColor: Colors.ink,
  },
  appleIcon: {
    fontSize: 20,
    color: Colors.white,
    marginTop: -2,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.blackLight,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.blackLight,
  },
  benefitsSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  benefitsList: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDotWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  signInOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    opacity: 0.96,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  signInOverlayText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    letterSpacing: 0.2,
  },
});
