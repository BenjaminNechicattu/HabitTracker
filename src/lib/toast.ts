import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export type ToastPayload = {
  id: number;
  message: string;
  icon?: IconName;
  tone?: 'default' | 'success' | 'danger';
};

type Listener = (toast: ToastPayload) => void;

let listener: Listener | null = null;
let nextId = 1;

export function registerToastListener(next: Listener | null) {
  listener = next;
}

export function showToast(message: string, options: { icon?: IconName; tone?: ToastPayload['tone'] } = {}) {
  listener?.({ id: nextId++, message, ...options });
}
