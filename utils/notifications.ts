import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export interface NotificationContent {
  title: string;
  body: string;
}

/**
 * The OS stores the text given here, so it is fixed until the notification is
 * rescheduled — changing the app language later does not update a pending one.
 * Callers must re-invoke this on language change; `HaikuProvider` does.
 */
export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  content: NotificationContent,
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log('Scheduled daily notification:', id);
    return id;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all notifications');
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}
