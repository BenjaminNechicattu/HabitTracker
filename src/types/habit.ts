export type TabKey = 'dashboard' | 'streak' | 'habits' | 'add' | 'progress' | 'profile';

export type HabitChoiceOption = {
  id: string;
  name: string;
  taskType?: 'check' | 'target' | 'tracker';
  targetValue?: number;
  measurableUnit?: string;
};

export type HabitTaskType = 'yesNo' | 'target' | 'tracker' | 'choice';
export type LegacyHabitTaskType = HabitTaskType | 'measurable';

export type Habit = {
  id: string;
  name: string;
  category: string;
  frequency: 'daily';
  taskType: LegacyHabitTaskType;
  taskColor?: string;
  targetValue?: number;
  measurableUnit?: string;
  choiceOptions?: HabitChoiceOption[];
  randomSuggestionEnabled?: boolean;
  archived?: boolean;
  reminderEnabled: boolean;
  reminderMuted?: boolean;
  reminderTime?: string;
  repeatDays: number[];
  createdAt: number;
};

export type HabitTemplate = {
  id: string;
  name: string;
  category: string;
  frequency: 'daily';
  taskType: LegacyHabitTaskType;
  taskColor?: string;
  targetValue?: number;
  measurableUnit?: string;
  choiceOptions?: HabitChoiceOption[];
  randomSuggestionEnabled?: boolean;
  repeatDays: number[];
  featured?: boolean;
  tags: string[];
};

export type CheckInMap = Record<string, Record<string, number>>;

export const STATS_SECTION_IDS = ['statistics', 'trend', 'habits-graph', 'per-habit', 'calendar', 'reminders'] as const;
export type StatsSectionId = (typeof STATS_SECTION_IDS)[number];

export type PersistedState = {
  habits: Habit[];
  checkIns: CheckInMap;
  themeMode: 'system' | 'light' | 'dark' | 'amoled';
  onboarded: boolean;
  profileName: string;
  profileAvatar: string;
  profileAvatarImageUri?: string;
  statsOrder?: string[];
  newHabitReminderExpanded?: boolean;
};
