import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../design/theme';
import { Icon } from './Icon';

type Props = {
  checked: boolean;
  color: string;
  onPress: () => void;
  onLongPress?: () => void;
  label: string;
  size?: number;
  disabled?: boolean;
};

/** 44pt hit target around a 30pt animated completion circle. */
export function CompletionButton({ checked, color, onPress, onLongPress, label, size = 30, disabled }: Props) {
  const colors = useTheme();
  const progress = useSharedValue(checked ? 1 : 0);
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: reduceMotion ? 0 : 180 });
    if (checked && !reduceMotion) {
      pulse.value = withSequence(withSpring(1.18, { damping: 10, stiffness: 420 }), withSpring(1, { damping: 14, stiffness: 300 }));
    }
  }, [checked, progress, pulse, reduceMotion]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0)', color]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.textTertiary, color]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={6}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
          circleStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <Icon name="checkmark" size={size * 0.62} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
