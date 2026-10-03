import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../design/theme';
import { haptics } from '../lib/haptics';
import { getDateKey } from '../logic/progress';
import { Text } from './Text';

export type DayState = { ratio: number; total: number };

type Props = {
  month: Date;
  selectedKey: string;
  todayKey: string;
  weekStartsOn: 0 | 1;
  color: string;
  stateFor: (date: Date) => DayState;
  onSelect: (date: Date) => void;
};

const CELL = 42;
const STROKE = 3.5;

function Ring({ ratio, color, trackColor }: { ratio: number; color: string; trackColor: string }) {
  const r = (CELL - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={CELL} height={CELL} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={CELL / 2} cy={CELL / 2} r={r} stroke={trackColor} strokeWidth={STROKE} fill="none" />
      {ratio > 0 ? (
        <Circle
          cx={CELL / 2}
          cy={CELL / 2}
          r={r}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
        />
      ) : null}
    </Svg>
  );
}

export function MonthGrid({ month, selectedKey, todayKey, weekStartsOn, color, stateFor, onSelect }: Props) {
  const colors = useTheme();

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn });
    const end = endOfMonth(month);
    const rows: Date[][] = [];
    let cursor = start;
    while (cursor.getTime() <= end.getTime()) {
      rows.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
      cursor = addDays(cursor, 7);
    }
    return rows;
  }, [month, weekStartsOn]);

  const headers = weeks[0].map((date) => format(date, 'EEEEE'));

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row' }}>
        {headers.map((label, index) => (
          <View key={`${label}-${index}`} style={{ flex: 1, alignItems: 'center', paddingBottom: 6 }}>
            <Text variant="caption" color="tertiary" weight="600">
              {label}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row' }}>
          {week.map((date) => {
            const key = getDateKey(date);
            const inMonth = isSameMonth(date, month);
            if (!inMonth) {
              return <View key={key} style={{ flex: 1, height: 52 }} />;
            }
            const { ratio, total } = stateFor(date);
            const selected = key === selectedKey;
            const isToday = key === todayKey;
            const full = total > 0 && ratio >= 1;
            const future = key > todayKey;
            const label = `${format(date, 'EEEE, MMMM d')}. ${future ? 'Upcoming' : total === 0 ? 'No habits scheduled' : full ? 'All habits completed' : ratio > 0 ? `${Math.round(ratio * 100)} percent completed` : 'Nothing completed'}`;

            return (
              <Pressable
                key={key}
                onPress={() => {
                  haptics.select();
                  onSelect(date);
                }}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: CELL + 6, height: CELL + 6, borderRadius: (CELL + 6) / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: selected ? colors.text : 'transparent' }}>
                  <View style={{ width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' }}>
                    {full ? (
                      <View style={{ position: 'absolute', width: CELL, height: CELL, borderRadius: CELL / 2, backgroundColor: color }} />
                    ) : total > 0 && !future ? (
                      <Ring ratio={ratio} color={color} trackColor={colors.fillStrong} />
                    ) : null}
                    <Text
                      variant="subhead"
                      weight={isToday || full ? '800' : '500'}
                      color={full ? '#FFFFFF' : future ? 'tertiary' : isToday ? 'accent' : 'text'}
                      numeric
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
