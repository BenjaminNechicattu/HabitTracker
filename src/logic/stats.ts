import { addDays, differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { CheckInMap, Habit } from '../types/habit';
import {
  DaySummary,
  getDateKey,
  getHabitOptionKey,
  isCountHabit,
  isHabitCompleteForDay,
  isScheduledOn,
  parseDateKey,
  summarizeDay,
} from './progress';

const MAX_LOOKBACK_DAYS = 800;

function isDone(habit: Habit, checkIns: CheckInMap, date: Date) {
  return isHabitCompleteForDay(habit, checkIns[getDateKey(date)] ?? {});
}

/** Consecutive scheduled days completed. Today is forgiven until it ends. */
export function computeHabitStreak(habit: Habit, checkIns: CheckInMap, today: Date = new Date()): number {
  let cursor = startOfDay(today);
  if (!isDone(habit, checkIns, cursor)) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 1) {
    if (isDone(habit, checkIns, cursor)) {
      streak += 1;
    } else if (isScheduledOn(habit, cursor)) {
      break;
    }
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function earliestKey(checkIns: CheckInMap): string | null {
  const keys = Object.keys(checkIns).sort();
  return keys.length > 0 ? keys[0] : null;
}

export function computeBestHabitStreak(habit: Habit, checkIns: CheckInMap, today: Date = new Date()): number {
  const first = earliestKey(checkIns);
  if (!first) {
    return 0;
  }

  const end = startOfDay(today);
  let cursor = parseDateKey(first);
  let run = 0;
  let best = 0;
  while (cursor.getTime() <= end.getTime()) {
    if (isDone(habit, checkIns, cursor)) {
      run += 1;
      best = Math.max(best, run);
    } else if (isScheduledOn(habit, cursor)) {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

function hasAnyCompletion(checkIns: CheckInMap, date: Date) {
  return Object.values(checkIns[getDateKey(date)] ?? {}).some(Boolean);
}

export function computeGlobalStreak(checkIns: CheckInMap, today: Date = new Date()): number {
  let cursor = startOfDay(today);
  if (!hasAnyCompletion(checkIns, cursor)) {
    cursor = subDays(cursor, 1);
  }
  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS && hasAnyCompletion(checkIns, cursor); i += 1) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function computeBestGlobalStreak(checkIns: CheckInMap, today: Date = new Date()): number {
  const first = earliestKey(checkIns);
  if (!first) {
    return 0;
  }
  const end = startOfDay(today);
  let cursor = parseDateKey(first);
  let run = 0;
  let best = 0;
  while (cursor.getTime() <= end.getTime()) {
    run = hasAnyCompletion(checkIns, cursor) ? run + 1 : 0;
    best = Math.max(best, run);
    cursor = addDays(cursor, 1);
  }
  return best;
}

/** Oldest → newest series ending on `end` (inclusive). */
export function buildDailySeries(habits: Habit[], checkIns: CheckInMap, days: number, end: Date = new Date()): DaySummary[] {
  return Array.from({ length: days }, (_, index) => summarizeDay(habits, subDays(startOfDay(end), days - 1 - index), checkIns));
}

export function aggregate(series: DaySummary[]) {
  const completed = series.reduce((sum, day) => sum + day.completed, 0);
  const total = series.reduce((sum, day) => sum + day.total, 0);
  return { completed, total, rate: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

/** Average completion rate (0-100) for each weekday (0 = Sunday) over the last N weeks. */
export function weekdayPerformance(habits: Habit[], checkIns: CheckInMap, weeks = 12, end: Date = new Date()) {
  const series = buildDailySeries(habits, checkIns, weeks * 7, end);
  const buckets = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));
  for (const day of series) {
    const bucket = buckets[day.date.getDay()];
    bucket.completed += day.completed;
    bucket.total += day.total;
  }
  return buckets.map((bucket) => (bucket.total === 0 ? 0 : Math.round((bucket.completed / bucket.total) * 100)));
}

/** Completion rate for one habit across the last N days, counting only scheduled days. */
export function habitRate(habit: Habit, checkIns: CheckInMap, days: number, today: Date = new Date()) {
  let scheduled = 0;
  let completed = 0;
  for (let i = 0; i < days; i += 1) {
    const date = subDays(startOfDay(today), i);
    const done = isDone(habit, checkIns, date);
    const existed = (habit.createdAt ?? 0) <= date.getTime() + 86_399_999;
    if (done || (isScheduledOn(habit, date) && existed)) {
      scheduled += 1;
      if (done) {
        completed += 1;
      }
    }
  }
  return { scheduled, completed, rate: scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100) };
}

export type HabitSummary = {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  rate30: number;
  scheduled30: number;
  completed30: number;
  average: number;
  minimum: number;
  maximum: number;
  options: { id: string; name: string; total: number }[];
};

export function summarizeHabit(habit: Habit, checkIns: CheckInMap, today: Date = new Date()): HabitSummary {
  let totalCompletions = 0;
  const values: number[] = [];
  const optionTotals = new Map<string, number>();
  const optionPrefix = `${habit.id}::`;

  for (const entries of Object.values(checkIns)) {
    if (isHabitCompleteForDay(habit, entries)) {
      totalCompletions += 1;
    }
    const value = entries[habit.id] ?? 0;
    if (value > 0 && isCountHabit(habit)) {
      values.push(value);
    }
    for (const [key, amount] of Object.entries(entries)) {
      if (amount && key.startsWith(optionPrefix)) {
        const optionId = key.slice(optionPrefix.length);
        optionTotals.set(optionId, (optionTotals.get(optionId) ?? 0) + 1);
      }
    }
  }

  const recent = habitRate(habit, checkIns, 30, today);

  return {
    currentStreak: computeHabitStreak(habit, checkIns, today),
    bestStreak: computeBestHabitStreak(habit, checkIns, today),
    totalCompletions,
    rate30: recent.rate,
    scheduled30: recent.scheduled,
    completed30: recent.completed,
    average: values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
    minimum: values.length > 0 ? Math.min(...values) : 0,
    maximum: values.length > 0 ? Math.max(...values) : 0,
    options: (habit.choiceOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name,
      total: optionTotals.get(option.id) ?? 0,
    })),
  };
}

export function daysSince(date: Date, today: Date = new Date()) {
  return differenceInCalendarDays(today, date);
}

export { getHabitOptionKey };
