import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth, subDays } from 'date-fns';
import { CheckInMap, Habit } from '../types/habit';

export function isHabitCompleteForDay(habit: Habit, dayEntries: Record<string, number>) {
  const value = dayEntries[habit.id] ?? 0;
  if (habit.taskType === 'measurable') {
    return value >= (habit.targetValue ?? 1);
  }
  return value > 0;
}

export function getAlternativeGroupKey(habit: Habit): string | null {
  const value = habit.alternativeGroup?.trim();
  if (!value) {
    return null;
  }
  return value.toLowerCase();
}

export function getDayCompletionSummary(habits: Habit[], dayEntries: Record<string, number>) {
  const groupedHabits = new Map<string, Habit[]>();
  let total = 0;
  let completed = 0;

  for (const habit of habits) {
    const groupKey = getAlternativeGroupKey(habit);
    if (!groupKey) {
      total += 1;
      if (isHabitCompleteForDay(habit, dayEntries)) {
        completed += 1;
      }
      continue;
    }

    const existing = groupedHabits.get(groupKey);
    if (existing) {
      existing.push(habit);
    } else {
      groupedHabits.set(groupKey, [habit]);
    }
  }

  for (const options of groupedHabits.values()) {
    total += 1;
    if (options.some((option) => isHabitCompleteForDay(option, dayEntries))) {
      completed += 1;
    }
  }

  return {
    completed,
    total,
  };
}

export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function buildWeekProgress(checkIns: CheckInMap, habits: Habit[]) {
  return Array.from({ length: 7 }).map((_, idx) => {
    const date = subDays(new Date(), 6 - idx);
    const key = getDateKey(date);
    const dayEntries = checkIns[key] ?? {};
    const summary = getDayCompletionSummary(habits, dayEntries);
    const ratio = summary.total === 0 ? 0 : summary.completed / summary.total;

    return {
      label: format(date, 'EEEEE'),
      value: Math.round(ratio * 100),
    };
  });
}

export function countStreakForHabit(habit: Habit, checkIns: CheckInMap): number {
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const key = getDateKey(cursor);
    if (isHabitCompleteForDay(habit, checkIns[key] ?? {})) {
      streak += 1;
      cursor = subDays(cursor, 1);
      continue;
    }
    break;
  }

  return streak;
}

export function countGlobalStreak(checkIns: CheckInMap): number {
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const key = getDateKey(cursor);
    const hasAnyCompletion = Object.values(checkIns[key] ?? {}).some(Boolean);
    if (hasAnyCompletion) {
      streak += 1;
      cursor = subDays(cursor, 1);
      continue;
    }
    break;
  }

  return streak;
}

export function countLongestGlobalStreak(checkIns: CheckInMap): number {
  const keys = Object.keys(checkIns).sort();
  let longest = 0;
  let running = 0;
  let previousDate: Date | null = null;

  for (const key of keys) {
    const hasAnyCompletion = Object.values(checkIns[key] ?? {}).some(Boolean);
    if (!hasAnyCompletion) {
      continue;
    }

    const currentDate = new Date(`${key}T00:00:00`);
    if (!previousDate) {
      running = 1;
    } else {
      const previousKey = getDateKey(subDays(currentDate, 1));
      running = previousKey === getDateKey(previousDate) ? running + 1 : 1;
    }

    if (running > longest) {
      longest = running;
    }
    previousDate = currentDate;
  }

  return longest;
}

export function buildCurrentMonthCalendar(checkIns: CheckInMap, habits: Habit[]) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmpty = getDay(monthStart);

  const cells = Array.from({ length: leadingEmpty }).map((_, index) => ({
    key: `empty-${index}`,
    label: '',
    completion: 0,
    isToday: false,
    isEmpty: true,
  }));

  for (const day of days) {
    const key = getDateKey(day);
    const dayEntries = checkIns[key] ?? {};
    const summary = getDayCompletionSummary(habits, dayEntries);
    const completion = summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100);
    cells.push({
      key,
      label: format(day, 'd'),
      completion,
      isToday: key === getDateKey(new Date()),
      isEmpty: false,
    });
  }

  return {
    monthLabel: format(new Date(), 'MMMM yyyy'),
    cells,
  };
}
