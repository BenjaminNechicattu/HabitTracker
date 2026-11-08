import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../design/theme';
import { cardShadow, radius, spacing } from '../design/tokens';

type Props = {
  children: ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padded = true, style }: Props) {
  const colors = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: padded ? spacing.lg : 0,
          boxShadow: cardShadow(colors),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
