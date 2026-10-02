import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../design/theme';
import { spacing } from '../design/tokens';
import { haptics } from '../lib/haptics';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, title, message, confirmLabel, destructive, onConfirm, onCancel }: Props) {
  const colors = useTheme();
  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      {visible ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xxl }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss" accessibilityRole="button" />
          <Animated.View
            entering={ZoomIn.springify().damping(20).stiffness(260)}
            accessibilityViewIsModal
            style={{ backgroundColor: colors.card, borderRadius: 28, padding: spacing.xl, gap: spacing.md }}
          >
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            <Text variant="body" color="secondary">
              {message}
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <Button
                label={confirmLabel}
                variant={destructive ? 'destructive' : 'primary'}
                onPress={() => {
                  if (destructive) {
                    haptics.warning();
                  }
                  onConfirm();
                }}
              />
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}
