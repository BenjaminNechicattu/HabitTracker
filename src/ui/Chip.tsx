import { useTheme } from '../design/theme';
import { haptics } from '../lib/haptics';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  icon?: IconName;
  tint?: string;
  onPress: () => void;
};

export function Chip({ label, selected, icon, tint, onPress }: Props) {
  const colors = useTheme();
  const bg = selected ? tint ?? colors.text : colors.card;
  const fg = selected ? (tint ? '#FFFFFF' : colors.bg) : colors.textSecondary;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      scaleTo={0.95}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: bg,
        boxShadow: selected ? undefined : `0px 2px 8px ${colors.shadow}`,
      }}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text variant="subhead" weight="600" color={fg}>
        {label}
      </Text>
    </PressableScale>
  );
}
