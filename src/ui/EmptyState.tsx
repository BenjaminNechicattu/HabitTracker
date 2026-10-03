import { View } from 'react-native';
import { useTheme } from '../design/theme';
import { spacing } from '../design/tokens';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

type Props = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  const colors = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.huge, paddingHorizontal: spacing.xl }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={30} color={colors.accent} />
        </View>
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center">
        {message}
      </Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}
