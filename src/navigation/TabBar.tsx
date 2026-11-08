import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design/theme';
import { haptics } from '../lib/haptics';
import { Icon, IconName } from '../ui/Icon';
import { TabKey } from '../types/habit';

const TABS: { key: TabKey; label: string; icon: IconName; activeIcon: IconName }[] = [
  { key: 'today', label: 'Today', icon: 'home-outline', activeIcon: 'home' },
  { key: 'habits', label: 'Habits', icon: 'list-outline', activeIcon: 'list' },
  { key: 'insights', label: 'Insights', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

function TabItem({ tab, active, onPress }: { tab: (typeof TABS)[number]; active: boolean; onPress: () => void }) {
  const colors = useTheme();
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    scale.value = reduceMotion ? 1 : withSpring(active ? 1.08 : 1, { damping: 14, stiffness: 320 });
  }, [active, scale, reduceMotion]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      hitSlop={4}
      style={{ width: 54, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent' }}
    >
      <Animated.View style={iconStyle}>
        <Icon name={active ? tab.activeIcon : tab.icon} size={24} color={active ? colors.lime : 'rgba(255,255,255,0.88)'} />
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ alignItems: 'center', paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          gap: 2,
          padding: 6,
          borderRadius: 36,
          overflow: 'hidden',
          backgroundColor: colors.nav,
          borderWidth: 1,
          borderColor: colors.navBorder,
          boxShadow: '0px 14px 34px rgba(8,12,22,0.28)',
        }}
      >
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        {TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={tab.key === active}
            onPress={() => {
              if (tab.key !== active) {
                haptics.select();
                onChange(tab.key);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}
