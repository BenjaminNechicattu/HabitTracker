import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns';
import { useTheme } from '../../design/theme';
import { spacing } from '../../design/tokens';
import { getDateKey, getHabitDayRatio, getHabitsForDay, isHabitCompleteForDay, isScheduledOn, parseDateKey, summarizeDay } from '../../logic/progress';
import { useStore } from '../../store/HabitStore';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Icon } from '../../ui/Icon';
import { MonthGrid } from '../../ui/MonthGrid';
import { ProgressRing } from '../../ui/ProgressRing';
import { LargeTitle, Screen } from '../../ui/Screen';
import { SectionHeader } from '../../ui/SectionHeader';
import { Text } from '../../ui/Text';
import { useHabitInteractions } from '../shared/useHabitInteractions';

function MonthButton({ icon, onPress, label, disabled }: { icon: 'chevron-back' | 'chevron-forward'; onPress: () => void; label: string; disabled?: boolean }) {
  const colors = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}>
      <Icon name={icon} size={24} color={colors.accent} />
    </Pressable>
  );
}

export function CalendarScreen() {
  const colors = useTheme();
  const store = useStore();
  const today = useMemo(() => parseDateKey(store.todayKey), [store.todayKey]);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedKey, setSelectedKey] = useState(store.todayKey);
  const [habitFilter, setHabitFilter] = useState<string>('all');
  const { renderRow, overlays, readOnly } = useHabitInteractions(selectedKey);

  const filterHabit = store.activeHabits.find((habit) => habit.id === habitFilter);
  const color = filterHabit?.taskColor ?? colors.accent;
  const selectedDate = parseDateKey(selectedKey);
  const isCurrentMonth = isSameMonth(month, today);

  const stateFor = (date: Date) => {
    if (filterHabit) {
      const entries = store.checkIns[getDateKey(date)] ?? {};
      const relevant = isScheduledOn(filterHabit, date) || isHabitCompleteForDay(filterHabit, entries);
      return { ratio: relevant ? getHabitDayRatio(filterHabit, entries) : 0, total: relevant ? 1 : 0 };
    }
    const summary = summarizeDay(store.activeHabits, date, store.checkIns);
    return { ratio: summary.ratio, total: summary.total };
  };

  const entries = store.checkIns[selectedKey] ?? {};
  const dayHabits = filterHabit
    ? [filterHabit]
    : getHabitsForDay(store.activeHabits, selectedDate, entries);
  const summary = filterHabit
    ? (() => {
        const done = isHabitCompleteForDay(filterHabit, entries);
        return { completed: done ? 1 : 0, total: 1, ratio: done ? 1 : 0 };
      })()
    : summarizeDay(store.activeHabits, selectedDate, store.checkIns);

  const jumpToToday = () => {
    setMonth(startOfMonth(today));
    setSelectedKey(store.todayKey);
  };

  return (
    <>
      <Screen>
        <LargeTitle
          title="Calendar"
          eyebrow="History"
          trailing={
            !isCurrentMonth || selectedKey !== store.todayKey ? (
              <Pressable onPress={jumpToToday} hitSlop={10} accessibilityRole="button" accessibilityLabel="Jump to today" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text variant="body" color="accent" weight="600">
                  Today
                </Text>
              </Pressable>
            ) : undefined
          }
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: 4 }}>
          <Chip label="All habits" selected={habitFilter === 'all'} onPress={() => setHabitFilter('all')} />
          {store.activeHabits.map((habit) => (
            <Chip key={habit.id} label={habit.name} selected={habitFilter === habit.id} tint={habit.taskColor} onPress={() => setHabitFilter(habit.id)} />
          ))}
        </ScrollView>

        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonthButton icon="chevron-back" label="Previous month" onPress={() => setMonth((prev) => addMonths(prev, -1))} />
            <Text variant="headline" weight="800" style={{ letterSpacing: 1 }} accessibilityRole="header">
              {format(month, "MMM''yy").toUpperCase()}
            </Text>
            <MonthButton icon="chevron-forward" label="Next month" disabled={isCurrentMonth} onPress={() => setMonth((prev) => addMonths(prev, 1))} />
          </View>

          <MonthGrid month={month} selectedKey={selectedKey} todayKey={store.todayKey} weekStartsOn={store.weekStartsOn} color={color} stateFor={stateFor} onSelect={(date) => setSelectedKey(getDateKey(date))} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingTop: spacing.xs }}>
            {[
              { label: 'None', fill: 0 },
              { label: 'Partial', fill: 0.5 },
              { label: 'All done', fill: 1 },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.fill === 1 ? (
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color }} />
                ) : (
                  <ProgressRing size={16} stroke={3} progress={item.fill} color={color} trackColor={colors.fillStrong} />
                )}
                <Text variant="caption" color="secondary">
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={format(selectedDate, 'EEEE, MMM d')} />
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <ProgressRing size={64} stroke={7} progress={summary.ratio} color={summary.ratio >= 1 ? colors.success : color} trackColor={colors.fillStrong}>
              <Text variant="footnote" weight="800" numeric>
                {Math.round(summary.ratio * 100)}%
              </Text>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Text variant="headline">
                {summary.completed} of {summary.total} completed
              </Text>
              <Text variant="subhead" color="secondary">
                {readOnly ? 'Scheduled for this day' : summary.total === 0 ? 'Nothing scheduled' : summary.completed === summary.total ? 'A perfect day' : 'Tap a habit to update it'}
              </Text>
            </View>
          </Card>

          {dayHabits.length === 0 ? (
            <Text variant="subhead" color="secondary" align="center" style={{ paddingVertical: spacing.lg }}>
              No habits were scheduled on this day.
            </Text>
          ) : (
            dayHabits.map((habit) => <View key={habit.id}>{renderRow(habit)}</View>)
          )}
        </View>
      </Screen>
      {overlays}
    </>
  );
}
