import { ReactNode } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../design/theme';
import { cardShadow, spacing } from '../design/tokens';
import { Text } from './Text';

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Uppercase label above a control – the form building block. */
export function FormField({ label, hint, error, children }: FieldProps) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" color="tertiary" style={{ paddingHorizontal: spacing.xs }}>
        {label}
      </Text>
      {children}
      {error ? (
        <Text variant="footnote" color="danger" style={{ paddingHorizontal: spacing.xs }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="footnote" color="tertiary" style={{ paddingHorizontal: spacing.xs }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

type InputProps = TextInputProps & {
  accessory?: ReactNode;
};

export function Input({ accessory, style, ...rest }: InputProps) {
  const colors = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: 18,
        borderRadius: 18,
        backgroundColor: colors.card,
        boxShadow: cardShadow(colors),
      }}
    >
      <TextInput
        placeholderTextColor={colors.textTertiary}
        {...rest}
        style={[{ flex: 1, minWidth: 0, fontSize: 17, color: colors.text, minHeight: 56, outlineStyle: 'none' } as never, style]}
      />
      {accessory}
    </View>
  );
}
