import { Pressable, View } from 'react-native';
import { useTheme } from '../../design/theme';
import { cardShadow, spacing } from '../../design/tokens';
import { describeRepeat, formatReminderTime } from '../../lib/format';
import { formatAmount, isCountHabit, isTargetHabit } from '../../logic/progress';
import { Habit } from '../../types/habit';
import { HabitIcon } from '../../ui/HabitIcon';
import { Icon } from '../../ui/Icon';
import { PressableScale } from '../../ui/PressableScale';
import { Text } from '../../ui/Text';

export function describeHabit(habit: Habit): string {
  const parts: string[] = [];
  if (isTargetHabit(habit)) {
    parts.push(`Goal ${formatAmount(habit, habit.targetValue ?? 1)}`);
  } else if (isCountHabit(habit)) {
    parts.push(habit.measurableUnit ? `Tracks ${habit.measurableUnit}` : 'Tracker');
  } else if (habit.taskType === 'choice') {
    parts.push(`${habit.choiceOptions?.length ?? 0} options`);
  }
  parts.push(describeRepeat(habit.repeatDays));
  if (habit.reminderEnabled && habit.reminderTime) {
    parts.push(formatReminderTime(habit.reminderTime));
  }
  return parts.join(' · ');
}

type Props = {
  habit: Habit;
  onPress: () => void;
  onLongPress?: () => void;
  /** Drag handle press-in (reorder mode). */
  onDrag?: () => void;
  dragging?: boolean;
};

export function HabitListRow({ habit, onPress, onLongPress, onDrag, dragging }: Props) {
  const colors = useTheme();
  const color = habit.taskColor ?? colors.accent;
  const muted = habit.reminderEnabled && habit.reminderMuted;

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.card,
    opacity: habit.archived ? 0.7 : 1,
    boxShadow: dragging ? `0px 14px 30px ${colors.shadow}` : cardShadow(colors),
  };

  const body = (
    <>
      <HabitIcon category={habit.category} color={color} size={48} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="headline" numberOfLines={1}>
          {habit.name}
        </Text>
        <Text variant="footnote" color="secondary" numberOfLines={1}>
          {describeHabit(habit)}
        </Text>
      </View>
      {muted ? <Icon name="notifications-off-outline" size={18} color={colors.textTertiary} /> : null}
    </>
  );

  // Reorder mode: a plain row with a drag handle (avoids nesting buttons).
  if (onDrag) {
    return (
      <View style={rowStyle}>
        {body}
        <Pressable onPressIn={onDrag} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Reorder ${habit.name}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="reorder-three" size={26} color={colors.textTertiary} />
        </Pressable>
      </View>
    );
  }

  return (
    <PressableScale
      scaleTo={0.985}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}. ${describeHabit(habit)}${habit.archived ? '. Archived' : ''}`}
      style={rowStyle}
    >
      {body}
      <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
    </PressableScale>
  );
}
