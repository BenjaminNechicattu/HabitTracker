import type { HabitTasksWidgetSnapshot } from './HabitTasksWidget';

type WidgetInteractionEvent = {
  target?: string;
};

type WidgetSubscription = {
  remove: () => void;
};

export const HabitTasksWidget = {
  updateSnapshot: (_props: HabitTasksWidgetSnapshot) => {
    // No-op on non-iOS platforms.
  },
};

export function addWidgetUserInteractionListener(
  _listener: (event: WidgetInteractionEvent) => void,
): WidgetSubscription {
  return {
    remove: () => {
      // No-op on non-iOS platforms.
    },
  };
}
