import { ReactNode } from 'react';
import { Pressable, RefreshControlProps, ScrollView, ScrollViewProps, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design/theme';
import { spacing } from '../design/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export const TAB_BAR_CLEARANCE = 108;
/** Keeps content readable on iPad / large windows. */
export const MAX_CONTENT_WIDTH = 680;

type ScreenProps = {
  children: ReactNode;
  /** Reserve room for the floating tab bar. */
  tabBar?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function Screen({ children, tabBar = true, scroll = true, contentStyle, scrollProps }: ScreenProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + (tabBar ? TAB_BAR_CLEARANCE : spacing.xxxl),
    paddingHorizontal: spacing.xl,
    width: '100%' as const,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center' as const,
  };

  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: colors.bg }, padding, contentStyle]}>{children}</View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[padding, { gap: spacing.xl }, contentStyle]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}

type TitleProps = {
  title: string;
  eyebrow?: string;
  trailing?: ReactNode;
};

export function LargeTitle({ title, eyebrow, trailing }: TitleProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <Text variant="subhead" color="secondary" numberOfLines={1}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="largeTitle" numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">
          {title}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

type BackProps = {
  title: string;
  onBack: () => void;
  trailing?: ReactNode;
  label?: string;
};

/** Pushed-page header: blue "‹ Back" link followed by a large title. */
export function PageHeader({ title, onBack, trailing, label = 'Back' }: BackProps) {
  const colors = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
          <Icon name="chevron-back" size={24} color={colors.accent} style={{ marginLeft: -6 }} />
          <Text variant="body" color="accent">
            {label}
          </Text>
        </Pressable>
        {trailing}
      </View>
      <Text variant="largeTitle" numberOfLines={2} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

export function RoundButton({ icon, onPress, label, filled }: { icon: React.ComponentProps<typeof Icon>['name']; onPress: () => void; label: string; filled?: boolean }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? colors.text : colors.card,
        opacity: pressed ? 0.8 : 1,
        boxShadow: `0px 4px 14px ${colors.shadow}`,
      })}
    >
      <Icon name={icon} size={24} color={filled ? colors.bg : colors.text} />
    </Pressable>
  );
}
