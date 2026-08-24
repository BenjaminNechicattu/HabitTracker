export type TabKey = 'dashboard' | 'streak' | 'habits' | 'add' | 'progress' | 'profile';
export type ThemeColor = 'violet' | 'teal' | 'sunset' | 'rose' | 'forest' | 'gray';

export type Habit = {
  id: string;
  name: string;
  category: string;
  alternativeGroup?: string;
  randomSuggestionEnabled?: boolean;
  frequency: 'daily' | 'weekly';
  taskType: 'yesNo' | 'measurable';
  targetValue?: number;
  measurableUnit?: string;
  archived?: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  repeatDays: number[];
  createdAt: number;
};

export type CheckInMap = Record<string, Record<string, number>>;

export type PersistedState = {
  habits: Habit[];
  checkIns: CheckInMap;
  themeMode: 'system' | 'light' | 'dark';
  themeColor: ThemeColor;
  onboarded: boolean;
  profileName: string;
  profileAvatar: string;
  profileAvatarImageUri?: string;
};
