export type HabitTasksWidgetItem = {
  id: string;
  name: string;
  done: boolean;
};

export type HabitTasksWidgetSnapshot = {
  completed: number;
  total: number;
  habits: HabitTasksWidgetItem[];
};

export const HabitTasksWidget = {
  updateSnapshot: (_props: HabitTasksWidgetSnapshot) => {
    // No-op on non-iOS platforms.
  },
};
