import { ReactNode, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../design/theme';
import { radius, spacing } from '../design/tokens';
import { Text } from './Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeightRatio?: number;
};

export function BottomSheet({ visible, onClose, title, children, maxHeightRatio = 0.88 }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      progress.value = reduceMotion ? 1 : withSpring(1, { damping: 26, stiffness: 260, mass: 0.9 });
    } else {
      progress.value = withTiming(0, { duration: reduceMotion ? 0 : 200, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          scheduleOnRN(setMounted, false);
        }
      });
    }
  }, [visible, progress, drag, reduceMotion]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      drag.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 110 || event.velocityY > 900) {
        scheduleOnRN(onClose);
      } else {
        drag.value = withSpring(0, { damping: 24, stiffness: 300 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - Math.min(1, progress.value)) * height + drag.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value) }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
          </Animated.View>

          <Animated.View
            accessibilityViewIsModal
            style={[
              {
                maxHeight: height * maxHeightRatio,
                borderTopLeftRadius: radius.sheet,
                borderTopRightRadius: radius.sheet,
                overflow: 'hidden',
                backgroundColor: colors.isDark ? 'rgba(24,27,33,0.94)' : 'rgba(255,255,255,0.95)',
                borderTopWidth: 1,
                borderColor: colors.separator,
              },
              sheetStyle,
            ]}
          >
            <BlurView intensity={60} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <GestureDetector gesture={pan}>
              <View style={{ alignItems: 'center', paddingTop: spacing.sm, paddingBottom: title ? spacing.xs : spacing.md }}>
                <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.fillStrong }} />
                {title ? (
                  <Text variant="headline" weight="700" style={{ marginTop: spacing.md }} accessibilityRole="header">
                    {title}
                  </Text>
                ) : null}
              </View>
            </GestureDetector>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
