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

type AddHabitTabProps = {
  styles: any;
  palette: Palette;
  isDarkTheme: boolean;
  newHabitName: string;
  newHabitCategory: string;
  newHabitFrequency: 'daily' | 'weekly';
  newHabitTaskType: 'yesNo' | 'measurable';
  newHabitTargetValue: string;
  newHabitUnit: string;
  newHabitReminderEnabled: boolean;
  newHabitReminder: string;
  newHabitReminderExpanded: boolean;
  newHabitRepeatDays: number[];
  formError: string;
  onSetNewHabitName: (value: string) => void;
  onSetNewHabitCategory: (value: string) => void;
  onSetNewHabitFrequency: (value: 'daily' | 'weekly') => void;
  onSetNewHabitTaskType: (value: 'yesNo' | 'measurable') => void;
  onSetNewHabitTargetValue: (value: string) => void;
  onSetNewHabitUnit: (value: string) => void;
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
  newHabitTargetValue,
  newHabitUnit,
  newHabitReminderEnabled,
  newHabitReminder,
  newHabitReminderExpanded,
  newHabitRepeatDays,
  formError,
  onSetNewHabitName,
  onSetNewHabitCategory,
  onSetNewHabitFrequency,
  onSetNewHabitTaskType,
  onSetNewHabitTargetValue,
  onSetNewHabitUnit,
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

        <View style={styles.frequencyRow}>
          {templateCategories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setTemplateCategory(category)}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: templateCategory === category ? palette.accent : palette.bg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ color: templateCategory === category ? '#fff' : palette.text, fontWeight: '700' }}>{category}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          {filteredTemplates.slice(0, 6).map((template) => (
            <Pressable
              key={template.id}
              onPress={() => onApplyTemplate(template)}
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 14,
                padding: 12,
                backgroundColor: isDarkTheme ? '#171717' : '#f8f5ff',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontWeight: '800' }}>{template.name}</Text>
                  <Text style={{ color: palette.muted, marginTop: 2 }}>
                    {template.category} · {template.taskType === 'measurable' ? `${template.targetValue ?? 1} ${template.measurableUnit ?? 'units'}` : 'Yes / No'}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: template.featured ? palette.accent : palette.bg,
                  }}
                >
                  <Text style={{ color: template.featured ? '#fff' : palette.text, fontSize: 11, fontWeight: '800' }}>
                    {template.featured ? 'Featured' : 'Template'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.addHeroIconWrap, { backgroundColor: isDarkTheme ? '#171717' : '#f4efff' }]}> 
          <Ionicons name={getHabitIconName(newHabitCategory) as any} size={34} color={palette.accent} />
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
            backgroundColor: isDarkTheme ? '#171717' : '#f8f5ff',
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
                      backgroundColor: selected ? palette.accent : isDarkTheme ? '#171717' : '#f4efff',
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
        <View style={styles.frequencyRow}>
          <Pressable
            onPress={() => onSetNewHabitFrequency('daily')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: newHabitFrequency === 'daily' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text
              style={{
                color: newHabitFrequency === 'daily' ? '#fff' : palette.text,
                fontWeight: '700',
              }}
            >
              Daily
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSetNewHabitFrequency('weekly')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: newHabitFrequency === 'weekly' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text
              style={{
                color: newHabitFrequency === 'weekly' ? '#fff' : palette.text,
                fontWeight: '700',
              }}
            >
              Weekly
            </Text>
          </Pressable>
        </View>

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
              <Text style={{ color: newHabitTaskType === 'yesNo' ? '#fff' : palette.text, fontWeight: '700' }}>Yes / No</Text>
            </Pressable>
            <Pressable
              onPress={() => onSetNewHabitTaskType('measurable')}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: newHabitTaskType === 'measurable' ? palette.accent : palette.bg,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ color: newHabitTaskType === 'measurable' ? '#fff' : palette.text, fontWeight: '700' }}>Measurable</Text>
            </Pressable>
          </View>
        </View>

        {newHabitTaskType === 'measurable' ? (
          <>
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              placeholder="Target amount (e.g. 8)"
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              value={newHabitTargetValue}
              onChangeText={onSetNewHabitTargetValue}
            />
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              placeholder="Unit (e.g. glasses, mins, pages)"
              placeholderTextColor={palette.muted}
              value={newHabitUnit}
              onChangeText={onSetNewHabitUnit}
            />
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
              backgroundColor: newHabitReminderEnabled ? (isDarkTheme ? '#171717' : '#f8f5ff') : palette.bg,
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
                    backgroundColor: newHabitReminderEnabled ? (isDarkTheme ? '#171717' : '#f8f5ff') : palette.bg,
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
