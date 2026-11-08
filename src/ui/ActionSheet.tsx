import { View } from 'react-native';
import { useTheme } from '../design/theme';
import { spacing } from '../design/tokens';
import { haptics } from '../lib/haptics';
import { BottomSheet } from './BottomSheet';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type SheetAction = {
  key: string;
  label: string;
  icon?: IconName;
  destructive?: boolean;
  selected?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: SheetAction[];
};

/** Context-menu replacement: primary actions first, destructive actions visually separated. */
export function ActionSheet({ visible, onClose, title, subtitle, actions }: Props) {
  const colors = useTheme();
  const normal = actions.filter((action) => !action.destructive);
  const destructive = actions.filter((action) => action.destructive);

  const renderAction = (action: SheetAction) => {
    const tint = action.destructive ? colors.danger : colors.text;
    return (
      <PressableScale
        key={action.key}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityState={{ selected: action.selected }}
        onPress={() => {
          haptics.tap();
          onClose();
          // Let the sheet start closing before running the action (e.g. opening a dialog).
          setTimeout(action.onPress, 120);
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, paddingHorizontal: spacing.lg }}
      >
        {action.icon ? <Icon name={action.icon} size={22} color={tint} /> : null}
        <Text variant="body" color={tint} style={{ flex: 1 }}>
          {action.label}
        </Text>
        {action.selected ? <Icon name="checkmark" size={20} color={colors.accent} /> : null}
      </PressableScale>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {subtitle ? (
        <Text variant="footnote" color="secondary" align="center" style={{ marginTop: -spacing.xs }}>
          {subtitle}
        </Text>
      ) : null}
      <View style={{ backgroundColor: colors.fill, borderRadius: 20, overflow: 'hidden' }}>
        {normal.map((action, index) => (
          <View key={action.key}>
            {index > 0 ? <View style={{ height: 1, marginLeft: 54, backgroundColor: colors.separator }} /> : null}
            {renderAction(action)}
          </View>
        ))}
      </View>
      {destructive.length > 0 ? (
        <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 20, overflow: 'hidden' }}>{destructive.map(renderAction)}</View>
      ) : null}
    </BottomSheet>
  );
}
