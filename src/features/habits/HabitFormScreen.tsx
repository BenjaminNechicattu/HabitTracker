import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { DAY_OPTIONS, HABIT_LIBRARY_TEMPLATES } from '../../constants/habits';
import { HABIT_ICON_OPTIONS, getHabitIconName } from '../../constants/habitIcons';
import { useTheme } from '../../design/theme';
import { cardShadow, DEFAULT_HABIT_COLOR, HABIT_COLORS, spacing } from '../../design/tokens';
import { REPEAT_PRESETS } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { isCountHabit } from '../../logic/progress';
import { useNav } from '../../navigation/NavProvider';
import { HabitInput, useStore } from '../../store/HabitStore';
import { Habit, HabitTemplate } from '../../types/habit';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { FormField, Input } from '../../ui/FormField';
import { HabitIcon } from '../../ui/HabitIcon';
import { Icon, IconName } from '../../ui/Icon';
import { PressableScale } from '../../ui/PressableScale';
import { PageHeader, Screen } from '../../ui/Screen';
import { SearchBar } from '../../ui/SearchBar';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SettingsGroup, SettingsRow } from '../../ui/Settings';
import { Text } from '../../ui/Text';
import { TimeField } from './TimeField';

type Kind = 'yesNo' | 'target' | 'tracker' | 'choice';
type Mode = 'custom' | 'templates';
type Option = { id: string; name: string };

const KIND_OPTIONS: { key: Kind; label: string }[] = [
  { key: 'yesNo', label: 'Check' },
  { key: 'target', label: 'Goal' },
  { key: 'tracker', label: 'Tracker' },
  { key: 'choice', label: 'Choice' },
];

const KIND_HINT: Record<Kind, string> = {
  yesNo: 'Simple completion — done or not done.',
  target: 'Reach a daily amount, like 8 glasses of water.',
  tracker: 'Log any amount each day, like money spent or minutes read.',
  choice: 'Complete any one of several options.',
};

const DEFAULT_OPTIONS: Option[] = [
  { id: 'option-1', name: 'Walk 30 minutes' },
  { id: 'option-2', name: 'Cycle 20 minutes' },
];

function normalizeKind(type: Habit['taskType']): Kind {
  return type === 'measurable' ? 'target' : type;
}

