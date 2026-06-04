import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  Modal,
  Pressable,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, BookOpen, ImageIcon, X, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Colors from '@/constants/colors';
import { useHaikus } from '@/providers/HaikuProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { SEASON_THEMES, formatDate } from '@/constants/haiku-themes';
import { Haiku } from '@/types/haiku';

// Horizontal screen padding and inter-item gap for the image grid. Kept in
// module scope so both the column math and the StyleSheet padding agree.
const H_PADDING = 24;
const GRID_GAP = 10;

// Caps the content column on wide canvases (iPad / iPadOS 26 resizable
// windows). Larger than any phone width, so it's a no-op on phones; on a
// tablet the whole archive — header, filters, list and image grid — sits in a
// single centered column instead of sprawling edge-to-edge.
const CONTENT_MAX_WIDTH = 600;

// Responsive column count for the image grid, derived from the (capped)
// content width rather than a stale module-scope Dimensions snapshot.
function getGridColumns(width: number): number {
  if (width >= 560) return 3;
  return 2;
}

type FilterType = 'all' | 'favorites' | 'images';

function HaikuCard({ haiku, onToggleFavorite, onImagePress, dateLocale, getThemeLabel }: { haiku: Haiku; onToggleFavorite: (id: string) => void; onImagePress: (uri: string, haiku: Haiku) => void; dateLocale: string; getThemeLabel: (key: string) => string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const themeInfo = SEASON_THEMES[haiku.theme];

  const handleFavorite = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggleFavorite(haiku.id);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          {themeInfo && (
            <View style={styles.themeChip}>
              <Text style={styles.themeEmoji}>{themeInfo.emoji}</Text>
              <Text style={styles.themeName}>{getThemeLabel(haiku.theme)}</Text>
            </View>
          )}
          {!themeInfo && haiku.theme && (
            <View style={styles.themeChip}>
              <Text style={styles.themeEmoji}>✏️</Text>
              <Text style={styles.themeName}>{haiku.theme}</Text>
            </View>
          )}
          <Text style={styles.cardDate}>{formatDate(haiku.date, dateLocale)}</Text>
        </View>
        <TouchableOpacity onPress={handleFavorite} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Heart
            size={20}
            color={haiku.isFavorite ? Colors.accent : Colors.textMuted}
            fill={haiku.isFavorite ? Colors.accent : 'none'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardLines}>
        <Text style={styles.cardLine}>{haiku.lines[0]}</Text>
        <Text style={styles.cardLine}>{haiku.lines[1]}</Text>
        <Text style={styles.cardLine}>{haiku.lines[2]}</Text>
      </View>

      {haiku.imageUri && (
        <TouchableOpacity
          style={styles.cardImageContainer}
          onPress={() => onImagePress(haiku.imageUri!, haiku)}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: haiku.imageUri }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardImageOverlay}>
            <ImageIcon size={14} color={Colors.white} />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.cardAccent} />
    </Animated.View>
  );
}

