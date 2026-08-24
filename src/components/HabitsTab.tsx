import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { getHabitIconName } from '../constants/habitIcons';
import { getHabitOptionKey } from '../logic/progress';
import { Habit } from '../types/habit';

type Palette = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

type ChoiceOptionEditor = {
  id: string;
  name: string;
  taskType: 'check' | 'target' | 'tracker';
  targetValue: string;
  measurableUnit: string;
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
  groupByType: boolean;
  onSetGroupByType: (value: boolean) => void;
  editingHabitId: string | null;
  editHabitName: string;
  editHabitCategory: string;
  editHabitTaskColor: string;
  editHabitReminder: string;
  editHabitReminderEnabled: boolean;
  editHabitChoiceOptions: ChoiceOptionEditor[];
  editHabitRandomSuggestionEnabled: boolean;
  onEditHabitName: (value: string) => void;
  onEditHabitCategory: (value: string) => void;
  onEditHabitTaskColor: (value: string) => void;
  onEditHabitReminder: (value: string) => void;
  onEditHabitReminderEnabled: (value: boolean) => void;
  onSetEditHabitChoiceOptions: (value: ChoiceOptionEditor[]) => void;
  onSetEditHabitRandomSuggestionEnabled: (value: boolean) => void;
  onSaveEditedHabit: (habitId: string) => void;
  onCancelEditHabit: () => void;
  onStartEditHabit: (habit: Habit) => void;
  onToggleHabitCompletion: (habitId: string) => void;
  onToggleChoiceOption: (habitId: string, optionId: string) => void;
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
  groupByType,
  onSetGroupByType,
  editingHabitId,
  editHabitName,
  editHabitCategory,
  editHabitTaskColor,
  editHabitReminder,
  editHabitReminderEnabled,
  editHabitChoiceOptions,
  editHabitRandomSuggestionEnabled,
  onEditHabitName,
  onEditHabitCategory,
  onEditHabitTaskColor,
  onEditHabitReminder,
  onEditHabitReminderEnabled,
  onSetEditHabitChoiceOptions,
  onSetEditHabitRandomSuggestionEnabled,
  onSaveEditedHabit,
  onCancelEditHabit,
  onStartEditHabit,
  onToggleHabitCompletion,
  onToggleChoiceOption,
  onSetHabitProgress,
  onArchiveHabit,
  onUnarchiveHabit,
  onDeleteHabit,
}: HabitsTabProps) {
  const [reorderMode, setReorderMode] = useState(false);

  useEffect(() => {
    if (habitFilter !== 'active' && reorderMode) {
      setReorderMode(false);
    }
  }, [habitFilter, reorderMode]);

  const renderHabitRow = (habit: Habit, drag?: () => void, isActive?: boolean) => {
    const todayValue = todayCompletions[habit.id] ?? 0;
    const isTargetLike = habit.taskType === 'target' || habit.taskType === 'measurable';
    const isTrackerLike = habit.taskType === 'tracker';
    const checked = isTargetLike ? todayValue >= (habit.targetValue ?? 1) : todayValue > 0;
    const isEditing = editingHabitId === habit.id;
    const iconName = getHabitIconName(habit.category);
    const progressLabel =
      isTargetLike
        ? `Progress ${todayValue} / ${habit.targetValue ?? 1} ${habit.measurableUnit ?? 'units'}`
        : isTrackerLike
          ? `Logged ${todayValue} ${habit.measurableUnit ?? 'units'}`
          : habit.taskType === 'choice'
            ? `Any of these · ${habit.choiceOptions?.length ?? 0} options`
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
            <Ionicons name={iconName as any} size={16} color={habit.taskColor ?? palette.accent} />
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
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: palette.text, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>Task color</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['#22c55e', '#6653ff', '#f97316', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6', '#facc15'].map((color) => {
                    const active = editHabitTaskColor === color;
                    return (
                      <Pressable
                        key={color}
                        onPress={() => onEditHabitTaskColor(color)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: color,
                          borderWidth: active ? 3 : 1,
                          borderColor: active ? '#fff' : palette.border,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: palette.text, fontWeight: '700', fontSize: 13 }}>Notifications</Text>
                <Pressable
                  onPress={() => onEditHabitReminderEnabled(!editHabitReminderEnabled)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: editHabitReminderEnabled ? palette.accent : palette.border,
                    backgroundColor: editHabitReminderEnabled ? palette.accent : palette.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name={editHabitReminderEnabled ? 'bell' : 'bell-off'}
                    size={18}
                    color={editHabitReminderEnabled ? '#fff' : palette.muted}
                  />
                </Pressable>
              </View>
              {editHabitReminderEnabled ? (
                <TextInput
                  style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                  value={editHabitReminder}
                  onChangeText={onEditHabitReminder}
                  placeholder="Reminder (HH:MM)"
                  placeholderTextColor={palette.muted}
                />
              ) : null}
              {habit.taskType === 'choice' ? (
                <View style={{ gap: 8, marginTop: 6 }}>
                  <Text style={{ color: palette.text, fontWeight: '700', fontSize: 13 }}>Options</Text>
                  {editHabitChoiceOptions.map((option, index) => (
                    <View key={option.id || `choice-option-${index}`} style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TextInput
                          style={[styles.input, { borderColor: palette.border, color: palette.text, flex: 1 }]}
                          value={option.name}
                          onChangeText={(text) => {
                            const next = editHabitChoiceOptions.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: text } : item,
                            );
                            onSetEditHabitChoiceOptions(next);
                          }}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor={palette.muted}
                        />
                        {editHabitChoiceOptions.length > 2 ? (
                          <Pressable
                            onPress={() => onSetEditHabitChoiceOptions(editHabitChoiceOptions.filter((_, itemIndex) => itemIndex !== index))}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isDarkTheme ? '#111111' : '#edf9f1',
                              borderWidth: 1,
                              borderColor: palette.border,
                            }}
                          >
                            <Text style={{ color: palette.text, fontWeight: '800' }}>−</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {(['check', 'target', 'tracker'] as const).map((taskType) => (
                          <Pressable
                            key={`${option.id}-${taskType}`}
                            onPress={() => {
                              const next = editHabitChoiceOptions.map((item, itemIndex) =>
                                itemIndex === index ? {
                                  ...item,
                                  taskType,
                                  measurableUnit: item.measurableUnit || 'units',
                                  targetValue: item.targetValue || '1',
                                } : item,
                              );
                              onSetEditHabitChoiceOptions(next);
                            }}
                            style={{
                              borderWidth: 1,
                              borderRadius: 999,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              backgroundColor: option.taskType === taskType ? palette.accent : palette.bg,
                              borderColor: palette.border,
                            }}
                          >
                            <Text style={{ color: option.taskType === taskType ? '#fff' : palette.text, fontWeight: '700', fontSize: 11 }}>
                              {taskType === 'check' ? 'Check' : taskType === 'target' ? 'Target' : 'Track'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {(option.taskType === 'target' || option.taskType === 'tracker') ? (
                        <View style={{ gap: 8 }}>
                          <TextInput
                            style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                            value={option.targetValue}
                            onChangeText={(text) => {
                              const next = editHabitChoiceOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, targetValue: text } : item,
                              );
                              onSetEditHabitChoiceOptions(next);
                            }}
                            placeholder={option.taskType === 'target' ? 'Target amount' : 'Track value'}
                            placeholderTextColor={palette.muted}
                            keyboardType="number-pad"
                          />
                          <TextInput
                            style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                            value={option.measurableUnit}
                            onChangeText={(text) => {
                              const next = editHabitChoiceOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, measurableUnit: text } : item,
                              );
                              onSetEditHabitChoiceOptions(next);
                            }}
                            placeholder="Unit"
                            placeholderTextColor={palette.muted}
                          />
                        </View>
                      ) : null}
                    </View>
                  ))}
                  <Pressable
                    onPress={() => onSetEditHabitChoiceOptions([...editHabitChoiceOptions, { id: `choice-option-${Date.now()}-${Math.random()}`, name: '', taskType: 'check', targetValue: '1', measurableUnit: 'units' }])}
                    style={{
                      alignSelf: 'flex-start',
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: isDarkTheme ? '#111111' : '#edf9f1',
                    }}
                  >
                    <Text style={{ color: palette.text, fontWeight: '700' }}>+ Add option</Text>
                  </Pressable>
                  <View style={styles.preferenceRow}>
                    <View>
                      <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 15 }]}>Daily random suggestion</Text>
                      <Text style={[styles.habitInfo, { color: palette.muted }]}>Choose one choice for the day</Text>
                    </View>
                    <Switch
                      value={editHabitRandomSuggestionEnabled}
                      onValueChange={onSetEditHabitRandomSuggestionEnabled}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.habitMeta}>
              <Text style={[styles.habitName, { color: palette.text }]}>{habit.name}</Text>
              <Text style={[styles.habitInfo, { color: palette.muted }]}>{progressLabel}</Text>
             {habit.taskType === 'choice' && habit.choiceOptions && habit.choiceOptions.length > 0 ? (
               <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                 {habit.choiceOptions.map((option) => {
                   const optionChecked = Boolean(todayCompletions[getHabitOptionKey(habit.id, option.id)]);
                   return (
                     <Pressable
                       key={option.id}
                       onPress={() => onToggleChoiceOption(habit.id, option.id)}
                       style={{
                         borderWidth: 1,
                         borderRadius: 999,
                         paddingHorizontal: 8,
                         paddingVertical: 5,
                         backgroundColor: optionChecked ? palette.accent : isDarkTheme ? '#111111' : '#edf9f1',
                         borderColor: optionChecked ? palette.accent : palette.border,
                       }}
                     >
                       <Text style={{ color: optionChecked ? '#fff' : palette.text, fontSize: 11, fontWeight: '700' }}>
                         {option.name}
                       </Text>
                     </Pressable>
                   );
                 })}
               </View>
             ) : null}
           </View>
          )}

          {!isEditing && !habit.archived ? (
            isTargetLike || isTrackerLike ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <Pressable
                  onPress={() => onSetHabitProgress(habit.id, todayValue - 1)}
                  style={[styles.checkPill, { borderColor: palette.border, backgroundColor: isDarkTheme ? '#111111' : '#edf9f1' }]}
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
                      backgroundColor: checked ? palette.accent : isDarkTheme ? '#111111' : '#edf9f1',
                    },
                  ]}
                >
                  <Text style={{ color: checked ? '#fff' : palette.text, fontWeight: '700' }}>+</Text>
                </Pressable>
              </View>
            ) : habit.taskType === 'choice' ? (
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

  const yesNoHabits = filteredHabits.filter((h) => h.taskType !== 'target' && h.taskType !== 'measurable' && h.taskType !== 'tracker');
  const goalAndTrackerHabits = filteredHabits.filter((h) => h.taskType === 'target' || h.taskType === 'measurable' || h.taskType === 'tracker');

  return (
    <View style={styles.tabBody}>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>All Habits</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => onSetGroupByType(!groupByType)}
              style={[
                styles.slimCheckButton,
                {
                  backgroundColor: groupByType ? palette.accent : palette.bg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ color: groupByType ? '#fff' : palette.text, fontWeight: '700' }}>Group</Text>
            </Pressable>
            {habitFilter === 'active' ? (
              <Pressable
                onPress={() => setReorderMode((prev) => !prev)}
                style={[
                  styles.slimCheckButton,
                  {
                    backgroundColor: reorderMode ? palette.accent : palette.bg,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={{ color: reorderMode ? '#fff' : palette.text, fontWeight: '700' }}>
                  {reorderMode ? 'Done' : 'Reorder'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
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

        {habitFilter === 'active' && reorderMode ? (
          <Text style={[styles.habitInfo, { color: palette.muted }]}>Long press the menu icon to drag and reorder habits.</Text>
        ) : null}

        {filteredHabits.length === 0 ? (
          <Text style={[styles.habitInfo, { color: palette.muted }]}>No habits in this filter.</Text>
        ) : habitFilter === 'active' && reorderMode ? (
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
            nestedScrollEnabled={false}
            activationDistance={8}
          />
        ) : groupByType ? (
          <View>
            {yesNoHabits.length > 0 ? (
              <View>
                <Text style={[styles.habitInfo, { color: palette.accent, fontWeight: '800', marginBottom: 4 }]}>✅ Check</Text>
                {yesNoHabits.map((habit) => renderHabitRow(habit))}
              </View>
            ) : null}
            {goalAndTrackerHabits.length > 0 ? (
              <View style={{ marginTop: yesNoHabits.length > 0 ? 10 : 0 }}>
                <Text style={[styles.habitInfo, { color: palette.accent, fontWeight: '800', marginBottom: 4 }]}>📊 Goals & Trackers</Text>
                {goalAndTrackerHabits.map((habit) => renderHabitRow(habit))}
              </View>
            ) : null}
          </View>
        ) : (
          <View>{filteredHabits.map((habit) => renderHabitRow(habit))}</View>
        )}
      </View>
    </View>
  );
}
