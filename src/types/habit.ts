export type TabKey = 'dashboard' | 'streak' | 'habits' | 'add' | 'progress' | 'profile';
export type ThemeColor = 'violet' | 'teal' | 'sunset' | 'rose' | 'forest' | 'gray' | 'blue' | 'red';

export type Habit = {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly';
  taskType: 'yesNo' | 'measurable';
  targetValue?: number;
  measurableUnit?: string;
  archived?: boolean;
  reminderEnabled: boolean;
  reminderMuted?: boolean;
  reminderTime?: string;
  repeatDays: number[];
  createdAt: number;
};

export type CheckInMap = Record<string, Record<string, number>>;

export const STATS_SECTION_IDS = ['statistics', 'weekly', 'trend', 'habits-graph', 'per-habit', 'calendar', 'reminders'] as const;
export type StatsSectionId = (typeof STATS_SECTION_IDS)[number];

export type PersistedState = {
  habits: Habit[];
  checkIns: CheckInMap;
  themeMode: 'system' | 'light' | 'dark' | 'amoled';
  themeColor: ThemeColor;
  onboarded: boolean;
  profileName: string;
  profileAvatar: string;
  profileAvatarImageUri?: string;
  statsOrder?: string[];
};
