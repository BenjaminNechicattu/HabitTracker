import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { getStepSize, isHabitCompleteForDay } from '../../logic/progress';
import { computeHabitStreak } from '../../logic/stats';
import { Habit } from '../../types/habit';
import { showToast } from '../../lib/toast';
import { ActionSheet, SheetAction } from '../../ui/ActionSheet';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useTheme } from '../../design/theme';
import { AmountSheet } from './AmountSheet';
import { HabitListRow } from '../habits/HabitListRow';
import { HabitRow } from './HabitRow';
import { SwipeAction, SwipeRow } from './SwipeRow';

type RowOptions = {
  /** Swipe shortcuts: complete on the left, edit/delete on the right. */
  swipe?: boolean;
  dimmed?: boolean;
  onOpen?: () => void;
  /** Show Restore/Archive as the swipe-right action instead of Complete. */
  manage?: boolean;
  /** Management layout (schedule summary) instead of the completion row. */
  list?: boolean;
};

/**
 * Shared behaviour for habit rows: completion, stepping, long-press menu,
 * amount entry and delete confirmation for a given date.
 */
export function useHabitInteractions(dateKey: string) {
  const store = useStore();
  const nav = useNav();
  const colors = useTheme();
  const [menuHabit, setMenuHabit] = useState<Habit | null>(null);
  const [amountHabit, setAmountHabit] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const readOnly = dateKey > store.todayKey;

  const renderRow = useCallback(
    (habit: Habit, options: RowOptions = {}): ReactElement => {
      const entries = store.checkIns[dateKey] ?? {};
      const done = isHabitCompleteForDay(habit, entries);

      const row = options.list ? (
        <HabitListRow
          habit={habit}
          onPress={options.onOpen ?? (() => nav.push({ name: 'habit', id: habit.id }))}
          onLongPress={() => setMenuHabit(habit)}
        />
      ) : (
        <HabitRow
          habit={habit}
          entries={entries}
          streak={computeHabitStreak(habit, store.checkIns)}
          readOnly={readOnly || !!habit.archived}
          dimmed={options.dimmed}
          onOpen={options.onOpen ?? (() => nav.push({ name: 'habit', id: habit.id }))}
          onLongPress={() => setMenuHabit(habit)}
          onToggle={() => store.toggleHabit(habit.id, dateKey)}
          onStep={(direction) => store.stepProgress(habit.id, direction, getStepSize(habit), dateKey)}
          onEditAmount={() => setAmountHabit(habit)}
          onToggleOption={(optionId) => store.toggleChoiceOption(habit.id, optionId, dateKey)}
        />
      );

      if (!options.swipe) {
        return row;
      }

      const left: SwipeAction[] | undefined = options.manage
        ? [
            habit.archived
              ? { key: 'restore', label: 'Restore', icon: 'arrow-undo', color: colors.accent, onPress: () => store.unarchiveHabit(habit.id) }
              : { key: 'archive', label: 'Archive', icon: 'archive', color: '#8B93A3', onPress: () => store.archiveHabit(habit.id) },
          ]
        : readOnly
          ? undefined
          : [{ key: 'complete', label: done ? 'Undo' : 'Complete', icon: done ? 'arrow-undo' : 'checkmark', color: done ? '#8B93A3' : colors.success, onPress: () => store.toggleHabit(habit.id, dateKey) }];

      const right: SwipeAction[] = [
        { key: 'edit', label: 'Edit', icon: 'create', color: colors.accent, onPress: () => nav.push({ name: 'form', id: habit.id }) },
        { key: 'delete', label: 'Delete', icon: 'trash', color: colors.danger, onPress: () => setDeleteTarget(habit) },
      ];

      return (
        <SwipeRow left={left} right={right}>
          {row}
        </SwipeRow>
      );
    },
    [store, nav, dateKey, readOnly, colors],
  );

  const menuActions = useMemo<SheetAction[]>(() => {
    if (!menuHabit) {
      return [];
    }
    const habit = menuHabit;
    const done = isHabitCompleteForDay(habit, store.checkIns[dateKey] ?? {});
    const actions: SheetAction[] = [];
    if (!readOnly && !habit.archived) {
      actions.push({
        key: 'toggle',
        label: done ? 'Mark as Incomplete' : 'Mark Complete',
        icon: done ? 'close-circle-outline' : 'checkmark-circle-outline',
        onPress: () => store.toggleHabit(habit.id, dateKey),
      });
    }
    actions.push(
      { key: 'details', label: 'View Details', icon: 'stats-chart-outline', onPress: () => nav.push({ name: 'habit', id: habit.id }) },
      { key: 'edit', label: 'Edit', icon: 'create-outline', onPress: () => nav.push({ name: 'form', id: habit.id }) },
      { key: 'duplicate', label: 'Duplicate', icon: 'copy-outline', onPress: () => { store.duplicateHabit(habit.id); showToast('Habit duplicated', { icon: 'copy' }); } },
      habit.archived
        ? { key: 'restore', label: 'Restore', icon: 'arrow-undo-outline', onPress: () => store.unarchiveHabit(habit.id) }
        : { key: 'archive', label: 'Archive', icon: 'archive-outline', onPress: () => { store.archiveHabit(habit.id); showToast('Habit archived', { icon: 'archive' }); } },
      { key: 'delete', label: 'Delete Habit', icon: 'trash-outline', destructive: true, onPress: () => setDeleteTarget(habit) },
    );
    return actions;
  }, [menuHabit, store, dateKey, readOnly, nav]);

  const overlays = (
    <>
      <ActionSheet visible={!!menuHabit} onClose={() => setMenuHabit(null)} title={menuHabit?.name} subtitle={menuHabit?.category} actions={menuActions} />
      <AmountSheet
        habit={amountHabit}
        current={amountHabit ? (store.checkIns[dateKey] ?? {})[amountHabit.id] ?? 0 : 0}
        onClose={() => setAmountHabit(null)}
        onSave={(habit, value) => store.setProgress(habit.id, value, dateKey)}
      />
      <ConfirmDialog
        visible={!!deleteTarget}
        destructive
        title="Delete habit?"
        message={deleteTarget ? `“${deleteTarget.name}” and all of its history will be permanently removed.` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            store.deleteHabit(deleteTarget.id);
            showToast('Habit deleted', { icon: 'trash' });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );

  return { renderRow, overlays, readOnly };
}
