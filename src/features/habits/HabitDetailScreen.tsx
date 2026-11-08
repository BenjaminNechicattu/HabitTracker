import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { spacing } from '../../design/tokens';
import { useTheme } from '../../design/theme';
import { describeRepeat, formatReminderTime } from '../../lib/format';
import { showToast } from '../../lib/toast';
import { formatAmount, isCountHabit, isTargetHabit, parseDateKey } from '../../logic/progress';
import { summarizeHabit } from '../../logic/stats';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { ActionSheet } from '../../ui/ActionSheet';
import { Card } from '../../ui/Card';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { HabitIcon } from '../../ui/HabitIcon';
import { HabitHeatmap } from '../../ui/Heatmap';
import { PageHeader, RoundButton, Screen } from '../../ui/Screen';
import { SectionHeader } from '../../ui/SectionHeader';
import { SettingsGroup, SettingsRow } from '../../ui/Settings';
import { StatCard } from '../../ui/StatCard';
import { Text } from '../../ui/Text';
import { useHabitInteractions } from '../shared/useHabitInteractions';

export function HabitDetailScreen({ habitId }: { habitId: string }) {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const habit = store.habits.find((item) => item.id === habitId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { renderRow, overlays } = useHabitInteractions(store.todayKey);
  const today = useMemo(() => parseDateKey(store.todayKey), [store.todayKey]);
  const summary = useMemo(() => (habit ? summarizeHabit(habit, store.checkIns, today) : null), [habit, store.checkIns, today]);

  if (!habit || !summary) {
    return (
      <Screen tabBar={false}>
        <PageHeader title="Habit not found" onBack={() => nav.pop()} />
      </Screen>
    );
  }

  const color = habit.taskColor ?? colors.accent;
  const maxOption = Math.max(1, ...summary.options.map((option) => option.total));

  return (
    <>
      <Screen tabBar={false}>
        <PageHeader title={habit.name} onBack={() => nav.pop()} trailing={<RoundButton icon="ellipsis-horizontal" label="More actions" onPress={() => setMenuOpen(true)} />} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <HabitIcon category={habit.category} color={color} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">{habit.category}</Text>
            <Text variant="subhead" color="secondary" numberOfLines={2}>
              {isTargetHabit(habit) ? `Goal ${formatAmount(habit, habit.targetValue ?? 1)} · ` : ''}
              {describeRepeat(habit.repeatDays)}
              {habit.archived ? ' · Archived' : ''}
            </Text>
          </View>
        </View>

        {!habit.archived ? <View>{renderRow(habit, { onOpen: () => undefined })}</View> : null}

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatCard label="Current streak" value={`${summary.currentStreak}`} caption={summary.currentStreak === 1 ? 'day' : 'days'} icon="flame" tint={colors.warning} />
            <StatCard label="Best streak" value={`${summary.bestStreak}`} caption={summary.bestStreak === 1 ? 'day' : 'days'} icon="trophy" tint={color} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatCard label="Completion rate" value={`${summary.rate30}%`} caption="last 30 days" icon="pie-chart" tint={colors.accent} />
            <StatCard label="Total" value={`${summary.totalCompletions}`} caption="completions" icon="checkmark-done" tint={colors.success} />
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title="History" />
          <Card>
            <HabitHeatmap habit={habit} checkIns={store.checkIns} weekStartsOn={store.weekStartsOn} today={today} weeks={14} />
          </Card>
        </View>

        {isCountHabit(habit) && summary.maximum > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Daily amounts" />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatCard label="Average" value={`${Math.round(summary.average * 10) / 10}`} caption={habit.measurableUnit} />
              <StatCard label="Lowest" value={`${summary.minimum}`} caption={habit.measurableUnit} />
              <StatCard label="Highest" value={`${summary.maximum}`} caption={habit.measurableUnit} />
            </View>
          </View>
        ) : null}

        {habit.taskType === 'choice' && summary.options.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Options chosen" />
            <Card style={{ gap: spacing.md }}>
              {summary.options.map((option) => (
                <View key={option.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="subhead" numberOfLines={1} style={{ flex: 1 }}>
                      {option.name}
                    </Text>
                    <Text variant="subhead" color="secondary" numeric>
                      {option.total}×
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.fillStrong, overflow: 'hidden' }}>
                    <View style={{ width: `${(option.total / maxOption) * 100}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <SettingsGroup title="Schedule">
          <SettingsRow title="Repeat" icon="repeat" tint="#5B52D6" value={describeRepeat(habit.repeatDays)} onPress={() => nav.push({ name: 'form', id: habit.id })} />
          <SettingsRow
            title="Reminder"
            icon={habit.reminderMuted ? 'notifications-off' : 'notifications'}
            tint="#E8503A"
            value={habit.reminderEnabled && habit.reminderTime ? formatReminderTime(habit.reminderTime) : 'Off'}
            onPress={() => nav.push({ name: 'form', id: habit.id })}
          />
          {habit.reminderEnabled ? (
            <SettingsRow title="Mute reminder" icon="volume-mute" tint="#8B93A3" switchValue={!!habit.reminderMuted} onSwitchChange={(value) => store.setReminderMuted(habit.id, value)} />
          ) : null}
        </SettingsGroup>
      </Screen>

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={habit.name}
        actions={[
          { key: 'edit', label: 'Edit', icon: 'create-outline', onPress: () => nav.push({ name: 'form', id: habit.id }) },
          { key: 'duplicate', label: 'Duplicate', icon: 'copy-outline', onPress: () => { store.duplicateHabit(habit.id); showToast('Habit duplicated', { icon: 'copy' }); } },
          habit.archived
            ? { key: 'restore', label: 'Restore', icon: 'arrow-undo-outline', onPress: () => store.unarchiveHabit(habit.id) }
            : { key: 'archive', label: 'Archive', icon: 'archive-outline', onPress: () => { store.archiveHabit(habit.id); showToast('Habit archived', { icon: 'archive' }); nav.pop(); } },
          { key: 'delete', label: 'Delete Habit', icon: 'trash-outline', destructive: true, onPress: () => setConfirmDelete(true) },
        ]}
      />
      <ConfirmDialog
        visible={confirmDelete}
        destructive
        title="Delete habit?"
        message={`“${habit.name}” and all of its history will be permanently removed.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          nav.pop();
          store.deleteHabit(habit.id);
          showToast('Habit deleted', { icon: 'trash' });
        }}
      />
      {overlays}
    </>
  );
}
