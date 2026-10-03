import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTheme } from '../../design/theme';
import { spacing } from '../../design/tokens';
import { haptics } from '../../lib/haptics';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { Habit } from '../../types/habit';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { LargeTitle, RoundButton, Screen } from '../../ui/Screen';
import { SearchBar } from '../../ui/SearchBar';
import { SectionHeader } from '../../ui/SectionHeader';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Text } from '../../ui/Text';
import { useHabitInteractions } from '../shared/useHabitInteractions';
import { HabitListRow } from './HabitListRow';

type Filter = 'active' | 'archived' | 'all';

export function HabitsScreen() {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [reordering, setReordering] = useState(false);
  const { renderRow, overlays } = useHabitInteractions(store.todayKey);

  const base = filter === 'active' ? store.activeHabits : filter === 'archived' ? store.archivedHabits : store.habits;
  const categories = useMemo(() => ['All', ...Array.from(new Set(base.map((habit) => habit.category)))], [base]);
  const activeCategory = categories.includes(category) ? category : 'All';

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return base.filter((habit) => {
      const matchesCategory = activeCategory === 'All' || habit.category === activeCategory;
      const matchesQuery = !needle || habit.name.toLowerCase().includes(needle) || habit.category.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [base, query, activeCategory]);

  const canReorder = filter === 'active' && !query.trim() && activeCategory === 'All' && store.activeHabits.length > 1;
  const isReordering = reordering && canReorder;

  const renderDraggable = ({ item, drag, isActive }: RenderItemParams<Habit>) => (
    <ScaleDecorator activeScale={1.02}>
      <View style={{ paddingBottom: spacing.md }}>
        <HabitListRow
          habit={item}
          onPress={() => nav.push({ name: 'habit', id: item.id })}
          onDrag={() => {
            haptics.select();
            drag();
          }}
          dragging={isActive}
        />
      </View>
    </ScaleDecorator>
  );

  return (
    <>
      <Screen>
        <LargeTitle title="Habits" eyebrow={`${store.activeHabits.length} active${store.archivedHabits.length ? ` · ${store.archivedHabits.length} archived` : ''}`} trailing={<RoundButton icon="add" label="New habit" onPress={() => nav.push({ name: 'form' })} filled />} />

        {store.habits.length === 0 ? (
          <Card>
            <EmptyState icon="leaf-outline" title="No habits yet" message="Start building your routine." actionLabel="Create Your First Habit" onAction={() => nav.push({ name: 'form' })} />
          </Card>
        ) : (
          <>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search habits or categories" />

            <SegmentedControl<Filter>
              options={[
                { key: 'active', label: 'Active' },
                { key: 'archived', label: 'Archived' },
                { key: 'all', label: 'All' },
              ]}
              value={filter}
              onChange={(next) => {
                setFilter(next);
                setReordering(false);
              }}
            />

            {categories.length > 2 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.xl }}>
                {categories.map((name) => (
                  <Chip key={name} label={name} selected={name === activeCategory} onPress={() => setCategory(name)} />
                ))}
              </ScrollView>
            ) : null}

            <View style={{ gap: spacing.md }}>
              <SectionHeader
                title={`${filtered.length} ${filtered.length === 1 ? 'habit' : 'habits'}`}
                actionLabel={canReorder ? (isReordering ? 'Done' : 'Reorder') : undefined}
                onAction={canReorder ? () => setReordering((prev) => !prev) : undefined}
              />

              {isReordering ? (
                <DraggableFlatList
                  data={store.activeHabits}
                  keyExtractor={(item) => item.id}
                  renderItem={renderDraggable}
                  onDragEnd={({ data }) => {
                    haptics.select();
                    store.reorderActiveHabits(data);
                  }}
                  scrollEnabled={false}
                  activationDistance={8}
                />
              ) : filtered.length === 0 ? (
                <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs }}>
                  <Text variant="headline">{query ? 'No matches' : filter === 'archived' ? 'Nothing archived' : 'No habits here'}</Text>
                  <Text variant="subhead" color="secondary" align="center">
                    {query ? `Nothing found for “${query}”.` : filter === 'archived' ? 'Archived habits appear here and keep their history.' : 'Try a different filter.'}
                  </Text>
                </Card>
              ) : (
                filtered.map((habit) => (
                  <View key={habit.id}>
                    {renderRow(habit, { swipe: true, manage: true, list: true })}
                  </View>
                ))
              )}
            </View>
            {isReordering ? (
              <Text variant="footnote" color="tertiary" align="center" style={{ color: colors.textTertiary }}>
                Press and hold the handle, then drag to reorder.
              </Text>
            ) : null}
          </>
        )}
      </Screen>
      {overlays}
    </>
  );
}
