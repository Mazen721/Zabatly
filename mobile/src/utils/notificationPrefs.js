import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'zabatly_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS = {
  bookingUpdates: true,
  promotions: true,
};

export async function loadNotificationPrefs() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export async function saveNotificationPrefs(prefs) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
