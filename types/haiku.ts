import { DEFAULT_ART_STYLE, type ArtStyleId } from '@/constants/packs';

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
  /** Last-used art style, remembered across artwork generations. */
  artStyle: ArtStyleId;
}

export const DEFAULT_SETTINGS: HaikuSettings = {
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
  artStyle: DEFAULT_ART_STYLE,
};
