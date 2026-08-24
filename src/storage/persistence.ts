import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_HABITS, STORAGE_KEY } from '../constants/habits';
import { CheckInMap, Habit, PersistedState } from '../types/habit';

function normalizeHabit(habit: Habit): Habit {
  const taskType = habit.taskType === 'measurable' ? 'measurable' : 'yesNo';
  const alternativeGroup =
    typeof habit.alternativeGroup === 'string' && habit.alternativeGroup.trim() ? habit.alternativeGroup.trim() : undefined;
  const randomSuggestionEnabled = alternativeGroup ? Boolean(habit.randomSuggestionEnabled) : undefined;
  const targetValue =
    taskType === 'measurable' && typeof habit.targetValue === 'number' && Number.isFinite(habit.targetValue)
      ? Math.max(1, Math.round(habit.targetValue))
      : undefined;
  const measurableUnit =
    taskType === 'measurable' && typeof habit.measurableUnit === 'string' && habit.measurableUnit.trim()
      ? habit.measurableUnit.trim()
      : undefined;

  return {
    ...habit,
    alternativeGroup,
    randomSuggestionEnabled,
    taskType,
    targetValue,
    measurableUnit,
  };
}

function normalizeCheckIns(raw: unknown): CheckInMap {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalized: CheckInMap = {};
  for (const [dateKey, dayEntries] of Object.entries(raw as Record<string, unknown>)) {
    if (!dayEntries || typeof dayEntries !== 'object') {
      continue;
    }

    const dayMap: Record<string, number> = {};
    for (const [habitId, value] of Object.entries(dayEntries as Record<string, unknown>)) {
      const numericValue =
        typeof value === 'number'
          ? Math.max(0, Math.round(value))
          : typeof value === 'boolean'
            ? value
              ? 1
              : 0
            : 0;

      if (numericValue > 0) {
        dayMap[habitId] = numericValue;
      }
    }

    if (Object.keys(dayMap).length > 0) {
      normalized[dateKey] = dayMap;
    }
  }

  return normalized;
}

export async function loadPersistedState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        habits: INITIAL_HABITS,
        checkIns: {},
        themeMode: 'system',
        themeColor: 'violet',
        onboarded: false,
        profileName: 'Ben',
        profileAvatar: 'person-circle-outline',
        profileAvatarImageUri: '',
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const legacyDarkMode = (parsed as { darkMode?: unknown }).darkMode;
    const inferredThemeMode =
      parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system'
        ? parsed.themeMode
        : typeof legacyDarkMode === 'boolean'
          ? legacyDarkMode
            ? 'dark'
            : 'light'
          : 'system';
    const inferredThemeColor =
      parsed.themeColor === 'violet' ||
      parsed.themeColor === 'teal' ||
      parsed.themeColor === 'sunset' ||
      parsed.themeColor === 'rose' ||
      parsed.themeColor === 'forest' ||
      parsed.themeColor === 'gray'
        ? parsed.themeColor
        : 'violet';

    return {
      habits:
        Array.isArray(parsed.habits) && parsed.habits.length > 0
          ? (parsed.habits as Habit[]).map((habit) => normalizeHabit(habit))
          : INITIAL_HABITS.map((habit) => normalizeHabit(habit)),
      checkIns: normalizeCheckIns(parsed.checkIns),
      themeMode: inferredThemeMode,
      themeColor: inferredThemeColor,
      onboarded: typeof parsed.onboarded === 'boolean' ? parsed.onboarded : false,
      profileName: typeof parsed.profileName === 'string' && parsed.profileName.trim() ? parsed.profileName.trim() : 'Ben',
      profileAvatar:
        typeof parsed.profileAvatar === 'string' && parsed.profileAvatar.trim()
          ? parsed.profileAvatar.trim()
          : 'person-circle-outline',
      profileAvatarImageUri:
        typeof parsed.profileAvatarImageUri === 'string' ? parsed.profileAvatarImageUri : '',
    };
  } catch {
    return {
      habits: INITIAL_HABITS,
      checkIns: {},
      themeMode: 'system',
      themeColor: 'violet',
      onboarded: false,
      profileName: 'Ben',
      profileAvatar: 'person-circle-outline',
      profileAvatarImageUri: '',
    };
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep UI responsive if persistence fails.
  }
}

export async function clearPersistedState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore cleanup errors.
  }
}
