import { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  stroke?: number;
  progress: number;
  color: string;
  trackColor: string;
  children?: ReactNode;
  accessibilityLabel?: string;
};

export function ProgressRing({ size = 120, stroke = 12, progress, color, trackColor, children, accessibilityLabel }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    value.value = reduceMotion ? clamped : withTiming(clamped, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [clamped, reduceMotion, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.value),
    opacity: value.value > 0.002 ? 1 : 0,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
