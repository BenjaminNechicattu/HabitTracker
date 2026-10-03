import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

export async function shareBackupFile(json: string): Promise<'shared' | 'downloaded' | 'unavailable'> {
  const filename = `habitty-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;

  if (Platform.OS === 'web') {
    const doc = (globalThis as { document?: Document }).document;
    if (!doc) {
      return 'unavailable';
    }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = doc.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

  if (!(await Sharing.isAvailableAsync())) {
    return 'unavailable';
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Habitty backup', UTI: 'public.json' });
  return 'shared';
}

/** Lets the user pick a backup and returns its text, or null when cancelled. */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  const { uri } = result.assets[0];
  if (Platform.OS === 'web') {
    return (await fetch(uri)).text();
  }
  return new File(uri).text();
}
