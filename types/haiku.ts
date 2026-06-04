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
}

export const DEFAULT_SETTINGS: HaikuSettings = {
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
};
