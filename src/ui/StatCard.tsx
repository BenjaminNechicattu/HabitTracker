import { View } from 'react-native';
import { useTheme } from '../design/theme';
import { cardShadow, spacing } from '../design/tokens';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  value: string;
  caption?: string;
  icon?: IconName;
  tint?: string;
};

export function StatCard({ label, value, caption, icon, tint }: Props) {
  const colors = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ''}`}
      style={{
        flex: 1,
        minWidth: 0,
        padding: spacing.lg,
        gap: 6,
        borderRadius: 22,
        backgroundColor: colors.card,
        boxShadow: cardShadow(colors),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Icon name={icon} size={14} color={tint ?? colors.textTertiary} /> : null}
        <Text variant="footnote" weight="600" color="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Text>
      </View>
      <Text variant="title" weight="800" numeric numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {caption ? (
        <Text variant="footnote" color="secondary" numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
