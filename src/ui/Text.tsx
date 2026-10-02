import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../design/theme';
import { typography, TypeVariant } from '../design/tokens';

type ColorToken = 'text' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'success' | 'onAccent';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: ColorToken | (string & {});
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  numeric?: boolean;
};

export function Text({ variant = 'body', color = 'text', weight, align, numeric, style, ...rest }: Props) {
  const colors = useTheme();
  const palette: Record<ColorToken, string> = {
    text: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accent,
    danger: colors.danger,
    success: colors.success,
    onAccent: colors.onAccent,
  };
  const resolved = (palette as Record<string, string>)[color] ?? color;
  const base = typography[variant] as TextStyle;

  return (
    <RNText
      maxFontSizeMultiplier={variant === 'largeTitle' || variant === 'metric' ? 1.15 : 1.4}
      {...rest}
      style={[
        base,
        { color: resolved },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
