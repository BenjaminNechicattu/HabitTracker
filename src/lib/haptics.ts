import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

function run(task: () => Promise<void>) {
  if (!enabled) {
    return;
  }
  task().catch(() => {
    // Haptics are best-effort and unavailable on some devices/platforms.
  });
}

export const haptics = {
  /** Light impact – toggles, taps. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Medium impact – completing a habit. */
  complete: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Selection tick – drag, pickers, segmented controls. */
  select: () => run(() => Haptics.selectionAsync()),
  /** Success – milestones only. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
