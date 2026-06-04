import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { File, Paths } from 'expo-file-system';
import { Haiku, HaikuSettings, DEFAULT_SETTINGS } from '@/types/haiku';
import { getTodayDateString, getRandomTheme, getCurrentSeason } from '@/constants/haiku-themes';
import { generateHaiku } from '@/utils/haiku-generator';
import { scheduleDailyNotification, cancelAllNotifications } from '@/utils/notifications';
import { usePurchases } from '@/providers/PurchaseProvider';
import { useLanguage } from '@/providers/LanguageProvider';

const HAIKUS_KEY = 'haiku_archive';
const SETTINGS_KEY = 'haiku_settings';

async function loadHaikus(): Promise<Haiku[]> {
  try {
    const stored = await AsyncStorage.getItem(HAIKUS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load haikus:', error);
    return [];
  }
}

async function saveHaikus(haikus: Haiku[]): Promise<void> {
  // imageUri is now a `file://` path (see saveImageToHaiku) — short enough
  // to persist safely. Previously we stripped imageUri because it was an
  // inline base64 data URI; that meant generated images disappeared after
  // app restart.
  try {
    await AsyncStorage.setItem(HAIKUS_KEY, JSON.stringify(haikus));
  } catch (error) {
    console.error('Failed to save haikus:', error);
  }
}

async function loadSettings(): Promise<HaikuSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: HaikuSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const [HaikuProvider, useHaikus] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { canGenerate } = usePurchases();
  const { language } = useLanguage();
  const [haikus, setHaikus] = useState<Haiku[]>([]);
  const [settings, setSettings] = useState<HaikuSettings>(DEFAULT_SETTINGS);

  const haikusQuery = useQuery({
    queryKey: ['haikus'],
    queryFn: loadHaikus,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: loadSettings,
  });

  useEffect(() => {
    if (haikusQuery.data) {
      setHaikus(haikusQuery.data);
    }
  }, [haikusQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const todayHaiku = useMemo(() => {
    const today = getTodayDateString();
    return haikus.find((h) => h.date === today) ?? null;
  }, [haikus]);

  const favorites = useMemo(() => {
    return haikus.filter((h) => h.isFavorite).sort((a, b) => b.createdAt - a.createdAt);
  }, [haikus]);

  const archive = useMemo(() => {
    return [...haikus].sort((a, b) => b.createdAt - a.createdAt);
  }, [haikus]);

  const generateMutation = useMutation({
    mutationFn: async ({ forceNew, selectedTheme, customTopic }: { forceNew?: boolean; selectedTheme?: string; customTopic?: string } = {}) => {
      const today = getTodayDateString();
      if (!forceNew && todayHaiku) {
        return todayHaiku;
      }

      if (forceNew && !canGenerate) {
        throw new Error('LIMIT_REACHED');
      }

      let theme: string;
      if (customTopic) {
        theme = customTopic;
      } else if (selectedTheme) {
        theme = selectedTheme;
      } else {
        theme = Math.random() > 0.5 ? getCurrentSeason() : getRandomTheme();
      }
      // The server picks the tier (free → gpt-4o-mini, paid → gpt-4o) based
      // on the authoritative daily-free / credit state in Firestore, and
      // deducts credits transactionally inside the Cloud Function. The client
      // never mutates credit state directly anymore.
      // Language is forwarded so the haiku is generated in the user's UI
      // language with calibrated examples.
      const lines = await generateHaiku(theme, language);

      const newHaiku: Haiku = {
        id: `${today}-${Date.now()}`,
        lines,
        theme,
        date: today,
        isFavorite: false,
        createdAt: Date.now(),
      };

      const filtered = forceNew ? haikus.filter((h) => h.date !== today) : haikus;
      const updated = [...filtered, newHaiku];
      setHaikus(updated);
      await saveHaikus(updated);

      return newHaiku;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['haikus'] });
    },
  });

  const saveImageToHaiku = useCallback(
    async (haikuId: string, base64Data: string, mimeType: string = 'image/png') => {
      try {
        // Write the image to the document directory so it survives app
        // restarts (cache can be evicted by the OS). The file URI is a tiny
        // string — safe to persist alongside the haiku in AsyncStorage.
        const extension =
          mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
        const fileName = `haiku-${haikuId}.${extension}`;
        const file = new File(Paths.document, fileName);

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // `write` overwrites if the file already exists (re-generating the
        // image for the same haiku replaces the old one).
        file.write(bytes);

        const updated = haikus.map((h) =>
          h.id === haikuId ? { ...h, imageUri: file.uri } : h,
        );
        setHaikus(updated);
        await saveHaikus(updated);
      } catch (error) {
        console.error('Failed to save haiku image:', error);
      }
    },
    [haikus],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const updated = haikus.map((h) =>
        h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
      );
      setHaikus(updated);
      await saveHaikus(updated);
    },
    [haikus]
  );

  // Wipe all locally-stored haiku data. Called as part of account deletion so
  // a subsequent sign-in on the same device doesn't surface the prior user's
  // archive. Deletes the on-disk image files too, not just the AsyncStorage
  // index.
  const clearLocalData = useCallback(async () => {
    for (const h of haikus) {
      if (h.imageUri?.startsWith('file://')) {
        try {
          const f = new File(h.imageUri);
          if (f.exists) f.delete();
        } catch {
          // Best-effort — orphaned files are wiped on uninstall anyway.
        }
      }
    }
    setHaikus([]);
    try {
      await AsyncStorage.removeItem(HAIKUS_KEY);
    } catch (error) {
      console.error('Failed to clear local haikus:', error);
    }
  }, [haikus]);

  const updateSettings = useCallback(
    async (newSettings: Partial<HaikuSettings>) => {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      await saveSettings(merged);

      if (merged.notificationsEnabled) {
        await scheduleDailyNotification(merged.notificationHour, merged.notificationMinute);
      } else {
        await cancelAllNotifications();
      }
    },
    [settings]
  );

  return {
    haikus: archive,
    todayHaiku,
    favorites,
    settings,
    isLoading: haikusQuery.isLoading || settingsQuery.isLoading,
    isGenerating: generateMutation.isPending,
    generateTodayHaiku: (forceNew?: boolean, selectedTheme?: string, customTopic?: string) =>
      generateMutation.mutateAsync({ forceNew, selectedTheme, customTopic }),
    generateError: generateMutation.error?.message ?? null,
    toggleFavorite,
    saveImageToHaiku,
    updateSettings,
    clearLocalData,
  };
});
