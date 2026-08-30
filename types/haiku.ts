import {
  DEFAULT_ART_STYLE,
  DEFAULT_POET_VOICE,
  type ArtStyleId,
  type PoetVoiceId,
} from '@/constants/packs';

export interface Haiku {
  id: string;
  lines: [string, string, string];
  theme: string;
  date: string;
  isFavorite: boolean;
  createdAt: number;
  imageUri?: string;
}

export interface HaikuSettings {
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
  /**
   * Last-used packs. Picked per generation in the topic sheet / artwork
   * screen, but remembered here so the plain refresh button and the
   * mount-time auto-generate reuse the user's last choice.
   */
  poetVoice: PoetVoiceId;
  artStyle: ArtStyleId;
}

export const DEFAULT_SETTINGS: HaikuSettings = {
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
  poetVoice: DEFAULT_POET_VOICE,
  artStyle: DEFAULT_ART_STYLE,
};
