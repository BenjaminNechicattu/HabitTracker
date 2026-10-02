import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { INITIAL_HABITS } from '../constants/habits';
import { ThemeMode } from '../design/theme';
import { DEFAULT_HABIT_COLOR } from '../design/tokens';
import { haptics, setHapticsEnabled as applyHapticsEnabled } from '../lib/haptics';
import { showToast } from '../lib/toast';
import { useTodayKey } from '../lib/useTodayKey';
import {
  DayEntries,
  getDateKey,
  getHabitOptionKey,
  getHabitsForDay,
  isCountHabit,
  isHabitCompleteForDay,
  isTargetHabit,
  parseDateKey,
} from '../logic/progress';
import { computeHabitStreak } from '../logic/stats';
import { syncHabitReminders } from '../notifications/reminders';
import { clearPersistedState, loadPersistedState, parseBackup, savePersistedState, serializeBackup } from '../storage/persistence';
import { CheckInMap, Habit, PersistedState } from '../types/habit';
import { addWidgetUserInteractionListener, HabitTasksWidget } from '../widgets/widgetBridge';

export type HabitInput = Omit<Habit, 'id' | 'createdAt' | 'archived' | 'frequency'>;

export type ProfileInput = {
  name: string;
  avatar: string;
  imageUri: string;
};

const STREAK_MILESTONES = [7, 14, 21, 30, 50, 100, 200, 365];

type StoreValue = {
  hydrated: boolean;
  todayKey: string;
  habits: Habit[];
  activeHabits: Habit[];
  archivedHabits: Habit[];
  checkIns: CheckInMap;
  themeMode: ThemeMode;
  onboarded: boolean;
  profileName: string;
  profileAvatar: string;
  profileAvatarImageUri: string;
  weekStartsOn: 0 | 1;
  hapticsEnabled: boolean;

  completeOnboarding: (name: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setWeekStartsOn: (value: 0 | 1) => void;
  setHapticsEnabled: (value: boolean) => void;
  saveProfile: (input: ProfileInput) => void;

  toggleHabit: (habitId: string, dateKey?: string) => void;
  setProgress: (habitId: string, value: number, dateKey?: string) => void;
  stepProgress: (habitId: string, direction: 1 | -1, amount: number, dateKey?: string) => void;
  toggleChoiceOption: (habitId: string, optionId: string, dateKey?: string) => void;

  addHabit: (input: HabitInput) => Habit;
  updateHabit: (habitId: string, patch: Partial<HabitInput>) => void;
  duplicateHabit: (habitId: string) => void;
  archiveHabit: (habitId: string) => void;
  unarchiveHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  reorderActiveHabits: (ordered: Habit[]) => void;
  setReminderMuted: (habitId: string, muted: boolean) => void;
  removeReminder: (habitId: string) => void;

  exportBackup: () => string;
  importBackup: (raw: string) => { ok: boolean; habits?: number };
  resetAll: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error('useStore must be used inside <StoreProvider>');
  }
  return value;
}

