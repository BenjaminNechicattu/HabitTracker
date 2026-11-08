export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  card: 24,
  xl: 28,
  sheet: 32,
  pill: 999,
} as const;

export type ThemeColors = {
  isDark: boolean;
  bg: string;
  card: string;
  fill: string;
  fillStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  lime: string;
  nav: string;
  navBorder: string;
  navIcon: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  overlay: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  isDark: false,
  bg: '#F3F5F9',
  card: '#FFFFFF',
  fill: '#EEF1F6',
  fillStrong: '#E3E7EE',
  text: '#0B1220',
  textSecondary: '#5B6475',
  textTertiary: '#8B93A3',
  separator: 'rgba(15,23,42,0.08)',
  accent: '#2F6FEB',
  accentSoft: 'rgba(47,111,235,0.12)',
  onAccent: '#FFFFFF',
  lime: '#C9F23A',
  nav: 'rgba(22,23,26,0.92)',
  navBorder: 'rgba(255,255,255,0.08)',
  navIcon: '#FFFFFF',
  success: '#2FB457',
  successSoft: 'rgba(47,180,87,0.14)',
  danger: '#D93F32',
  dangerSoft: 'rgba(217,63,50,0.12)',
  warning: '#F29A1F',
  overlay: 'rgba(8,12,22,0.45)',
  shadow: 'rgba(15,23,42,0.07)',
};

export const darkColors: ThemeColors = {
  isDark: true,
  bg: '#0B0D11',
  card: '#16191F',
  fill: '#1F232B',
  fillStrong: '#2A2F39',
  text: '#F4F6FA',
  textSecondary: '#A0A8B7',
  textTertiary: '#6F7788',
  separator: 'rgba(255,255,255,0.08)',
  accent: '#5B93FF',
  accentSoft: 'rgba(91,147,255,0.18)',
  onAccent: '#FFFFFF',
  lime: '#C9F23A',
  nav: 'rgba(38,41,48,0.92)',
  navBorder: 'rgba(255,255,255,0.1)',
  navIcon: '#FFFFFF',
  success: '#3CCB6B',
  successSoft: 'rgba(60,203,107,0.18)',
  danger: '#FF6B5E',
  dangerSoft: 'rgba(255,107,94,0.16)',
  warning: '#FFB444',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.4)',
};

export const amoledColors: ThemeColors = {
  ...darkColors,
  bg: '#000000',
  card: '#0F1114',
  fill: '#181B20',
  fillStrong: '#23272E',
  nav: 'rgba(30,32,38,0.94)',
};

export const HABIT_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#22C55E',
  '#F59E0B',
  '#EC4899',
  '#EF4444',
  '#14B8A6',
  '#64748B',
] as const;

export const DEFAULT_HABIT_COLOR: string = HABIT_COLORS[0];

export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 23, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase' },
  metric: { fontSize: 44, lineHeight: 50, fontWeight: '800', letterSpacing: -1 },
} as const;

export type TypeVariant = keyof typeof typography;

export const MIN_TOUCH = 44;

export function cardShadow(colors: ThemeColors): string {
  return `0px 6px 20px ${colors.shadow}`;
}

/** Appends an alpha channel to a #RRGGBB colour. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    return hex;
  }
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${a}`;
}