export function HabitFormScreen({ habitId }: { habitId?: string }) {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const existing = habitId ? store.habits.find((habit) => habit.id === habitId) : undefined;
  const editing = !!existing;

  const [mode, setMode] = useState<Mode>('custom');
  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<Kind>(existing ? normalizeKind(existing.taskType) : 'yesNo');
  const [category, setCategory] = useState(existing?.category ?? 'Health');
  const [color, setColor] = useState(existing?.taskColor ?? DEFAULT_HABIT_COLOR);
  const [target, setTarget] = useState(existing?.targetValue ? String(existing.targetValue) : '');
  const [unit, setUnit] = useState(existing?.measurableUnit ?? '');
  const [options, setOptions] = useState<Option[]>(existing?.choiceOptions?.length ? existing.choiceOptions.map((o) => ({ ...o })) : DEFAULT_OPTIONS);
  const [suggest, setSuggest] = useState(existing?.randomSuggestionEnabled ?? true);
  const [reminderOn, setReminderOn] = useState(existing?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '08:00');
  const [repeatDays, setRepeatDays] = useState<number[]>(existing?.repeatDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');

  const [templateQuery, setTemplateQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');

  const categoryOptions = useMemo(() => {
    const names = HABIT_ICON_OPTIONS.map((option) => option.category);
    return names.includes(category) ? names : [category, ...names];
  }, [category]);

  const colorOptions = useMemo<string[]>(() => ([...HABIT_COLORS] as string[]).includes(color) ? [...HABIT_COLORS] : [color, ...HABIT_COLORS], [color]);

  const templateCategories = useMemo(() => ['All', ...Array.from(new Set(HABIT_LIBRARY_TEMPLATES.map((template) => template.category)))], []);
  const templates = useMemo(() => {
    const needle = templateQuery.trim().toLowerCase();
    return HABIT_LIBRARY_TEMPLATES.filter((template) => {
      const inCategory = templateCategory === 'All' || template.category === templateCategory;
      const matches = !needle || template.name.toLowerCase().includes(needle) || template.category.toLowerCase().includes(needle) || template.tags.some((tag) => tag.toLowerCase().includes(needle));
      return inCategory && matches;
    });
  }, [templateQuery, templateCategory]);

  const applyTemplate = (template: HabitTemplate) => {
    const nextKind = normalizeKind(template.taskType);
    setName(template.name);
    setKind(nextKind);
    setCategory(template.category);
    setColor(template.taskColor ?? DEFAULT_HABIT_COLOR);
    setTarget(template.targetValue ? String(template.targetValue) : '');
    setUnit(template.measurableUnit ?? '');
    setOptions(template.choiceOptions?.length ? template.choiceOptions.map((option) => ({ ...option })) : DEFAULT_OPTIONS);
    setSuggest(template.randomSuggestionEnabled ?? true);
    setRepeatDays(template.repeatDays.length > 0 ? template.repeatDays : [0, 1, 2, 3, 4, 5, 6]);
    setError('');
    setMode('custom');
    haptics.tap();
  };

  const toggleDay = (day: number) => {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]));
    setError('');
  };

  const presetKey = REPEAT_PRESETS.find((preset) => preset.days.length === repeatDays.length && preset.days.every((day) => repeatDays.includes(day)))?.key;

  const canSave = name.trim().length > 0;

  const save = () => {
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();
    const amount = Math.round(Number(target));

    if (!trimmedName) {
      setError('Give your habit a name.');
      showToast('Habit name is required', { icon: 'alert-circle', tone: 'danger' });
      return;
    }
    if (kind === 'target' && (!Number.isFinite(amount) || amount <= 0)) {
      setError('Goals need an amount greater than 0.');
      showToast('Daily goal must be greater than zero', { icon: 'alert-circle', tone: 'danger' });
      return;
    }
    if ((kind === 'target' || kind === 'tracker') && !trimmedUnit) {
      setError('Add a unit, like “glasses” or “minutes”.');
      showToast('Add a unit for this habit', { icon: 'alert-circle', tone: 'danger' });
      return;
    }
    const cleanOptions = options.map((option) => ({ ...option, name: option.name.trim() })).filter((option) => option.name);
    if (kind === 'choice' && cleanOptions.length < 2) {
      setError('Add at least two options to choose from.');
      showToast('Add at least two options', { icon: 'alert-circle', tone: 'danger' });
      return;
    }
    if (repeatDays.length === 0) {
      setError('Pick at least one day.');
      showToast('Choose at least one repeat day', { icon: 'alert-circle', tone: 'danger' });
      return;
    }
    if (reminderOn && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime.trim())) {
      setError('Use a valid time like 07:30.');
      showToast('Reminder time must be a valid time', { icon: 'alert-circle', tone: 'danger' });
      return;
    }

    const input: HabitInput = {
      name: trimmedName,
      category: category.trim() || 'General',
      taskType: existing ? existing.taskType : kind,
      taskColor: color,
      targetValue: kind === 'target' ? amount : kind === 'tracker' ? existing?.targetValue : undefined,
      measurableUnit: kind === 'target' || kind === 'tracker' ? trimmedUnit : undefined,
      choiceOptions: kind === 'choice' ? cleanOptions.map((option, index) => ({ id: option.id || `option-${index + 1}-${Date.now()}`, name: option.name })) : undefined,
      randomSuggestionEnabled: kind === 'choice' ? suggest : undefined,
      reminderEnabled: reminderOn,
      reminderTime: reminderOn ? reminderTime.trim() : undefined,
      reminderMuted: reminderOn ? existing?.reminderMuted ?? false : false,
      repeatDays,
    };

    if (existing) {
      store.updateHabit(existing.id, input);
      showToast('Changes saved', { icon: 'checkmark-circle', tone: 'success' });
    } else {
      store.addHabit(input);
      showToast('Habit created', { icon: 'checkmark-circle', tone: 'success' });
    }
    haptics.success();
    nav.pop();
  };

  const isCount = existing ? isCountHabit(existing) : kind === 'target' || kind === 'tracker';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen tabBar={false}>
        <PageHeader title={editing ? 'Edit Habit' : 'New Habit'} onBack={() => nav.pop()} label={editing ? 'Cancel' : 'Close'} />

        {!editing ? (
          <SegmentedControl<Mode>
            options={[
              { key: 'custom', label: 'Custom' },
              { key: 'templates', label: 'Templates' },
            ]}
            value={mode}
            onChange={setMode}
          />
        ) : null}

        {mode === 'templates' ? (
          <View style={{ gap: spacing.lg }}>
            <SearchBar value={templateQuery} onChangeText={setTemplateQuery} placeholder="Search templates" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: 4 }}>
              {templateCategories.map((item) => (
                <Chip key={item} label={item} selected={item === templateCategory} onPress={() => setTemplateCategory(item)} />
              ))}
            </ScrollView>
            <View style={{ gap: spacing.md }}>
              {templates.length === 0 ? (
                <Text variant="subhead" color="secondary" align="center">
                  No templates match your search.
                </Text>
              ) : (
                templates.map((template) => (
                  <PressableScale
                    key={template.id}
                    scaleTo={0.985}
                    onPress={() => applyTemplate(template)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use template ${template.name}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 22, backgroundColor: colors.card, boxShadow: cardShadow(colors) }}
                  >
                    <HabitIcon category={template.category} color={template.taskColor ?? colors.accent} size={48} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="headline" numberOfLines={1}>
                        {template.name}
                      </Text>
                      <Text variant="footnote" color="secondary" numberOfLines={1}>
                        {template.category}
                        {template.targetValue ? ` · ${template.targetValue} ${template.measurableUnit ?? ''}` : ''}
                      </Text>
                    </View>
                    <Icon name="add-circle" size={26} color={colors.accent} />
                  </PressableScale>
                ))
              )}
            </View>
          </View>
        ) : (
          <>
            <FormField label="Name">
              <Input
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError('');
                }}
                placeholder="e.g. Drink water"
                maxLength={40}
                returnKeyType="done"
                accessibilityLabel="Habit name"
              />
            </FormField>

            <FormField label="Type" hint={editing ? 'The type can’t be changed after a habit is created.' : KIND_HINT[kind]}>
              {editing ? (
                <SettingsGroup>
                  <SettingsRow title={KIND_OPTIONS.find((option) => option.key === kind)?.label ?? ''} subtitle={KIND_HINT[kind]} />
                </SettingsGroup>
              ) : (
                <SegmentedControl<Kind> options={KIND_OPTIONS} value={kind} onChange={(next) => { setKind(next); setError(''); }} />
              )}
            </FormField>

            {kind === 'target' || kind === 'tracker' ? (
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {kind === 'target' ? (
                  <View style={{ flex: 1 }}>
                    <FormField label="Daily goal">
                      <Input value={target} onChangeText={(value) => setTarget(value.replace(/[^0-9]/g, ''))} placeholder="8" keyboardType="number-pad" accessibilityLabel="Daily goal amount" />
                    </FormField>
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <FormField label="Unit">
                    <Input value={unit} onChangeText={setUnit} placeholder={kind === 'target' ? 'glasses' : 'minutes'} maxLength={16} accessibilityLabel="Unit" />
                  </FormField>
                </View>
              </View>
            ) : null}

            {kind === 'choice' ? (
              <FormField label="Options" hint="Completing any one of these counts for the day.">
                <View style={{ gap: spacing.sm }}>
                  {options.map((option, index) => (
                    <Input
                      key={option.id}
                      value={option.name}
                      onChangeText={(value) => setOptions((prev) => prev.map((item) => (item.id === option.id ? { ...item, name: value } : item)))}
                      placeholder={`Option ${index + 1}`}
                      accessibilityLabel={`Option ${index + 1}`}
                      accessory={
                        options.length > 2 ? (
                          <Pressable onPress={() => setOptions((prev) => prev.filter((item) => item.id !== option.id))} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove option ${index + 1}`}>
                            <Icon name="remove-circle" size={24} color={colors.danger} />
                          </Pressable>
                        ) : undefined
                      }
                    />
                  ))}
                  <Button label="Add option" variant="secondary" compact icon="add" onPress={() => setOptions((prev) => [...prev, { id: `option-${Date.now()}`, name: '' }])} style={{ alignSelf: 'flex-start' }} />
                </View>
                <SettingsGroup>
                  <SettingsRow title="Suggest one each day" icon="sparkles" tint={colors.accent} switchValue={suggest} onSwitchChange={setSuggest} />
                </SettingsGroup>
              </FormField>
            ) : null}

            <FormField label="Category">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {categoryOptions.map((item) => (
                  <Chip key={item} label={item} icon={getHabitIconName(item) as IconName} selected={item === category} onPress={() => setCategory(item)} />
                ))}
              </View>
            </FormField>

            <FormField label="Color">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {colorOptions.map((item) => {
                  const selected = item === color;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        haptics.select();
                        setColor(item);
                      }}
                      accessibilityRole="radio"
                      accessibilityLabel={`Color ${item}`}
                      accessibilityState={{ selected }}
                      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item, alignItems: 'center', justifyContent: 'center', borderWidth: selected ? 3 : 0, borderColor: colors.card, boxShadow: selected ? `0px 0px 0px 2px ${item}` : undefined }}>
                        {selected ? <Icon name="checkmark" size={18} color="#FFFFFF" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </FormField>

            <FormField label="Repeat">
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {REPEAT_PRESETS.map((preset) => (
                    <Chip key={preset.key} label={preset.label} selected={presetKey === preset.key} onPress={() => setRepeatDays([...preset.days])} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                  {DAY_OPTIONS.map((day, index) => {
                    const selected = repeatDays.includes(day.value);
                    return (
                      <Pressable
                        key={`${day.value}-${index}`}
                        onPress={() => {
                          haptics.select();
                          toggleDay(day.value);
                        }}
                        accessibilityRole="checkbox"
                        accessibilityLabel={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.value]}
                        accessibilityState={{ checked: selected }}
                        style={{ flex: 1, maxWidth: 48, aspectRatio: 1, minHeight: 40, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.text : colors.card, boxShadow: selected ? undefined : `0px 2px 8px ${colors.shadow}` }}
                      >
                        <Text variant="subhead" weight="700" color={selected ? colors.bg : 'secondary'}>
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </FormField>

            <FormField label="Reminder">
              <SettingsGroup>
                <SettingsRow title="Remind me" icon="notifications" tint="#E8503A" switchValue={reminderOn} onSwitchChange={(value) => { haptics.tap(); setReminderOn(value); }} />
                {reminderOn ? <SettingsRow title="Time" icon="time" tint="#5B52D6" trailing={<TimeField value={reminderTime} onChange={setReminderTime} />} /> : null}
              </SettingsGroup>
            </FormField>

            {error ? (
              <Text variant="subhead" color="danger" align="center" accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Button label={editing ? 'Save Changes' : 'Create Habit'} onPress={save} disabled={!canSave} />
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
