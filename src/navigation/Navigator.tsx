import { View } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInRight, SlideOutDown, SlideOutRight } from 'react-native-reanimated';
import { useTheme } from '../design/theme';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { HabitDetailScreen } from '../features/habits/HabitDetailScreen';
import { HabitFormScreen } from '../features/habits/HabitFormScreen';
import { HabitsScreen } from '../features/habits/HabitsScreen';
import { InsightsScreen } from '../features/insights/InsightsScreen';
import { ProfileScreen } from '../features/settings/ProfileScreen';
import { RemindersScreen } from '../features/settings/RemindersScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { TodayScreen } from '../features/today/TodayScreen';
import { Route, useNav } from './NavProvider';
import { TabBar } from './TabBar';

function TabContent() {
  const { tab } = useNav();
  switch (tab) {
    case 'habits':
      return <HabitsScreen />;
    case 'insights':
      return <InsightsScreen />;
    case 'calendar':
      return <CalendarScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <TodayScreen />;
  }
}

function RouteContent({ route }: { route: Route }) {
  switch (route.name) {
    case 'habit':
      return <HabitDetailScreen habitId={route.id} />;
    case 'form':
      return <HabitFormScreen habitId={route.id} />;
    case 'profile':
      return <ProfileScreen />;
    case 'reminders':
      return <RemindersScreen />;
  }
}

export function Navigator() {
  const colors = useTheme();
  const { tab, stack, setTab } = useNav();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ flex: 1 }}>
        <TabContent />
      </Animated.View>
      {stack.length === 0 ? <TabBar active={tab} onChange={setTab} /> : null}

      {stack.map((route, index) => (
        <Animated.View
          key={`${route.name}-${index}`}
          entering={route.name === 'form' ? SlideInDown.duration(320) : SlideInRight.duration(280)}
          exiting={route.name === 'form' ? SlideOutDown.duration(260) : SlideOutRight.duration(240)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg }}
        >
          <RouteContent route={route} />
        </Animated.View>
      ))}
    </View>
  );
}
