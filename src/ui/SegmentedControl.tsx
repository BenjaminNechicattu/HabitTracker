import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../design/theme';
import { haptics } from '../lib/haptics';
import { Text } from './Text';

type Option<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
};

const PADDING = 4;

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const colors = useTheme();
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const index = Math.max(0, options.findIndex((option) => option.key === value));
  const segmentWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const offset = useSharedValue(0);

  useEffect(() => {
    const target = index * segmentWidth;
    offset.value = reduceMotion || segmentWidth === 0 ? target : withSpring(target, { damping: 22, stiffness: 320 });
  }, [index, segmentWidth, offset, reduceMotion]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      style={{ backgroundColor: colors.fillStrong, borderRadius: 16, padding: PADDING, flexDirection: 'row', minHeight: 44 }}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            {
              pointerEvents: 'none',
              position: 'absolute',
              top: PADDING,
              left: PADDING,
              bottom: PADDING,
              width: segmentWidth,
              borderRadius: 12,
              backgroundColor: colors.isDark ? colors.card : '#FFFFFF',
              boxShadow: `0px 2px 8px ${colors.shadow}`,
            },
            thumbStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptics.select();
                onChange(option.key);
              }
            }}
            style={{ flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text variant="subhead" weight={selected ? '700' : '600'} color={selected ? 'text' : 'secondary'} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
