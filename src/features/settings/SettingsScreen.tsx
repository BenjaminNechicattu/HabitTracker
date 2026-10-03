import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../../design/theme';
import { ThemeMode } from '../../design/theme';
import { cardShadow, spacing } from '../../design/tokens';
import { pickBackupFile, shareBackupFile } from '../../lib/backup';
import { showToast } from '../../lib/toast';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { ActionSheet } from '../../ui/ActionSheet';
import { Avatar } from '../../ui/Avatar';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Icon } from '../../ui/Icon';
import { LargeTitle, Screen } from '../../ui/Screen';
import { SettingsGroup, SettingsRow } from '../../ui/Settings';
import { Text } from '../../ui/Text';

const THEME_LABEL: Record<ThemeMode, string> = { system: 'System', light: 'Light', dark: 'Dark', amoled: 'AMOLED' };

export function SettingsScreen() {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const [sheet, setSheet] = useState<'theme' | 'week' | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const remindersOn = store.activeHabits.filter((habit) => habit.reminderEnabled && !habit.reminderMuted).length;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const exportData = async () => {
    try {
      const result = await shareBackupFile(store.exportBackup());
      showToast(result === 'unavailable' ? 'Sharing isn’t available on this device' : result === 'downloaded' ? 'Backup downloaded' : 'Backup ready', {
        icon: result === 'unavailable' ? 'alert-circle' : 'checkmark-circle',
        tone: result === 'unavailable' ? 'danger' : 'success',
      });
    } catch {
      showToast('Couldn’t export your data', { icon: 'alert-circle', tone: 'danger' });
    }
  };

  const chooseImport = async () => {
    try {
      const text = await pickBackupFile();
      if (text) {
        setPendingImport(text);
      }
    } catch {
      showToast('Couldn’t open that file', { icon: 'alert-circle', tone: 'danger' });
    }
  };

  const applyImport = () => {
    const result = pendingImport ? store.importBackup(pendingImport) : { ok: false };
    setPendingImport(null);
    showToast(result.ok ? `Restored ${result.habits ?? 0} habits` : 'That isn’t a valid Habitty backup', {
      icon: result.ok ? 'checkmark-circle' : 'alert-circle',
      tone: result.ok ? 'success' : 'danger',
    });
  };

  return (
    <>
      <Screen>
        <LargeTitle title="Settings" />

        <Pressable
          onPress={() => nav.push({ name: 'profile' })}
          accessibilityRole="button"
          accessibilityLabel={`${store.profileName}. Edit profile`}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderRadius: 24, backgroundColor: colors.card, boxShadow: cardShadow(colors), opacity: pressed ? 0.85 : 1 })}
        >
          <Avatar name={store.profileName} avatar={store.profileAvatar} imageUri={store.profileAvatarImageUri} size={64} />
          <View style={{ flex: 1 }}>
            <Text variant="title" numberOfLines={1}>
              {store.profileName}
            </Text>
            <Text variant="subhead" color="secondary">
              Edit name and avatar
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>

        <SettingsGroup>
          <SettingsRow title="Reminders" icon="notifications" tint="#E8503A" value={remindersOn === 0 ? 'Off' : `${remindersOn} on`} onPress={() => nav.push({ name: 'reminders' })} />
          <SettingsRow title="Archived habits" icon="archive" tint="#8B93A3" value={`${store.archivedHabits.length}`} onPress={() => nav.setTab('habits')} />
        </SettingsGroup>

        <SettingsGroup title="Preferences">
          <SettingsRow title="Appearance" icon="contrast" tint="#5B52D6" value={THEME_LABEL[store.themeMode]} onPress={() => setSheet('theme')} />
          <SettingsRow title="Week starts on" icon="calendar" tint="#4FB3C9" value={store.weekStartsOn === 1 ? 'Monday' : 'Sunday'} onPress={() => setSheet('week')} />
          <SettingsRow title="Haptic feedback" icon="phone-portrait" tint="#F0A030" switchValue={store.hapticsEnabled} onSwitchChange={store.setHapticsEnabled} />
        </SettingsGroup>

        <SettingsGroup title="Data" footer="Your habits live only on this device. Export a backup to keep them safe or move to a new phone.">
          <SettingsRow title="Export backup" icon="share" tint="#3B6FE0" onPress={exportData} />
          <SettingsRow title="Import backup" icon="download" tint="#5CC25C" onPress={chooseImport} />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow title="Habitty" icon="leaf" tint="#2FB457" value={`v${version}`} />
          <SettingsRow title="Privacy" icon="shield-checkmark" tint="#8B93A3" value="Local-only data" />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow title="Reset All Data" destructive centered onPress={() => setConfirmReset(true)} />
        </SettingsGroup>
      </Screen>

      <ActionSheet
        visible={sheet === 'theme'}
        onClose={() => setSheet(null)}
        title="Appearance"
        actions={(Object.keys(THEME_LABEL) as ThemeMode[]).map((mode) => ({
          key: mode,
          label: THEME_LABEL[mode],
          icon: mode === 'light' ? 'sunny-outline' : mode === 'system' ? 'phone-portrait-outline' : 'moon-outline',
          selected: store.themeMode === mode,
          onPress: () => store.setThemeMode(mode),
        }))}
      />
      <ActionSheet
        visible={sheet === 'week'}
        onClose={() => setSheet(null)}
        title="Week starts on"
        actions={[
          { key: 'sun', label: 'Sunday', selected: store.weekStartsOn === 0, onPress: () => store.setWeekStartsOn(0) },
          { key: 'mon', label: 'Monday', selected: store.weekStartsOn === 1, onPress: () => store.setWeekStartsOn(1) },
        ]}
      />
      <ConfirmDialog
        visible={pendingImport !== null}
        title="Restore this backup?"
        message="Your current habits and history will be replaced by the contents of the file."
        confirmLabel="Restore"
        onCancel={() => setPendingImport(null)}
        onConfirm={applyImport}
      />
      <ConfirmDialog
        visible={confirmReset}
        destructive
        title="Reset all data?"
        message="This permanently deletes every habit, your history, reminders and settings on this device."
        confirmLabel="Reset Everything"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await store.resetAll();
        }}
      />
    </>
  );
}
