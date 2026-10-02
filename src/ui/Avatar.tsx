import { Image, View } from 'react-native';
import { IconName, Icon } from './Icon';
import { Text } from './Text';

type Props = {
  name: string;
  avatar: string;
  imageUri?: string;
  size?: number;
};

export function Avatar({ name, avatar, imageUri, size = 52 }: Props) {
  const usesDefaultGlyph = !avatar || avatar === 'person-circle-outline';
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${name} profile picture`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#A8D5EE',
      }}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: size, height: size }} />
      ) : usesDefaultGlyph ? (
        <Text variant="title" weight="700" color="#0B1220" style={{ fontSize: size * 0.42, lineHeight: size * 0.5 }}>
          {(name.trim()[0] ?? 'B').toUpperCase()}
        </Text>
      ) : (
        <Icon name={avatar as IconName} size={size * 0.52} color="#0B1220" />
      )}
    </View>
  );
}
