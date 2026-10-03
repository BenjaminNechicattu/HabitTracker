import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '../../design/theme';
import { cardShadow, spacing, withAlpha } from '../../design/tokens';
import { formatReminderTime } from '../../lib/format';
import { DayEntries, formatAmount, getHabitOptionKey, isHabitCompleteForDay, isTargetHabit, isTrackerHabit } from '../../logic/progress';
import { Habit } from '../../types/habit';
import { CompletionButton } from '../../ui/CompletionButton';
import { HabitIcon } from '../../ui/HabitIcon';
import { Icon } from '../../ui/Icon';
import { PressableScale } from '../../ui/PressableScale';
import { Text } from '../../ui/Text';

export type HabitRowProps = {
  habit: Habit;
  entries: DayEntries;
  streak: number;
  readOnly?: boolean;
  dimmed?: boolean;
  onOpen?: () => void;
  onLongPress?: () => void;
  onToggle: () => void;
  onStep: (direction: 1 | -1) => void;
  onEditAmount: () => void;
  onToggleOption: (optionId: string) => void;
};

function StepButton({ icon, onPress, disabled, label }: { icon: 'add' | 'remove'; onPress: () => void; disabled?: boolean; label: string }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.fill,
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

export function HabitRow({
  habit,
  entries,
  streak,
  readOnly,
  dimmed,
  onOpen,
  onLongPress,
  onToggle,
  onStep,
  onEditAmount,
  onToggleOption,
}: HabitRowProps) {
  const colors = useTheme();
  const [expanded, setExpanded] = useState(false);
  const color = habit.taskColor ?? colors.accent;
  const done = isHabitCompleteForDay(habit, entries);
  const value = entries[habit.id] ?? 0;
  const isTarget = isTargetHabit(habit);
  const isTracker = isTrackerHabit(habit);
  const isChoice = habit.taskType === 'choice';
  const goal = habit.targetValue ?? 1;
  const options = habit.choiceOptions ?? [];
  const chosen = isChoice ? options.find((option) => entries[getHabitOptionKey(habit.id, option.id)]) : undefined;

  const streakText = streak > 0 ? `${streak} day streak` : '';
  let subtitle: string;
  if (isTarget) {
    subtitle = `${value} of ${formatAmount(habit, goal)}`;
  } else if (isTracker) {
    subtitle = value > 0 ? `${formatAmount(habit, value)} logged` : habit.measurableUnit ? `Log ${habit.measurableUnit}` : 'Nothing logged';
  } else if (isChoice) {
    subtitle = chosen ? chosen.name : `Any of ${options.length} options`;
  } else if (done) {
    subtitle = streakText ? `Completed · ${streakText}` : 'Completed';
  } else {
    subtitle = streakText || (habit.reminderEnabled && habit.reminderTime ? `Reminder ${formatReminderTime(habit.reminderTime)}` : 'Tap to complete');
  }
  if ((isTarget || isTracker || isChoice) && done && streakText) {
    subtitle = `${subtitle} · ${streakText}`;
  }

  const a11yLabel = `${habit.name}. ${done ? 'Completed' : 'Not completed'}. ${subtitle}`;

  return (
    <View style={{ opacity: dimmed ? 0.6 : 1 }}>
      <View style={{ borderRadius: 22, backgroundColor: colors.card, boxShadow: cardShadow(colors), overflow: 'hidden' }}>
        {done ? <View style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withAlpha(color, colors.isDark ? 0.14 : 0.07) }} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: spacing.sm }}>
          <PressableScale
            scaleTo={0.985}
            onPress={onOpen}
            onLongPress={onLongPress}
            delayLongPress={350}
            accessibilityRole="button"
            accessibilityLabel={a11yLabel}
            accessibilityHint="Opens habit details. Long press for more actions."
            style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}
          >
            <HabitIcon category={habit.category} color={color} size={48} />

            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text variant="headline" numberOfLines={2}>
                {habit.name}
              </Text>
              <Text variant="footnote" color={done ? 'success' : 'secondary'} numberOfLines={1} weight={done ? '600' : '400'}>
                {subtitle}
              </Text>
            </View>
          </PressableScale>

          {isTarget || isTracker ? null : isChoice ? (
            <CompletionButton
              checked={done}
              color={color}
              disabled={readOnly}
              label={done ? `Clear ${habit.name}` : `Choose an option for ${habit.name}`}
              onPress={() => (done ? onToggle() : setExpanded((prev) => !prev))}
            />
          ) : (
            <CompletionButton checked={done} color={color} disabled={readOnly} label={done ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`} onPress={onToggle} />
          )}
        </View>

        {isTarget || isTracker ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.md + 48 + spacing.md, paddingRight: spacing.md, paddingBottom: spacing.md, marginTop: -spacing.xs }}>
            {isTarget ? (
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.fillStrong, overflow: 'hidden' }}>
                <View style={{ height: 6, borderRadius: 3, width: `${Math.min(100, (value / goal) * 100)}%`, backgroundColor: color }} />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <StepButton icon="remove" onPress={() => onStep(-1)} disabled={readOnly || value <= 0} label={`Decrease ${habit.name}`} />
              <Pressable
                onPress={onEditAmount}
                disabled={readOnly}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${habit.name} amount ${value}. Tap to enter an exact amount`}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text variant="headline" weight="800" numeric color={done ? 'success' : 'text'}>
                  {value}
                </Text>
              </Pressable>
              <StepButton icon="add" onPress={() => onStep(1)} disabled={readOnly} label={`Increase ${habit.name}`} />
            </View>
          </View>
        ) : null}

        {isChoice && (expanded || done) && options.length > 0 ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} layout={LinearTransition} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
            {options.map((option) => {
              const selected = Boolean(entries[getHabitOptionKey(habit.id, option.id)]);
              return (
                <Pressable
                  key={option.id}
                  disabled={readOnly}
                  onPress={() => {
                    onToggleOption(option.id);
                    setExpanded(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.name}
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    justifyContent: 'center',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: selected ? color : colors.fill,
                  }}
                >
                  {selected ? <Icon name="checkmark" size={14} color="#FFFFFF" /> : null}
                  <Text variant="subhead" weight="600" color={selected ? '#FFFFFF' : 'text'}>
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
