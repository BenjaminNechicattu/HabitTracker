import { Habit } from '../types/habit';

export const STORAGE_KEY = 'habitty.v1';

export const NOTIFICATION_STORAGE_KEY = 'habitty.notificationMap.v1';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-water',
    name: 'Drink Water',
    category: 'Health',
    frequency: 'daily',
    taskType: 'yesNo',
    reminderEnabled: true,
    reminderTime: '07:00',
    repeatDays: [1, 2, 3, 4, 5, 6, 0],
    createdAt: Date.now(),
  },
  {
    id: 'habit-workout',
    name: 'Workout',
    category: 'Fitness',
    frequency: 'daily',
    taskType: 'yesNo',
    reminderEnabled: true,
    reminderTime: '18:30',
    repeatDays: [1, 3, 5],
    createdAt: Date.now(),
  },
  {
    id: 'habit-read',
    name: 'Read 20 min',
    category: 'Learning',
    frequency: 'daily',
    taskType: 'yesNo',
    reminderEnabled: true,
    reminderTime: '21:00',
    repeatDays: [1, 2, 3, 4, 5, 6, 0],
    createdAt: Date.now(),
  },
];

export const DAY_OPTIONS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
] as const;
