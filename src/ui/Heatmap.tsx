import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { addDays, format, startOfWeek, subWeeks } from 'date-fns';
import { useTheme } from '../design/theme';
import { withAlpha } from '../design/tokens';
import { getDateKey, getHabitCellState, HabitCellState } from '../logic/progress';
import { CheckInMap, Habit } from '../types/habit';
import { Text } from './Text';

type Props = {
  habit: Habit;
  checkIns: CheckInMap;
  weeks?: number;
  weekStartsOn: 0 | 1;
  today: Date;
};

const GAP = 4;

function Cell({ state, size, color, isToday }: { state: HabitCellState; size: number; color: string; isToday: boolean }) {
  const colors = useTheme();
  const radius = Math.max(4, size * 0.3);
  const base = { width: size, height: size, borderRadius: radius, alignItems: 'center' as const, justifyContent: 'center' as const };
  const ring = isToday ? { borderWidth: 2, borderColor: colors.text } : null;

  if (state === 'done') {
    return <View style={[base, { backgroundColor: color }, ring]} />;
  }
  if (state === 'partial') {
    return (
      <View style={[base, { backgroundColor: withAlpha(color, 0.25) }, ring]}>
        <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, backgroundColor: color }} />
      </View>
    );
  }
  if (state === 'missed') {
    return <View style={[base, { borderWidth: 1.5, borderColor: colors.fillStrong, backgroundColor: 'transparent' }, ring]} />;
  }
  if (state === 'rest') {
    return (
      <View style={[base, { backgroundColor: colors.fill }, ring]}>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textTertiary }} />
      </View>
    );
  }
  return <View style={[base, { backgroundColor: 'transparent' }, ring]} />;
}

export function HabitHeatmap({ habit, checkIns, weeks = 15, weekStartsOn, today }: Props) {
  const colors = useTheme();
  const [width, setWidth] = useState(0);
  const color = habit.taskColor ?? colors.accent;
  const size = width > 0 ? Math.floor((width - GAP * (weeks - 1)) / weeks) : 0;
  const todayKey = getDateKey(today);

  const columns = useMemo(() => {
    const firstWeek = subWeeks(startOfWeek(today, { weekStartsOn }), weeks - 1);
    return Array.from({ length: weeks }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const date = addDays(firstWeek, week * 7 + day);
        return { key: getDateKey(date), state: getHabitCellState(habit, date, checkIns, today) };
      }),
    );
  }, [habit, checkIns, weeks, weekStartsOn, today]);

  const legend: { label: string; state: HabitCellState }[] = [
    { label: 'Done', state: 'done' },
    { label: 'Partial', state: 'partial' },
    { label: 'Missed', state: 'missed' },
    { label: 'Rest day', state: 'rest' },
  ];

  return (
    <View style={{ gap: 14 }}>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} accessible accessibilityLabel={`Completion history for the last ${weeks} weeks`}>
        {size > 0 ? (
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {columns.map((column, index) => (
              <View key={index} style={{ gap: GAP }}>
                {column.map((cell) => (
                  <Cell key={cell.key} state={cell.state} size={size} color={color} isToday={cell.key === todayKey} />
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {legend.map((item) => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Cell state={item.state} size={14} color={color} isToday={false} />
            <Text variant="caption" color="secondary">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="caption" color="tertiary">
        {format(addDays(subWeeks(startOfWeek(today, { weekStartsOn }), weeks - 1), 0), 'MMM d')} – {format(today, 'MMM d')}
      </Text>
    </View>
  );
}
