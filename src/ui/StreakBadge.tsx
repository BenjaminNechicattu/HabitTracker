import { View } from 'react-native';
import { useTheme } from '../design/theme';
import { withAlpha } from '../design/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  count: number;
  suffix?: string;
};

export function StreakBadge({ count, suffix }: Props) {
  const colors = useTheme();
  const active = count > 0;
  const tint = active ? colors.warning : colors.textTertiary;
  return (
    <View
      accessible
      accessibilityLabel={`${count} day streak`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        height: 28,
        borderRadius: 14,
        backgroundColor: withAlpha(tint, 0.16),
      }}
    >
      <Icon name={active ? 'flame' : 'flame-outline'} size={14} color={tint} />
      <Text variant="caption" weight="700" color={tint} numeric>
        {count}
        {suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
}
