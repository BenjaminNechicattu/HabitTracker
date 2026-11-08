import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '../design/theme';
import { radius, spacing } from '../design/tokens';
import { Button } from './Button';
import { Text } from './Text';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPrompt() {
  const colors = useTheme();
  const [visible, setVisible] = useState(false);
  const [isApple, setIsApple] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const browserIsApple = /iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsApple(browserIsApple);

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setVisible(false);
    };

    if (browserIsApple) {
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      setVisible(false);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setVisible(false);
    }

    setInstallPrompt(null);
  }, [installPrompt]);

  if (Platform.OS !== 'web' || !visible) {
    return null;
  }

  const title = installPrompt ? 'Install Habitty' : isApple ? 'Add Habitty to your home screen' : 'Install Habitty';
  const message = installPrompt
    ? 'Get a faster app-like experience with quick access from your home screen.'
    : isApple
      ? 'Tap the Share button and choose Add to Home Screen.'
      : 'Use your browser menu to add this app to your home screen.';

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 20,
        paddingHorizontal: spacing.lg,
        zIndex: 200,
        pointerEvents: 'box-none',
      }}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.separator,
          padding: spacing.lg,
          shadowColor: colors.shadow,
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        }}
      >
        <Text variant="headline" weight="700">
          {title}
        </Text>
        <Text variant="subhead" color="secondary" style={{ marginTop: 6 }}>
          {message}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg }}>
          <Button label={installPrompt ? 'Maybe later' : 'Dismiss'} variant="secondary" compact onPress={() => setVisible(false)} />
          {installPrompt ? <Button label="Install" compact onPress={handleInstall} /> : null}
        </View>
      </View>
    </View>
  );
}
