import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { amoledColors, darkColors, lightColors, ThemeColors } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark' | 'amoled';

const ThemeContext = createContext<ThemeColors>(lightColors);

export function resolveColors(mode: ThemeMode, systemScheme: string | null | undefined): ThemeColors {
  if (mode === 'amoled') {
    return amoledColors;
  }
  if (mode === 'dark') {
    return darkColors;
  }
  if (mode === 'light') {
    return lightColors;
  }
  return systemScheme === 'dark' ? darkColors : lightColors;
}

export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const systemScheme = useColorScheme();
  const colors = useMemo(() => resolveColors(mode, systemScheme), [mode, systemScheme]);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
