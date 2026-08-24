import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { addDays, format, subDays } from 'date-fns';
import {
  PanResponder,
  Platform,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { INITIAL_HABITS } from './src/constants/habits';
import {
  buildCurrentMonthCalendar,
  buildWeekProgress,
  countGlobalStreak,
  countLongestGlobalStreak,
  getDateKey,
  getHabitOptionKey,
  isHabitCompleteForDay,
} from './src/logic/progress';
import { syncHabitReminders } from './src/notifications/reminders';
import { clearPersistedState, loadPersistedState, savePersistedState } from './src/storage/persistence';
import { buildPalette } from './src/theme/palette';
import { CheckInMap, Habit, HabitTemplate, PersistedState, STATS_SECTION_IDS, StatsSectionId, TabKey } from './src/types/habit';
import { AddHabitTab } from './src/components/AddHabitTab';
import { DashboardTab } from './src/components/DashboardTab';
import { HabitsTab } from './src/components/HabitsTab';
import { ProfileTab } from './src/components/ProfileTab';
import { addWidgetUserInteractionListener, HabitTasksWidget } from './src/widgets/widgetBridge';

const TAB_SWIPE_ORDER: TabKey[] = ['dashboard', 'habits', 'add', 'progress', 'profile'];

type HabitChoiceFormItem = {
  id: string;
  name: string;
  taskType: 'check' | 'target' | 'tracker';
  targetValue: string;
  measurableUnit: string;
};

const TASK_COLOR_OPTIONS = ['#22c55e', '#6653ff', '#f97316', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6', '#facc15'];

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [checkIns, setCheckIns] = useState<CheckInMap>({});
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark' | 'amoled'>('system');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [onboarded, setOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const systemColorScheme = useColorScheme();
  const { height: screenHeight } = useWindowDimensions();

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Health');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily'>('daily');
  const [newHabitTaskType, setNewHabitTaskType] = useState<'yesNo' | 'target' | 'tracker' | 'choice' | 'measurable'>('yesNo');
  const [newHabitTargetValue, setNewHabitTargetValue] = useState('');
  const [newHabitUnit, setNewHabitUnit] = useState('');
  const [newHabitTaskColor, setNewHabitTaskColor] = useState('#22c55e');
  const [newHabitChoiceOptions, setNewHabitChoiceOptions] = useState<HabitChoiceFormItem[]>([
    { id: 'option-1', name: 'Walk 30 minutes', taskType: 'check', targetValue: '30', measurableUnit: 'min' },
    { id: 'option-2', name: 'Cycle 20 minutes', taskType: 'check', targetValue: '20', measurableUnit: 'min' },
    { id: 'option-3', name: 'Go to the gym', taskType: 'check', targetValue: '1', measurableUnit: 'session' },
  ]);
  const [newHabitRandomSuggestionEnabled, setNewHabitRandomSuggestionEnabled] = useState(true);
  const [newHabitReminderEnabled, setNewHabitReminderEnabled] = useState(true);
  const [newHabitReminder, setNewHabitReminder] = useState('07:00');
  const [newHabitRepeatDays, setNewHabitRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [habitFilter, setHabitFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitCategory, setEditHabitCategory] = useState('');
  const [editHabitTaskColor, setEditHabitTaskColor] = useState('#22c55e');
  const [editHabitReminder, setEditHabitReminder] = useState('07:00');
  const [editHabitReminderEnabled, setEditHabitReminderEnabled] = useState(true);
  const [formError, setFormError] = useState('');
  const [profileName, setProfileName] = useState('Ben');
  const [profileAvatar, setProfileAvatar] = useState('person-circle-outline');
  const [profileAvatarImageUri, setProfileAvatarImageUri] = useState('');
  const [draftProfileName, setDraftProfileName] = useState('Ben');
  const [draftProfileAvatar, setDraftProfileAvatar] = useState('person-circle-outline');
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState<string | null>(getDateKey(new Date()));
  const [groupByType, setGroupByType] = useState(false);
  const [statsOrder, setStatsOrder] = useState<StatsSectionId[]>([...STATS_SECTION_IDS]);
  const [statsReorderMode, setStatsReorderMode] = useState(false);
  const [newHabitReminderExpanded, setNewHabitReminderExpanded] = useState(true);
  const [showReminderList, setShowReminderList] = useState(true);
  const [editHabitChoiceOptions, setEditHabitChoiceOptions] = useState<HabitChoiceFormItem[]>([]);
  const [editHabitRandomSuggestionEnabled, setEditHabitRandomSuggestionEnabled] = useState(true);

  const todayKey = getDateKey(new Date());
  const todayCompletions = checkIns[todayKey] ?? {};
  const isTargetHabit = (habit: Habit) => habit.taskType === 'target' || habit.taskType === 'measurable';
  const isTrackerHabit = (habit: Habit) => habit.taskType === 'tracker';

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      const state = await loadPersistedState();
      if (cancelled) {
        return;
      }

      setHabits(state.habits);
      setCheckIns(state.checkIns);
      setThemeMode(state.themeMode);
      setOnboarded(state.onboarded);
      setProfileName(state.profileName);
      setProfileAvatar(state.profileAvatar);
      setProfileAvatarImageUri(state.profileAvatarImageUri ?? '');
      setDraftProfileName(state.profileName);
      setDraftProfileAvatar(state.profileAvatar);
      setOnboardingName(state.profileName.trim() && state.profileName !== 'Ben' ? state.profileName : '');
      setNewHabitReminderExpanded(state.newHabitReminderExpanded ?? true);
      if (Array.isArray(state.statsOrder) && state.statsOrder.length > 0) {
        const validOrder = state.statsOrder.filter((id): id is StatsSectionId =>
          (STATS_SECTION_IDS as readonly string[]).includes(id)
        );
        const missing = [...STATS_SECTION_IDS].filter((id) => !validOrder.includes(id));
        setStatsOrder([...validOrder, ...missing]);
      }
      setHydrated(true);
    };

    loadState().catch(() => {
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
      statsOrder,
      newHabitReminderExpanded,
    };

    savePersistedState(payload).catch(() => {
      // Keep UI responsive if persistence fails.
    });
  }, [habits, checkIns, themeMode, onboarded, profileName, profileAvatar, profileAvatarImageUri, statsOrder, newHabitReminderExpanded, hydrated]);

  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived), [habits]);

  const filteredHabits = useMemo(() => {
    if (habitFilter === 'all') {
      return habits;
    }
    if (habitFilter === 'archived') {
      return habits.filter((habit) => habit.archived);
    }
    return activeHabits;
  }, [habitFilter, habits, activeHabits]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (Platform.OS === 'web') {
      return;
    }

    syncHabitReminders(activeHabits).catch(() => {
      // Notification scheduling should never block app usage.
    });
  }, [activeHabits, hydrated]);

  const completedToday = useMemo(() => {
    return activeHabits.filter((habit) => isHabitCompleteForDay(habit, todayCompletions)).length;
  }, [activeHabits, todayCompletions]);

  const todayProgress = activeHabits.length === 0 ? 0 : Math.round((completedToday / activeHabits.length) * 100);
  const dayStreak = countGlobalStreak(checkIns);
  const bestStreak = countLongestGlobalStreak(checkIns);
  const weekProgress = buildWeekProgress(checkIns, activeHabits);
  const monthCalendar = buildCurrentMonthCalendar(checkIns, activeHabits);
  const dailyChoiceSuggestion = useMemo(() => {
    const eligibleHabits = activeHabits.filter(
      (habit) => habit.taskType === 'choice' && habit.randomSuggestionEnabled && (habit.choiceOptions?.length ?? 0) > 0,
    );

    if (eligibleHabits.length === 0) {
      return null;
    }

    const hashSeed = Array.from(todayKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const habitIndex = hashSeed % eligibleHabits.length;
    const habit = eligibleHabits[habitIndex];
    const options = habit.choiceOptions ?? [];
    const optionIndex = (hashSeed + habit.name.length) % options.length;
    return `${habit.name}: ${options[optionIndex]?.name ?? 'Complete it'}`;
  }, [activeHabits, todayKey]);
  const selectedCalendarProgress = useMemo(() => {
    if (!selectedCalendarDateKey) {
      return null;
    }

    const dayEntries = checkIns[selectedCalendarDateKey] ?? {};
    const completed = activeHabits.filter((habit) => isHabitCompleteForDay(habit, dayEntries)).length;

    const items = activeHabits.map((habit) => {
      const value = dayEntries[habit.id] ?? 0;
      const done = isHabitCompleteForDay(habit, dayEntries);
      const detail =
        isTargetHabit(habit)
          ? `${value}/${habit.targetValue ?? 1} ${habit.measurableUnit ?? 'units'}`
          : habit.taskType === 'tracker'
            ? `${value} ${habit.measurableUnit ?? 'units'} logged`
            : done
              ? 'Completed'
              : 'Not completed';

      return {
        id: habit.id,
        name: habit.name,
        done,
        value,
        isBinary: !isTargetHabit(habit) && habit.taskType !== 'tracker',
        detail,
      };
    });

    return {
      dateLabel: format(new Date(`${selectedCalendarDateKey}T00:00:00`), 'EEE, MMM d'),
      completion: activeHabits.length === 0 ? 0 : Math.round((completed / activeHabits.length) * 100),
      completed,
      total: activeHabits.length,
      items,
    };
  }, [selectedCalendarDateKey, checkIns, activeHabits]);
  const completionDays = Object.values(checkIns).filter((value) => Object.values(value).some(Boolean)).length;
  const archivedCount = habits.filter((habit) => habit.archived).length;
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const streakPanelHeight = Math.max(560, screenHeight - topInset - 110);

  const progressTrendData = useMemo(() => {
    return Array.from({ length: 11 }).map((_, index) => {
      const date = subDays(new Date(), (10 - index) * 3);
      const key = getDateKey(date);
      const dayEntries = checkIns[key] ?? {};
      const completed = activeHabits.filter((habit) => isHabitCompleteForDay(habit, dayEntries)).length;
      const value = activeHabits.length === 0 ? 0 : Math.round((completed / activeHabits.length) * 100);

      return {
        label: format(date, 'd'),
        value,
      };
    });
  }, [checkIns, activeHabits]);

  const habitCompletionGraph = useMemo(() => {
    const colors = ['#6d5ce8', '#7a77ff', '#4f93ff', '#8f66d9', '#f39a4c', '#ff8a52', '#57b987', '#393b7f'];

    return activeHabits.slice(0, 8).map((habit, index) => {
      const lookbackDays = 14;
      let completeCount = 0;

      for (let i = 0; i < lookbackDays; i += 1) {
        const dayKey = getDateKey(subDays(new Date(), i));
        const done = isHabitCompleteForDay(habit, checkIns[dayKey] ?? {});
        if (done) {
          completeCount += 1;
        }
      }

      return {
        id: habit.id,
        shortName: habit.name.slice(0, 8),
        value: Math.max(8, Math.round((completeCount / lookbackDays) * 100)),
        color: colors[index % colors.length],
      };
    });
  }, [activeHabits, checkIns]);

  const perHabitStats = useMemo(() => {
    return activeHabits.map((habit) => {
      const lookbackDays = 30;
      let completeCount = 0;
      let streak = 0;
      let streakRunning = true;
      let totalCompletions = 0;

      for (const dayEntries of Object.values(checkIns)) {
        if (isHabitCompleteForDay(habit, dayEntries)) {
          totalCompletions += 1;
        }
      }

      for (let i = 0; i < lookbackDays; i += 1) {
        const dayKey = getDateKey(subDays(new Date(), i));
        const done = isHabitCompleteForDay(habit, checkIns[dayKey] ?? {});
        if (done) {
          completeCount += 1;
          if (streakRunning) {
            streak += 1;
          }
        } else {
          streakRunning = false;
        }
      }

      const optionStats = (habit.choiceOptions ?? []).map((option) => {
        let optionCount = 0;
        for (const dayEntries of Object.values(checkIns)) {
          if (dayEntries[getHabitOptionKey(habit.id, option.id)]) {
            optionCount += 1;
          }
        }
        return {
          id: option.id,
          name: option.name,
          total: optionCount,
        };
      });

      const trackerValues: number[] = [];
      for (const dayEntries of Object.values(checkIns)) {
        const value = dayEntries[habit.id] ?? 0;
        if (value > 0 && (habit.taskType === 'tracker' || habit.taskType === 'target' || habit.taskType === 'measurable')) {
          trackerValues.push(value);
        }
      }

      const average = trackerValues.length > 0 ? trackerValues.reduce((sum, value) => sum + value, 0) / trackerValues.length : 0;
      const minimum = trackerValues.length > 0 ? Math.min(...trackerValues) : 0;
      const maximum = trackerValues.length > 0 ? Math.max(...trackerValues) : 0;

      return {
        id: habit.id,
        name: habit.name,
        taskType: habit.taskType,
        rate30d: Math.round((completeCount / lookbackDays) * 100),
        streak,
        totalCompletions,
        optionStats,
        average,
        minimum,
        maximum,
      };
    });
  }, [activeHabits, checkIns]);

  const categoryInsights = useMemo(() => {
    const categoryMap = new Map<string, { count: number; completed: number }>();

    for (const habit of activeHabits) {
      const current = categoryMap.get(habit.category) ?? { count: 0, completed: 0 };
      const done = isHabitCompleteForDay(habit, todayCompletions);
      categoryMap.set(habit.category, {
        count: current.count + 1,
        completed: current.completed + (done ? 1 : 0),
      });
    }

    return [...categoryMap.entries()]
      .map(([category, item]) => ({
        category,
        count: item.count,
        rate: item.count === 0 ? 0 : Math.round((item.completed / item.count) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeHabits, todayCompletions]);

  const widgetSnapshot = useMemo(() => {
    const widgetHabits = activeHabits.slice(0, 3).map((habit) => {
      const currentValue = todayCompletions[habit.id] ?? 0;
      const done = isTargetHabit(habit) ? currentValue >= (habit.targetValue ?? 1) : habit.taskType === 'tracker' ? currentValue > 0 : currentValue > 0;

      return {
        id: habit.id,
        name: habit.name,
        done,
      };
    });

    return {
      completed: completedToday,
      total: activeHabits.length,
      habits: widgetHabits,
    };
  }, [activeHabits, todayCompletions, completedToday]);

  const trendPoints = useMemo(() => {
    const chartWidth = 260;
    const chartHeight = 108;
    const stepX = progressTrendData.length > 1 ? chartWidth / (progressTrendData.length - 1) : chartWidth;

    return progressTrendData.map((point, index) => ({
      ...point,
      x: index * stepX,
      y: chartHeight - (point.value / 100) * chartHeight,
    }));
  }, [progressTrendData]);

  const trendSegments = useMemo(() => {
    return trendPoints.slice(1).map((point, index) => {
      const prev = trendPoints[index];
      const dx = point.x - prev.x;
      const dy = point.y - prev.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      return {
        key: `${prev.label}-${point.label}-${index}`,
        x: prev.x,
        y: prev.y,
        length,
        angle,
      };
    });
  }, [trendPoints]);

  const goToSwipeTab = (direction: 1 | -1) => {
    const currentTab = activeTab === 'streak' ? 'dashboard' : activeTab;
    const currentIndex = TAB_SWIPE_ORDER.indexOf(currentTab);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = Math.max(0, Math.min(TAB_SWIPE_ORDER.length - 1, currentIndex + direction));
    if (nextIndex !== currentIndex) {
      setActiveTab(TAB_SWIPE_ORDER[nextIndex]);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          if (Math.abs(gestureState.dx) < 45 || Math.abs(gestureState.dx) < Math.abs(gestureState.dy)) {
            return;
          }

          if (gestureState.dx < 0) {
            goToSwipeTab(1);
          } else {
            goToSwipeTab(-1);
          }
        },
      }),
    [activeTab],
  );

  const reminderHabits = useMemo(() => {
    return activeHabits
      .filter((habit) => habit.reminderEnabled && habit.reminderTime)
      .sort((a, b) => (a.reminderTime ?? '').localeCompare(b.reminderTime ?? ''));
  }, [activeHabits]);

  const isDarkTheme = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark' || themeMode === 'amoled';
  const isAmoled = themeMode === 'amoled';
  const palette = buildPalette(isDarkTheme, isAmoled);

  const saveProfile = () => {
    const trimmedName = draftProfileName.trim();
    const nextName = trimmedName || 'Ben';
    setProfileName(nextName);
    setProfileAvatar(draftProfileAvatar || 'person-circle-outline');
    setProfileAvatarImageUri(profileAvatarImageUri);
    setToastMessage('profile updated');
  };

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setToastMessage('');
    }, 2200);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const completeOnboarding = () => {
    const trimmedName = onboardingName.trim();
    if (!trimmedName) {
      setOnboardingError('Please enter your name to continue.');
      return;
    }

    setProfileName(trimmedName);
    setDraftProfileName(trimmedName);
    setOnboardingError('');
    setOnboarded(true);
  };

  const getChoiceOptionStatus = (habit: Habit, optionId: string, dateKey: string = todayKey) => {
    return Boolean((checkIns[dateKey] ?? {})[getHabitOptionKey(habit.id, optionId)]);
  };

  const toggleChoiceOption = (habitId: string, optionId: string, dateKey: string = todayKey) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit || habit.taskType !== 'choice') {
      return;
    }

    setCheckIns((prev) => {
      const dayMap = prev[dateKey] ?? {};
      const nextDayMap = { ...dayMap };
      const optionKey = getHabitOptionKey(habitId, optionId);
      const isActive = Boolean(nextDayMap[optionKey]);

      (habit.choiceOptions ?? []).forEach((option) => {
        delete nextDayMap[getHabitOptionKey(habitId, option.id)];
      });

      if (isActive) {
        delete nextDayMap[habitId];
      } else {
        nextDayMap[optionKey] = 1;
        nextDayMap[habitId] = 1;
      }

      return {
        ...prev,
        [dateKey]: nextDayMap,
      };
    });
  };

  const setHabitProgressForDate = (habitId: string, rawValue: number, dateKey: string = todayKey) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const rounded = Number.isFinite(rawValue) ? Math.round(rawValue) : 0;
    const normalizedValue =
      isTargetHabit(habit)
        ? Math.max(0, Math.min(rounded, habit.targetValue ?? 1))
        : habit.taskType === 'tracker'
          ? Math.max(0, rounded)
          : habit.taskType === 'choice'
            ? rounded > 0
              ? 1
              : 0
            : rounded > 0
              ? 1
              : 0;

    setCheckIns((prev) => {
      const dayMap = prev[dateKey] ?? {};
      const nextDayMap = { ...dayMap };

      if (habit.taskType === 'choice') {
        if (normalizedValue > 0) {
          nextDayMap[habitId] = 1;
        } else {
          delete nextDayMap[habitId];
          (habit.choiceOptions ?? []).forEach((option) => {
            delete nextDayMap[getHabitOptionKey(habitId, option.id)];
          });
        }
      } else if (normalizedValue > 0) {
        nextDayMap[habitId] = normalizedValue;
      } else {
        delete nextDayMap[habitId];
      }

      return {
        ...prev,
        [dateKey]: nextDayMap,
      };
    });
  };

  const toggleHabitCompletion = (habitId: string) => {
    const currentValue = todayCompletions[habitId] ?? 0;
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    if (habit.taskType === 'choice') {
      if (currentValue > 0) {
        setHabitProgressForDate(habitId, 0, todayKey);
        return;
      }

      if (habit.choiceOptions && habit.choiceOptions.length > 0) {
        toggleChoiceOption(habitId, habit.choiceOptions[0].id, todayKey);
      } else {
        setHabitProgressForDate(habitId, 1, todayKey);
      }
      return;
    }

    if (isTargetHabit(habit)) {
      const target = habit.targetValue ?? 1;
      setHabitProgressForDate(habitId, currentValue >= target ? 0 : currentValue + 1, todayKey);
      return;
    }

    if (isTrackerHabit(habit)) {
      setHabitProgressForDate(habitId, currentValue > 0 ? 0 : 1, todayKey);
      return;
    }

    setHabitProgressForDate(habitId, currentValue > 0 ? 0 : 1, todayKey);
  };

  const setHabitProgress = (habitId: string, rawValue: number) => {
    setHabitProgressForDate(habitId, rawValue, todayKey);
  };

  const setHabitProgressForSelectedDate = (habitId: string, rawValue: number) => {
    if (!selectedCalendarDateKey || isSelectedCalendarInFuture) {
      return;
    }
    setHabitProgressForDate(habitId, rawValue, selectedCalendarDateKey);
  };

  const toggleHabitCompletionForSelectedDate = (habitId: string) => {
    if (!selectedCalendarDateKey || isSelectedCalendarInFuture) {
      return;
    }

    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const currentValue = checkIns[selectedCalendarDateKey]?.[habitId] ?? 0;
    if (habit.taskType === 'choice') {
      if (currentValue > 0) {
        setHabitProgressForDate(habitId, 0, selectedCalendarDateKey);
        return;
      }

      if (habit.choiceOptions && habit.choiceOptions.length > 0) {
        toggleChoiceOption(habitId, habit.choiceOptions[0].id, selectedCalendarDateKey);
      } else {
        setHabitProgressForDate(habitId, 1, selectedCalendarDateKey);
      }
      return;
    }

    if (isTargetHabit(habit)) {
      const target = habit.targetValue ?? 1;
      setHabitProgressForDate(habitId, currentValue >= target ? 0 : currentValue + 1, selectedCalendarDateKey);
      return;
    }

    if (isTrackerHabit(habit)) {
      setHabitProgressForDate(habitId, currentValue > 0 ? 0 : 1, selectedCalendarDateKey);
      return;
    }

    setHabitProgressForDate(habitId, currentValue > 0 ? 0 : 1, selectedCalendarDateKey);
  };

  const moveSelectedCalendarDate = (delta: number) => {
    const baseDate = selectedCalendarDateKey ? new Date(`${selectedCalendarDateKey}T00:00:00`) : new Date();
    setSelectedCalendarDateKey(getDateKey(addDays(baseDate, delta)));
  };

  const selectedCalendarDate = selectedCalendarDateKey ? new Date(`${selectedCalendarDateKey}T00:00:00`) : new Date();
  const isSelectedCalendarInFuture = selectedCalendarDate.getTime() > new Date(`${todayKey}T00:00:00`).getTime();

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'ios') {
      return;
    }

    try {
      HabitTasksWidget.updateSnapshot(widgetSnapshot);
    } catch {
      // Ignore when running environments without widget native support.
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
        const habit = habits.find((item) => item.id === habitId && !item.archived);
        if (!habit) {
          return;
        }

        const currentValue = todayCompletions[habitId] ?? 0;
        if (habit.taskType === 'choice') {
          if (currentValue > 0) {
            setHabitProgress(habitId, 0);
          } else if (habit.choiceOptions && habit.choiceOptions.length > 0) {
            toggleChoiceOption(habitId, habit.choiceOptions[0].id);
          } else {
            setHabitProgress(habitId, 1);
          }
        } else if (isTargetHabit(habit)) {
          const targetValue = habit.targetValue ?? 1;
          setHabitProgress(habitId, currentValue >= targetValue ? 0 : currentValue + 1);
        } else if (isTrackerHabit(habit)) {
          setHabitProgress(habitId, currentValue > 0 ? 0 : 1);
        } else {
          setHabitProgress(habitId, currentValue > 0 ? 0 : 1);
        }

        setToastMessage(`${habit.name} updated from widget`);
      });
    } catch {
      // Ignore when running environments without widget native support.
    }

    return () => {
      subscription?.remove();
    };
  }, [hydrated, habits, todayCompletions]);

  const addHabit = () => {
    const trimmedName = newHabitName.trim();
    const reminderTime = newHabitReminder.trim();
    const parsedTarget = Number(newHabitTargetValue.trim());

    if (!trimmedName) {
      setFormError('Habit name is required.');
      return;
    }

    if (newHabitReminderEnabled && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime)) {
      setFormError('Reminder time must use HH:MM (24h).');
      return;
    }

    if (newHabitRepeatDays.length === 0) {
      setFormError('Choose at least one repeat day.');
      return;
    }

    if ((newHabitTaskType === 'target' || newHabitTaskType === 'measurable') && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      setFormError('Target habits need an amount greater than 0.');
      return;
    }

    const trimmedUnit = newHabitUnit.trim();
    if ((newHabitTaskType === 'target' || newHabitTaskType === 'measurable' || newHabitTaskType === 'tracker') && !trimmedUnit) {
      setFormError('Add a unit for your target or tracker habit.');
      return;
    }

  const choiceOptions = newHabitTaskType === 'choice'
    ? newHabitChoiceOptions
        .map((option) => ({
          ...option,
          name: option.name.trim(),
          targetValue: option.targetValue.trim(),
          measurableUnit: option.measurableUnit.trim(),
        }))
        .filter((option) => option.name)
    : [];

  if (newHabitTaskType === 'choice') {
    if (choiceOptions.length < 2) {
      setFormError('Choose at least two options for an “any of these” habit.');
      return;
    }
    for (const option of choiceOptions) {
      if ((option.taskType === 'target' || option.taskType === 'tracker') && !option.measurableUnit) {
        setFormError('Each target or tracker option needs a unit.');
        return;
      }
    }
  }

  const habitTaskType: Habit['taskType'] = newHabitTaskType === 'choice'
    ? 'choice'
    : newHabitTaskType === 'tracker'
      ? 'tracker'
      : newHabitTaskType === 'target' || newHabitTaskType === 'measurable'
        ? 'target'
        : 'yesNo';

  const habit: Habit = {
    id: `habit-${Date.now()}`,
    name: trimmedName,
    category: newHabitCategory.trim() || 'General',
    frequency: 'daily',
    taskType: habitTaskType,
    taskColor: newHabitTaskColor,
    targetValue: newHabitTaskType === 'target' || newHabitTaskType === 'tracker' || newHabitTaskType === 'measurable' ? Math.round(parsedTarget) : undefined,
    measurableUnit: newHabitTaskType === 'target' || newHabitTaskType === 'tracker' || newHabitTaskType === 'measurable' ? trimmedUnit : undefined,
    choiceOptions: newHabitTaskType === 'choice'
      ? choiceOptions.map((option, index) => ({
          id: option.id || `option-${index + 1}-${Date.now()}`,
          name: option.name,
          taskType: option.taskType,
          targetValue: option.taskType === 'target' ? Number(option.targetValue) || 1 : undefined,
          measurableUnit: option.measurableUnit || undefined,
        }))
      : undefined,
    randomSuggestionEnabled: newHabitTaskType === 'choice' ? newHabitRandomSuggestionEnabled : undefined,
    archived: false,
    reminderEnabled: newHabitReminderEnabled,
    reminderTime: newHabitReminderEnabled ? reminderTime : undefined,
    repeatDays: newHabitRepeatDays,
    createdAt: Date.now(),
  };

    setHabits((prev) => [habit, ...prev]);
    setNewHabitName('');
    setNewHabitCategory('Health');
    setNewHabitFrequency('daily');
    setNewHabitTaskType('yesNo');
    setNewHabitTargetValue('');
    setNewHabitUnit('');
    setNewHabitTaskColor('#22c55e');
    setNewHabitChoiceOptions([
      { id: 'option-1', name: 'Walk 30 minutes', taskType: 'check', targetValue: '30', measurableUnit: 'min' },
      { id: 'option-2', name: 'Cycle 20 minutes', taskType: 'check', targetValue: '20', measurableUnit: 'min' },
      { id: 'option-3', name: 'Go to the gym', taskType: 'check', targetValue: '1', measurableUnit: 'session' },
    ]);
    setNewHabitRandomSuggestionEnabled(true);
    setNewHabitReminderEnabled(true);
    setNewHabitReminder('07:00');
    setNewHabitReminderExpanded(true);
    setNewHabitRepeatDays([1, 2, 3, 4, 5]);
    setFormError('');
    setActiveTab('habits');
  };

  const applyHabitTemplate = (template: HabitTemplate) => {
    const normalizedTaskType: 'yesNo' | 'target' | 'tracker' | 'choice' =
      template.taskType === 'measurable' ? 'target' : template.taskType === 'tracker' ? 'tracker' : template.taskType === 'choice' ? 'choice' : template.taskType === 'target' ? 'target' : 'yesNo';

    setNewHabitName(template.name);
    setNewHabitCategory(template.category);
    setNewHabitFrequency('daily');
    setNewHabitTaskType(normalizedTaskType);
    setNewHabitTaskColor(template.taskColor ?? '#22c55e');
    setNewHabitTargetValue(template.targetValue ? String(template.targetValue) : '');
    setNewHabitUnit(template.measurableUnit ?? '');
    setNewHabitChoiceOptions(template.choiceOptions && template.choiceOptions.length > 0
      ? template.choiceOptions.map((option) => ({
          id: option.id || `temp-option-${Date.now()}-${Math.random()}`,
          name: option.name,
          taskType: option.taskType ?? 'check',
          targetValue: option.targetValue ? String(option.targetValue) : '1',
          measurableUnit: option.measurableUnit ?? 'units',
        }))
      : [
          { id: 'option-1', name: 'Walk 30 minutes', taskType: 'check', targetValue: '30', measurableUnit: 'min' },
          { id: 'option-2', name: 'Cycle 20 minutes', taskType: 'check', targetValue: '20', measurableUnit: 'min' },
          { id: 'option-3', name: 'Go to the gym', taskType: 'check', targetValue: '1', measurableUnit: 'session' },
        ]);
    setNewHabitRandomSuggestionEnabled(template.randomSuggestionEnabled ?? true);
    setNewHabitReminderEnabled(true);
    setNewHabitReminder('07:00');
    setNewHabitReminderExpanded(true);
    setNewHabitRepeatDays(template.repeatDays.length > 0 ? template.repeatDays : [1, 2, 3, 4, 5]);
    setFormError('');
    setActiveTab('add');
  };

  const toggleRepeatDay = (day: number) => {
    setNewHabitRepeatDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((value) => value !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
    setCheckIns((prev) => {
      const next: CheckInMap = {};
      for (const [date, dayEntries] of Object.entries(prev)) {
        const { [habitId]: _unused, ...remaining } = dayEntries;
        next[date] = remaining;
      }
      return next;
    });
  };

  const archiveHabit = (habitId: string) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, archived: true } : habit)));
    if (editingHabitId === habitId) {
      setEditingHabitId(null);
    }
  };

  const unarchiveHabit = (habitId: string) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, archived: false } : habit)));
  };

  const startEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditHabitName(habit.name);
    setEditHabitCategory(habit.category);
    setEditHabitTaskColor(habit.taskColor ?? '#22c55e');
    setEditHabitReminder(habit.reminderTime ?? '07:00');
    setEditHabitReminderEnabled(habit.reminderEnabled);
    setEditHabitChoiceOptions(
      (habit.choiceOptions && habit.choiceOptions.length > 0
        ? habit.choiceOptions
        : [
            { id: `${habit.id}-option-1`, name: 'Option 1', taskType: 'check', targetValue: '1', measurableUnit: 'units' },
            { id: `${habit.id}-option-2`, name: 'Option 2', taskType: 'check', targetValue: '1', measurableUnit: 'units' },
          ])
        .map((option) => ({
          id: option.id,
          name: option.name,
          taskType: (option.taskType ?? 'check') as HabitChoiceFormItem['taskType'],
          targetValue: option.targetValue ? String(option.targetValue) : '1',
          measurableUnit: option.measurableUnit ?? 'units',
        })),
    );
    setEditHabitRandomSuggestionEnabled(habit.randomSuggestionEnabled ?? true);
  };

  const cancelEditHabit = () => {
    setEditingHabitId(null);
    setEditHabitName('');
    setEditHabitCategory('');
    setEditHabitTaskColor('#22c55e');
    setEditHabitReminder('07:00');
    setEditHabitReminderEnabled(true);
    setEditHabitChoiceOptions([]);
    setEditHabitRandomSuggestionEnabled(true);
  };

  const saveEditedHabit = (habitId: string) => {
    const trimmedName = editHabitName.trim();
    const trimmedCategory = editHabitCategory.trim();

    if (!trimmedName) {
      return;
    }

    if (editHabitReminderEnabled && editHabitReminder && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(editHabitReminder.trim())) {
      return;
    }

    const habitToEdit = habits.find((habit) => habit.id === habitId);
    if (habitToEdit?.taskType === 'choice') {
      const validOptions = editHabitChoiceOptions.map((option) => option.name.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        return;
      }

      for (const option of editHabitChoiceOptions) {
        if ((option.taskType === 'target' || option.taskType === 'tracker') && !option.measurableUnit.trim()) {
          return;
        }
      }
    }

    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              name: trimmedName,
              category: trimmedCategory || 'General',
              taskColor: editHabitTaskColor,
              reminderEnabled: editHabitReminderEnabled,
              reminderTime: editHabitReminderEnabled ? editHabitReminder.trim() : undefined,
              choiceOptions: habit.taskType === 'choice'
                ? editHabitChoiceOptions
                    .map((option) => ({
                      id: option.id || `${habit.id}-option-${Date.now()}`,
                      name: option.name.trim(),
                      taskType: (option.taskType || 'check') as HabitChoiceFormItem['taskType'],
                      targetValue: option.taskType === 'target' ? Number(option.targetValue) || 1 : undefined,
                      measurableUnit: option.taskType === 'target' || option.taskType === 'tracker'
                        ? option.measurableUnit.trim() || undefined
                        : undefined,
                    }))
                    .filter((option) => option.name)
                : habit.choiceOptions,
              randomSuggestionEnabled: habit.taskType === 'choice' ? editHabitRandomSuggestionEnabled : habit.randomSuggestionEnabled,
            }
          : habit,
      ),
    );

    cancelEditHabit();
  };

  const muteReminder = (habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === habitId ? { ...habit, reminderMuted: !habit.reminderMuted } : habit)),
    );
  };

  const clearAllData = async () => {
    await clearPersistedState();
    await syncHabitReminders([]);
    setHabits(INITIAL_HABITS);
    setCheckIns({});
    setThemeMode('system');
    setOnboarded(false);
    setProfileName('Ben');
    setProfileAvatar('person-circle-outline');
    setDraftProfileName('Ben');
    setDraftProfileAvatar('person-circle-outline');
    setProfileAvatarImageUri('');
    setOnboardingName('');
    setOnboardingError('');
    setStatsOrder([...STATS_SECTION_IDS]);
    setNewHabitReminderExpanded(true);
    setActiveTab('dashboard');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: '#0d1324', paddingTop: topInset }]}> 
        <ExpoStatusBar style="light" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingTitle}>Preparing your habit space...</Text>
          <Text style={styles.loadingSubtitle}>Loading local data</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: '#f7f4ff', paddingTop: topInset }]}> 
        <ExpoStatusBar style="dark" />
        <LinearGradient colors={['#edf9f1', '#e3f6ea', '#ffffff']} style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadgeIcon}>
              <MaterialCommunityIcons name="check-decagram" size={28} color="#22c55e" />
            </View>
          </View>
          <Text style={styles.heroTopLabel}>Habitty</Text>
          <Text style={styles.heroTitle}>Build better habits every day.</Text>
          <Text style={styles.heroCopy}>
            Track daily progress, keep streaks alive, and improve with local-only data privacy.
          </Text>
          <TextInput
            style={styles.onboardingInput}
            placeholder="Your name"
            placeholderTextColor="#8188a9"
            value={onboardingName}
            onChangeText={(value) => {
              setOnboardingName(value);
              if (onboardingError) {
                setOnboardingError('');
              }
            }}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={completeOnboarding}
          />
          {onboardingError ? <Text style={styles.onboardingError}>{onboardingError}</Text> : null}
          <View style={styles.featureList}>
            <View style={styles.heroFeatureRow}>
              <Ionicons name="calendar-outline" size={16} color="#22c55e" />
              <Text style={styles.featureText}>Track daily habits</Text>
            </View>
            <View style={styles.heroFeatureRow}>
              <Ionicons name="bar-chart-outline" size={16} color="#22c55e" />
              <Text style={styles.featureText}>See progress and streaks</Text>
            </View>
            <View style={styles.heroFeatureRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#22c55e" />
              <Text style={styles.featureText}>Fully local and private</Text>
            </View>
          </View>
          <Pressable style={styles.heroButton} onPress={completeOnboarding}>
            <Text style={styles.heroButtonText}>Get Started</Text>
          </Pressable>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.screen}>
      <SafeAreaView style={[styles.screen, { backgroundColor: palette.bg, paddingTop: topInset }]}> 
      <ExpoStatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <LinearGradient
        colors={isDarkTheme ? ['#000000', '#000000'] : ['#eafaf0', '#dff5e7', '#f5fff9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollArea}
        nestedScrollEnabled
        {...(activeTab === 'habits' ? {} : panResponder.panHandlers)}
      >
        {activeTab === 'dashboard' ? (
          <LinearGradient
            colors={isDarkTheme ? ['#121212', '#050505'] : [palette.accent2, palette.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerCard, { borderColor: isDarkTheme ? '#2a2a2a' : palette.border }]}
          >
            <View style={styles.headerLeftCol}>
              <View style={styles.headerAvatarBadge}>
                {profileAvatarImageUri ? (
                  <Image source={{ uri: profileAvatarImageUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <Ionicons name={profileAvatar as any} size={30} color="#fff" />
                )}
              </View>
              <View>
                <Text style={styles.headerGreeting}>Hey {profileName}! 👋</Text>
                <Text style={styles.headerCaption}>Every habit counts.</Text>
              </View>
            </View>
          </LinearGradient>
        ) : null}

        {activeTab === 'dashboard' && (
          <DashboardTab
            styles={styles}
            palette={palette}
            isDarkTheme={isDarkTheme}
            todayProgress={todayProgress}
            completedToday={completedToday}
            dayStreak={dayStreak}
            activeHabits={activeHabits}
            todayCompletions={todayCompletions}
            checkIns={checkIns}
            selectedDateKey={selectedCalendarDateKey ?? todayKey}
            groupByType={groupByType}
            dailyChoiceSuggestion={dailyChoiceSuggestion}
            onSetGroupByType={setGroupByType}
            onToggleHabitCompletion={toggleHabitCompletion}
            onToggleChoiceOption={toggleChoiceOption}
            onSetHabitProgress={setHabitProgress}
            onOpenStreak={() => setActiveTab('streak')}
            onPreviousDay={() => moveSelectedCalendarDate(-1)}
            onNextDay={() => moveSelectedCalendarDate(1)}
            onToday={() => setSelectedCalendarDateKey(getDateKey(new Date()))}
          />
        )}

        {activeTab === 'streak' && (
          <View style={[styles.tabBody, { minHeight: streakPanelHeight }]}>
            <LinearGradient
              colors={isDarkTheme ? ['#16131d', '#0c0a12'] : ['#2e2663', '#1b1740']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.streakHeroCard, styles.streakHeroFull]}
            >
              <Text style={styles.streakHeroIcon}>🔥</Text>
              <Text style={styles.streakHeroValue}>{dayStreak}</Text>
              <Text style={styles.streakHeroLabel}>Day Streak</Text>
              <Text style={styles.streakHeroTitle}>Amazing! 🔥</Text>
              <Text style={styles.streakHeroCopy}>You're building something great. Keep it up!</Text>

              <View style={styles.streakSubCard}>
                <Text style={styles.streakSubLabel}>Longest Streak</Text>
                <View style={styles.streakSubValueRow}>
                  <MaterialCommunityIcons name="fire" size={14} color="#ff964f" />
                  <Text style={styles.streakSubValue}>{bestStreak} days</Text>
                </View>
                <Text style={styles.streakSubCopy}>Keep going to beat your personal best!</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {activeTab === 'habits' && (
          <HabitsTab
            styles={styles}
            palette={palette}
            isDarkTheme={isDarkTheme}
            habitFilter={habitFilter}
            onSetHabitFilter={setHabitFilter}
            filteredHabits={filteredHabits}
            onReorderHabits={setHabits}
            todayCompletions={todayCompletions}
            groupByType={groupByType}
            onSetGroupByType={setGroupByType}
            editingHabitId={editingHabitId}
            editHabitName={editHabitName}
            editHabitCategory={editHabitCategory}
            editHabitTaskColor={editHabitTaskColor}
            editHabitReminder={editHabitReminder}
            editHabitReminderEnabled={editHabitReminderEnabled}
            editHabitChoiceOptions={editHabitChoiceOptions}
            editHabitRandomSuggestionEnabled={editHabitRandomSuggestionEnabled}
            onEditHabitName={setEditHabitName}
            onEditHabitCategory={setEditHabitCategory}
            onEditHabitTaskColor={setEditHabitTaskColor}
            onEditHabitReminder={setEditHabitReminder}
            onEditHabitReminderEnabled={setEditHabitReminderEnabled}
            onSetEditHabitChoiceOptions={setEditHabitChoiceOptions}
            onSetEditHabitRandomSuggestionEnabled={setEditHabitRandomSuggestionEnabled}
            onSaveEditedHabit={saveEditedHabit}
            onCancelEditHabit={cancelEditHabit}
            onStartEditHabit={startEditHabit}
            onToggleHabitCompletion={toggleHabitCompletion}
            onToggleChoiceOption={toggleChoiceOption}
            onSetHabitProgress={setHabitProgress}
            onArchiveHabit={archiveHabit}
            onUnarchiveHabit={unarchiveHabit}
            onDeleteHabit={deleteHabit}
          />
        )}

        {activeTab === 'add' && (
          <AddHabitTab
            styles={styles}
            palette={palette}
            isDarkTheme={isDarkTheme}
            newHabitName={newHabitName}
            newHabitCategory={newHabitCategory}
            newHabitFrequency={newHabitFrequency}
            newHabitTaskType={newHabitTaskType}
            newHabitTaskColor={newHabitTaskColor}
            newHabitTargetValue={newHabitTargetValue}
            newHabitUnit={newHabitUnit}
            newHabitChoiceOptions={newHabitChoiceOptions}
            newHabitRandomSuggestionEnabled={newHabitRandomSuggestionEnabled}
            newHabitReminderEnabled={newHabitReminderEnabled}
            newHabitReminder={newHabitReminder}
            newHabitReminderExpanded={newHabitReminderExpanded}
            newHabitRepeatDays={newHabitRepeatDays}
            formError={formError}
            onSetNewHabitName={setNewHabitName}
            onSetNewHabitCategory={setNewHabitCategory}
            onSetNewHabitFrequency={setNewHabitFrequency}
            onSetNewHabitTaskType={setNewHabitTaskType}
            onSetNewHabitTaskColor={setNewHabitTaskColor}
            onSetNewHabitTargetValue={setNewHabitTargetValue}
            onSetNewHabitUnit={setNewHabitUnit}
            onSetNewHabitChoiceOptions={setNewHabitChoiceOptions}
            onSetNewHabitRandomSuggestionEnabled={setNewHabitRandomSuggestionEnabled}
            onSetNewHabitReminderEnabled={setNewHabitReminderEnabled}
            onSetNewHabitReminder={setNewHabitReminder}
            onSetNewHabitReminderExpanded={setNewHabitReminderExpanded}
            onToggleRepeatDay={toggleRepeatDay}
            onApplyTemplate={applyHabitTemplate}
            onAddHabit={addHabit}
          />
        )}

        {activeTab === 'progress' && (
          <View style={styles.tabBody}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Stats</Text>
              <Pressable
                onPress={() => setStatsReorderMode((prev) => !prev)}
                style={[
                  styles.slimCheckButton,
                  {
                    backgroundColor: statsReorderMode ? palette.accent : palette.bg,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={{ color: statsReorderMode ? '#fff' : palette.text, fontWeight: '700' }}>
                  {statsReorderMode ? 'Done' : 'Reorder'}
                </Text>
              </Pressable>
            </View>

            {statsReorderMode ? (
              <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.habitInfo, { color: palette.muted }]}>Long-press the handle to drag and reorder sections.</Text>
                <DraggableFlatList
                  data={statsOrder}
                  keyExtractor={(item) => item}
                  renderItem={({ item, drag, isActive }: RenderItemParams<StatsSectionId>) => (
                    <ScaleDecorator>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: palette.border,
                          opacity: isActive ? 0.85 : 1,
                        }}
                      >
                        <Pressable
                          onLongPress={drag}
                          delayLongPress={120}
                          style={{ paddingHorizontal: 4 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Drag to reorder ${item}`}
                        >
                          <Ionicons name="menu" size={18} color={palette.muted} />
                        </Pressable>
                        <Text style={{ color: palette.text, fontWeight: '700', flex: 1 }}>
                          {item === 'statistics' ? '📊 Statistics'
                            : item === 'trend' ? '📈 Progress Over Time'
                            : item === 'habits-graph' ? '📉 Habit Completion'
                            : item === 'per-habit' ? '🔍 Per-Habit Details'
                            : item === 'calendar' ? '🗓️ Calendar'
                            : item === 'reminders' ? '🔔 Reminders'
                            : item}
                        </Text>
                      </View>
                    </ScaleDecorator>
                  )}
                  onDragEnd={({ data }) => setStatsOrder(data)}
                  scrollEnabled={false}
                  nestedScrollEnabled={false}
                  activationDistance={8}
                />
              </View>
            ) : (
              statsOrder.map((sectionId) => {
                if (sectionId === 'statistics') {
                  return (
                    <View key="statistics" style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <Text style={[styles.sectionTitle, { color: palette.text }]}>Statistics</Text>
                      <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.statLabel, { color: palette.muted }]}>Completion</Text>
                          <Text style={[styles.statValue, { color: palette.text }]}>{todayProgress}%</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.statLabel, { color: palette.muted }]}>Best Streak</Text>
                          <Text style={[styles.statValue, { color: palette.text }]}>{bestStreak}d</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.statLabel, { color: palette.muted }]}>Total Habits</Text>
                          <Text style={[styles.statValue, { color: palette.text }]}>{activeHabits.length}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.statLabel, { color: palette.muted }]}>Archived</Text>
                          <Text style={[styles.statValue, { color: palette.text }]}>{archivedCount}</Text>
                        </View>
                      </View>
                      <Text style={[styles.habitInfo, { color: palette.muted }]}>Active Days: {completionDays}</Text>
                      {categoryInsights.length > 0 ? (
                        <View style={{ marginTop: 12, gap: 8 }}>
                          <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 15 }]}>Category Insights</Text>
                          {categoryInsights.map((item) => (
                            <View key={item.category} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <Text style={{ color: palette.text, fontWeight: '700' }}>{item.category}</Text>
                              <Text style={{ color: palette.muted }}>{item.count} habits · {item.rate}% complete</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                }
                if (sectionId === 'trend') {
                  return (
                    <View key="trend" style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <Text style={[styles.sectionTitle, { color: palette.text }]}>Progress Over Time</Text>
                      <View style={[styles.graphFrame, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                        <View style={styles.lineChartArea}>
                          {trendSegments.map((segment) => (
                            <View
                              key={segment.key}
                              style={[
                                styles.lineSegment,
                                {
                                  width: segment.length,
                                  left: segment.x,
                                  top: segment.y,
                                  backgroundColor: palette.accent,
                                  transform: [{ rotate: `${segment.angle}deg` }],
                                },
                              ]}
                            />
                          ))}
                          {trendPoints.map((point, index) => (
                            <View
                              key={`${point.label}-${index}`}
                              style={[styles.linePoint, { left: point.x - 3, top: point.y - 3, backgroundColor: palette.accent }]}
                            />
                          ))}
                        </View>
                        <View style={styles.graphAxisRow}>
                          <Text style={[styles.graphAxisText, { color: palette.muted }]}>{progressTrendData[0]?.label ?? '0'}</Text>
                          <Text style={[styles.graphAxisText, { color: palette.muted }]}>{progressTrendData[Math.floor(progressTrendData.length / 2)]?.label ?? '15'}</Text>
                          <Text style={[styles.graphAxisText, { color: palette.muted }]}>{progressTrendData[progressTrendData.length - 1]?.label ?? '30'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }
                if (sectionId === 'habits-graph') {
                  return (
                    <View key="habits-graph" style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <Text style={[styles.sectionTitle, { color: palette.text }]}>Habit Completion</Text>
                      <View style={[styles.graphFrame, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                        <View style={styles.habitBarsRow}>
                          {habitCompletionGraph.length === 0 ? (
                            <Text style={[styles.habitInfo, { color: palette.muted }]}>No active habits yet.</Text>
                          ) : (
                            habitCompletionGraph.map((bar) => (
                              <View key={bar.id} style={styles.habitBarColumn}>
                                <View style={[styles.habitBarFill, { height: `${bar.value}%`, backgroundColor: bar.color }]} />
                              </View>
                            ))
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }
                if (sectionId === 'per-habit') {
                  return (
                    <View key="per-habit" style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <Text style={[styles.sectionTitle, { color: palette.text }]}>Per-Habit Details</Text>
                      <Text style={[styles.habitInfo, { color: palette.muted }]}>30-day completion rate, current streak, and total completions.</Text>
                      {perHabitStats.length === 0 ? (
                        <Text style={[styles.habitInfo, { color: palette.muted }]}>No active habits yet.</Text>
                      ) : (
                        perHabitStats.map((stat) => (
                          <View
                            key={stat.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                              gap: 8,
                            }}
                          >
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={[styles.habitName, { color: palette.text }]} numberOfLines={1}>{stat.name}</Text>
                              <Text style={[styles.habitInfo, { color: palette.muted }]}>
                                {stat.taskType === 'target' || stat.taskType === 'measurable' ? '📏' : stat.taskType === 'tracker' ? '📊' : stat.taskType === 'choice' ? '🎯' : '✅'} {stat.totalCompletions} total · {stat.streak}d streak
                              </Text>
                              {stat.taskType === 'tracker' ? (
                                <Text style={[styles.habitInfo, { color: palette.muted }]}>
                                  Avg {stat.average ?? 0} · Min {stat.minimum ?? 0} · Max {stat.maximum ?? 0}
                                </Text>
                              ) : null}
                              {stat.taskType === 'choice' && stat.optionStats && stat.optionStats.length > 0 ? (
                                <View style={{ marginTop: 6, gap: 2 }}>
                                  {stat.optionStats.map((option) => (
                                    <Text key={option.id} style={[styles.habitInfo, { color: palette.muted }]}>
                                      • {option.name}: {option.total} times
                                    </Text>
                                  ))}
                                </View>
                              ) : null}
                            </View>
                            <View
                              style={{
                                alignItems: 'center',
                                backgroundColor: palette.bg,
                                borderRadius: 10,
                                paddingHorizontal: 8,
                                paddingVertical: 6,
                                minWidth: 52,
                              }}
                            >
                              <Text style={{ color: palette.accent, fontWeight: '800', fontSize: 16 }}>{stat.rate30d}%</Text>
                              <Text style={{ color: palette.muted, fontSize: 10, fontWeight: '600' }}>30d</Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  );
                }
                if (sectionId === 'calendar') {
                  return (
                    <View key="calendar" style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <Text style={[styles.sectionTitle, { color: palette.text }]}>Calendar</Text>
                      <Text style={[styles.habitInfo, { color: palette.muted }]}>{monthCalendar.monthLabel}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10, gap: 8 }}>
                        <Pressable onPress={() => moveSelectedCalendarDate(-1)} style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}> 
                          <Text style={{ color: palette.text, fontWeight: '700' }}>Previous day</Text>
                        </Pressable>
                        <Pressable onPress={() => setSelectedCalendarDateKey(getDateKey(new Date()))} style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}> 
                          <Text style={{ color: palette.text, fontWeight: '700' }}>Today</Text>
                        </Pressable>
                      </View>
                      <View style={styles.weekdayHeader}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                          <Text key={`${label}-${index}`} style={[styles.weekdayLabel, { color: palette.muted }]}>
                            {label}
                          </Text>
                        ))}
                      </View>
                      <View style={styles.calendarGrid}>
                        {monthCalendar.cells.map((cell) => {
                          if (cell.isEmpty) {
                            return <View key={cell.key} style={[styles.calendarCell, { opacity: 0 }]} />;
                          }
                          const selected = selectedCalendarDateKey === cell.key;
                          const cellDate = new Date(`${cell.key}T00:00:00`);
                          const isFutureCell = cellDate.getTime() > new Date(`${todayKey}T00:00:00`).getTime();
                          return (
                            <Pressable
                              key={cell.key}
                              onPress={() => {
                                if (isFutureCell) {
                                  return;
                                }
                                setSelectedCalendarDateKey(cell.key);
                              }}
                              disabled={isFutureCell}
                              style={[
                                styles.calendarCell,
                                { backgroundColor: cell.isToday ? palette.accent : palette.bg, opacity: isFutureCell ? 0.7 : 1 },
                                selected ? { borderWidth: 1, borderColor: palette.accent } : null,
                              ]}
                            >
                              <Text style={{ color: cell.isToday ? '#fff' : palette.text, fontWeight: '700', fontSize: 12 }}>
                                {cell.label}
                              </Text>
                              <View style={[styles.calendarCompletionTrack, { backgroundColor: palette.border }]}>
                                <View
                                  style={[
                                    styles.calendarCompletionFill,
                                    { width: `${cell.completion}%`, backgroundColor: cell.isToday ? '#fff' : palette.accent },
                                  ]}
                                />
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                      {selectedCalendarProgress ? (
                        <View style={[styles.calendarDetailCard, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                          <View style={styles.calendarDetailHeader}>
                            <Text style={[styles.calendarDetailDate, { color: palette.text }]}>{selectedCalendarProgress.dateLabel}</Text>
                            <Text style={[styles.reminderTime, { color: palette.accent }]}>{selectedCalendarProgress.completion}%</Text>
                          </View>
                          <Text style={[styles.calendarDetailSummary, { color: palette.muted }]}>
                            {selectedCalendarProgress.completed} of {selectedCalendarProgress.total} habits completed
                          </Text>
                          <View style={styles.calendarDetailList}>
                            {selectedCalendarProgress.items.map((item) => (
                              <View key={item.id} style={styles.calendarDetailItem}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    style={[
                                      styles.calendarDetailHabitName,
                                      { color: item.done ? palette.text : palette.muted, fontWeight: item.done ? '700' : '600' },
                                    ]}
                                  >
                                    {item.name}
                                  </Text>
                                  <Text style={{ color: item.done ? '#22c55e' : palette.muted, fontSize: 11, fontWeight: '400' }}>
                                    {item.detail}
                                  </Text>
                                </View>
                                {item.isBinary ? (
                                  <Pressable
                                    onPress={() => {
                                      if (isSelectedCalendarInFuture) {
                                        return;
                                      }
                                      toggleHabitCompletionForSelectedDate(item.id);
                                    }}
                                    disabled={isSelectedCalendarInFuture}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: item.done ? palette.accent : palette.border,
                                      backgroundColor: isSelectedCalendarInFuture ? palette.bg : item.done ? palette.accent : palette.bg,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      opacity: isSelectedCalendarInFuture ? 0.45 : 1,
                                    }}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: item.done }}
                                    accessibilityLabel={item.done ? `Mark ${item.name} incomplete` : `Mark ${item.name} complete`}
                                  >
                                    <MaterialCommunityIcons
                                      name={item.done ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
                                      size={18}
                                      color={item.done ? '#fff' : palette.muted}
                                    />
                                  </Pressable>
                                ) : (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: isSelectedCalendarInFuture ? 0.45 : 1 }}>
                                    <Pressable
                                      onPress={() => {
                                        if (isSelectedCalendarInFuture) {
                                          return;
                                        }
                                        setHabitProgressForSelectedDate(item.id, item.value - 1);
                                      }}
                                      disabled={isSelectedCalendarInFuture}
                                      style={[styles.checkPill, { borderColor: palette.border, backgroundColor: palette.bg }]}
                                    >
                                      <Text style={{ color: palette.text, fontWeight: '700' }}>-</Text>
                                    </Pressable>
                                    <TextInput
                                      value={String(item.value)}
                                      keyboardType="number-pad"
                                      editable={!isSelectedCalendarInFuture}
                                      onChangeText={(text) => {
                                        if (isSelectedCalendarInFuture) {
                                          return;
                                        }
                                        const parsed = Number(text.replace(/[^0-9]/g, ''));
                                        setHabitProgressForSelectedDate(item.id, Number.isFinite(parsed) ? parsed : 0);
                                      }}
                                      style={{
                                        width: 52,
                                        height: 30,
                                        borderWidth: 1,
                                        borderRadius: 8,
                                        borderColor: palette.border,
                                        color: palette.text,
                                        textAlign: 'center',
                                        backgroundColor: palette.bg,
                                        paddingVertical: 0,
                                        fontWeight: '700',
                                      }}
                                    />
                                    <Pressable
                                      onPress={() => {
                                        if (isSelectedCalendarInFuture) {
                                          return;
                                        }
                                        setHabitProgressForSelectedDate(item.id, item.value + 1);
                                      }}
                                      disabled={isSelectedCalendarInFuture}
                                      style={[styles.checkPill, { borderColor: palette.border, backgroundColor: palette.bg }]}
                                    >
                                      <Text style={{ color: palette.text, fontWeight: '700' }}>+</Text>
                                    </Pressable>
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.habitInfo, { color: palette.muted, marginTop: 10 }]}>Tap a date to view that day's progress.</Text>
                      )}
                    </View>
                  );
                }
                if (sectionId === 'reminders') {
                  return (
                    <View key="reminders" style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <Text style={[styles.sectionTitle, { color: palette.text }]}>Reminders</Text>
                        <Pressable onPress={() => setShowReminderList((prev) => !prev)} style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border, width: 36, paddingHorizontal: 0, alignItems: 'center' }]}> 
                          <Ionicons name={showReminderList ? 'chevron-up' : 'chevron-down'} size={18} color={palette.accent} />
                        </Pressable>
                      </View>
                      <Text style={[styles.habitInfo, { color: palette.muted }]}> {reminderHabits.length} reminder{reminderHabits.length === 1 ? '' : 's'} configured.</Text>
                      {showReminderList ? (
                        reminderHabits.length === 0 ? (
                          <Text style={[styles.habitInfo, { color: palette.muted }]}>No reminders enabled yet.</Text>
                        ) : (
                          reminderHabits.map((habit) => (
                            <View key={habit.id} style={[styles.reminderRow, { borderBottomColor: palette.border }]}> 
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={[styles.habitName, { color: habit.reminderMuted ? palette.muted : palette.text }]} numberOfLines={1}>
                                  {habit.name}
                                </Text>
                                {habit.reminderMuted ? (
                                  <Text style={{ color: palette.muted, fontSize: 11 }}>Muted</Text>
                                ) : null}
                              </View>
                              <Text style={[styles.reminderTime, { color: habit.reminderMuted ? palette.muted : palette.accent }]}> 
                                {habit.reminderTime}
                              </Text>
                              <Pressable
                                onPress={() => muteReminder(habit.id)}
                                style={{
                                  borderWidth: 1,
                                  borderColor: habit.reminderMuted ? palette.accent : palette.border,
                                  borderRadius: 8,
                                  width: 32,
                                  height: 32,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: habit.reminderMuted ? palette.accent : palette.bg,
                                  marginLeft: 8,
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={habit.reminderMuted ? `Unmute ${habit.name}` : `Mute ${habit.name}`}
                              >
                                <MaterialCommunityIcons
                                  name={habit.reminderMuted ? 'bell-off-outline' : 'bell-outline'}
                                  size={16}
                                  color={habit.reminderMuted ? '#fff' : palette.muted}
                                />
                              </Pressable>
                            </View>
                          ))
                        )
                      ) : null}
                    </View>
                  );
                }
                return null;
              })
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            styles={styles}
            palette={palette}
            isDarkTheme={isDarkTheme}
            draftName={draftProfileName}
            selectedAvatar={draftProfileAvatar}
            profileAvatarImageUri={profileAvatarImageUri}
            onChangeName={setDraftProfileName}
            onSelectAvatar={(value) => {
              setDraftProfileAvatar(value);
              setProfileAvatarImageUri('');
            }}
            onSetProfileAvatarImageUri={(value) => {
              setProfileAvatarImageUri(value);
              if (value) {
                setDraftProfileAvatar('person-circle-outline');
              }
            }}
            themeMode={themeMode}
            onSetThemeMode={setThemeMode}
            onClearAllData={clearAllData}
            onSaveProfile={saveProfile}
          />
        )}
      </ScrollView>

      {toastMessage ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <View style={[styles.tabBar, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Pressable onPress={() => setActiveTab('dashboard')} style={styles.tabButton}>
          <Ionicons name="home-outline" size={18} color={activeTab === 'dashboard' ? palette.accent : palette.muted} />
          <Text style={[styles.tabText, { color: activeTab === 'dashboard' ? palette.accent : palette.muted }]}>Home</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('habits')} style={styles.tabButton}>
          <Ionicons name="checkbox-outline" size={18} color={activeTab === 'habits' ? palette.accent : palette.muted} />
          <Text style={[styles.tabText, { color: activeTab === 'habits' ? palette.accent : palette.muted }]}>Habits</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('add')} style={styles.tabButton}>
          <Ionicons name="add-circle-outline" size={20} color={activeTab === 'add' ? palette.accent : palette.muted} />
          <Text style={[styles.tabText, { color: activeTab === 'add' ? palette.accent : palette.muted }]}>Add</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('progress')} style={styles.tabButton}>
          <Ionicons name="stats-chart-outline" size={18} color={activeTab === 'progress' ? palette.accent : palette.muted} />
          <Text style={[styles.tabText, { color: activeTab === 'progress' ? palette.accent : palette.muted }]}>Stats</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('profile')} style={styles.tabButton}>
          <Ionicons name="person-outline" size={18} color={activeTab === 'profile' ? palette.accent : palette.muted} />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? palette.accent : palette.muted }]}>Profile</Text>
        </Pressable>
      </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  loadingSubtitle: {
    color: '#b4c1ea',
    fontSize: 15,
  },
  heroCard: {
    margin: 20,
    marginTop: 36,
    padding: 24,
    borderRadius: 28,
    flex: 1,
    borderWidth: 1,
    borderColor: '#d7f0df',
  },
  heroBadgeRow: {
    marginBottom: 14,
  },
  heroBadgeIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9f4e3',
  },
  heroTopLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#3b6152',
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    color: '#18392d',
  },
  heroCopy: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
    color: '#4b6d5b',
  },
  onboardingInput: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d1ebdc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#18392d',
    backgroundColor: '#ffffff',
  },
  onboardingError: {
    marginTop: 8,
    color: '#d12d47',
    fontWeight: '700',
    fontSize: 13,
  },
  featureList: {
    marginTop: 22,
    gap: 10,
  },
  heroFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#2f4e41',
    fontSize: 15,
    fontWeight: '600',
  },
  heroButton: {
    marginTop: 'auto',
    backgroundColor: '#4a6cff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  scrollArea: {
    padding: 16,
    paddingTop: 28,
    paddingBottom: 100,
    gap: 14,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  headerCaption: {
    color: '#e5fff0',
    marginTop: 4,
    fontSize: 17,
    fontWeight: '600',
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  streakValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 19,
  },
  streakLabel: {
    color: '#ebfff2',
    fontSize: 12,
    marginTop: 2,
  },
  headerRightCol: {
    alignItems: 'center',
    gap: 8,
  },
  headerAvatarBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  tabBody: {
    gap: 14,
  },
  progressCard: {
    borderRadius: 20,
    padding: 16,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressEditAction: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progressEditText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  progressRowWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  compactProgressCard: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressRingShell: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingLabel: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  progressCopyWrap: {
    flex: 1,
    gap: 2,
  },
  progressTitle: {
    color: '#e8fff0',
    fontSize: 14,
    fontWeight: '700',
  },
  progressMainCallout: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  progressCaption: {
    color: '#dffae9',
    fontSize: 13,
  },
  streakHeroCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  streakHeroFull: {
    flex: 1,
    justifyContent: 'center',
  },
  streakHeroIcon: {
    fontSize: 42,
  },
  streakHeroValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
  },
  streakHeroLabel: {
    color: '#ebfff2',
    fontSize: 22,
    fontWeight: '700',
  },
  streakHeroTitle: {
    color: '#ffffff',
    marginTop: 8,
    fontSize: 26,
    fontWeight: '800',
  },
  streakHeroCopy: {
    color: '#d8fbe7',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  streakSubCard: {
    marginTop: 16,
    width: '100%',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 12,
    gap: 6,
  },
  streakSubLabel: {
    color: '#dffae9',
    fontSize: 12,
    fontWeight: '700',
  },
  streakSubValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakSubValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  streakSubCopy: {
    color: '#d4f7e4',
    fontSize: 13,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitStackRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  habitPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  habitAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPill: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitMeta: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  habitInfo: {
    fontSize: 13,
  },
  slimCheckButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  habitActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  deleteChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteChipText: {
    color: '#d12d47',
    fontWeight: '700',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  repeatDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  addHeroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  iconCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconCategoryChip: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarPreview: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  profileAvatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileAvatarChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatDayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#d12d47',
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  graphFrame: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  lineChartArea: {
    width: 260,
    height: 108,
    alignSelf: 'center',
    position: 'relative',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  linePoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  graphAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  graphAxisText: {
    fontSize: 11,
    fontWeight: '700',
  },
  habitBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    gap: 8,
  },
  habitBarColumn: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(124, 118, 179, 0.15)',
    overflow: 'hidden',
  },
  habitBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
  },
  progressLabel: {
    width: 30,
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weekdayLabel: {
    width: '14%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarCell: {
    width: '13%',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  calendarCompletionTrack: {
    width: 16,
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  calendarCompletionFill: {
    height: '100%',
  },
  calendarDetailCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  calendarDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarDetailDate: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  calendarDetailSummary: {
    fontSize: 12,
  },
  calendarDetailList: {
    marginTop: 4,
    gap: 6,
  },
  calendarDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarDetailHabitName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '100',
  },
  reminderRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTime: {
    fontWeight: '800',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#d12d47',
    fontWeight: '800',
  },
  tabBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toastWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 88,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 12, 12, 0.92)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  tabButton: {
    minWidth: 54,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
