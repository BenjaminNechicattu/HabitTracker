import { Pressable, View } from 'react-native';
import { spacing } from '../design/tokens';
import { Text } from './Text';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, minHeight: 28 }}>
      <Text variant="label" color="tertiary" accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text variant="subhead" color="accent" weight="600">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
