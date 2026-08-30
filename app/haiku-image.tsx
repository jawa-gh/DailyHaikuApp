import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X, ImageIcon, Download, CreditCard, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useMutation } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { useHaikus } from '@/providers/HaikuProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { IMAGE_CREDIT_COST } from '@/types/auth';
import { generateHaikuImage } from '@/utils/haiku-image-generator';
import { isInsufficientCredits, isNotAuthenticated } from '@/utils/errors';
import PackPicker from '@/components/PackPicker';
import { ART_STYLES, type ArtStyleId } from '@/constants/packs';

// Caps the content column on wide canvases (iPad / iPadOS 26 resizable
// windows). Larger than any phone width, so it's a no-op on phones.
const CONTENT_MAX_WIDTH = 480;

export default function HaikuImageScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { credits, isPurchasing } = usePurchases();
  const { saveImageToHaiku, settings, updateSettings } = useHaikus();
  const params = useLocalSearchParams<{ line1: string; line2: string; line3: string; theme: string; haikuId: string }>();

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [imageReady, setImageReady] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyleId>(settings.artStyle);
  const { t } = useLanguage();

  const scrollViewRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;

  const themeLabel = params.theme ?? 'nature';

  // Settings arrive from AsyncStorage a beat after first render, so the
  // useState seed above can be the default rather than the user's choice.
  // Re-seed when they land — but never overwrite a selection already made.
  const styleTouched = useRef(false);
  useEffect(() => {
    if (!styleTouched.current) {
      setSelectedStyle(settings.artStyle);
    }
  }, [settings.artStyle]);

  // Selection is local; it's persisted on generate rather than on tap so
  // browsing the styles doesn't re-run updateSettings (which re-schedules the
  // daily notification as a side effect) once per chip.
  const handleSelectStyle = useCallback((style: ArtStyleId) => {
    styleTouched.current = true;
    setSelectedStyle(style);
  }, []);

  const getStyleLabel = useCallback(
    (key: ArtStyleId): string => (t.artStyles as Record<string, string>)[key] || key,
    [t],
  );

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      const lines: [string, string, string] = [
        params.line1 ?? '',
        params.line2 ?? '',
        params.line3 ?? '',
      ];
      // Credit deduction happens server-side inside the Cloud Function:
      // it spends 2 credits in a Firestore transaction *before* calling
      // OpenAI, and refunds atomically if generation fails.
      return generateHaikuImage({
        lines,
        theme: themeLabel,
        style: selectedStyle,
      });
    },
    onSuccess: (data) => {
      const dataUri = `data:${data.mimeType};base64,${data.base64Data}`;
      setGeneratedImage(data.base64Data);
      setImageMimeType(data.mimeType);
      setImageReady(true);

      if (params.haikuId) {
        // Pass base64 + mime so the provider can write to disk under a
        // stable path and persist the file URI in the archive (rather than
        // a huge inline data: URI we'd have to strip on save).
        saveImageToHaiku(params.haikuId, data.base64Data, data.mimeType);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      if (isNotAuthenticated(error)) {
        // Function rejected because the caller isn't signed in. Force sign-in.
        router.replace('/auth');
        return;
      }
      if (isInsufficientCredits(error)) {
        // Server-side credit check rejected — likely a stale client view.
        // Route to /purchase rather than showing a generic generation error.
        router.push('/purchase');
        return;
      }
      console.error('Image generation error:', error);
      Alert.alert(t.haikuImage.generationFailed, t.haikuImage.generationFailedMessage);
    },
  });

  const handlePurchaseAndGenerate = useCallback(async () => {
    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (credits < IMAGE_CREDIT_COST) {
      router.push('/purchase');
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      setHasPurchased(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      if (selectedStyle !== settings.artStyle) {
        void updateSettings({ artStyle: selectedStyle });
      }

      await generateImageMutation.mutateAsync();
    } catch (err) {
      console.error('Purchase/generate failed:', err);
      setHasPurchased(false);
      checkAnim.setValue(0);
    }
  }, [isAuthenticated, credits, scaleAnim, checkAnim, generateImageMutation, selectedStyle, settings.artStyle, updateSettings]);

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = `data:${imageMimeType};base64,${generatedImage}`;
        link.download = `haiku-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Alert.alert(t.haikuImage.downloaded, t.haikuImage.imageDownloaded);
      } else {
        if (Platform.OS === 'ios') {
          // writeOnly = true → iOS shows the less invasive "Add Only" prompt
          // ("save to photos") instead of asking for full photo library
          // access. iOS still requires a permission for write-to-library.
          const { status } = await MediaLibrary.requestPermissionsAsync(true);
          if (status !== 'granted') {
            Alert.alert(t.haikuImage.permissionRequired, t.haikuImage.permissionMessage);
            return;
          }
        }
        // Android: saveToLibraryAsync uses MediaStore.insert() on API 29+,
        // which requires no permission for adding files to the user's media
        // library. We deliberately don't request — and the manifest blocks —
        // READ_MEDIA_IMAGES / READ_MEDIA_VIDEO. Google Play policy forbids
        // those for apps that only save (never read) the user's media.

        const fileName = `haiku-${Date.now()}.png`;
        const file = new File(Paths.cache, fileName);
        const binaryString = atob(generatedImage);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        file.write(bytes);

        await MediaLibrary.saveToLibraryAsync(file.uri);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t.haikuImage.saved, t.haikuImage.imageSaved);
      }
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(t.haikuImage.saveFailed, t.haikuImage.saveFailedMessage);
    }
  }, [generatedImage, imageMimeType]);

  const imageUri = generatedImage ? `data:${imageMimeType};base64,${generatedImage}` : null;

  useEffect(() => {
    if (imageReady && imageUri) {
      imageAnim.setValue(0);
      Animated.timing(imageAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [imageReady, imageUri]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="image-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconWrap}>
            <ImageIcon size={28} color={Colors.accent} />
          </View>
          <Text style={styles.title}>{t.haikuImage.title}</Text>
          <Text style={styles.subtitle}>
            {t.haikuImage.subtitle}
          </Text>
        </View>

        <View style={styles.haikuPreview}>
          <Text style={styles.previewLine}>{params.line1}</Text>
          <View style={styles.previewDivider} />
          <Text style={styles.previewLine}>{params.line2}</Text>
          <View style={styles.previewDivider} />
          <Text style={styles.previewLine}>{params.line3}</Text>
        </View>

        {!generatedImage && !generateImageMutation.isPending && (
          <View style={styles.styleSection}>
            <PackPicker
              label={t.haikuImage.artStyle}
              packs={ART_STYLES}
              selected={selectedStyle}
              onSelect={handleSelectStyle}
              getLabel={getStyleLabel}
              testIDPrefix="style-chip"
            />
          </View>
        )}

        {!generatedImage && !generateImageMutation.isPending && (
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Sparkles size={18} color={Colors.accent} />
                <Text style={styles.priceLabel}>{t.haikuImage.aiArtwork}</Text>
              </View>
              <Text style={styles.priceValue}>
                {IMAGE_CREDIT_COST}{' '}
                {IMAGE_CREDIT_COST === 1 ? t.haikuImage.credit : t.haikuImage.credits}
              </Text>
            </View>
            <Text style={styles.balanceText}>
              {t.purchase.youHave} {credits}{' '}
              {credits === 1 ? t.purchase.creditRemaining : t.purchase.creditsRemaining}
            </Text>
            <View style={styles.priceDividerLine} />
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>{t.haikuImage.feature1}</Text>
              <Text style={styles.featureItem}>{t.haikuImage.feature2}</Text>
              <Text style={styles.featureItem}>{t.haikuImage.feature3}</Text>
            </View>
          </View>
        )}

        {generateImageMutation.isPending && (
          <View style={styles.generatingContainer}>
            <View style={styles.generatingInner}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.generatingText}>{t.haikuImage.creatingArtwork}</Text>
              <Text style={styles.generatingHint}>{t.haikuImage.mayTakeSeconds}</Text>
            </View>
          </View>
        )}

        {imageReady && imageUri && (
          <Animated.View style={[styles.imageContainer, { opacity: imageAnim, transform: [{ scale: imageAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            <View style={styles.imageSuccessBanner}>
              <Check size={16} color={Colors.white} />
              <Text style={styles.imageSuccessText}>{t.haikuImage.artworkReady}</Text>
            </View>
            <Image
              source={{ uri: imageUri }}
              style={styles.generatedImage}
              resizeMode="cover"
              onLoad={() => console.log('Image rendered successfully')}
              onError={(e) => console.error('Image render error:', e.nativeEvent)}
              testID="generated-image"
            />
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload}
              activeOpacity={0.7}
              testID="download-button"
            >
              <Download size={20} color={Colors.white} />
              <Text style={styles.downloadText}>{t.haikuImage.saveToDevice}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!generatedImage && !generateImageMutation.isPending && (
          <View style={styles.bottomSection}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  (isPurchasing || hasPurchased) && styles.purchaseButtonDisabled,
                ]}
                onPress={handlePurchaseAndGenerate}
                disabled={isPurchasing || hasPurchased || generateImageMutation.isPending}
                activeOpacity={0.8}
                testID="generate-image-button"
              >
                {hasPurchased ? (
                  <Animated.View style={[styles.purchaseContent, { opacity: checkAnim }]}>
                    <Check size={22} color={Colors.white} />
                  </Animated.View>
                ) : (
                  <View style={styles.purchaseContent}>
                    <CreditCard size={20} color={Colors.white} />
                    <Text style={styles.purchaseText}>
                      {t.haikuImage.generateFor} {IMAGE_CREDIT_COST}{' '}
                      {IMAGE_CREDIT_COST === 1 ? t.haikuImage.credit : t.haikuImage.credits}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.disclaimer}>
              {t.haikuImage.disclaimer}
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerSection: {
    alignItems: 'center',
    paddingTop: 4,
    marginBottom: 28,
  },
  iconWrap: {
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
  haikuPreview: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  previewLine: {
    fontSize: 17,
    lineHeight: 28,
    color: Colors.ink,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  previewDivider: {
    width: 20,
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 6,
  },
  // No card background here — the picker's own chips carry the surface, and
  // boxing them inside another card reads as a nested panel.
  styleSection: {
    marginBottom: 8,
  },
  priceSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  balanceText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  priceDividerLine: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 14,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingLeft: 12,
    lineHeight: 18,
  },
  generatingContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  generatingInner: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  generatingText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 4,
  },
  generatingHint: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  imageContainer: {
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  imageSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sage,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 4,
  },
  imageSuccessText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  generatedImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.sage,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
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
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
