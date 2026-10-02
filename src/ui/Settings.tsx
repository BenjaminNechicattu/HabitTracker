import { Children, ReactNode } from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '../design/theme';
import { cardShadow, spacing } from '../design/tokens';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { SectionHeader } from './SectionHeader';
import { Text } from './Text';

// react-native-web paints the 'on' thumb teal unless told otherwise.
export const WEB_SWITCH_PROPS = { activeThumbColor: '#FFFFFF' } as object;

export function SettingsGroup({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const colors = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? <SectionHeader title={title} /> : null}
      <View style={{ backgroundColor: colors.card, borderRadius: 22, overflow: 'hidden', boxShadow: cardShadow(colors) }}>
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 ? <View style={{ height: 1, marginLeft: 72, backgroundColor: colors.separator }} /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <Text variant="footnote" color="tertiary" style={{ paddingHorizontal: spacing.md }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

type RowProps = {
  title: string;
  icon?: IconName;
  tint?: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
  centered?: boolean;
  trailing?: ReactNode;
  disabled?: boolean;
};

export function SettingsRow({
  title,
  icon,
  tint,
  value,
  subtitle,
  onPress,
  switchValue,
  onSwitchChange,
  destructive,
  centered,
  trailing,
  disabled,
}: RowProps) {
  const colors = useTheme();
  const isSwitch = typeof switchValue === 'boolean' && onSwitchChange;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
      {icon ? (
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tint ?? colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} color="#FFFFFF" />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0, alignItems: centered ? 'center' : 'flex-start' }}>
        <Text variant="body" weight={centered ? '700' : '400'} color={destructive ? 'danger' : 'text'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="body" color="secondary" numberOfLines={1} style={{ maxWidth: '45%' }}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          trackColor={{ true: colors.success, false: colors.fillStrong }}
          thumbColor="#FFFFFF"
          {...WEB_SWITCH_PROPS}
          accessibilityLabel={title}
        />
      ) : onPress && !centered ? (
        <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
      ) : null}
    </View>
  );

  if (!onPress || isSwitch) {
    return content;
  }
  return (
    <PressableScale scaleTo={0.99} onPress={onPress} accessibilityRole="button" accessibilityLabel={title} disabled={disabled}>
      {content}
    </PressableScale>
  );
}
