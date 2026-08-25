import { useMemo, useState } from 'react';
import { Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DAY_OPTIONS, HABIT_LIBRARY_TEMPLATES } from '../constants/habits';
import { HABIT_ICON_OPTIONS, getHabitIconName } from '../constants/habitIcons';
import { HabitTemplate } from '../types/habit';

type Palette = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

type ChoiceOptionInput = {
  id: string;
  name: string;
};

type AddHabitTabProps = {
  styles: any;
  palette: Palette;
  isDarkTheme: boolean;
  newHabitName: string;
  newHabitCategory: string;
  newHabitFrequency: 'daily';
  newHabitTaskType: 'yesNo' | 'target' | 'tracker' | 'choice' | 'measurable';
  newHabitTaskColor: string;
  newHabitTargetValue: string;
  newHabitUnit: string;
  newHabitChoiceOptions: ChoiceOptionInput[];
  newHabitRandomSuggestionEnabled: boolean;
  newHabitReminderEnabled: boolean;
  newHabitReminder: string;
  newHabitReminderExpanded: boolean;
  newHabitRepeatDays: number[];
  formError: string;
  onSetNewHabitName: (value: string) => void;
  onSetNewHabitCategory: (value: string) => void;
  onSetNewHabitFrequency: (value: 'daily') => void;
  onSetNewHabitTaskType: (value: 'yesNo' | 'target' | 'tracker' | 'choice' | 'measurable') => void;
  onSetNewHabitTaskColor: (value: string) => void;
  onSetNewHabitTargetValue: (value: string) => void;
  onSetNewHabitUnit: (value: string) => void;
  onSetNewHabitChoiceOptions: (value: ChoiceOptionInput[]) => void;
  onSetNewHabitRandomSuggestionEnabled: (value: boolean) => void;
  onSetNewHabitReminderEnabled: (value: boolean) => void;
  onSetNewHabitReminder: (value: string) => void;
  onSetNewHabitReminderExpanded: (value: boolean) => void;
  onToggleRepeatDay: (day: number) => void;
  onApplyTemplate: (template: HabitTemplate) => void;
  onAddHabit: () => void;
};

