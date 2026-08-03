import { ThemeColor } from '../types/habit';

const THEME_ACCENTS: Record<
  ThemeColor,
  {
    light: { accent: string; accent2: string; border: string };
    dark: { accent: string; accent2: string; border: string };
  }
> = {
  violet: {
    light: { accent: '#6653ff', accent2: '#9d8bff', border: '#e6e0ff' },
    dark: { accent: '#8a77ff', accent2: '#b5a7ff', border: '#2a2a2a' },
  },
  teal: {
    light: { accent: '#0f9d9a', accent2: '#43c3c0', border: '#d7f0ef' },
    dark: { accent: '#27c8c3', accent2: '#6ce6e2', border: '#2a2a2a' },
  },
  sunset: {
    light: { accent: '#e97132', accent2: '#f7a15a', border: '#ffe6d7' },
    dark: { accent: '#ff9a57', accent2: '#ffc08f', border: '#2a2a2a' },
  },
  rose: {
    light: { accent: '#d14f82', accent2: '#e37aa3', border: '#f8deea' },
    dark: { accent: '#f06da3', accent2: '#f59ac0', border: '#2a2a2a' },
  },
  forest: {
    light: { accent: '#2f8f4e', accent2: '#58b373', border: '#dbefdf' },
    dark: { accent: '#4fc274', accent2: '#7fe09f', border: '#2a2a2a' },
  },
  gray: {
    light: { accent: '#666f7a', accent2: '#9299a3', border: '#e3e6ea' },
    dark: { accent: '#9ea5af', accent2: '#c4c9d0', border: '#2a2a2a' },
  },
  blue: {
    light: { accent: '#2563eb', accent2: '#5d8ef5', border: '#dbeafe' },
    dark: { accent: '#4a87ff', accent2: '#79a8ff', border: '#2a2a2a' },
  },
  red: {
    light: { accent: '#dc2626', accent2: '#f06060', border: '#fee2e2' },
    dark: { accent: '#f04545', accent2: '#f97070', border: '#2a2a2a' },
  },
};

export function buildPalette(darkMode: boolean, themeColor: ThemeColor, amoled = false) {
  const accents = THEME_ACCENTS[themeColor] ?? THEME_ACCENTS.violet;

  return darkMode
    ? {
        bg: '#000000',
        card: amoled ? '#000000' : '#0d0d0d',
        text: '#f3f3f3',
        muted: '#a9a9a9',
        accent: accents.dark.accent,
        accent2: accents.dark.accent2,
        border: amoled ? '#181818' : accents.dark.border,
      }
    : {
        bg: '#f4f2ff',
        card: '#ffffff',
        text: '#1e2346',
        muted: '#6f7495',
        accent: accents.light.accent,
        accent2: accents.light.accent2,
        border: accents.light.border,
      };
}
