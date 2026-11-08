import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductionReleaseScreen } from './src/features/release/ProductionReleaseScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProductionReleaseScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
