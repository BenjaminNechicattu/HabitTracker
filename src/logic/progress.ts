import { endOfDay, format, parse, startOfDay } from 'date-fns';
import { CheckInMap, Habit } from '../types/habit';

export type DayEntries = Record<string, number>;

export function getHabitOptionKey(habitId: string, optionId: string): string {
  return `${habitId}::${optionId}`;
}

export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(key: string): Date {
  return parse(key, 'yyyy-MM-dd', new Date());
}

export function isTargetHabit(habit: Habit): boolean {
  return habit.taskType === 'target' || habit.taskType === 'measurable';
}

export function isTrackerHabit(habit: Habit): boolean {
  return habit.taskType === 'tracker';
}

export function isCountHabit(habit: Habit): boolean {
  return isTargetHabit(habit) || isTrackerHabit(habit);
}

export function isHabitCompleteForDay(habit: Habit, dayEntries: DayEntries): boolean {
  const value = dayEntries[habit.id] ?? 0;
  if (habit.taskType === 'choice') {
    if (value > 0) {
      return true;
    }
    return (habit.choiceOptions ?? []).some((option) => Boolean(dayEntries[getHabitOptionKey(habit.id, option.id)]));
  }
  if (isTargetHabit(habit)) {
    return value >= (habit.targetValue ?? 1);
  }
  return value > 0;
}

/** 0 → not started, (0,1) → in progress, 1 → complete. */
export function getHabitDayRatio(habit: Habit, dayEntries: DayEntries): number {
  if (isHabitCompleteForDay(habit, dayEntries)) {
    return 1;
  }
  if (isTargetHabit(habit)) {
    const goal = habit.targetValue ?? 1;
    return Math.min(1, (dayEntries[habit.id] ?? 0) / goal);
  }
  return 0;
}

export function isScheduledOn(habit: Habit, date: Date): boolean {
  if (!habit.repeatDays || habit.repeatDays.length === 0) {
    return true;
  }
  return habit.repeatDays.includes(date.getDay());
}

/** A sensible +/- step so large goals (steps, minutes) stay usable. */
export function getStepSize(habit: Habit): number {
  const goal = habit.targetValue ?? 0;
  if (goal >= 1000) {
    return 100;
  }
  if (goal >= 100) {
    return 10;
  }
  return 1;
}

export function formatAmount(habit: Habit, value: number): string {
  const unit = habit.measurableUnit ?? '';
  return unit ? `${value} ${unit}` : String(value);
}

function existedOn(habit: Habit, date: Date): boolean {
  return (habit.createdAt ?? 0) <= endOfDay(date).getTime();
}

/**
 * Habits that count towards a given day: those scheduled that day, plus any
 * habit the user completed anyway (a bonus check-in).
 */
export function getHabitsForDay(habits: Habit[], date: Date, dayEntries: DayEntries): Habit[] {
  return habits.filter((habit) => {
    if (isHabitCompleteForDay(habit, dayEntries)) {
      return true;
    }
    return isScheduledOn(habit, date) && existedOn(habit, date);
  });
}

export type DaySummary = {
  date: Date;
  key: string;
  completed: number;
  total: number;
  ratio: number;
};

export function summarizeDay(habits: Habit[], date: Date, checkIns: CheckInMap): DaySummary {
  const key = getDateKey(date);
  const entries = checkIns[key] ?? {};
  const dayHabits = getHabitsForDay(habits, date, entries);
  const completed = dayHabits.filter((habit) => isHabitCompleteForDay(habit, entries)).length;
  return {
    date,
    key,
    completed,
    total: dayHabits.length,
    ratio: dayHabits.length === 0 ? 0 : completed / dayHabits.length,
  };
}

export type HabitCellState = 'future' | 'rest' | 'done' | 'partial' | 'missed';

export function getHabitCellState(habit: Habit, date: Date, checkIns: CheckInMap, today: Date): HabitCellState {
  const entries = checkIns[getDateKey(date)] ?? {};
  if (isHabitCompleteForDay(habit, entries)) {
    return 'done';
  }
  if (startOfDay(date).getTime() > startOfDay(today).getTime()) {
    return 'future';
  }
  if (!isScheduledOn(habit, date) || !existedOn(habit, date)) {
    return 'rest';
  }
  return (entries[habit.id] ?? 0) > 0 ? 'partial' : 'missed';
}
