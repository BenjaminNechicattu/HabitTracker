import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getDateKey } from '../logic/progress';

/** Today's date key, refreshed at midnight and whenever the app returns to the foreground. */
export function useTodayKey(): string {
  const [key, setKey] = useState(() => getDateKey(new Date()));

  useEffect(() => {
    const refresh = () => setKey(getDateKey(new Date()));

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1).getTime();
    const timer = setTimeout(refresh, Math.max(1000, nextMidnight - now.getTime()));

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [key]);

  return key;
}
