import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../design/theme';
import { formatReminderTime } from '../../lib/format';
import { Input } from '../../ui/FormField';
import { Text } from '../../ui/Text';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function toDate(value: string): Date {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  const date = new Date();
  date.setHours(match ? Number(match[1]) : 8, match ? Number(match[2]) : 0, 0, 0);
  return date;
}

function toValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Native time picker on iOS/Android, a plain HH:MM field on web. */
export function TimeField({ value, onChange }: Props) {
  const colors = useTheme();
  const [showAndroid, setShowAndroid] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroid(false);
    }
    if (event.type === 'set' && selected) {
      onChange(toValue(selected));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ width: 120 }}>
        <Input
          value={value}
          onChangeText={onChange}
          placeholder="08:00"
          maxLength={5}
          accessibilityLabel="Reminder time, 24 hour HH:MM"
          style={{ textAlign: 'right', minHeight: 44, fontSize: 17 }}
        />
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return <DateTimePicker value={toDate(value)} mode="time" display="compact" onChange={handleChange} accessibilityLabel="Reminder time" />;
  }

  return (
    <>
      <Pressable onPress={() => setShowAndroid(true)} accessibilityRole="button" accessibilityLabel={`Reminder time ${formatReminderTime(value)}`} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.fill }}>
        <Text variant="body" weight="600" color="accent">
          {formatReminderTime(value)}
        </Text>
      </Pressable>
      {showAndroid ? <DateTimePicker value={toDate(value)} mode="time" is24Hour={false} onChange={handleChange} /> : null}
    </>
  );
}