export function AddHabitTab({
  styles,
  palette,
  isDarkTheme,
  newHabitName,
  newHabitCategory,
  newHabitFrequency,
  newHabitTaskType,
  newHabitTaskColor,
  newHabitTargetValue,
  newHabitUnit,
  newHabitChoiceOptions,
  newHabitRandomSuggestionEnabled,
  newHabitReminderEnabled,
  newHabitReminder,
  newHabitReminderExpanded,
  newHabitRepeatDays,
  formError,
  onSetNewHabitName,
  onSetNewHabitCategory,
  onSetNewHabitFrequency,
  onSetNewHabitTaskType,
  onSetNewHabitTaskColor,
  onSetNewHabitTargetValue,
  onSetNewHabitUnit,
  onSetNewHabitChoiceOptions,
  onSetNewHabitRandomSuggestionEnabled,
  onSetNewHabitReminderEnabled,
  onSetNewHabitReminder,
  onSetNewHabitReminderExpanded,
  onToggleRepeatDay,
  onApplyTemplate,
  onAddHabit,
}: AddHabitTabProps) {
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'All' | string>('All');
  const [showTemplates, setShowTemplates] = useState(false);

  const templateCategories = useMemo(() => ['All', ...new Set(HABIT_LIBRARY_TEMPLATES.map((template) => template.category))], []);

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return HABIT_LIBRARY_TEMPLATES.filter((template) => {
      const matchesCategory = templateCategory === 'All' || template.category === templateCategory;
      const matchesQuery =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [templateCategory, templateSearch]);

  const parseReminderTime = (value: string) => {
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    const now = new Date();
    if (!match) {
      now.setHours(7, 0, 0, 0);
      return now;
    }

    const next = new Date(now);
    next.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return next;
  };

  const formatReminderTime = (value: Date) => {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const reminderPickerValue = parseReminderTime(newHabitReminder);

  const onReminderTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowReminderTimePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      onSetNewHabitReminder(formatReminderTime(selectedDate));
    }
  };

  const visibleIconOptions = showAllIcons ? HABIT_ICON_OPTIONS : [];

  return (
    <View style={styles.tabBody}>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Add New Habit</Text>
        <Text style={[styles.habitInfo, { color: palette.muted }]}>Start from a ready-made template or build your own.</Text>

        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholder="Search templates"
          placeholderTextColor={palette.muted}
          value={templateSearch}
          onChangeText={setTemplateSearch}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 15 }]}>Default tasks</Text>
          <Pressable
            onPress={() => setShowTemplates((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={showTemplates ? 'Collapse default tasks' : 'Expand default tasks'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={showTemplates ? 'chevron-up' : 'chevron-down'} size={18} color={palette.accent} />
          </Pressable>
        </View>

        {showTemplates ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {templateCategories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setTemplateCategory(category)}
                  style={[
                    styles.frequencyButton,
                    {
                      backgroundColor: templateCategory === category ? palette.accent : palette.bg,
                      borderColor: palette.border,
                      minWidth: category === 'All' ? 54 : 42,
                      height: 42,
                      paddingHorizontal: category === 'All' ? 12 : 0,
                      paddingVertical: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  {category === 'All' ? (
                    <Text style={{ color: templateCategory === category ? '#fff' : palette.text, fontWeight: '800', fontSize: 11 }}>
                      all
                    </Text>
                  ) : (
                    <Ionicons
                      name={getHabitIconName(category) as any}
                      size={18}
                      color={templateCategory === category ? '#fff' : palette.text}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            <View style={{ gap: 8 }}>
              {filteredTemplates.slice(0, 6).map((template) => (
                <View
                  key={template.id}
                  style={{
                    borderWidth: 1,
                    borderColor: palette.border,
                    borderRadius: 14,
                    padding: 12,
                    backgroundColor: isDarkTheme ? '#171717' : '#f1faf4',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.text, fontWeight: '800' }}>{template.name}</Text>
                      <Text style={{ color: palette.muted, marginTop: 2 }}>
                        {template.category} · {template.taskType === 'target' || template.taskType === 'measurable' ? `${template.targetValue ?? 1} ${template.measurableUnit ?? 'units'}` : template.taskType === 'tracker' ? `${template.measurableUnit ?? 'units'} log` : template.taskType === 'choice' ? `${template.choiceOptions?.length ?? 0} options` : 'Check'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        onApplyTemplate(template);
                        setShowTemplates(false);
                      }}
                      style={{
                        borderRadius: 999,
                        backgroundColor: palette.accent,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Load</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={[styles.addHeroIconWrap, { backgroundColor: isDarkTheme ? '#171717' : '#edf9f1' }]}> 
          <Ionicons name={getHabitIconName(newHabitCategory) as any} size={34} color={newHabitTaskColor || palette.accent} />
        </View>

        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <Text style={[styles.habitInfo, { color: palette.muted, marginBottom: 8 }]}>Task color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['#22c55e', '#6653ff', '#f97316', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6', '#facc15'].map((color) => {
              const active = newHabitTaskColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => onSetNewHabitTaskColor(color)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: color,
                    borderWidth: active ? 3 : 1,
                    borderColor: active ? '#fff' : palette.border,
                    shadowColor: '#000',
                    shadowOpacity: active ? 0.18 : 0,
                    shadowRadius: active ? 4 : 0,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                />
              );
            })}
          </View>
        </View>

        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholder="Habit name"
          placeholderTextColor={palette.muted}
          value={newHabitName}
          onChangeText={onSetNewHabitName}
        />

        <Pressable
          onPress={() => setShowAllIcons((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showAllIcons ? 'Collapse icon list' : 'Expand icon list'}
          style={{
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDarkTheme ? '#171717' : '#f1faf4',
          }}
        >
          <Text style={{ color: palette.text, fontWeight: '700' }}>Daily Icons</Text>
          <Ionicons name={showAllIcons ? 'chevron-up' : 'chevron-down'} size={16} color={palette.accent} />
        </Pressable>

        {showAllIcons ? (
          <View style={[styles.iconCategoryRow, { justifyContent: 'flex-start', flexWrap: 'wrap' }]}> 
            {visibleIconOptions.map(({ category, icon }) => {
              const selected = category.toLowerCase() === newHabitCategory.trim().toLowerCase();
              return (
                <Pressable
                  key={category}
                  onPress={() => onSetNewHabitCategory(category)}
                  style={[
                    styles.iconCategoryChip,
                    {
                      backgroundColor: selected ? palette.accent : isDarkTheme ? '#171717' : '#edf9f1',
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Ionicons name={icon as any} size={16} color={selected ? '#fff' : palette.accent} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholder="Category (Health, Learning, Fitness)"
          placeholderTextColor={palette.muted}
          value={newHabitCategory}
          onChangeText={onSetNewHabitCategory}
        />
        <View>
          <Text style={[styles.habitInfo, { color: palette.muted, marginBottom: 8 }]}>Task type</Text>
          <View style={styles.frequencyRow}>
            <Pressable
              onPress={() => onSetNewHabitTaskType('yesNo')}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: newHabitTaskType === 'yesNo' ? palette.accent : palette.bg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ color: newHabitTaskType === 'yesNo' ? '#fff' : palette.text, fontWeight: '700' }}>Check</Text>
            </Pressable>
            <Pressable
              onPress={() => onSetNewHabitTaskType('target')}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: newHabitTaskType === 'target' ? palette.accent : palette.bg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ color: newHabitTaskType === 'target' ? '#fff' : palette.text, fontWeight: '700' }}>Target</Text>
            </Pressable>
            <Pressable
              onPress={() => onSetNewHabitTaskType('tracker')}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: newHabitTaskType === 'tracker' ? palette.accent : palette.bg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ color: newHabitTaskType === 'tracker' ? '#fff' : palette.text, fontWeight: '700' }}>Tracker</Text>
            </Pressable>
            <Pressable
              onPress={() => onSetNewHabitTaskType('choice')}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: newHabitTaskType === 'choice' ? palette.accent : palette.bg,
                  borderColor: palette.border,
                  alignSelf: 'center',
                  minWidth: 110,
                },
              ]}
            >
              <Text style={{ color: newHabitTaskType === 'choice' ? '#fff' : palette.text, fontWeight: '700', textAlign: 'center' }}>Any of these</Text>
            </Pressable>
          </View>
        </View>

        {(newHabitTaskType === 'target' || newHabitTaskType === 'tracker') ? (
          <>
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              placeholder={newHabitTaskType === 'tracker' ? 'Value logged today (e.g. 250)' : 'Target amount (e.g. 8)'}
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              value={newHabitTargetValue}
              onChangeText={onSetNewHabitTargetValue}
            />
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              placeholder="Unit (e.g. litres, kg, ₹, hours)"
              placeholderTextColor={palette.muted}
              value={newHabitUnit}
              onChangeText={onSetNewHabitUnit}
            />
          </>
        ) : null}

        {newHabitTaskType === 'choice' ? (
          <>
            <Text style={[styles.habitInfo, { color: palette.muted, marginBottom: 8 }]}>Options</Text>
            {newHabitChoiceOptions.map((option, index) => (
              <View key={option.id || `choice-option-${index}`} style={{ gap: 8, paddingVertical: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { borderColor: palette.border, color: palette.text, flex: 1 }]}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={palette.muted}
                    value={option.name}
                    onChangeText={(text) => {
                      const next = [...newHabitChoiceOptions];
                      next[index] = { ...option, name: text };
                      onSetNewHabitChoiceOptions(next);
                    }}
                  />
                  {newHabitChoiceOptions.length > 2 ? (
                    <Pressable
                      onPress={() => onSetNewHabitChoiceOptions(newHabitChoiceOptions.filter((_, itemIndex) => itemIndex !== index))}
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
              </View>
            ))}
            <Pressable
              onPress={() => onSetNewHabitChoiceOptions([
                ...newHabitChoiceOptions,
                { id: `choice-option-${Date.now()}-${Math.random()}`, name: '' },
              ])}
              style={{
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: palette.bg,
              }}
            >
              <Text style={{ color: palette.text, fontWeight: '700' }}>+ Add option</Text>
            </Pressable>
            <View style={styles.preferenceRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 15 }]}>Daily random suggestion</Text>
                <Text style={[styles.habitInfo, { color: palette.muted }]}>Pick one option at random each day</Text>
              </View>
              <Switch
                value={newHabitRandomSuggestionEnabled}
                onValueChange={onSetNewHabitRandomSuggestionEnabled}
              />
            </View>
          </>
        ) : null}

        <View style={styles.preferenceRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 15 }]}>Reminder</Text>
            <Text style={[styles.habitInfo, { color: palette.muted }]}>Enable daily reminder notifications</Text>
          </View>
          <Switch
            value={newHabitReminderEnabled}
            onValueChange={(value) => {
              onSetNewHabitReminderEnabled(value);
              if (value) {
                onSetNewHabitReminderExpanded(true);
              }
            }}
          />
        </View>

        <View>
          <Pressable
            onPress={() => onSetNewHabitReminderExpanded(!newHabitReminderExpanded)}
            accessibilityRole="button"
            accessibilityLabel={newHabitReminderExpanded ? 'Collapse reminder settings' : 'Expand reminder settings'}
            style={{
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: newHabitReminderEnabled ? (isDarkTheme ? '#171717' : '#f1faf4') : palette.bg,
              opacity: newHabitReminderEnabled ? 1 : 0.65,
            }}
          >
            <Text style={{ color: palette.text, fontWeight: '700' }}>{newHabitReminderEnabled ? `Reminder ${newHabitReminder}` : 'Reminders off'}</Text>
            <Ionicons name={newHabitReminderExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={palette.accent} />
          </Pressable>

          {newHabitReminderEnabled && newHabitReminderExpanded ? (
            <View style={{ marginTop: 8, gap: 8 }}>
              <Text style={[styles.habitInfo, { color: palette.muted }]}>Pick the time and repeat days.</Text>
              <Pressable
                onPress={() => {
                  if (!newHabitReminderEnabled) {
                    return;
                  }
                  setShowReminderTimePicker((prev) => !prev);
                }}
                accessibilityRole="button"
                accessibilityLabel="Choose reminder time"
                style={[
                  styles.input,
                  {
                    borderColor: palette.border,
                    backgroundColor: newHabitReminderEnabled ? (isDarkTheme ? '#171717' : '#f1faf4') : palette.bg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: newHabitReminderEnabled ? 1 : 0.6,
                  },
                ]}
              >
                <Text style={{ color: palette.text, fontWeight: '700' }}>{newHabitReminder}</Text>
                <Ionicons name="time-outline" size={18} color={palette.accent} />
              </Pressable>
              {newHabitReminderEnabled && showReminderTimePicker ? (
                <View style={{ marginTop: 4 }}>
                  <DateTimePicker value={reminderPickerValue} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour onChange={onReminderTimeChange} />
                </View>
              ) : null}

              <View style={styles.repeatDaysRow}>
                {DAY_OPTIONS.map((day, index) => {
                  const isSelected = newHabitRepeatDays.includes(day.value);
                  return (
                    <Pressable
                      key={`${day.value}-${index}`}
                      onPress={() => onToggleRepeatDay(day.value)}
                      style={[
                        styles.repeatDayButton,
                        {
                          backgroundColor: isSelected ? palette.accent : palette.bg,
                          borderColor: palette.border,
                        },
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#fff' : palette.text, fontWeight: '700' }}>{day.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Pressable style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={onAddHabit}>
          <Text style={styles.primaryButtonText}>Save Habit</Text>
        </Pressable>
      </View>
    </View>
  );
}
