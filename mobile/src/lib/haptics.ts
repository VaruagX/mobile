import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Light tap feedback on press (no-op on web). */
export function tap() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

export function success() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
