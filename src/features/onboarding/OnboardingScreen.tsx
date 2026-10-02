import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../design/theme';
import { spacing } from '../../design/tokens';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/HabitStore';
import { Button } from '../../ui/Button';
import { FormField, Input } from '../../ui/FormField';
import { Icon, IconName } from '../../ui/Icon';
import { Text } from '../../ui/Text';

const FEATURES: { icon: IconName; title: string; body: string; tint: string }[] = [
  { icon: 'checkmark-circle', title: 'Check in in seconds', body: 'Open, tap, done. See your progress at a glance.', tint: '#2FB457' },
  { icon: 'flame', title: 'Build real streaks', body: 'Gentle momentum that rewards consistency.', tint: '#F29A1F' },
  { icon: 'lock-closed', title: 'Private by design', body: 'Everything stays on your device.', tint: '#2F6FEB' },
];

export function OnboardingScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [name, setName] = useState(store.profileName !== 'Ben' ? store.profileName : '');
  const [error, setError] = useState('');

  const start = () => {
    if (!name.trim()) {
      setError('Tell us what to call you.');
      return;
    }
    haptics.success();
    store.completeOnboarding(name);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.huge, paddingBottom: insets.bottom + spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.xxl }}
      >
        <Animated.View entering={FadeInDown.duration(420)} style={{ gap: spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#17181A', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="checkmark-done" size={36} color={colors.lime} />
          </View>
          <View style={{ gap: spacing.sm }}>
            <Text variant="largeTitle" style={{ fontSize: 40, lineHeight: 46 }}>
              Welcome to{'\n'}Habitty
            </Text>
            <Text variant="body" color="secondary">
              A personal habit journal for building a calmer, more consistent routine.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(420)} style={{ gap: spacing.lg }}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: feature.tint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={feature.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="headline">{feature.title}</Text>
                <Text variant="subhead" color="secondary">
                  {feature.body}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(420)} style={{ gap: spacing.lg, marginTop: 'auto' }}>
          <FormField label="What should we call you?" error={error || undefined}>
            <Input
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError('');
              }}
              placeholder="Your name"
              autoCapitalize="words"
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={start}
              accessibilityLabel="Your name"
            />
          </FormField>
          <Button label="Get Started" onPress={start} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