function cleanDay(day: DayEntries): DayEntries | null {
  return Object.keys(day).length > 0 ? day : null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [checkIns, setCheckIns] = useState<CheckInMap>({});
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [onboarded, setOnboarded] = useState(false);
  const [profileName, setProfileName] = useState('Ben');
  const [profileAvatar, setProfileAvatar] = useState('person-circle-outline');
  const [profileAvatarImageUri, setProfileAvatarImageUri] = useState('');
  const [weekStartsOn, setWeekStartsOnState] = useState<0 | 1>(0);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const legacyPrefs = useRef<Pick<PersistedState, 'statsOrder' | 'newHabitReminderExpanded'>>({});
  const todayKey = useTodayKey();

  // Mirrors let actions read the latest data synchronously (needed for milestone checks).
  const habitsRef = useRef(habits);
  const checkInsRef = useRef(checkIns);
  habitsRef.current = habits;
  checkInsRef.current = checkIns;

  useEffect(() => {
    let cancelled = false;
    loadPersistedState()
      .then((state) => {
        if (cancelled) {
          return;
        }
        setHabits(state.habits);
        setCheckIns(state.checkIns);
        setThemeModeState(state.themeMode);
        setOnboarded(state.onboarded);
        setProfileName(state.profileName);
        setProfileAvatar(state.profileAvatar);
        setProfileAvatarImageUri(state.profileAvatarImageUri ?? '');
        setWeekStartsOnState(state.weekStartsOn === 1 ? 1 : 0);
        const haptic = state.hapticsEnabled !== false;
        setHapticsEnabledState(haptic);
        applyHapticsEnabled(haptic);
        legacyPrefs.current = { statsOrder: state.statsOrder, newHabitReminderExpanded: state.newHabitReminderExpanded };
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const payload: PersistedState = {
      habits,
      checkIns,
      themeMode,
      onboarded,
      profileName,
      profileAvatar,
      profileAvatarImageUri,
      weekStartsOn,
      hapticsEnabled,
      ...legacyPrefs.current,
    };
    savePersistedState(payload).catch(() => {
      // Persistence failures must never block the UI.
    });
  }, [hydrated, habits, checkIns, themeMode, onboarded, profileName, profileAvatar, profileAvatarImageUri, weekStartsOn, hapticsEnabled]);

  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((habit) => habit.archived), [habits]);

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') {
      return;
    }
    syncHabitReminders(activeHabits).catch(() => {
      // Scheduling should never block app usage.
    });
  }, [activeHabits, hydrated]);

  const writeCheckIns = useCallback((next: CheckInMap) => {
    checkInsRef.current = next;
    setCheckIns(next);
  }, []);

  const writeDay = useCallback(
    (dateKey: string, nextDay: DayEntries) => {
      const next = { ...checkInsRef.current };
      const cleaned = cleanDay(nextDay);
      if (cleaned) {
        next[dateKey] = cleaned;
      } else {
        delete next[dateKey];
      }
      writeCheckIns(next);
    },
    [writeCheckIns],
  );

  /** Fires celebration feedback only when a habit transitions to complete today. */
  const celebrate = useCallback(
    (habit: Habit, dateKey: string, wasDone: boolean) => {
      const day = checkInsRef.current[dateKey] ?? {};
      const nowDone = isHabitCompleteForDay(habit, day);
      if (wasDone && !nowDone) {
        haptics.tap();
        return;
      }
      if (wasDone || !nowDone) {
        return;
      }

      const today = getDateKey(new Date());
      if (dateKey !== today) {
        haptics.tap();
        return;
      }

      const streak = computeHabitStreak(habit, checkInsRef.current);
      const date = parseDateKey(dateKey);
      const dayHabits = getHabitsForDay(habitsRef.current.filter((item) => !item.archived), date, day);
      const allDone = dayHabits.length > 0 && dayHabits.every((item) => isHabitCompleteForDay(item, day));

      if (STREAK_MILESTONES.includes(streak)) {
        haptics.success();
        showToast(`${streak}-day streak on ${habit.name}`, { icon: 'flame', tone: 'success' });
      } else if (allDone) {
        haptics.success();
        showToast('All done for today', { icon: 'checkmark-circle', tone: 'success' });
      } else {
        haptics.complete();
      }
    },
    [],
  );

  const setProgress = useCallback(
    (habitId: string, rawValue: number, dateKey: string = getDateKey(new Date())) => {
      const habit = habitsRef.current.find((item) => item.id === habitId);
      if (!habit) {
        return;
      }
      const day = checkInsRef.current[dateKey] ?? {};
      const wasDone = isHabitCompleteForDay(habit, day);

      const rounded = Number.isFinite(rawValue) ? Math.round(rawValue) : 0;
      const value = isTargetHabit(habit)
        ? Math.max(0, Math.min(rounded, habit.targetValue ?? 1))
        : habit.taskType === 'tracker'
          ? Math.max(0, rounded)
          : rounded > 0
            ? 1
            : 0;

      const nextDay = { ...day };
      if (habit.taskType === 'choice') {
        if (value > 0) {
          nextDay[habitId] = 1;
        } else {
          delete nextDay[habitId];
          (habit.choiceOptions ?? []).forEach((option) => delete nextDay[getHabitOptionKey(habitId, option.id)]);
        }
      } else if (value > 0) {
        nextDay[habitId] = value;
      } else {
        delete nextDay[habitId];
      }

      writeDay(dateKey, nextDay);
      celebrate(habit, dateKey, wasDone);
    },
    [celebrate, writeDay],
  );

  const toggleChoiceOption = useCallback(
    (habitId: string, optionId: string, dateKey: string = getDateKey(new Date())) => {
      const habit = habitsRef.current.find((item) => item.id === habitId);
      if (!habit || habit.taskType !== 'choice') {
        return;
      }
      const day = checkInsRef.current[dateKey] ?? {};
      const wasDone = isHabitCompleteForDay(habit, day);
      const optionKey = getHabitOptionKey(habitId, optionId);
      const wasActive = Boolean(day[optionKey]);

      const nextDay = { ...day };
      (habit.choiceOptions ?? []).forEach((option) => delete nextDay[getHabitOptionKey(habitId, option.id)]);
      if (wasActive) {
        delete nextDay[habitId];
      } else {
        nextDay[optionKey] = 1;
        nextDay[habitId] = 1;
      }

      writeDay(dateKey, nextDay);
      celebrate(habit, dateKey, wasDone);
    },
    [celebrate, writeDay],
  );

  const toggleHabit = useCallback(
    (habitId: string, dateKey: string = getDateKey(new Date())) => {
      const habit = habitsRef.current.find((item) => item.id === habitId);
      if (!habit) {
        return;
      }
      const day = checkInsRef.current[dateKey] ?? {};
      const done = isHabitCompleteForDay(habit, day);

      if (habit.taskType === 'choice') {
        if (done) {
          setProgress(habitId, 0, dateKey);
        } else if (habit.choiceOptions && habit.choiceOptions.length > 0) {
          toggleChoiceOption(habitId, habit.choiceOptions[0].id, dateKey);
        } else {
          setProgress(habitId, 1, dateKey);
        }
        return;
      }
      if (isTargetHabit(habit)) {
        setProgress(habitId, done ? 0 : habit.targetValue ?? 1, dateKey);
        return;
      }
      setProgress(habitId, done ? 0 : 1, dateKey);
    },
    [setProgress, toggleChoiceOption],
  );

  const stepProgress = useCallback(
    (habitId: string, direction: 1 | -1, amount: number, dateKey: string = getDateKey(new Date())) => {
      const habit = habitsRef.current.find((item) => item.id === habitId);
      if (!habit || !isCountHabit(habit)) {
        return;
      }
      const current = (checkInsRef.current[dateKey] ?? {})[habitId] ?? 0;
      setProgress(habitId, current + direction * amount, dateKey);
    },
    [setProgress],
  );

  const addHabit = useCallback((input: HabitInput): Habit => {
    const habit: Habit = {
      ...input,
      id: `habit-${Date.now()}`,
      frequency: 'daily',
      archived: false,
      createdAt: Date.now(),
      taskColor: input.taskColor ?? DEFAULT_HABIT_COLOR,
    };
    setHabits((prev) => [habit, ...prev]);
    return habit;
  }, []);

  const updateHabit = useCallback((habitId: string, patch: Partial<HabitInput>) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, ...patch } : habit)));
  }, []);

  const duplicateHabit = useCallback((habitId: string) => {
    setHabits((prev) => {
      const index = prev.findIndex((habit) => habit.id === habitId);
      if (index === -1) {
        return prev;
      }
      const source = prev[index];
      const copy: Habit = {
        ...source,
        id: `habit-${Date.now()}`,
        name: `${source.name} copy`,
        createdAt: Date.now(),
        archived: false,
        choiceOptions: source.choiceOptions?.map((option) => ({ ...option })),
      };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }, []);

  const archiveHabit = useCallback((habitId: string) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, archived: true } : habit)));
  }, []);

  const unarchiveHabit = useCallback((habitId: string) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, archived: false } : habit)));
  }, []);

  const deleteHabit = useCallback(
    (habitId: string) => {
      setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
      const optionPrefix = `${habitId}::`;
      const next: CheckInMap = {};
      for (const [date, entries] of Object.entries(checkInsRef.current)) {
        const remaining = Object.fromEntries(Object.entries(entries).filter(([key]) => key !== habitId && !key.startsWith(optionPrefix)));
        if (Object.keys(remaining).length > 0) {
          next[date] = remaining;
        }
      }
      writeCheckIns(next);
    },
    [writeCheckIns],
  );

  const reorderActiveHabits = useCallback((ordered: Habit[]) => {
    setHabits((prev) => [...ordered, ...prev.filter((habit) => habit.archived)]);
  }, []);

  const setReminderMuted = useCallback((habitId: string, muted: boolean) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, reminderMuted: muted } : habit)));
  }, []);

  const removeReminder = useCallback((habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === habitId ? { ...habit, reminderEnabled: false, reminderTime: undefined, reminderMuted: false } : habit)),
    );
  }, []);

  const completeOnboarding = useCallback((name: string) => {
    setProfileName(name.trim() || 'Ben');
    setOnboarded(true);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => setThemeModeState(mode), []);
  const setWeekStartsOn = useCallback((value: 0 | 1) => setWeekStartsOnState(value), []);
  const setHapticsEnabled = useCallback((value: boolean) => {
    applyHapticsEnabled(value);
    setHapticsEnabledState(value);
  }, []);

  const saveProfile = useCallback((input: ProfileInput) => {
    setProfileName(input.name.trim() || 'Ben');
    setProfileAvatar(input.avatar || 'person-circle-outline');
    setProfileAvatarImageUri(input.imageUri);
  }, []);

  const exportBackup = useCallback(
    () =>
      serializeBackup({
        habits: habitsRef.current,
        checkIns: checkInsRef.current,
        themeMode,
        onboarded,
        profileName,
        profileAvatar,
      }),
    [themeMode, onboarded, profileName, profileAvatar],
  );

  const importBackup = useCallback(
    (raw: string) => {
      const parsed = parseBackup(raw);
      if (!parsed) {
        return { ok: false };
      }
      setHabits(parsed.habits.length > 0 ? parsed.habits : INITIAL_HABITS);
      writeCheckIns(parsed.checkIns);
      if (parsed.profileName) {
        setProfileName(parsed.profileName);
      }
      return { ok: true, habits: parsed.habits.length };
    },
    [writeCheckIns],
  );

  const resetAll = useCallback(async () => {
    await clearPersistedState();
    if (Platform.OS !== 'web') {
      await syncHabitReminders([]).catch(() => undefined);
    }
    setHabits(INITIAL_HABITS);
    writeCheckIns({});
    setThemeModeState('system');
    setOnboarded(false);
    setProfileName('Ben');
    setProfileAvatar('person-circle-outline');
    setProfileAvatarImageUri('');
    setWeekStartsOnState(0);
    setHapticsEnabledState(true);
    applyHapticsEnabled(true);
    legacyPrefs.current = {};
  }, [writeCheckIns]);

  // iOS widget mirror.
  const todayEntries = checkIns[todayKey] ?? {};
  const widgetSnapshot = useMemo(() => {
    const todays = getHabitsForDay(activeHabits, parseDateKey(todayKey), todayEntries);
    return {
      completed: todays.filter((habit) => isHabitCompleteForDay(habit, todayEntries)).length,
      total: todays.length,
      habits: todays.slice(0, 3).map((habit) => ({
        id: habit.id,
        name: habit.name,
        done: isHabitCompleteForDay(habit, todayEntries),
      })),
    };
  }, [activeHabits, todayEntries, todayKey]);

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'ios') {
      return;
    }
    try {
      HabitTasksWidget.updateSnapshot(widgetSnapshot);
    } catch {
      // Widget support is unavailable outside native iOS builds.
    }
  }, [hydrated, widgetSnapshot]);

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'ios') {
      return;
    }
    let subscription: { remove: () => void } | undefined;
    try {
      subscription = addWidgetUserInteractionListener((event) => {
        const target = event.target ?? '';
        if (!target.startsWith('toggle:')) {
          return;
        }
        const habitId = target.replace('toggle:', '');
        const habit = habitsRef.current.find((item) => item.id === habitId && !item.archived);
        if (habit) {
          toggleHabit(habitId);
          showToast(`${habit.name} updated from widget`, { icon: 'apps' });
        }
      });
    } catch {
      // Widget support is unavailable outside native iOS builds.
    }
    return () => subscription?.remove();
  }, [hydrated, toggleHabit]);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      todayKey,
      habits,
      activeHabits,
      archivedHabits,
      checkIns,
      themeMode,
      onboarded,
      profileName,
      profileAvatar,
      profileAvatarImageUri,
      weekStartsOn,
      hapticsEnabled,
      completeOnboarding,
      setThemeMode,
      setWeekStartsOn,
      setHapticsEnabled,
      saveProfile,
      toggleHabit,
      setProgress,
      stepProgress,
      toggleChoiceOption,
      addHabit,
      updateHabit,
      duplicateHabit,
      archiveHabit,
      unarchiveHabit,
      deleteHabit,
      reorderActiveHabits,
      setReminderMuted,
      removeReminder,
      exportBackup,
      importBackup,
      resetAll,
    }),
    [
      hydrated,
      todayKey,
      habits,
      activeHabits,
      archivedHabits,
      checkIns,
      themeMode,
      onboarded,
      profileName,
      profileAvatar,
      profileAvatarImageUri,
      weekStartsOn,
      hapticsEnabled,
      completeOnboarding,
      setThemeMode,
      setWeekStartsOn,
      setHapticsEnabled,
      saveProfile,
      toggleHabit,
      setProgress,
      stepProgress,
      toggleChoiceOption,
      addHabit,
      updateHabit,
      duplicateHabit,
      archiveHabit,
      unarchiveHabit,
      deleteHabit,
      reorderActiveHabits,
      setReminderMuted,
      removeReminder,
      exportBackup,
      importBackup,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
