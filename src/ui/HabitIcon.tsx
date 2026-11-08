import { View } from 'react-native';
import { getHabitIconName } from '../constants/habitIcons';
import { useTheme } from '../design/theme';
import { withAlpha } from '../design/tokens';
import { Icon, IconName } from './Icon';

type Props = {
  category: string;
  color: string;
  size?: number;
};

export function HabitIcon({ category, color, size = 48 }: Props) {
  const colors = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withAlpha(color, colors.isDark ? 0.22 : 0.14),
      }}
    >
      <Icon name={getHabitIconName(category) as IconName} size={size * 0.5} color={color} />
    </View>
  );
}
