import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../design/theme';
import { spacing } from '../../design/tokens';
import { haptics } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { useNav } from '../../navigation/NavProvider';
import { useStore } from '../../store/HabitStore';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { FormField, Input } from '../../ui/FormField';
import { Icon, IconName } from '../../ui/Icon';
import { PageHeader, Screen } from '../../ui/Screen';

const AVATARS: IconName[] = [
  'person-circle-outline', 'happy-outline', 'star-outline', 'sunny-outline', 'rocket-outline', 'flash-outline',
  'leaf-outline', 'heart-outline', 'flame-outline', 'paw-outline', 'planet-outline', 'cafe-outline',
];

export function ProfileScreen() {
  const colors = useTheme();
  const nav = useNav();
  const store = useStore();
  const [name, setName] = useState(store.profileName);
  const [avatar, setAvatar] = useState(store.profileAvatar);
  const [imageUri, setImageUri] = useState(store.profileAvatarImageUri);

  const pick = async (source: 'library' | 'camera') => {
    try {
      const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Permission is needed to choose a photo', { icon: 'alert-circle', tone: 'danger' });
        return;
      }
      const options = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.9 };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setAvatar('person-circle-outline');
      }
    } catch {
      showToast('Couldn’t open the photo picker', { icon: 'alert-circle', tone: 'danger' });
    }
  };

  const save = () => {
    store.saveProfile({ name, avatar, imageUri });
    haptics.success();
    showToast('Profile updated', { icon: 'checkmark-circle', tone: 'success' });
    nav.pop();
  };

  return (
    <Screen tabBar={false}>
      <PageHeader title="Profile" onBack={() => nav.pop()} />

      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={name || store.profileName} avatar={avatar} imageUri={imageUri} size={112} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button compact variant="secondary" label="Choose Photo" icon="image" onPress={() => pick('library')} />
          <Button compact variant="secondary" label="Take Photo" icon="camera" onPress={() => pick('camera')} />
          {imageUri ? <Button compact variant="ghost" label="Remove" onPress={() => setImageUri('')} /> : null}
        </View>
      </View>

      <FormField label="Name">
        <Input value={name} onChangeText={setName} placeholder="Your name" maxLength={24} autoCapitalize="words" returnKeyType="done" accessibilityLabel="Your name" />
      </FormField>

      <FormField label="Avatar">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {AVATARS.map((icon) => {
            const selected = !imageUri && avatar === icon;
            return (
              <Pressable
                key={icon}
                onPress={() => {
                  haptics.select();
                  setAvatar(icon);
                  setImageUri('');
                }}
                accessibilityRole="radio"
                accessibilityLabel={icon.replace('-outline', '').replace(/-/g, ' ')}
                accessibilityState={{ selected }}
                style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.text : colors.card, boxShadow: selected ? undefined : `0px 2px 8px ${colors.shadow}` }}
              >
                <Icon name={icon} size={26} color={selected ? colors.bg : colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      </FormField>

      <Button label="Save Profile" onPress={save} />
    </Screen>
  );
}
