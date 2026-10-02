import { format } from 'date-fns';

export function formatReminderTime(value?: string): string {
  if (!value) {
    return '';
  }
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return value;
  }
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return format(date, 'h:mm a');
}

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKENDS = [6, 0];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function sameSet(a: number[], b: number[]) {
  return a.length === b.length && a.every((day) => b.includes(day));
}

export function describeRepeat(days: number[]): string {
  if (days.length === 0 || sameSet(days, ALL_DAYS)) {
    return 'Every day';
  }
  if (sameSet(days, WEEKDAYS)) {
    return 'Weekdays';
  }
  if (sameSet(days, WEEKENDS)) {
    return 'Weekends';
  }
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter((day) => days.includes(day));
  return ordered.map((day) => SHORT_NAMES[day]).join(', ');
}

export const REPEAT_PRESETS = [
  { key: 'daily', label: 'Every day', days: ALL_DAYS },
  { key: 'weekdays', label: 'Weekdays', days: WEEKDAYS },
  { key: 'weekends', label: 'Weekends', days: WEEKENDS },
] as const;

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) {
    return 'Good night';
  }
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
