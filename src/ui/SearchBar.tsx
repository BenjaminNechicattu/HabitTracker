import { forwardRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '../design/theme';
import { cardShadow } from '../design/tokens';
import { Icon } from './Icon';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
};

export const SearchBar = forwardRef<TextInput, Props>(function SearchBar(
  { value, onChangeText, placeholder = 'Search', onFocus, onBlur, onSubmit },
  ref,
) {
  const colors = useTheme();
  return (
    <View
      accessibilityRole="search"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 52,
        paddingHorizontal: 18,
        borderRadius: 26,
        backgroundColor: colors.card,
        boxShadow: cardShadow(colors),
      }}
    >
      <Icon name="search" size={20} color={colors.textTertiary} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={{ flex: 1, minWidth: 0, fontSize: 17, color: colors.text, height: 52, outlineStyle: 'none' } as never}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear search">
          <Icon name="close-circle" size={20} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
});
