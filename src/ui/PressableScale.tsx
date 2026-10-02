import { ReactNode } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children?: ReactNode;
};

/** Pressable that responds immediately with a subtle spring scale. */
export function PressableScale({ scaleTo = 0.97, style, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleIn = (event: GestureResponderEvent) => {
    if (!reduceMotion) {
      scale.value = withSpring(scaleTo, { damping: 22, stiffness: 420 });
    }
    onPressIn?.(event);
  };
  const handleOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, { damping: 18, stiffness: 320 });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable {...rest} onPressIn={handleIn} onPressOut={handleOut} style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
