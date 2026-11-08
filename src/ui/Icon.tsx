import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { IconName } from '../lib/toast';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 22, color, style }: Props) {
  return <Ionicons name={name} size={size} color={color} style={style} accessibilityElementsHidden importantForAccessibility="no" />;
}

export type { IconName };
