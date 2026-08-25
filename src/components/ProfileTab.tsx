import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image, Modal, Pressable, Text, TextInput, View } from 'react-native';

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
  profileAvatarImageUri?: string;
  themeMode: 'system' | 'light' | 'dark' | 'amoled';
  onChangeName: (value: string) => void;
  onSelectAvatar: (value: string) => void;
  onSetProfileAvatarImageUri: (value: string) => void;
  onSetThemeMode: (value: 'system' | 'light' | 'dark' | 'amoled') => void;
  onClearAllData: () => void | Promise<void>;
  onSaveProfile: () => void;
};

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
  profileAvatarImageUri,
  themeMode,
  onChangeName,
  onSelectAvatar,
  onSetProfileAvatarImageUri,
  onSetThemeMode,
  onClearAllData,
  onSaveProfile,
}: ProfileTabProps) {
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pickAvatarImage = async (mode: 'library' | 'camera') => {
    const permission =
      mode === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result =
      mode === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 });

    if (!result.canceled && result.assets[0]?.uri) {
      onSetProfileAvatarImageUri(result.assets[0].uri);
      setShowAvatarOptions(false);
    }
  };

  return (
    <View style={styles.tabBody}>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Profile</Text>
        <Text style={[styles.habitInfo, { color: palette.muted }]}>Edit your display name and avatar.</Text>

        <View style={[styles.profileAvatarPreview, { backgroundColor: isDarkTheme ? '#171717' : '#edf9f1', overflow: 'hidden' }]}> 
          {profileAvatarImageUri ? (
            <Image source={{ uri: profileAvatarImageUri }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Ionicons name={selectedAvatar as any} size={44} color={palette.accent} />
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => pickAvatarImage('library')}
            style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
          >
            <Text style={{ color: palette.text, fontWeight: '700' }}>Upload photo</Text>
          </Pressable>
          <Pressable
            onPress={() => pickAvatarImage('camera')}
            style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
          >
            <Text style={{ color: palette.text, fontWeight: '700' }}>Take photo</Text>
          </Pressable>
          {profileAvatarImageUri ? (
            <Pressable
              onPress={() => onSetProfileAvatarImageUri('')}
              style={[styles.slimCheckButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontWeight: '700' }}>Remove avatar</Text>
            </Pressable>
          ) : null}
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
            backgroundColor: isDarkTheme ? '#171717' : '#f1faf4',
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
                      backgroundColor: active ? palette.accent : isDarkTheme ? '#171717' : '#edf9f1',
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
