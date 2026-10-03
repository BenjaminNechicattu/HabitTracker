import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../design/theme';
import { radius, spacing } from '../../design/tokens';
import { formatReminderTime } from '../../lib/format';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
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
  const [showWebSheet, setShowWebSheet] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroid(false);
    }
    if (event.type === 'set' && selected) {
      onChange(toValue(selected));
    }
  };

  const parsed = useMemo(() => {
    const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    return {
      hour: match ? Number(match[1]) : 8,
      minute: match ? Number(match[2]) : 0,
    };
  }, [value]);

  const webHours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const webMinutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  if (Platform.OS === 'web') {
    return (
      <>
        <Pressable
          onPress={() => setShowWebSheet(true)}
          accessibilityRole="button"
          accessibilityLabel={`Reminder time ${formatReminderTime(value)}`}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.fill }}
        >
          <Text variant="body" weight="600" color="accent">
            {formatReminderTime(value)}
          </Text>
        </Pressable>

        <BottomSheet visible={showWebSheet} onClose={() => setShowWebSheet(false)} title="Reminder time">
          <View style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm }}>
              <View style={{ flex: 1, maxHeight: 220 }}>
                <Text variant="footnote" color="secondary" align="center" style={{ marginBottom: spacing.sm }}>
                  Hour
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.xs }}>
                  {webHours.map((hour) => (
                    <Pressable
                      key={`hour-${hour}`}
                      onPress={() => {
                        const next = `${String(hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`;
                        onChange(next);
                      }}
                      style={{
                        minHeight: 42,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: parsed.hour === hour ? colors.accentSoft : 'transparent',
                      }}
                    >
                      <Text variant="headline" weight={parsed.hour === hour ? '700' : '500'} color={parsed.hour === hour ? 'accent' : 'secondary'}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="title" weight="700" color="secondary">
                  :
                </Text>
              </View>

              <View style={{ flex: 1, maxHeight: 220 }}>
                <Text variant="footnote" color="secondary" align="center" style={{ marginBottom: spacing.sm }}>
                  Minute
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.xs }}>
                  {webMinutes.map((minute) => (
                    <Pressable
                      key={`minute-${minute}`}
                      onPress={() => {
                        const next = `${String(parsed.hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        onChange(next);
                      }}
                      style={{
                        minHeight: 42,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: parsed.minute === minute ? colors.accentSoft : 'transparent',
                      }}
                    >
                      <Text variant="headline" weight={parsed.minute === minute ? '700' : '500'} color={parsed.minute === minute ? 'accent' : 'secondary'}>
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Button
              label="Done"
              onPress={() => {
                setShowWebSheet(false);
              }}
            />
          </View>
        </BottomSheet>
      </>
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
