import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../design/theme';
import { withAlpha } from '../design/tokens';
import { haptics } from '../lib/haptics';
import { Text } from './Text';

export type BarDatum = {
  key: string;
  label: string;
  /** 0-100 */
  value: number;
  accessibilityLabel: string;
};

type Props = {
  data: BarDatum[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  color: string;
  height?: number;
  /** Show every Nth axis label (for dense charts). */
  labelEvery?: number;
};

function Bar({ value, max, color, selected }: { value: number; max: number; color: string; selected: boolean }) {
  const colors = useTheme();
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = Math.max(0, Math.min(100, value)) / 100;
    progress.value = reduceMotion ? target : withTiming(target, { duration: 480, easing: Easing.out(Easing.cubic) });
  }, [value, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({ height: Math.max(6, progress.value * max) }));

  return (
    <Animated.View
      style={[
        { width: '100%', borderRadius: 8, backgroundColor: value > 0 ? (selected ? color : withAlpha(color, 0.38)) : colors.fillStrong },
        style,
      ]}
    />
  );
}

export function BarChart({ data, selectedKey, onSelect, color, height = 140, labelEvery = 1 }: Props) {
  const colors = useTheme();
  const dense = data.length > 14;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: dense ? 3 : 10, borderBottomWidth: 1, borderBottomColor: colors.separator }}>
        {data.map((item) => (
          <Pressable
            key={item.key}
            disabled={!onSelect}
            onPress={() => {
              haptics.select();
              onSelect?.(item.key);
            }}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            accessibilityState={{ selected: item.key === selectedKey }}
            style={{ flex: 1, height, justifyContent: 'flex-end', alignItems: 'center' }}
          >
            <Bar value={item.value} max={height - 4} color={color} selected={selectedKey ? item.key === selectedKey : true} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: dense ? 3 : 10 }}>
        {data.map((item, index) => (
          <View key={item.key} style={{ flex: 1, alignItems: 'center' }}>
            {index % labelEvery === 0 ? (
              <Text
                variant="caption"
                color={item.key === selectedKey ? 'text' : 'tertiary'}
                weight={item.key === selectedKey ? '700' : '500'}
                numberOfLines={1}
                style={{ width: dense ? 36 : undefined, textAlign: 'center' }}
              >
                {item.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
