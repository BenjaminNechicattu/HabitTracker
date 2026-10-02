import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/design/theme';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { Navigator } from './src/navigation/Navigator';
import { NavProvider } from './src/navigation/NavProvider';
import { StoreProvider, useStore } from './src/store/HabitStore';
import { ToastHost } from './src/ui/ToastHost';
import { Screen } from './src/ui/Screen';
import { Skeleton } from './src/ui/Skeleton';
import { View } from 'react-native';
import { spacing } from './src/design/tokens';

function Shell() {
  const colors = useTheme();
  const { hydrated, onboarded } = useStore();

  let content;
  if (!hydrated) {
    content = (
      <Screen tabBar={false}>
        <View style={{ gap: spacing.lg }}>
          <Skeleton width={160} height={34} radius={10} />
          <Skeleton height={150} radius={24} />
          <Skeleton height={72} radius={22} />
          <Skeleton height={72} radius={22} />
        </View>
      </Screen>
    );
  } else if (!onboarded) {
    content = <OnboardingScreen />;
  } else {
    content = (
      <NavProvider>
        <Navigator />
      </NavProvider>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      {content}
      <ToastHost />
    </View>
  );
}

function Themed() {
  const { themeMode } = useStore();
  return (
    <ThemeProvider mode={themeMode}>
      <Shell />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Themed />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
