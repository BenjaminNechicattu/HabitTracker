import { Pressable, View } from 'react-native';
import { addDays, format, startOfWeek } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../design/theme';
import { spacing } from '../../design/tokens';
import { haptics } from '../../lib/haptics';
import { getDateKey, summarizeDay } from '../../logic/progress';
import { CheckInMap, Habit } from '../../types/habit';
import { Text } from '../../ui/Text';

type Props = {
  selectedKey: string;
  todayKey: string;
  weekStartsOn: 0 | 1;
  habits: Habit[];
  checkIns: CheckInMap;
  onSelect: (key: string) => void;
};

const SIZE = 38;
const STROKE = 3;

function MiniRing({ ratio, color, track }: { ratio: number; color: string; track: string }) {
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={track} strokeWidth={STROKE} fill="none" />
      {ratio > 0 ? (
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
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

export function WeekStrip({ selectedKey, todayKey, weekStartsOn, habits, checkIns, onSelect }: Props) {
  const colors = useTheme();
  const anchor = new Date(`${selectedKey}T00:00:00`);
  const start = startOfWeek(anchor, { weekStartsOn });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }}>
      {days.map((date) => {
        const key = getDateKey(date);
        const selected = key === selectedKey;
        const future = key > todayKey;
        const summary = summarizeDay(habits, date, checkIns);
        return (
          <Pressable
            key={key}
            disabled={future}
            onPress={() => {
              haptics.select();
              onSelect(key);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${format(date, 'EEEE, MMMM d')}${key === todayKey ? ', today' : ''}. ${summary.completed} of ${summary.total} completed`}
            accessibilityState={{ selected, disabled: future }}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: 22,
              backgroundColor: selected ? colors.text : 'transparent',
              opacity: future ? 0.4 : 1,
              minHeight: 44,
            }}
          >
            <Text variant="caption" weight="600" color={selected ? colors.bg : 'tertiary'}>
              {format(date, 'EEEEE')}
            </Text>
            <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
              {summary.total > 0 && !future ? <MiniRing ratio={summary.ratio} color={selected ? colors.lime : colors.accent} track={selected ? 'rgba(255,255,255,0.18)' : colors.fillStrong} /> : null}
              <Text variant="subhead" weight={key === todayKey ? '800' : '600'} color={selected ? colors.bg : key === todayKey ? 'accent' : 'text'} numeric>
                {date.getDate()}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
