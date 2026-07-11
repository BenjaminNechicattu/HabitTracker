import { addUserInteractionListener } from 'expo-widgets';
import {
  HabitTasksWidget,
  type HabitTasksWidgetSnapshot,
} from './HabitTasksWidget.ios';

type WidgetInteractionEvent = {
  target?: string;
};

type WidgetSubscription = {
  remove: () => void;
};

export { HabitTasksWidget };
export type { HabitTasksWidgetSnapshot };

export function addWidgetUserInteractionListener(
  listener: (event: WidgetInteractionEvent) => void,
): WidgetSubscription {
  return addUserInteractionListener((event) => {
    listener({ target: event.target });
  });
}
