import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import { HabitTemplate, TabKey } from '../types/habit';

export type Route =
  | { name: 'habit'; id: string }
  | { name: 'form'; id?: string; template?: HabitTemplate }
  | { name: 'profile' }
  | { name: 'reminders' };

type NavValue = {
  tab: TabKey;
  stack: Route[];
  setTab: (tab: TabKey) => void;
  push: (route: Route) => void;
  pop: () => void;
  /** Replace the top route (e.g. the template picker becoming the form). */
  replace: (route: Route) => void;
};

const NavContext = createContext<NavValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<TabKey>('today');
  const [stack, setStack] = useState<Route[]>([]);

  const setTab = useCallback((next: TabKey) => {
    setStack([]);
    setTabState(next);
  }, []);
  const push = useCallback((route: Route) => setStack((prev) => [...prev, route]), []);
  const pop = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);
  const replace = useCallback((route: Route) => setStack((prev) => [...prev.slice(0, -1), route]), []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 0) {
        pop();
        return true;
      }
      if (tab !== 'today') {
        setTabState('today');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [stack.length, tab, pop]);

  const value = useMemo(() => ({ tab, stack, setTab, push, pop, replace }), [tab, stack, setTab, push, pop, replace]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavValue {
  const value = useContext(NavContext);
  if (!value) {
    throw new Error('useNav must be used inside <NavProvider>');
  }
  return value;
}
