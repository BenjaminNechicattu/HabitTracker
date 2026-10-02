import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import { useTheme } from '../../design/theme';
import { spacing, withAlpha } from '../../design/tokens';
import { getDateKey, parseDateKey } from '../../logic/progress';
import { aggregate, buildDailySeries, computeBestGlobalStreak, computeGlobalStreak, habitRate, weekdayPerformance } from '../../logic/stats';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { BarChart, BarDatum } from '../../ui/BarChart';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { HabitIcon } from '../../ui/HabitIcon';
import { Icon } from '../../ui/Icon';
import { LargeTitle, Screen } from '../../ui/Screen';
import { SectionHeader } from '../../ui/SectionHeader';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { StatCard } from '../../ui/StatCard';
import { Text } from '../../ui/Text';

type Range = 'week' | 'month' | 'quarter';
const DAYS: Record<Range, number> = { week: 7, month: 30, quarter: 91 };
const RANGE_NAME: Record<Range, string> = { week: 'This week', month: 'Last 30 days', quarter: 'Last 3 months' };

export function InsightsScreen() {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const [range, setRange] = useState<Range>('week');
  const [selected, setSelected] = useState<string | undefined>();
  const today = useMemo(() => parseDateKey(store.todayKey), [store.todayKey]);
  const days = DAYS[range];

  const insight = useMemo(() => {
    const habits = store.activeHabits;
    const series = buildDailySeries(habits, store.checkIns, days, today);
    const previous = buildDailySeries(habits, store.checkIns, days, subDays(today, days));
    const current = aggregate(series);
    const before = aggregate(previous);

    let bars: (BarDatum & { detail: string })[];
    if (range === 'quarter') {
      bars = Array.from({ length: 13 }, (_, index) => {
        const slice = series.slice(index * 7, index * 7 + 7);
        const result = aggregate(slice);
        const first = slice[0].date;
        return {
          key: getDateKey(first),
          label: format(first, 'MMM d'),
          value: result.rate,
          accessibilityLabel: `Week of ${format(first, 'MMMM d')}: ${result.rate} percent`,
          detail: `Week of ${format(first, 'MMM d')}: ${result.completed} of ${result.total} (${result.rate}%)`,
        };
      });
    } else {
      bars = series.map((day) => {
        const percent = Math.round(day.ratio * 100);
        return {
          key: day.key,
          label: range === 'week' ? format(day.date, 'EEEEE') : format(day.date, 'd'),
          value: percent,
          accessibilityLabel: `${format(day.date, 'EEEE, MMMM d')}: ${percent} percent`,
          detail: `${format(day.date, 'EEE, MMM d')}: ${day.completed} of ${day.total} (${percent}%)`,
        };
      });
    }

    const perHabit = habits
      .map((habit) => ({ habit, ...habitRate(habit, store.checkIns, days, today) }))
      .sort((a, b) => b.rate - a.rate);

    const weekdayRates = weekdayPerformance(habits, store.checkIns, 12, today);
    const order = Array.from({ length: 7 }, (_, i) => (store.weekStartsOn + i) % 7);
    const best = weekdayRates.reduce((top, value, day) => (value > weekdayRates[top] ? day : top), 0);

    const categories = new Map<string, { completed: number; scheduled: number }>();
    for (const row of perHabit) {
      const entry = categories.get(row.habit.category) ?? { completed: 0, scheduled: 0 };
      entry.completed += row.completed;
      entry.scheduled += row.scheduled;
      categories.set(row.habit.category, entry);
    }
    const categoryRows = Array.from(categories.entries())
      .map(([name, value]) => ({ name, rate: value.scheduled === 0 ? 0 : Math.round((value.completed / value.scheduled) * 100) }))
      .sort((a, b) => b.rate - a.rate);

    return { series, current, before, bars, perHabit, weekdayRates, order, best, categoryRows };
  }, [store.activeHabits, store.checkIns, store.weekStartsOn, days, range, today]);

  const streak = useMemo(() => computeGlobalStreak(store.checkIns, today), [store.checkIns, today]);
  const bestStreak = useMemo(() => computeBestGlobalStreak(store.checkIns, today), [store.checkIns, today]);

  if (store.activeHabits.length === 0) {
    return (
      <Screen>
        <LargeTitle title="Insights" />
        <Card>
          <EmptyState icon="stats-chart-outline" title="Nothing to chart yet" message="Complete a few habits and your trends will show up here." actionLabel="Create a Habit" onAction={() => nav.push({ name: 'form' })} />
        </Card>
      </Screen>
    );
  }

  const delta = insight.current.rate - insight.before.rate;
  const hasBefore = insight.before.total > 0;
  const selectedBar = insight.bars.find((bar) => bar.key === selected);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const hasData = insight.current.total > 0 && insight.weekdayRates.some((value) => value > 0);

  return (
    <Screen>
      <LargeTitle title="Insights" eyebrow={RANGE_NAME[range]} />

      <SegmentedControl<Range>
        options={[
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
          { key: 'quarter', label: '3 Months' },
        ]}
        value={range}
        onChange={(next) => {
          setRange(next);
          setSelected(undefined);
        }}
      />

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Completion rate" />
        <Card style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text variant="metric" weight="800" numeric>
                {insight.current.rate}%
              </Text>
              <Text variant="subhead" color="secondary">
                {insight.current.completed} of {insight.current.total} scheduled completed
              </Text>
            </View>
            {hasBefore ? (
              <View
                accessible
                accessibilityLabel={`${delta >= 0 ? 'Up' : 'Down'} ${Math.abs(delta)} percentage points from the previous period`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: delta >= 0 ? colors.successSoft : colors.dangerSoft }}
              >
                <Icon name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={14} color={delta >= 0 ? colors.success : colors.danger} />
                <Text variant="caption" weight="700" color={delta >= 0 ? colors.success : colors.danger} numeric>
                  {Math.abs(delta)}%
                </Text>
              </View>
            ) : null}
          </View>

          <BarChart data={insight.bars} selectedKey={selected} onSelect={(key) => setSelected((prev) => (prev === key ? undefined : key))} color={colors.accent} height={150} labelEvery={range === 'month' ? 5 : range === 'quarter' ? 3 : 1} />

          <Text variant="footnote" color="secondary" align="center" style={{ minHeight: 18 }}>
            {selectedBar ? selectedBar.detail : hasBefore ? `${delta >= 0 ? 'Up' : 'Down'} ${Math.abs(delta)} points from the previous ${range === 'week' ? 'week' : range === 'month' ? '30 days' : '3 months'}` : 'Tap a bar for details'}
          </Text>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard label="Streak" value={`${streak}`} caption={streak === 1 ? 'day' : 'days'} icon="flame" tint={colors.warning} />
        <StatCard label="Best" value={`${bestStreak}`} caption={bestStreak === 1 ? 'day' : 'days'} icon="trophy" tint={colors.accent} />
        <StatCard label="Done" value={`${insight.current.completed}`} caption={`${insight.current.total} scheduled`} icon="checkmark-done" tint={colors.success} />
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Consistency" />
        <Card padded={false}>
          {insight.perHabit.map(({ habit, rate }, index) => {
            const color = habit.taskColor ?? colors.accent;
            return (
              <Pressable
                key={habit.id}
                onPress={() => nav.push({ name: 'habit', id: habit.id })}
                accessibilityRole="button"
                accessibilityLabel={`${habit.name}: ${rate} percent. Open details`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.separator, minHeight: 64 }}
              >
                <HabitIcon category={habit.category} color={color} size={40} />
                <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                  <Text variant="subhead" weight="600" numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.fillStrong, overflow: 'hidden' }}>
                    <View style={{ width: `${rate}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
                  </View>
                </View>
                <Text variant="headline" weight="800" numeric style={{ minWidth: 48, textAlign: 'right' }}>
                  {rate}%
                </Text>
              </Pressable>
            );
          })}
        </Card>
      </View>

      {hasData ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Best days" />
          <Card style={{ gap: spacing.md }}>
            <BarChart
              data={insight.order.map((day) => ({
                key: String(day),
                label: weekdayLetters[day],
                value: insight.weekdayRates[day],
                accessibilityLabel: `${dayNames[day]}: ${insight.weekdayRates[day]} percent`,
              }))}
              selectedKey={String(insight.best)}
              color={colors.accent}
              height={100}
            />
            <Text variant="footnote" color="secondary" align="center">
              You're strongest on {dayNames[insight.best]}s ({insight.weekdayRates[insight.best]}%).
            </Text>
          </Card>
        </View>
      ) : null}

      {insight.categoryRows.length > 1 ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="By category" />
          <Card style={{ gap: spacing.lg }}>
            {insight.categoryRows.map((row) => (
              <View key={row.name} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="subhead" weight="600">
                    {row.name}
                  </Text>
                  <Text variant="subhead" color="secondary" numeric>
                    {row.rate}%
                  </Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.fillStrong, overflow: 'hidden' }}>
                  <View style={{ width: `${row.rate}%`, height: 8, borderRadius: 4, backgroundColor: withAlpha(colors.accent, 0.85) }} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
