import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DAY_OPTIONS, INITIAL_HABITS } from './src/constants/habits';
import {
  buildCurrentMonthCalendar,
  buildWeekProgress,
  countGlobalStreak,
  countLongestGlobalStreak,
  getDateKey,
} from './src/logic/progress';
import { syncHabitReminders } from './src/notifications/reminders';
import { clearPersistedState, loadPersistedState, savePersistedState } from './src/storage/persistence';
import { buildPalette } from './src/theme/palette';
import { CheckInMap, Habit, PersistedState, TabKey, ThemeColor } from './src/types/habit';
import { AddHabitTab } from './src/components/AddHabitTab';
import { DashboardTab } from './src/components/DashboardTab';
import { HabitsTab } from './src/components/HabitsTab';
import { ProfileTab } from './src/components/ProfileTab';
import { addWidgetUserInteractionListener, HabitTasksWidget } from './src/widgets/widgetBridge';

const TAB_SWIPE_ORDER: TabKey[] = ['dashboard', 'habits', 'add', 'progress', 'profile'];

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [checkIns, setCheckIns] = useState<CheckInMap>({});
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [themeColor, setThemeColor] = useState<ThemeColor>('violet');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [onboarded, setOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const systemColorScheme = useColorScheme();
  const { height: screenHeight } = useWindowDimensions();

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Health');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [newHabitTaskType, setNewHabitTaskType] = useState<'yesNo' | 'measurable'>('yesNo');
  const [newHabitTargetValue, setNewHabitTargetValue] = useState('');
  const [newHabitUnit, setNewHabitUnit] = useState('');
  const [newHabitReminderEnabled, setNewHabitReminderEnabled] = useState(true);
  const [newHabitReminder, setNewHabitReminder] = useState('07:00');
  const [newHabitRepeatDays, setNewHabitRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [habitFilter, setHabitFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitCategory, setEditHabitCategory] = useState('');
  const [editHabitReminder, setEditHabitReminder] = useState('07:00');
  const [formError, setFormError] = useState('');
  const [profileName, setProfileName] = useState('Ben');
  const [profileAvatar, setProfileAvatar] = useState('person-circle-outline');
  const [draftProfileName, setDraftProfileName] = useState('Ben');
  const [draftProfileAvatar, setDraftProfileAvatar] = useState('person-circle-outline');
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const todayKey = getDateKey(new Date());
  const todayCompletions = checkIns[todayKey] ?? {};

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
      setThemeColor(state.themeColor);
      setOnboarded(state.onboarded);
      setProfileName(state.profileName);
      setProfileAvatar(state.profileAvatar);
      setDraftProfileName(state.profileName);
      setDraftProfileAvatar(state.profileAvatar);
      setOnboardingName(state.profileName.trim() && state.profileName !== 'Ben' ? state.profileName : '');
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
      themeColor,
      onboarded,
      profileName,
      profileAvatar,
    };

    savePersistedState(payload).catch(() => {
      // Keep UI responsive if persistence fails.
    });
  }, [habits, checkIns, themeMode, themeColor, onboarded, profileName, profileAvatar, hydrated]);

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
    return activeHabits.filter((habit) => {
      const value = todayCompletions[habit.id] ?? 0;
      if (habit.taskType === 'measurable') {
        return value >= (habit.targetValue ?? 1);
      }
      return value > 0;
    }).length;
  }, [activeHabits, todayCompletions]);

  const todayProgress = activeHabits.length === 0 ? 0 : Math.round((completedToday / activeHabits.length) * 100);
  const dayStreak = countGlobalStreak(checkIns);
  const bestStreak = countLongestGlobalStreak(checkIns);
  const weekProgress = buildWeekProgress(checkIns, activeHabits);
  const monthCalendar = buildCurrentMonthCalendar(checkIns, activeHabits);
  const completionDays = Object.values(checkIns).filter((value) => Object.values(value).some(Boolean)).length;
  const archivedCount = habits.filter((habit) => habit.archived).length;
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const streakPanelHeight = Math.max(560, screenHeight - topInset - 110);

  const progressTrendData = useMemo(() => {
    return Array.from({ length: 11 }).map((_, index) => {
      const date = subDays(new Date(), (10 - index) * 3);
      const key = getDateKey(date);
      const dayEntries = checkIns[key] ?? {};
      const completed = activeHabits.filter((habit) => {
        const value = dayEntries[habit.id] ?? 0;
        return habit.taskType === 'measurable' ? value >= (habit.targetValue ?? 1) : value > 0;
      }).length;
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
        const value = checkIns[dayKey]?.[habit.id] ?? 0;
        const done = habit.taskType === 'measurable' ? value >= (habit.targetValue ?? 1) : value > 0;
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

  const widgetSnapshot = useMemo(() => {
    const widgetHabits = activeHabits.slice(0, 3).map((habit) => {
      const currentValue = todayCompletions[habit.id] ?? 0;
      const done = habit.taskType === 'measurable' ? currentValue >= (habit.targetValue ?? 1) : currentValue > 0;

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

  const isDarkTheme = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const palette = buildPalette(isDarkTheme, themeColor);

  const saveProfile = () => {
    const trimmedName = draftProfileName.trim();
    const nextName = trimmedName || 'Ben';
    setProfileName(nextName);
    setProfileAvatar(draftProfileAvatar || 'person-circle-outline');
    setToastMessage(`profile updated`);
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

  const toggleHabitCompletion = (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    if (habit.taskType === 'measurable') {
      const currentValue = todayCompletions[habitId] ?? 0;
      const target = habit.targetValue ?? 1;
      setHabitProgress(habitId, currentValue >= target ? 0 : currentValue + 1);
      return;
    }

    const currentValue = todayCompletions[habitId] ?? 0;
    setHabitProgress(habitId, currentValue > 0 ? 0 : 1);
  };

  const setHabitProgress = (habitId: string, rawValue: number) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const rounded = Number.isFinite(rawValue) ? Math.round(rawValue) : 0;
    const normalizedValue =
      habit.taskType === 'measurable'
        ? Math.max(0, Math.min(rounded, habit.targetValue ?? 1))
        : rounded > 0
          ? 1
          : 0;

    setCheckIns((prev) => {
      const dayMap = prev[todayKey] ?? {};
      const nextDayMap = { ...dayMap };
      if (normalizedValue > 0) {
        nextDayMap[habitId] = normalizedValue;
      } else {
        delete nextDayMap[habitId];
      }

      return {
        ...prev,
        [todayKey]: nextDayMap,
      };
    });
  };

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
        if (habit.taskType === 'measurable') {
          const targetValue = habit.targetValue ?? 1;
          setHabitProgress(habitId, currentValue >= targetValue ? 0 : currentValue + 1);
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

    if (newHabitTaskType === 'measurable' && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      setFormError('Measurable tasks need a target amount greater than 0.');
      return;
    }

    const trimmedUnit = newHabitUnit.trim();
    if (newHabitTaskType === 'measurable' && !trimmedUnit) {
      setFormError('Add a unit for measurable tasks.');
      return;
    }

    const habit: Habit = {
      id: `habit-${Date.now()}`,
      name: trimmedName,
      category: newHabitCategory.trim() || 'General',
      frequency: newHabitFrequency,
      taskType: newHabitTaskType,
      targetValue: newHabitTaskType === 'measurable' ? Math.round(parsedTarget) : undefined,
      measurableUnit: newHabitTaskType === 'measurable' ? trimmedUnit : undefined,
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
    setNewHabitReminderEnabled(true);
    setNewHabitReminder('07:00');
    setNewHabitRepeatDays([1, 2, 3, 4, 5]);
    setFormError('');
    setActiveTab('habits');
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
    setEditHabitReminder(habit.reminderTime ?? '07:00');
  };

  const cancelEditHabit = () => {
    setEditingHabitId(null);
    setEditHabitName('');
    setEditHabitCategory('');
    setEditHabitReminder('07:00');
  };

  const saveEditedHabit = (habitId: string) => {
    const trimmedName = editHabitName.trim();
    const trimmedCategory = editHabitCategory.trim();

    if (!trimmedName) {
      return;
    }

    if (editHabitReminder && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(editHabitReminder.trim())) {
      return;
    }

    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              name: trimmedName,
              category: trimmedCategory || 'General',
              reminderTime: habit.reminderEnabled ? editHabitReminder.trim() : undefined,
            }
          : habit,
      ),
    );

    cancelEditHabit();
  };

  const clearAllData = async () => {
    await clearPersistedState();
    await syncHabitReminders([]);
    setHabits(INITIAL_HABITS);
    setCheckIns({});
    setThemeMode('system');
    setThemeColor('violet');
    setOnboarded(false);
    setProfileName('Ben');
    setProfileAvatar('person-circle-outline');
    setDraftProfileName('Ben');
    setDraftProfileAvatar('person-circle-outline');
    setOnboardingName('');
    setOnboardingError('');
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
        <LinearGradient colors={['#f1edff', '#ede8ff', '#ffffff']} style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadgeIcon}>
              <MaterialCommunityIcons name="check-decagram" size={28} color="#6653ff" />
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
              <Ionicons name="calendar-outline" size={16} color="#6653ff" />
              <Text style={styles.featureText}>Track daily habits</Text>
            </View>
            <View style={styles.heroFeatureRow}>
              <Ionicons name="bar-chart-outline" size={16} color="#6653ff" />
              <Text style={styles.featureText}>See progress and streaks</Text>
            </View>
            <View style={styles.heroFeatureRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#6653ff" />
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
        colors={isDarkTheme ? ['#000000', '#000000'] : ['#f3efff', '#ebe5ff', '#f8f6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollArea} {...panResponder.panHandlers}>
        {activeTab === 'dashboard' ? (
          <LinearGradient
            colors={isDarkTheme ? ['#121212', '#050505'] : [palette.accent2, palette.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerCard, { borderColor: isDarkTheme ? '#2a2a2a' : palette.border }]}
          >
            <View style={styles.headerLeftCol}>
              <View style={styles.headerAvatarBadge}>
                <Ionicons name={profileAvatar as any} size={30} color="#fff" />
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
            onToggleHabitCompletion={toggleHabitCompletion}
            onSetHabitProgress={setHabitProgress}
            onOpenStreak={() => setActiveTab('streak')}
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
            editingHabitId={editingHabitId}
            editHabitName={editHabitName}
            editHabitCategory={editHabitCategory}
            editHabitReminder={editHabitReminder}
            onEditHabitName={setEditHabitName}
            onEditHabitCategory={setEditHabitCategory}
            onEditHabitReminder={setEditHabitReminder}
            onSaveEditedHabit={saveEditedHabit}
            onCancelEditHabit={cancelEditHabit}
            onStartEditHabit={startEditHabit}
            onToggleHabitCompletion={toggleHabitCompletion}
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
            newHabitTargetValue={newHabitTargetValue}
            newHabitUnit={newHabitUnit}
            newHabitReminderEnabled={newHabitReminderEnabled}
            newHabitReminder={newHabitReminder}
            newHabitRepeatDays={newHabitRepeatDays}
            formError={formError}
            onSetNewHabitName={setNewHabitName}
            onSetNewHabitCategory={setNewHabitCategory}
            onSetNewHabitFrequency={setNewHabitFrequency}
            onSetNewHabitTaskType={setNewHabitTaskType}
            onSetNewHabitTargetValue={setNewHabitTargetValue}
            onSetNewHabitUnit={setNewHabitUnit}
            onSetNewHabitReminderEnabled={setNewHabitReminderEnabled}
            onSetNewHabitReminder={setNewHabitReminder}
            onToggleRepeatDay={toggleRepeatDay}
            onAddHabit={addHabit}
          />
        )}

        {activeTab === 'progress' && (
          <View style={styles.tabBody}>
            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
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
            </View>

            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Weekly Completion</Text>
              {weekProgress.map((bar, index) => (
                <View key={`${bar.label}-${index}`} style={styles.progressRow}>
                  <Text style={[styles.progressLabel, { color: palette.muted }]}>{bar.label}</Text>
                  <View style={[styles.barTrack, { backgroundColor: palette.bg }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${bar.value}%`,
                          backgroundColor: palette.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: palette.text }]}>{bar.value}%</Text>
                </View>
              ))}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
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
                      style={[
                        styles.linePoint,
                        {
                          left: point.x - 3,
                          top: point.y - 3,
                          backgroundColor: palette.accent,
                        },
                      ]}
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

            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
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

            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Calendar</Text>
              <Text style={[styles.habitInfo, { color: palette.muted }]}>{monthCalendar.monthLabel}</Text>
              <View style={styles.weekdayHeader}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                  <Text key={`${label}-${index}`} style={[styles.weekdayLabel, { color: palette.muted }]}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {monthCalendar.cells.map((cell) => (
                  <View
                    key={cell.key}
                    style={[
                      styles.calendarCell,
                      {
                        backgroundColor: cell.isToday ? palette.accent : palette.bg,
                        opacity: cell.isEmpty ? 0 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: cell.isToday ? '#fff' : palette.text,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {cell.label}
                    </Text>
                    <View style={[styles.calendarCompletionTrack, { backgroundColor: palette.border }]}> 
                      <View
                        style={[
                          styles.calendarCompletionFill,
                          {
                            width: `${cell.completion}%`,
                            backgroundColor: cell.isToday ? '#fff' : palette.accent,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Reminders</Text>
              {reminderHabits.length === 0 ? (
                <Text style={[styles.habitInfo, { color: palette.muted }]}>No reminders enabled yet.</Text>
              ) : (
                reminderHabits.map((habit) => (
                  <View key={habit.id} style={[styles.reminderRow, { borderBottomColor: palette.border }]}> 
                    <Text style={[styles.habitName, { color: palette.text }]}>{habit.name}</Text>
                    <Text style={[styles.reminderTime, { color: palette.accent }]}>{habit.reminderTime}</Text>
                  </View>
                ))
              )}
            </View>

          </View>
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            styles={styles}
            palette={palette}
            isDarkTheme={isDarkTheme}
            draftName={draftProfileName}
            selectedAvatar={draftProfileAvatar}
            onChangeName={setDraftProfileName}
            onSelectAvatar={setDraftProfileAvatar}
            themeMode={themeMode}
            onSetThemeMode={setThemeMode}
            themeColor={themeColor}
            onSetThemeColor={setThemeColor}
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
    borderColor: '#e1dbff',
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
    backgroundColor: '#ebe5ff',
  },
  heroTopLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#4c4f7a',
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    color: '#1a1e3a',
  },
  heroCopy: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
    color: '#4f5577',
  },
  onboardingInput: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d8d1ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1e3a',
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
    color: '#2f365f',
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
    color: '#e7e2ff',
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
    color: '#ece8ff',
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
    color: '#ecebff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressMainCallout: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  progressCaption: {
    color: '#e2ddff',
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
    color: '#f1edff',
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
    color: '#dad2ff',
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
    color: '#e5dcff',
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
    color: '#d7d2e9',
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
