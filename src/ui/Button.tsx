import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../design/theme';
import { radius, withAlpha } from '../design/tokens';
import { haptics } from '../lib/haptics';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, compact, style }: Props) {
  const colors = useTheme();
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent },
    secondary: { bg: colors.fill, fg: colors.text },
    destructive: { bg: colors.dangerSoft, fg: colors.danger },
    ghost: { bg: 'transparent', fg: colors.accent },
  }[variant];

  const inactive = disabled || loading;
  const background = variant === 'primary' && disabled ? withAlpha(colors.accent, 0.4) : palette.bg;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        {
          height: compact ? 44 : 56,
          borderRadius: radius.pill,
          paddingHorizontal: compact ? 18 : 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          backgroundColor: background,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Icon name={icon} size={20} color={palette.fg} /> : null}
          <Text variant="headline" color={palette.fg} weight="700">
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