function ImageGridItem({ haiku, onPress, dateLocale, size }: { haiku: Haiku; onPress: (uri: string, haiku: Haiku) => void; dateLocale: string; size: number }) {
  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: size, height: size }]}
      onPress={() => onPress(haiku.imageUri!, haiku)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: haiku.imageUri }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.gridOverlay}>
        <Text style={styles.gridLine} numberOfLines={1}>{haiku.lines[0]}</Text>
        <Text style={styles.gridDate}>{formatDate(haiku.date, dateLocale)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const MemoizedHaikuCard = React.memo(HaikuCard);
const MemoizedImageGridItem = React.memo(ImageGridItem);

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { haikus, favorites, toggleFavorite } = useHaikus();
  const { t, dateLocale } = useLanguage();

  // Responsive image-grid metrics, derived from the capped content width so
  // tiles stay in the centered column and never balloon to full iPad width.
  // Recomputed on resize/rotation.
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH);
  const gridColumns = getGridColumns(contentWidth);
  const gridItemSize = (contentWidth - H_PADDING * 2 - GRID_GAP * (gridColumns - 1)) / gridColumns;

  // Square lightbox image, capped so the haiku text + save button below it
  // always stay on screen — on a wide iPad an uncapped square would push them
  // off the bottom (the App Store iPad rejection).
  const lightboxImageSize = Math.min(width - 32, height * 0.5, 480);

  const getThemeLabel = useCallback((key: string): string => {
    return (t.themes as Record<string, string>)[key] || key;
  }, [t]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [lightboxVisible, setLightboxVisible] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxHaiku, setLightboxHaiku] = useState<Haiku | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const imageHaikus = useMemo(() => {
    return haikus.filter((h) => !!h.imageUri);
  }, [haikus]);

  const data = filter === 'favorites' ? favorites : filter === 'images' ? imageHaikus : haikus;

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const handleImagePress = useCallback((uri: string, haiku: Haiku) => {
    setLightboxImage(uri);
    setLightboxHaiku(haiku);
    setLightboxVisible(true);
  }, []);

  const handleSaveToDevice = useCallback(async () => {
    if (!lightboxImage || isSaving) return;

    setIsSaving(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = lightboxImage;
        link.download = `haiku-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert(t.archive.downloaded, t.archive.imageDownloaded);
      } else {
        if (Platform.OS === 'ios') {
          // writeOnly = true → iOS shows the less invasive "Add Only" prompt
          // ("save to photos") instead of asking for full photo library
          // access. iOS still requires a permission for write-to-library.
          const { status } = await MediaLibrary.requestPermissionsAsync(true);
          if (status !== 'granted') {
            Alert.alert(t.archive.permissionRequired, t.archive.permissionMessage);
            setIsSaving(false);
            return;
          }
        }
        // Android: saveToLibraryAsync uses MediaStore.insert() on API 29+,
        // which requires no permission for adding files to the user's media
        // library. We deliberately don't request — and the manifest blocks —
        // READ_MEDIA_IMAGES / READ_MEDIA_VIDEO. Google Play policy forbids
        // those for apps that only save (never read) the user's media, and
        // an Android review rejection landed on exactly that point.

        if (lightboxImage.startsWith('data:')) {
          const base64Data = lightboxImage.split(',')[1];
          if (!base64Data) throw new Error('Invalid image data');
          const fileName = `haiku-${Date.now()}.png`;
          const file = new File(Paths.cache, fileName);
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          file.write(bytes);
          await MediaLibrary.saveToLibraryAsync(file.uri);
        } else {
          const response = await fetch(lightboxImage);
          const blob = await response.blob();
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const fileName = `haiku-${Date.now()}.png`;
          const file = new File(Paths.cache, fileName);
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          file.write(bytes);
          await MediaLibrary.saveToLibraryAsync(file.uri);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t.archive.saved, t.archive.imageSavedToLibrary);
      }
    } catch (error) {
      console.error('Save to device failed:', error);
      Alert.alert(t.archive.saveFailed, t.archive.saveFailedMessage);
    } finally {
      setIsSaving(false);
    }
  }, [lightboxImage, isSaving]);

  const renderItem = useCallback(
    ({ item }: { item: Haiku }) => (
      <MemoizedHaikuCard haiku={item} onToggleFavorite={handleToggleFavorite} onImagePress={handleImagePress} dateLocale={dateLocale} getThemeLabel={getThemeLabel} />
    ),
    [handleToggleFavorite, handleImagePress, dateLocale, getThemeLabel]
  );

  const renderGridItem = useCallback(
    ({ item }: { item: Haiku }) => (
      <MemoizedImageGridItem haiku={item} onPress={handleImagePress} dateLocale={dateLocale} size={gridItemSize} />
    ),
    [handleImagePress, dateLocale, gridItemSize]
  );

  const keyExtractor = useCallback((item: Haiku) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.archive.title}</Text>
        <Text style={styles.headerSubtitle}>
          {haikus.length} {haikus.length !== 1 ? t.archive.haikus : t.archive.haiku} {t.archive.collected}
          {imageHaikus.length > 0 ? ` · ${imageHaikus.length} ${imageHaikus.length !== 1 ? t.archive.images : t.archive.image}` : ''}
        </Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <BookOpen size={14} color={filter === 'all' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.filterLabel, filter === 'all' && styles.filterLabelActive]}>{t.archive.all}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'favorites' && styles.filterChipActive]}
          onPress={() => setFilter('favorites')}
          activeOpacity={0.7}
        >
          <Heart
            size={14}
            color={filter === 'favorites' ? Colors.white : Colors.textSecondary}
            fill={filter === 'favorites' ? Colors.white : 'none'}
          />
          <Text style={[styles.filterLabel, filter === 'favorites' && styles.filterLabelActive]}>
            {t.archive.favorites}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'images' && styles.filterChipActive]}
          onPress={() => setFilter('images')}
          activeOpacity={0.7}
        >
          <ImageIcon size={14} color={filter === 'images' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.filterLabel, filter === 'images' && styles.filterLabelActive]}>
            {t.archive.imagesFilter}
          </Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>
            {filter === 'favorites' ? '💝' : filter === 'images' ? '🎨' : '📜'}
          </Text>
          <Text style={styles.emptyTitle}>
            {filter === 'favorites' ? t.archive.noFavorites : filter === 'images' ? t.archive.noImages : t.archive.noHaikus}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'favorites'
              ? t.archive.tapHeartHint
              : filter === 'images'
              ? t.archive.generateArtworkHint
              : t.archive.dailyHaikuHint}
          </Text>
        </View>
      ) : filter === 'images' ? (
        <FlatList
          key={`grid-${gridColumns}-columns`}
          data={data}
          renderItem={renderGridItem}
          keyExtractor={keyExtractor}
          numColumns={gridColumns}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.gridList, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={lightboxVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={styles.lightboxOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLightboxVisible(false)} />
          <View style={[styles.lightboxContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setLightboxVisible(false)}
              activeOpacity={0.7}
            >
              <X size={22} color={Colors.white} />
            </TouchableOpacity>

            {lightboxImage && (
              <Image
                source={{ uri: lightboxImage }}
                style={[styles.lightboxImage, { width: lightboxImageSize, height: lightboxImageSize }]}
                resizeMode="contain"
              />
            )}

            {lightboxHaiku && (
              <View style={styles.lightboxHaiku}>
                <Text style={styles.lightboxLine}>{lightboxHaiku.lines[0]}</Text>
                <Text style={styles.lightboxLine}>{lightboxHaiku.lines[1]}</Text>
                <Text style={styles.lightboxLine}>{lightboxHaiku.lines[2]}</Text>
                <Text style={styles.lightboxDate}>{formatDate(lightboxHaiku.date, dateLocale)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.lightboxSaveButton, isSaving && styles.lightboxSaveButtonDisabled]}
              onPress={handleSaveToDevice}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Download size={18} color={Colors.white} />
              <Text style={styles.lightboxSaveText}>{isSaving ? t.archive.saving : t.archive.saveToDevice}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
  },
  filterChipActive: {
    backgroundColor: Colors.ink,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.white,
  },
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  gridList: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardMeta: {
    gap: 6,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeEmoji: {
    fontSize: 12,
  },
  themeName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  cardDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  cardLines: {
    gap: 4,
  },
  cardLine: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.ink,
    fontStyle: 'italic' as const,
  },
  cardImageContainer: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
  },
  cardImageOverlay: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAccent: {
    height: 2,
    backgroundColor: Colors.sageLight,
    borderRadius: 1,
    marginTop: 16,
    width: 40,
    opacity: 0.8,
  },
  gridItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  gridOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  gridLine: {
    fontSize: 12,
    color: Colors.white,
    fontStyle: 'italic' as const,
  },
  gridDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  lightboxClose: {
    position: 'absolute' as const,
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lightboxImage: {
    borderRadius: 20,
  },
  lightboxHaiku: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  lightboxLine: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic' as const,
    textAlign: 'center',
    lineHeight: 24,
  },
  lightboxDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  lightboxSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lightboxSaveButtonDisabled: {
    opacity: 0.5,
  },
  lightboxSaveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
