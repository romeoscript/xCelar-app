import * as Haptics from 'expo-haptics';

/** A light tap for button/control presses — confirms the touch registered. */
export function tapFeedback(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** A success notification for completed actions (e.g. booking confirmed). */
export function successFeedback(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
