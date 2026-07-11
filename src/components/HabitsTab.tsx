import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { getHabitIconName } from '../constants/habitIcons';
import { Habit } from '../types/habit';

type Palette = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

type HabitsTabProps = {
  styles: any;
  palette: Palette;
  isDarkTheme: boolean;
  habitFilter: 'all' | 'active' | 'archived';
  onSetHabitFilter: (filter: 'all' | 'active' | 'archived') => void;
  filteredHabits: Habit[];
  onReorderHabits: (updater: (prev: Habit[]) => Habit[]) => void;
  todayCompletions: Record<string, number>;
  editingHabitId: string | null;
  editHabitName: string;
  editHabitCategory: string;
  editHabitReminder: string;
  onEditHabitName: (value: string) => void;
  onEditHabitCategory: (value: string) => void;
  onEditHabitReminder: (value: string) => void;
  onSaveEditedHabit: (habitId: string) => void;
  onCancelEditHabit: () => void;
  onStartEditHabit: (habit: Habit) => void;
  onToggleHabitCompletion: (habitId: string) => void;
  onSetHabitProgress: (habitId: string, value: number) => void;
  onArchiveHabit: (habitId: string) => void;
  onUnarchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
};

export function HabitsTab({
  styles,
  palette,
  isDarkTheme,
  habitFilter,
  onSetHabitFilter,
  filteredHabits,
  onReorderHabits,
  todayCompletions,
  editingHabitId,
  editHabitName,
  editHabitCategory,
  editHabitReminder,
  onEditHabitName,
  onEditHabitCategory,
  onEditHabitReminder,
  onSaveEditedHabit,
  onCancelEditHabit,
  onStartEditHabit,
  onToggleHabitCompletion,
  onSetHabitProgress,
  onArchiveHabit,
  onUnarchiveHabit,
  onDeleteHabit,
}: HabitsTabProps) {
  const renderHabitRow = (habit: Habit, drag?: () => void, isActive?: boolean) => {
    const todayValue = todayCompletions[habit.id] ?? 0;
    const checked = habit.taskType === 'measurable' ? todayValue >= (habit.targetValue ?? 1) : todayValue > 0;
    const isEditing = editingHabitId === habit.id;
    const iconName = getHabitIconName(habit.category);
    const progressLabel =
      habit.taskType === 'measurable'
        ? `Progress ${todayValue} / ${habit.targetValue ?? 1} ${habit.measurableUnit ?? 'units'}`
        : habit.reminderEnabled
          ? `Reminder ${habit.reminderTime ?? '--:--'}`
          : 'No reminder';

    return (
      <View key={habit.id} style={[styles.habitStackRow, { borderBottomColor: palette.border, opacity: isActive ? 0.9 : 1 }]}> 
        <View style={styles.habitPrimaryRow}>
          {drag ? (
            <Pressable
              onLongPress={drag}
              delayLongPress={120}
              style={{ marginRight: 10, paddingVertical: 6, paddingHorizontal: 2 }}
              accessibilityRole="button"
              accessibilityLabel={`Reorder ${habit.name}`}
            >
              <Ionicons name="menu" size={18} color={palette.muted} />
            </Pressable>
          ) : null}
          <View style={[styles.habitAvatar, { backgroundColor: isDarkTheme ? '#171717' : '#f5f1ff' }]}> 
            <Ionicons name={iconName as any} size={16} color={palette.accent} />
          </View>
          {isEditing ? (
            <View style={styles.habitMeta}>
              <TextInput
                style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                value={editHabitName}
                onChangeText={onEditHabitName}
                placeholder="Habit name"
                placeholderTextColor={palette.muted}
              />
              <TextInput
                style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                value={editHabitCategory}
                onChangeText={onEditHabitCategory}
                placeholder="Category"
                placeholderTextColor={palette.muted}
              />
              <TextInput
                style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                value={editHabitReminder}
                onChangeText={onEditHabitReminder}
                placeholder="Reminder (HH:MM)"
                placeholderTextColor={palette.muted}
              />
            </View>
          ) : (
            <View style={styles.habitMeta}>
              <Text style={[styles.habitName, { color: palette.text }]}>{habit.name}</Text>
              <Text style={[styles.habitInfo, { color: palette.muted }]}>{progressLabel}</Text>
            </View>
          )}

          {!isEditing && !habit.archived ? (
            habit.taskType === 'measurable' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <Pressable
                  onPress={() => onSetHabitProgress(habit.id, todayValue - 1)}
                  style={[styles.checkPill, { borderColor: palette.border, backgroundColor: isDarkTheme ? '#111111' : '#f3eeff' }]}
                >
                  <Text style={{ color: palette.text, fontWeight: '700' }}>-</Text>
                </Pressable>
                <TextInput
                  value={String(todayValue)}
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    const parsed = Number(text.replace(/[^0-9]/g, ''));
                    onSetHabitProgress(habit.id, Number.isFinite(parsed) ? parsed : 0);
                  }}
                  style={{
                    width: 44,
                    height: 32,
                    borderWidth: 1,
                    borderRadius: 10,
                    borderColor: palette.border,
                    color: palette.text,
                    textAlign: 'center',
                    backgroundColor: isDarkTheme ? '#111111' : '#ffffff',
                    fontWeight: '700',
                    paddingVertical: 0,
                  }}
                />
                <Pressable
                  onPress={() => onSetHabitProgress(habit.id, todayValue + 1)}
                  style={[
                    styles.checkPill,
                    {
                      borderColor: checked ? palette.accent : palette.border,
                      backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#f3eeff',
                    },
                  ]}
                >
                  <Text style={{ color: checked ? '#fff' : palette.text, fontWeight: '700' }}>+</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => onToggleHabitCompletion(habit.id)}
                style={[
                  styles.checkPill,
                  {
                    marginLeft: 'auto',
                    borderColor: checked ? palette.accent : palette.border,
                    backgroundColor: checked ? palette.accent : palette.bg,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={checked ? 'check-circle' : 'checkbox-blank-circle-outline'}
                  size={16}
                  color={checked ? '#ffffff' : palette.text}
                />
              </Pressable>
            )
          ) : null}
        </View>

        <View style={styles.habitActionsRow}>
          {isEditing ? (
            <>
              <Pressable
                onPress={() => onSaveEditedHabit(habit.id)}
                style={[styles.slimCheckButton, { backgroundColor: palette.accent, borderColor: palette.border }]}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Save</Text>
              </Pressable>
              <Pressable
                onPress={onCancelEditHabit}
                style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
              >
                <Text style={{ color: palette.text, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => onStartEditHabit(habit)}
                style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
              >
                <Text style={{ color: palette.text, fontWeight: '700' }}>Edit</Text>
              </Pressable>
              {!habit.archived ? (
                <Pressable
                  onPress={() => onArchiveHabit(habit.id)}
                  style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                >
                  <Text style={{ color: palette.text, fontWeight: '700' }}>Archive</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => onUnarchiveHabit(habit.id)}
                  style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                >
                  <Text style={{ color: palette.text, fontWeight: '700' }}>Restore</Text>
                </Pressable>
              )}
            </>
          )}
          <Pressable
            onPress={() => onDeleteHabit(habit.id)}
            style={[styles.deleteChip, { borderColor: palette.border }]}
          >
            <Text style={styles.deleteChipText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderDraggableHabitItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => (
    <ScaleDecorator>{renderHabitRow(item, drag, isActive)}</ScaleDecorator>
  );

  return (
    <View style={styles.tabBody}>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Text style={[styles.sectionTitle, { color: palette.text }]}>All Habits</Text>
        <View style={styles.frequencyRow}>
          <Pressable
            onPress={() => onSetHabitFilter('active')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: habitFilter === 'active' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: habitFilter === 'active' ? '#fff' : palette.text, fontWeight: '700' }}>Active</Text>
          </Pressable>
          <Pressable
            onPress={() => onSetHabitFilter('archived')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: habitFilter === 'archived' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: habitFilter === 'archived' ? '#fff' : palette.text, fontWeight: '700' }}>Archived</Text>
          </Pressable>
          <Pressable
            onPress={() => onSetHabitFilter('all')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: habitFilter === 'all' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: habitFilter === 'all' ? '#fff' : palette.text, fontWeight: '700' }}>All</Text>
          </Pressable>
        </View>

        {filteredHabits.length === 0 ? (
          <Text style={[styles.habitInfo, { color: palette.muted }]}>No habits in this filter.</Text>
        ) : habitFilter === 'active' ? (
          <DraggableFlatList
            data={filteredHabits}
            keyExtractor={(item) => item.id}
            renderItem={renderDraggableHabitItem}
            onDragEnd={({ data }) =>
              onReorderHabits((prev) => {
                const archived = prev.filter((habit) => habit.archived);
                return [...data, ...archived];
              })
            }
            scrollEnabled={false}
            activationDistance={8}
          />
        ) : (
          <View>{filteredHabits.map((habit) => renderHabitRow(habit))}</View>
        )}
      </View>
    </View>
  );
}
