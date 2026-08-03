import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { ThemeColor } from '../types/habit';

type Palette = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

type ProfileTabProps = {
  styles: any;
  palette: Palette;
  isDarkTheme: boolean;
  draftName: string;
  selectedAvatar: string;
  themeMode: 'system' | 'light' | 'dark' | 'amoled';
  themeColor: ThemeColor;
  onChangeName: (value: string) => void;
  onSelectAvatar: (value: string) => void;
  onSetThemeMode: (value: 'system' | 'light' | 'dark' | 'amoled') => void;
  onSetThemeColor: (value: ThemeColor) => void;
  onClearAllData: () => void | Promise<void>;
  onSaveProfile: () => void;
};

const THEME_COLOR_OPTIONS: { key: ThemeColor; label: string; color: string }[] = [
  { key: 'violet', label: 'Violet', color: '#7e66ff' },
  { key: 'blue', label: 'Blue', color: '#2563eb' },
  { key: 'teal', label: 'Teal', color: '#15b2ae' },
  { key: 'forest', label: 'Green', color: '#2f8f4e' },
  { key: 'sunset', label: 'Orange', color: '#ef863f' },
  { key: 'rose', label: 'Pink', color: '#dc5d92' },
  { key: 'red', label: 'Red', color: '#dc2626' },
  { key: 'gray', label: 'Gray', color: '#7f8791' },
];

const AVATAR_OPTIONS = [
  'person-circle-outline',
  'happy-outline',
  'star-outline',
  'sunny-outline',
  'rocket-outline',
  'flash-outline',
  'leaf-outline',
  'heart-outline',
  'flame-outline',
  'paw-outline',
  'planet-outline',
  'cafe-outline',
];

export function ProfileTab({
  styles,
  palette,
  isDarkTheme,
  draftName,
  selectedAvatar,
  themeMode,
  themeColor,
  onChangeName,
  onSelectAvatar,
  onSetThemeMode,
  onSetThemeColor,
  onClearAllData,
  onSaveProfile,
}: ProfileTabProps) {
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <View style={styles.tabBody}>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Profile</Text>
        <Text style={[styles.habitInfo, { color: palette.muted }]}>Edit your display name and avatar.</Text>

        <View style={[styles.profileAvatarPreview, { backgroundColor: isDarkTheme ? '#171717' : '#f4efff' }]}> 
          <Ionicons name={selectedAvatar as any} size={44} color={palette.accent} />
        </View>

        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholder="Your name"
          placeholderTextColor={palette.muted}
          value={draftName}
          onChangeText={onChangeName}
          maxLength={24}
        />

        <Pressable
          onPress={() => setShowAvatarOptions((prev) => !prev)}
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
          <Text style={{ color: palette.text, fontWeight: '700' }}>Choose avatar</Text>
          <Ionicons name={showAvatarOptions ? 'chevron-up' : 'chevron-down'} size={16} color={palette.accent} />
        </Pressable>

        {showAvatarOptions ? (
          <View style={styles.profileAvatarGrid}>
            {AVATAR_OPTIONS.map((iconName) => {
              const active = iconName === selectedAvatar;
              return (
                <Pressable
                  key={iconName}
                  onPress={() => onSelectAvatar(iconName)}
                  style={[
                    styles.profileAvatarChip,
                    {
                      backgroundColor: active ? palette.accent : isDarkTheme ? '#171717' : '#f4efff',
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Ionicons name={iconName as any} size={20} color={active ? '#fff' : palette.accent} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: palette.accent },
            pressed ? { opacity: 0.86, transform: [{ scale: 0.98 }] } : null,
          ]}
          onPress={onSaveProfile}
        >
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </Pressable>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <View>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Theme</Text>
          <Text style={[styles.habitInfo, { color: palette.muted }]}>Choose system, light, dark, or AMOLED mode.</Text>
        </View>
        <View style={styles.frequencyRow}>
          <Pressable
            onPress={() => onSetThemeMode('system')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: themeMode === 'system' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: themeMode === 'system' ? '#fff' : palette.text, fontWeight: '700' }}>System</Text>
          </Pressable>
          <Pressable
            onPress={() => onSetThemeMode('light')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: themeMode === 'light' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: themeMode === 'light' ? '#fff' : palette.text, fontWeight: '700' }}>Light</Text>
          </Pressable>
          <Pressable
            onPress={() => onSetThemeMode('dark')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: themeMode === 'dark' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: themeMode === 'dark' ? '#fff' : palette.text, fontWeight: '700' }}>Dark</Text>
          </Pressable>
          <Pressable
            onPress={() => onSetThemeMode('amoled')}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: themeMode === 'amoled' ? palette.accent : palette.bg,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={{ color: themeMode === 'amoled' ? '#fff' : palette.text, fontWeight: '700' }}>AMOLED</Text>
          </Pressable>
        </View>

        <Text style={[styles.habitInfo, { color: palette.muted, marginTop: 8 }]}>Theme palette</Text>
        <View style={styles.profileAvatarGrid}>
          {THEME_COLOR_OPTIONS.map((option) => {
            const active = option.key === themeColor;
            return (
              <Pressable
                key={option.key}
                onPress={() => onSetThemeColor(option.key)}
                accessibilityRole="button"
                accessibilityLabel={`Set ${option.label} theme color`}
                style={[
                  styles.profileAvatarChip,
                  {
                    backgroundColor: option.color,
                    borderColor: active ? '#ffffff' : palette.border,
                    borderWidth: active ? 3 : 1,
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Danger Zone</Text>
        <Text style={[styles.habitInfo, { color: '#d12d47', fontWeight: '700' }]}>Caution: This permanently deletes all local habits, streaks, and settings on this device.</Text>
        <Pressable style={[styles.dangerButton, { borderColor: palette.border }]} onPress={() => setShowResetConfirm(true)}>
          <Text style={styles.dangerButtonText}>Reset Local Data</Text>
        </Pressable>
      </View>

      <Modal
        visible={showResetConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetConfirm(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 22,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        >
          <View
            style={{
              borderRadius: 16,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
            }}
          >
            <Text style={{ color: palette.text, fontWeight: '800', fontSize: 18 }}>Reset local data?</Text>
            <Text style={{ color: palette.muted, fontSize: 14, lineHeight: 20 }}>
              This will permanently delete all habits, streak history, reminders, and profile settings on this device.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setShowResetConfirm(false)}
                style={{
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: isDarkTheme ? '#151515' : '#f7f2ff',
                }}
              >
                <Text style={{ color: palette.text, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setShowResetConfirm(false);
                  await onClearAllData();
                }}
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: '#d12d47',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
