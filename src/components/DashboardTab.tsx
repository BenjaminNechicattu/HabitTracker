import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { countStreakForHabit, getDateKey, getHabitOptionKey } from '../logic/progress';
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
  dayStreak: number;
  activeHabits: Habit[];
  todayCompletions: Record<string, number>;
  checkIns: CheckInMap;
  selectedDateKey: string;
  groupByType: boolean;
  dailyChoiceSuggestion?: string | null;
  onSetGroupByType: (value: boolean) => void;
  onToggleHabitCompletion: (habitId: string) => void;
  onToggleChoiceOption: (habitId: string, optionId: string) => void;
  onSetHabitProgress: (habitId: string, value: number) => void;
  onOpenStreak: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
};

export function DashboardTab({
  styles,
  palette,
  isDarkTheme,
  todayProgress,
  completedToday,
  dayStreak,
  activeHabits,
  todayCompletions,
  checkIns,
  selectedDateKey,
  groupByType,
  dailyChoiceSuggestion,
  onSetGroupByType,
  onToggleHabitCompletion,
  onToggleChoiceOption,
  onSetHabitProgress,
  onOpenStreak,
  onPreviousDay,
  onNextDay,
  onToday,
}: DashboardTabProps) {
  const progressBackground = isDarkTheme ? '#171717' : '#dfeee4';
  const progressLabelColor = isDarkTheme ? '#ffffff' : '#18392d';
  const progressCaptionColor = isDarkTheme ? palette.muted : '#496d5e';
  const todayDateKey = getDateKey(new Date());

  const selectedDateValues = checkIns[selectedDateKey] ?? {};
  const yesNoHabits = activeHabits.filter((h) => h.taskType === 'yesNo');
  const choiceHabits = activeHabits.filter((h) => h.taskType === 'choice');
  const goalAndTrackerHabits = activeHabits.filter((h) => h.taskType === 'target' || h.taskType === 'measurable' || h.taskType === 'tracker');

  const renderHabitRow = (habit: Habit) => {
    const todayValue = selectedDateValues[habit.id] ?? 0;
    const isTargetLike = habit.taskType === 'target' || habit.taskType === 'measurable';
    const isTrackerLike = habit.taskType === 'tracker';
    const checked = isTargetLike ? todayValue >= (habit.targetValue ?? 1) : todayValue > 0;
    const habitStreak = countStreakForHabit(habit, checkIns);
    const iconName = getHabitIconName(habit.category);
    const iconBg = checked ? '#ddf5e4' : isDarkTheme ? '#171717' : '#f1faf4';
    const progressLabel =
      isTargetLike
        ? `${todayValue} / ${habit.targetValue ?? 1} ${habit.measurableUnit ?? 'units'}`
        : isTrackerLike
          ? `${todayValue} ${habit.measurableUnit ?? 'units'} logged`
          : habit.taskType === 'choice'
            ? `${habit.choiceOptions?.length ?? 0} options · any of these`
            : `${habitStreak} day streak`;
    return (
      <View key={habit.id} style={[styles.habitRow, { borderBottomColor: palette.border }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <View style={[styles.habitAvatar, { backgroundColor: iconBg }]}> 
            <Ionicons name={iconName as any} size={16} color={habit.taskColor ?? palette.accent} />
          </View>
          <View style={styles.habitMeta}>
            <Text style={[styles.habitName, { color: palette.text }]}>{habit.name}</Text>
            <Text style={[styles.habitInfo, { color: palette.muted }]}>{progressLabel}</Text>
            {habit.taskType === 'choice' && habit.choiceOptions && habit.choiceOptions.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {habit.choiceOptions.map((option) => {
                  const optionKey = getHabitOptionKey(habit.id, option.id);
                  const optionChecked = Boolean(selectedDateValues[optionKey]);
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => onToggleChoiceOption(habit.id, option.id)}
                      style={{
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        backgroundColor: optionChecked ? palette.accent : isDarkTheme ? '#111111' : '#edf9f1',
                        borderColor: optionChecked ? palette.accent : palette.border,
                      }}
                    >
                      <Text style={{ color: optionChecked ? '#fff' : palette.text, fontSize: 11, fontWeight: '700' }}>
                        {option.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

        {isTargetLike || isTrackerLike ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => onSetHabitProgress(habit.id, todayValue - 1)}
              style={[styles.checkPill, { borderColor: palette.border, backgroundColor: isDarkTheme ? '#111111' : '#edf9f1' }]}
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
              style={[styles.checkPill, { borderColor: checked ? palette.accent : palette.border, backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#edf9f1' }]}
            >
              <Text style={{ color: checked ? '#fff' : palette.text, fontWeight: '700' }}>+</Text>
            </Pressable>
          </View>
        ) : habit.taskType === 'choice' ? (
          <Pressable
            onPress={() => onToggleHabitCompletion(habit.id)}
            style={[
              styles.checkPill,
              {
                borderColor: checked ? palette.accent : palette.border,
                backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#edf9f1',
              },
            ]}
          >
            <MaterialCommunityIcons name={checked ? 'check' : 'checkbox-blank-circle-outline'} size={14} color={checked ? '#fff' : palette.muted} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => onToggleHabitCompletion(habit.id)}
            style={[
              styles.checkPill,
              {
                borderColor: checked ? palette.accent : palette.border,
                backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#edf9f1',
              },
            ]}
          >
            <MaterialCommunityIcons name={checked ? 'check' : 'checkbox-blank-circle-outline'} size={14} color={checked ? '#fff' : palette.muted} />
          </Pressable>
        )}
      </View>
    );
  };

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
              borderColor: isDarkTheme ? '#2a2a2a' : '#d6efe0',
              backgroundColor: isDarkTheme ? '#111111' : '#edf9f1',
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
              {completedToday} / {activeHabits.length} done
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 }}>
            <Pressable onPress={onPreviousDay} style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border, width: 36, height: 36, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="chevron-back" size={18} color={palette.text} />
            </Pressable>
            <Text style={[styles.sectionTitle, { color: palette.text, textAlign: 'center', flex: 1 }]}>{new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: selectedDateKey !== todayDateKey ? 'numeric' : undefined })}</Text>
            {selectedDateKey !== todayDateKey ? (
              <Pressable onPress={onNextDay} style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border, width: 36, height: 36, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="chevron-forward" size={18} color={palette.text} />
              </Pressable>
            ) : (
              <View style={{ width: 36, height: 36 }} />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Pressable onPress={onToday} style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border, flex: 1, paddingHorizontal: 10 }]}> 
              <Text style={{ color: palette.text, fontWeight: '700', fontSize: 11 }}>Today</Text>
            </Pressable>
            <Pressable
              onPress={() => onSetGroupByType(!groupByType)}
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: groupByType ? palette.accent : palette.bg,
                flex: 1,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: groupByType ? '#fff' : palette.text, fontWeight: '700', fontSize: 12 }}>Group</Text>
            </Pressable>
          </View>
        </View>
        {activeHabits.length === 0 ? (
          <Text style={[styles.habitInfo, { color: palette.muted }]}>No active habits yet.</Text>
        ) : groupByType ? (
          <>
            {yesNoHabits.length > 0 ? (
              <View>
                <Text style={[styles.habitInfo, { color: palette.accent, fontWeight: '800', marginBottom: 4 }]}>✅ Check</Text>
                {yesNoHabits.map((habit) => renderHabitRow(habit))}
              </View>
            ) : null}
            {choiceHabits.length > 0 ? (
              <View style={{ marginTop: yesNoHabits.length > 0 ? 10 : 0 }}>
                <Text style={[styles.habitInfo, { color: palette.accent, fontWeight: '800', marginBottom: 4 }]}>🎯 Choice</Text>
                {choiceHabits.map((habit) => renderHabitRow(habit))}
              </View>
            ) : null}
            {goalAndTrackerHabits.length > 0 ? (
              <View style={{ marginTop: yesNoHabits.length > 0 || choiceHabits.length > 0 ? 10 : 0 }}>
                <Text style={[styles.habitInfo, { color: palette.accent, fontWeight: '800', marginBottom: 4 }]}>📊 Goals & Trackers</Text>
                {goalAndTrackerHabits.map((habit) => renderHabitRow(habit))}
              </View>
            ) : null}
          </>
        ) : (
          activeHabits.map((habit) => renderHabitRow(habit))
        )}
      </View>
    </View>
  );
}
