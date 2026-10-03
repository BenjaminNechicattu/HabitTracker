import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design/theme';
import { registerToastListener, ToastPayload } from '../lib/toast';
import { Icon } from './Icon';
import { Text } from './Text';

const DURATION_MS = 2600;

export function ToastHost() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    registerToastListener(setToast);
    return () => registerToastListener(null);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const tint = toast?.tone === 'success' ? colors.lime : toast?.tone === 'danger' ? colors.danger : '#FFFFFF';

  return (
    <View style={{ pointerEvents: 'none', position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutUp.duration(180)}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={{ borderRadius: 24, overflow: 'hidden', maxWidth: '90%', backgroundColor: 'rgba(20,22,26,0.9)' }}
        >
          <BlurView intensity={40} tint="dark" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
            {toast.icon ? <Icon name={toast.icon} size={18} color={tint} /> : null}
            <Text variant="subhead" weight="600" color="#FFFFFF" numberOfLines={2} style={{ flexShrink: 1 }}>
              {toast.message}
            </Text>
          </BlurView>
        </Animated.View>
      ) : null}
    </View>
  );
}
