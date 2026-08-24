import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { countStreakForHabit } from '../logic/progress';
import { getHabitIconName } from '../constants/habitIcons';
import { CheckInMap, Habit } from '../types/habit';

type Palette = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
};

type DashboardTabProps = {
  styles: any;
  palette: Palette;
  isDarkTheme: boolean;
  todayProgress: number;
  completedToday: number;
  totalTodayTargets: number;
  dayStreak: number;
  activeHabits: Habit[];
  todayCompletions: Record<string, number>;
  checkIns: CheckInMap;
  randomSuggestions: Array<{ group: string; option: string }>;
  onToggleHabitCompletion: (habitId: string) => void;
  onSetHabitProgress: (habitId: string, value: number) => void;
  onOpenStreak: () => void;
};

export function DashboardTab({
  styles,
  palette,
  isDarkTheme,
  todayProgress,
  completedToday,
  totalTodayTargets,
  dayStreak,
  activeHabits,
  todayCompletions,
  checkIns,
  randomSuggestions,
  onToggleHabitCompletion,
  onSetHabitProgress,
  onOpenStreak,
}: DashboardTabProps) {
  const progressBackground = isDarkTheme ? '#171717' : '#ddd2fb';
  const progressLabelColor = isDarkTheme ? '#ffffff' : '#2f2352';
  const progressCaptionColor = isDarkTheme ? palette.muted : '#5a4b84';

  return (
    <View style={styles.tabBody}>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 }]}>Today's Progress</Text>
          <Pressable
            onPress={onOpenStreak}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: isDarkTheme ? '#2a2a2a' : '#d6caef',
              backgroundColor: isDarkTheme ? '#111111' : '#f1ecff',
            }}
          >
            <MaterialCommunityIcons name="fire" size={14} color="#ff964f" />
            <Text style={{ color: progressLabelColor, fontSize: 12, fontWeight: '800' }}>{dayStreak}</Text>
            <Text style={{ color: progressCaptionColor, fontSize: 12, fontWeight: '700' }}>Day streak</Text>
          </Pressable>
        </View>
        <View style={[styles.compactProgressCard, { backgroundColor: isDarkTheme ? '#111111' : '#f7f6fc' }]}> 
          <View style={[styles.progressRingShell, { borderColor: progressBackground, width: 58, height: 58, borderRadius: 29, borderWidth: 5 }]}> 
            <View style={[styles.progressRingInner, { backgroundColor: progressBackground, width: 42, height: 42, borderRadius: 21 }]}> 
              <Text style={[styles.progressRingLabel, { fontSize: 12, color: progressLabelColor }]}>{todayProgress}%</Text>
            </View>
          </View>
          <View style={styles.progressCopyWrap}>
            <Text style={[styles.progressMainCallout, { color: progressLabelColor, fontSize: 16 }]}>Great job!</Text>
            <Text style={[styles.progressCaption, { color: progressCaptionColor }]}>You're doing amazing.</Text>
            <Text style={[styles.progressCaption, { color: progressCaptionColor }]}> 
              {completedToday} / {totalTodayTargets} done
            </Text>
          </View>
        </View>
      </View>

      {randomSuggestions.length > 0 ? (
        <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Today&apos;s Option</Text>
          {randomSuggestions.map((suggestion) => (
            <View key={`${suggestion.group}-${suggestion.option}`} style={{ marginTop: 8 }}>
              <Text style={[styles.habitName, { color: palette.text }]}>{suggestion.group}</Text>
              <Text style={[styles.habitInfo, { color: palette.muted }]}>Try: {suggestion.option}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Today</Text>
        {activeHabits.map((habit) => {
          const todayValue = todayCompletions[habit.id] ?? 0;
          const target = habit.targetValue ?? 1;
          const checked = habit.taskType === 'measurable' ? todayValue >= (habit.targetValue ?? 1) : todayValue > 0;
          const habitStreak = countStreakForHabit(habit, checkIns);
          const iconName = getHabitIconName(habit.category);
          const iconBg = checked ? '#efeaff' : isDarkTheme ? '#171717' : '#f6f2ff';
          const progressLabel =
            habit.taskType === 'measurable'
              ? `${todayValue} / ${habit.targetValue ?? 1} ${habit.measurableUnit ?? 'units'}`
              : `${habitStreak} day streak`;
          return (
            <View key={habit.id} style={[styles.habitRow, { borderBottomColor: palette.border }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View style={[styles.habitAvatar, { backgroundColor: iconBg }]}> 
                  <Ionicons name={iconName as any} size={16} color={palette.accent} />
                </View>
                <View style={styles.habitMeta}>
                  <Text style={[styles.habitName, { color: palette.text }]}>{habit.name}</Text>
                  <Text style={[styles.habitInfo, { color: palette.muted }]}>
                    {progressLabel}
                  </Text>
                </View>
              </View>

              {habit.taskType === 'measurable' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable
                    onPress={() => onSetHabitProgress(habit.id, todayValue - 1)}
                    style={[styles.checkPill, { borderColor: palette.border, backgroundColor: isDarkTheme ? '#111111' : '#f3eeff' }]}
                  >
                    <Text style={{ color: palette.text, fontWeight: '700' }}>-</Text>
                  </Pressable>
                  <TextInput
                    value={String(todayValue)}
                    keyboardType="number-pad"
                    onChangeText={(text) => {
                      const parsed = Number(text.replace(/[^0-9]/g, ''));
                      onSetHabitProgress(habit.id, Number.isFinite(parsed) ? parsed : 0);
                    }}
                    style={{
                      width: 44,
                      height: 32,
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: palette.border,
                      color: palette.text,
                      textAlign: 'center',
                      backgroundColor: isDarkTheme ? '#111111' : '#ffffff',
                      fontWeight: '700',
                      paddingVertical: 0,
                    }}
                  />
                  <Pressable
                    onPress={() => onSetHabitProgress(habit.id, todayValue + 1)}
                    style={[styles.checkPill, { borderColor: checked ? palette.accent : palette.border, backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#f3eeff' }]}
                  >
                    <Text style={{ color: checked ? '#fff' : palette.text, fontWeight: '700' }}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => onToggleHabitCompletion(habit.id)}
                  style={[
                    styles.checkPill,
                    {
                      borderColor: checked ? palette.accent : palette.border,
                      backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#f3eeff',
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={checked ? 'check' : 'checkbox-blank-circle-outline'} size={14} color={checked ? '#fff' : palette.muted} />
                </Pressable>
              )}
            </View>
          );
        })}
        {activeHabits.length === 0 ? <Text style={[styles.habitInfo, { color: palette.muted }]}>No active habits yet.</Text> : null}
      </View>
    </View>
  );
}
