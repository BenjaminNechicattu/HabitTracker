export type HabitIconOption = {
  category: string;
  icon: string;
  keywords: string[];
};

export const HABIT_ICON_OPTIONS: HabitIconOption[] = [
  { category: 'Health', icon: 'fitness-outline', keywords: ['health', 'wellness'] },
  { category: 'Fitness', icon: 'barbell-outline', keywords: ['fitness', 'fit', 'workout', 'gym', 'exercise'] },
  { category: 'Learning', icon: 'book-outline', keywords: ['learning', 'learn', 'study'] },
  { category: 'Mindfulness', icon: 'leaf-outline', keywords: ['mindfulness', 'mindful', 'meditation', 'mind'] },
  { category: 'Hydration', icon: 'water-outline', keywords: ['hydration', 'water', 'drink'] },
  { category: 'Sleep', icon: 'moon-outline', keywords: ['sleep', 'rest'] },
  { category: 'Nutrition', icon: 'nutrition-outline', keywords: ['nutrition', 'food', 'diet', 'meal'] },
  { category: 'Running', icon: 'walk-outline', keywords: ['running', 'run', 'walk', 'cardio'] },
  { category: 'Stretching', icon: 'body-outline', keywords: ['stretching', 'stretch', 'mobility', 'yoga'] },
  { category: 'Reading', icon: 'library-outline', keywords: ['reading', 'read', 'books'] },
  { category: 'Journaling', icon: 'create-outline', keywords: ['journaling', 'journal', 'writing'] },
  { category: 'Planning', icon: 'calendar-outline', keywords: ['planning', 'plan', 'schedule'] },
  { category: 'Focus', icon: 'timer-outline', keywords: ['focus', 'deep work', 'timer'] },
  { category: 'Work', icon: 'briefcase-outline', keywords: ['work', 'career', 'office'] },
  { category: 'Home', icon: 'home-outline', keywords: ['home', 'house', 'chores'] },
  { category: 'Nature', icon: 'flower-outline', keywords: ['nature', 'outdoor', 'garden'] },
];

export function getHabitIconName(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (!normalized) {
    return 'water-outline';
  }

  const byCategory = HABIT_ICON_OPTIONS.find((option) => option.category.toLowerCase() === normalized);
  if (byCategory) {
    return byCategory.icon;
  }

  const byKeyword = HABIT_ICON_OPTIONS.find((option) => option.keywords.some((keyword) => normalized.includes(keyword)));
  return byKeyword?.icon ?? 'water-outline';
}
