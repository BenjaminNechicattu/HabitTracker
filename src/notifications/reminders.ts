import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { NOTIFICATION_STORAGE_KEY } from '../constants/habits';
import { Habit } from '../types/habit';

type ReminderMap = Record<string, string[]>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

function parseReminderTime(reminderTime?: string) {
  if (!reminderTime) {
    return null;
  }
  const [hourRaw, minuteRaw] = reminderTime.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

async function readReminderMap(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as ReminderMap;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeReminderMap(map: ReminderMap): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore persistence errors for notification metadata.
  }
}

async function cancelHabitSchedules(habitId: string, reminderMap: ReminderMap): Promise<ReminderMap> {
  const ids = reminderMap[habitId] ?? [];
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  }
  const next = { ...reminderMap };
  delete next[habitId];
  return next;
}

export async function requestReminderPermissions(): Promise<boolean> {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return !!requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function scheduleHabit(habit: Habit): Promise<string[]> {
  const parsedTime = parseReminderTime(habit.reminderTime);
  if (!habit.reminderEnabled || habit.reminderMuted || !parsedTime) {
    return [];
  }

  const triggers = habit.repeatDays.length > 0 ? habit.repeatDays : [1, 2, 3, 4, 5, 6, 0];

  const identifiers: string[] = [];
  for (const day of triggers) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Reminder',
        body: `Time to complete: ${habit.name}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
      },
    });
    identifiers.push(identifier);
  }

  return identifiers;
}

export async function syncHabitReminders(habits: Habit[]): Promise<void> {
  const permissionGranted = await requestReminderPermissions();
  if (!permissionGranted) {
    return;
  }

  const existing = await readReminderMap();
  let nextMap: ReminderMap = { ...existing };

  const habitIds = new Set(habits.map((habit) => habit.id));

  for (const habitId of Object.keys(nextMap)) {
    if (!habitIds.has(habitId)) {
      nextMap = await cancelHabitSchedules(habitId, nextMap);
    }
  }

  for (const habit of habits) {
    nextMap = await cancelHabitSchedules(habit.id, nextMap);
    const ids = await scheduleHabit(habit);
    if (ids.length > 0) {
      nextMap[habit.id] = ids;
    }
  }

  await writeReminderMap(nextMap);
}
