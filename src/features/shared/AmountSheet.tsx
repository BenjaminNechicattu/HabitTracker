import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { spacing } from '../../design/tokens';
import { formatAmount, getStepSize, isTargetHabit } from '../../logic/progress';
import { Habit } from '../../types/habit';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Input } from '../../ui/FormField';
import { Text } from '../../ui/Text';

type Props = {
  habit: Habit | null;
  current: number;
  onClose: () => void;
  onSave: (habit: Habit, value: number) => void;
};

export function AmountSheet({ habit, current, onClose, onSave }: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (habit) {
      setText(String(current));
    }
  }, [habit, current]);

  const step = habit ? getStepSize(habit) : 1;
  const parsed = Number(text.replace(/[^0-9]/g, ''));
  const value = Number.isFinite(parsed) ? parsed : 0;
  const goal = habit && isTargetHabit(habit) ? habit.targetValue ?? 1 : undefined;

  return (
    <BottomSheet visible={!!habit} onClose={onClose} title={habit ? `Log ${habit.name}` : undefined}>
      {habit ? (
        <View style={{ gap: spacing.lg }}>
          <Text variant="subhead" color="secondary" align="center">
            {goal ? `Goal: ${formatAmount(habit, goal)}` : habit.measurableUnit ? `Unit: ${habit.measurableUnit}` : 'Enter an amount'}
          </Text>
          <Input
            value={text}
            onChangeText={(next) => setText(next.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
            accessibilityLabel="Amount"
            style={{ fontSize: 28, fontWeight: '700', textAlign: 'center' }}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[step, step * 5, step * 10].map((amount) => (
              <Chip key={amount} label={`+${amount}`} onPress={() => setText(String(value + amount))} />
            ))}
            {goal ? <Chip label="Goal" onPress={() => setText(String(goal))} /> : null}
          </View>
          <Button
            label="Save"
            onPress={() => {
              onSave(habit, value);
              onClose();
            }}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}
