import { Button, HStack, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

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

const HabitTasksWidgetComponent = (props: HabitTasksWidgetSnapshot) => {
  'widget';

  const visibleHabits = props.habits.slice(0, 3);

  return (
    <VStack spacing={10}>
      <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle('#111827')]}>
        Today: {props.completed}/{props.total}
      </Text>

      {visibleHabits.length === 0 ? (
        <Text modifiers={[foregroundStyle('#6b7280')]}>No active habits yet.</Text>
      ) : (
        visibleHabits.map((habit) => (
          <HStack key={habit.id} spacing={8}>
            <Text modifiers={[foregroundStyle('#1f2937')]}>• {habit.name}</Text>
            <Button
              label={habit.done ? 'Undo' : 'Done'}
              target={`toggle:${habit.id}`}
              modifiers={[buttonStyle('bordered')]}
            />
          </HStack>
        ))
      )}
    </VStack>
  );
};

export const HabitTasksWidget = createWidget('HabitTasksWidget', HabitTasksWidgetComponent);
