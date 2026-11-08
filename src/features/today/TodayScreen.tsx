import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { format } from 'date-fns';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '../../design/theme';
import { cardShadow, spacing } from '../../design/tokens';
import { greetingFor, titleCase } from '../../lib/format';
import { getHabitsForDay, isHabitCompleteForDay, parseDateKey } from '../../logic/progress';
import { computeGlobalStreak } from '../../logic/stats';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { Avatar } from '../../ui/Avatar';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { ProgressRing } from '../../ui/ProgressRing';
import { LargeTitle, RoundButton, Screen } from '../../ui/Screen';
import { SectionHeader } from '../../ui/SectionHeader';
import { Skeleton } from '../../ui/Skeleton';
import { StreakBadge } from '../../ui/StreakBadge';
import { Text } from '../../ui/Text';
import { useHabitInteractions } from '../shared/useHabitInteractions';
import { WeekStrip } from './WeekStrip';

export function TodayScreen() {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const [selectedKey, setSelectedKey] = useState(store.todayKey);
  const [category, setCategory] = useState<string>('All');
  const [showRest, setShowRest] = useState(false);
  const { renderRow, overlays, readOnly } = useHabitInteractions(selectedKey);

  const selectedDate = useMemo(() => parseDateKey(selectedKey), [selectedKey]);
  const isToday = selectedKey === store.todayKey;
  const entries = store.checkIns[selectedKey] ?? {};

  const scheduled = useMemo(() => getHabitsForDay(store.activeHabits, selectedDate, entries), [store.activeHabits, selectedDate, entries]);
  const scheduledIds = useMemo(() => new Set(scheduled.map((habit) => habit.id)), [scheduled]);
  const resting = useMemo(() => store.activeHabits.filter((habit) => !scheduledIds.has(habit.id)), [store.activeHabits, scheduledIds]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(scheduled.map((habit) => habit.category)))], [scheduled]);
  const activeCategory = categories.includes(category) ? category : 'All';
  const visible = scheduled.filter((habit) => activeCategory === 'All' || habit.category === activeCategory);
  const todo = visible.filter((habit) => !isHabitCompleteForDay(habit, entries));
  const completed = visible.filter((habit) => isHabitCompleteForDay(habit, entries));

  const doneCount = scheduled.filter((habit) => isHabitCompleteForDay(habit, entries)).length;
  const total = scheduled.length;
  const ratio = total === 0 ? 0 : doneCount / total;
  const allDone = total > 0 && doneCount === total;
  const globalStreak = useMemo(() => computeGlobalStreak(store.checkIns, new Date()), [store.checkIns]);

  const idea = useMemo(() => {
    if (!isToday) {
      return null;
    }
    const eligible = store.activeHabits.filter((habit) => habit.taskType === 'choice' && habit.randomSuggestionEnabled && (habit.choiceOptions?.length ?? 0) > 0);
    if (eligible.length === 0) {
      return null;
    }
    const seed = Array.from(store.todayKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const habit = eligible[seed % eligible.length];
    const options = habit.choiceOptions ?? [];
    return { habit: habit.name, option: options[(seed + habit.name.length) % options.length]?.name ?? '' };
  }, [store.activeHabits, store.todayKey, isToday]);

  if (!store.hydrated) {
    return <TodaySkeleton />;
  }

  const headline = allDone
    ? 'All done — nicely played'
    : total === 0
      ? 'Nothing scheduled'
      : doneCount === 0
        ? isToday
          ? "Let's make today count"
          : 'No habits completed'
        : `${total - doneCount} to go`;

  const title = isToday ? 'Today' : format(selectedDate, 'EEEE');
  const eyebrow = isToday ? `${greetingFor(new Date())}, ${titleCase(store.profileName)}` : format(selectedDate, 'MMMM d, yyyy');

  return (
    <>
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => nav.setTab('settings')} accessibilityRole="button" accessibilityLabel="Open settings and profile" hitSlop={6}>
            <Avatar name={store.profileName} avatar={store.profileAvatar} imageUri={store.profileAvatarImageUri} size={52} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <LargeTitle
              title={title}
              eyebrow={eyebrow}
            />
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <WeekStrip selectedKey={selectedKey} todayKey={store.todayKey} weekStartsOn={store.weekStartsOn} habits={store.activeHabits} checkIns={store.checkIns} onSelect={setSelectedKey} />
          {!isToday ? (
            <Pressable onPress={() => setSelectedKey(store.todayKey)} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', minHeight: 36, justifyContent: 'center' }}>
              <Text variant="subhead" color="accent" weight="600">
                Back to today
              </Text>
            </Pressable>
          ) : null}
        </View>

        {store.activeHabits.length === 0 ? (
          <Card>
            <EmptyState icon="leaf-outline" title="No habits yet" message="Start building your routine — one small habit is enough." actionLabel="Create Your First Habit" onAction={() => nav.push({ name: 'form' })} />
          </Card>
        ) : (
          <>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl, padding: spacing.xl }}>
              <ProgressRing size={128} stroke={13} progress={ratio} color={allDone ? colors.success : colors.accent} trackColor={colors.fillStrong} accessibilityLabel={`Progress for ${title}`}>
                <Text variant="title" weight="800" numeric>
                  {Math.round(ratio * 100)}%
                </Text>
              </ProgressRing>
              <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                <Text variant="label" color="tertiary">
                  {isToday ? "Today's progress" : 'Progress'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text variant="metric" weight="800" numeric style={{ fontSize: 40, lineHeight: 44 }}>
                    {doneCount}
                  </Text>
                  <Text variant="callout" color="secondary" numeric>
                    of {total}
                  </Text>
                </View>
                <Text variant="subhead" color="secondary" numberOfLines={2}>
                  {headline}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                  <StreakBadge count={globalStreak} suffix="day streak" />
                </View>
              </View>
            </Card>

            {idea ? (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="sparkles" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label" color="tertiary">
                    Today's idea
                  </Text>
                  <Text variant="subhead" weight="600" numberOfLines={2}>
                    {idea.habit}: {idea.option}
                  </Text>
                </View>
              </Card>
            ) : null}

            {categories.length > 2 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.xl }}>
                {categories.map((name) => (
                  <Chip key={name} label={name} selected={name === activeCategory} onPress={() => setCategory(name)} />
                ))}
              </ScrollView>
            ) : null}

            {readOnly ? (
              <Text variant="footnote" color="tertiary" align="center">
                Future days can't be completed yet.
              </Text>
            ) : null}

            {todo.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title={`To do · ${todo.length}`} />
                {todo.map((habit) => (
                  <Animated.View key={habit.id} layout={LinearTransition.springify().damping(24).stiffness(260)} entering={FadeIn.duration(200)}>
                    {renderRow(habit, { swipe: true })}
                  </Animated.View>
                ))}
              </View>
            ) : null}

            {completed.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title={`Completed · ${completed.length}`} />
                {completed.map((habit) => (
                  <Animated.View key={habit.id} layout={LinearTransition.springify().damping(24).stiffness(260)} entering={FadeIn.duration(200)}>
                    {renderRow(habit, { swipe: true })}
                  </Animated.View>
                ))}
              </View>
            ) : null}

            {visible.length === 0 && scheduled.length === 0 ? (
              <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
                <Icon name="moon-outline" size={28} color={colors.textTertiary} />
                <Text variant="headline">A rest day</Text>
                <Text variant="subhead" color="secondary" align="center">
                  No habits are scheduled for {isToday ? 'today' : 'this day'}.
                </Text>
              </Card>
            ) : null}

            {resting.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title={`Not scheduled · ${resting.length}`} actionLabel={showRest ? 'Hide' : 'Show'} onAction={() => setShowRest((prev) => !prev)} />
                {showRest ? resting.map((habit) => <View key={habit.id}>{renderRow(habit, { swipe: true, dimmed: true })}</View>) : null}
              </View>
            ) : null}
          </>
        )}
      </Screen>
      {overlays}
    </>
  );
}

function TodaySkeleton() {
  const colors = useTheme();
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Skeleton width={52} height={52} radius={26} />
        <View style={{ gap: 8, flex: 1 }}>
          <Skeleton width={140} height={14} />
          <Skeleton width={120} height={30} radius={10} />
        </View>
      </View>
      <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: spacing.xl, flexDirection: 'row', gap: spacing.xl, boxShadow: cardShadow(colors) }}>
        <Skeleton width={128} height={128} radius={64} />
        <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
          <Skeleton width={90} height={12} />
          <Skeleton width={110} height={36} radius={10} />
          <Skeleton width="80%" height={14} />
        </View>
      </View>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={72} radius={22} />
      ))}
    </Screen>
  );
}
