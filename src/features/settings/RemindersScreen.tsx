import { useState } from 'react';
import { Platform, Switch, View } from 'react-native';
import { useTheme } from '../../design/theme';
import { cardShadow, spacing } from '../../design/tokens';
import { haptics } from '../../lib/haptics';
import { describeRepeat, formatReminderTime } from '../../lib/format';
import { showToast } from '../../lib/toast';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { ActionSheet } from '../../ui/ActionSheet';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { HabitIcon } from '../../ui/HabitIcon';
import { Icon } from '../../ui/Icon';
import { PressableScale } from '../../ui/PressableScale';
import { PageHeader, Screen } from '../../ui/Screen';
import { SectionHeader } from '../../ui/SectionHeader';
import { SettingsGroup, SettingsRow, WEB_SWITCH_PROPS } from '../../ui/Settings';
import { Text } from '../../ui/Text';
import { Habit } from '../../types/habit';

export function RemindersScreen() {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const [menuHabit, setMenuHabit] = useState<Habit | null>(null);

  const withReminder = store.activeHabits
    .filter((habit) => habit.reminderEnabled && habit.reminderTime)
    .sort((a, b) => (a.reminderTime ?? '').localeCompare(b.reminderTime ?? ''));
  const without = store.activeHabits.filter((habit) => !habit.reminderEnabled || !habit.reminderTime);

  return (
    <>
      <Screen tabBar={false}>
        <PageHeader title="Reminders" onBack={() => nav.pop()} />

        {Platform.OS === 'web' ? (
          <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Icon name="information-circle" size={22} color={colors.accent} />
            <Text variant="subhead" color="secondary" style={{ flex: 1 }}>
              Notifications are delivered on iOS and Android. You can still set reminder times here.
            </Text>
          </Card>
        ) : null}

        {store.activeHabits.length === 0 ? (
          <Card>
            <EmptyState icon="notifications-outline" title="No reminders" message="Create a habit to schedule a gentle nudge." actionLabel="Create a Habit" onAction={() => nav.push({ name: 'form' })} />
          </Card>
        ) : (
          <>
            {withReminder.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <SectionHeader title="Scheduled" />
                <View style={{ backgroundColor: colors.card, borderRadius: 22, overflow: 'hidden', boxShadow: cardShadow(colors) }}>
                  {withReminder.map((habit, index) => (
                    <View key={habit.id}>
                      {index > 0 ? <View style={{ height: 1, marginLeft: 72, backgroundColor: colors.separator }} /> : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: spacing.lg }}>
                        <PressableScale
                          scaleTo={0.99}
                          onPress={() => nav.push({ name: 'form', id: habit.id })}
                          onLongPress={() => setMenuHabit(habit)}
                          accessibilityRole="button"
                          accessibilityLabel={`${habit.name}, ${describeRepeat(habit.repeatDays)} at ${formatReminderTime(habit.reminderTime)}${habit.reminderMuted ? ', muted' : ''}. Tap to edit, long press for more.`}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, minHeight: 68 }}
                        >
                          <HabitIcon category={habit.category} color={habit.taskColor ?? colors.accent} size={44} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text variant="body" numberOfLines={1} weight="600">
                              {habit.name}
                            </Text>
                            <Text variant="footnote" color="secondary" numberOfLines={1}>
                              {describeRepeat(habit.repeatDays)} · {formatReminderTime(habit.reminderTime)}
                            </Text>
                          </View>
                          {habit.reminderMuted ? <Icon name="notifications-off-outline" size={18} color={colors.textTertiary} /> : null}
                        </PressableScale>
                        <Switch
                          value={!habit.reminderMuted}
                          onValueChange={(value) => {
                            haptics.tap();
                            store.setReminderMuted(habit.id, !value);
                          }}
                          trackColor={{ true: colors.success, false: colors.fillStrong }}
                          thumbColor="#FFFFFF"
                          {...WEB_SWITCH_PROPS}
                          accessibilityLabel={`${habit.name} reminder`}
                        />
                      </View>
                    </View>
                  ))}
                </View>
                <Text variant="footnote" color="tertiary" style={{ paddingHorizontal: spacing.md }}>
                  Muted reminders keep their time but won’t send notifications.
                </Text>
              </View>
            ) : null}

            {without.length > 0 ? (
              <SettingsGroup title="No reminder">
                {without.map((habit) => (
                  <SettingsRow key={habit.id} title={habit.name} subtitle="Tap to add a reminder" onPress={() => nav.push({ name: 'form', id: habit.id })} trailing={<HabitIcon category={habit.category} color={habit.taskColor ?? colors.accent} size={32} />} />
                ))}
              </SettingsGroup>
            ) : null}
          </>
        )}
      </Screen>

      <ActionSheet
        visible={!!menuHabit}
        onClose={() => setMenuHabit(null)}
        title={menuHabit?.name}
        actions={
          menuHabit
            ? [
                { key: 'edit', label: 'Edit Reminder', icon: 'create-outline', onPress: () => nav.push({ name: 'form', id: menuHabit.id }) },
                { key: 'remove', label: 'Delete Reminder', icon: 'trash-outline', destructive: true, onPress: () => { store.removeReminder(menuHabit.id); showToast('Reminder removed', { icon: 'notifications-off' }); } },
              ]
            : []
        }
      />
    </>
  );
}
