import { useState } from 'react';
import { Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DAY_OPTIONS } from '../constants/habits';
import { HABIT_ICON_OPTIONS, getHabitIconName } from '../constants/habitIcons';

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
  newHabitAlternativeGroup: string;
  newHabitRandomSuggestionEnabled: boolean;
  newHabitFrequency: 'daily' | 'weekly';
  newHabitTaskType: 'yesNo' | 'measurable';
  newHabitTargetValue: string;
  newHabitUnit: string;
  newHabitReminderEnabled: boolean;
  newHabitReminder: string;
  newHabitRepeatDays: number[];
  formError: string;
  onSetNewHabitName: (value: string) => void;
  onSetNewHabitCategory: (value: string) => void;
  onSetNewHabitAlternativeGroup: (value: string) => void;
  onSetNewHabitRandomSuggestionEnabled: (value: boolean) => void;
  onSetNewHabitFrequency: (value: 'daily' | 'weekly') => void;
  onSetNewHabitTaskType: (value: 'yesNo' | 'measurable') => void;
  onSetNewHabitTargetValue: (value: string) => void;
  onSetNewHabitUnit: (value: string) => void;
  onSetNewHabitReminderEnabled: (value: boolean) => void;
  onSetNewHabitReminder: (value: string) => void;
  onToggleRepeatDay: (day: number) => void;
  onAddHabit: () => void;
};

export function AddHabitTab({
  styles,
  palette,
  isDarkTheme,
  newHabitName,
  newHabitCategory,
  newHabitAlternativeGroup,
  newHabitRandomSuggestionEnabled,
  newHabitFrequency,
  newHabitTaskType,
  newHabitTargetValue,
  newHabitUnit,
  newHabitReminderEnabled,
  newHabitReminder,
  newHabitRepeatDays,
  formError,
  onSetNewHabitName,
  onSetNewHabitCategory,
  onSetNewHabitAlternativeGroup,
  onSetNewHabitRandomSuggestionEnabled,
  onSetNewHabitFrequency,
  onSetNewHabitTaskType,
  onSetNewHabitTargetValue,
  onSetNewHabitUnit,
  onSetNewHabitReminderEnabled,
  onSetNewHabitReminder,
  onToggleRepeatDay,
  onAddHabit,
}: AddHabitTabProps) {
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

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

        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholder="Alternative group (optional)"
          placeholderTextColor={palette.muted}
          value={newHabitAlternativeGroup}
          onChangeText={onSetNewHabitAlternativeGroup}
        />
        <Text style={[styles.habitInfo, { color: palette.muted, marginTop: -2, marginBottom: 10 }]}>
          Add the same group name to multiple habits to complete any one of them.
        </Text>

        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 15 }]}>Random suggestion</Text>
            <Text style={[styles.habitInfo, { color: palette.muted }]}>Suggest one option daily for this group</Text>
          </View>
          <Switch
            value={newHabitAlternativeGroup.trim() ? newHabitRandomSuggestionEnabled : false}
            onValueChange={onSetNewHabitRandomSuggestionEnabled}
            disabled={!newHabitAlternativeGroup.trim()}
          />
        </View>
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
          <Switch value={newHabitReminderEnabled} onValueChange={onSetNewHabitReminderEnabled} />
        </View>

        <View>
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
            <View style={{ marginTop: 8 }}>
              <DateTimePicker
                value={reminderPickerValue}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour
                onChange={onReminderTimeChange}
              />
            </View>
          ) : null}
        </View>

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

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Pressable style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={onAddHabit}>
          <Text style={styles.primaryButtonText}>Save Habit</Text>
        </Pressable>
      </View>
    </View>
  );
}
