/**
 * Varuag OS design tokens.
 *
 * Every value is taken from the Varuag Labs website (src/styles/main.css):
 * the --vl-* colour variables for dark and light themes, the .band-paper
 * editorial band, type scale, radii, shadows and motion curves. CSS values
 * are translated to React Native units (1rem = 16px).
 */

export type ThemeName = 'dark' | 'light';

export type Palette = {
  bg: string;
  bg2: string;
  card: string;
  card2: string;
  fg: string;
  muted: string;
  faint: string;
  gold: string;
  goldText: string;
  gold1: string;
  gold2: string;
  goldHover: string;
  blue: string;
  blueText: string;
  line: string;
  lineStrong: string;
  grid: string;
  glass: string;
  glassStrong: string;
  glassBorder: string;
  glassHighlight: string;
  success: string;
  danger: string;
  header: string;
  glowGold: string;
  glowBlue: string;
  onGold: string;
  goldTint: string;
  goldBorder: string;
  blueTint: string;
  dangerTint: string;
  successTint: string;
  shadow: string;
  shadowSoft: string;
  /** Gold gradient stops used for .text-gold-gradient */
  goldGradient: string[];
};

const dark: Palette = {
  bg: '#08090d',
  bg2: '#101218',
  card: '#151821',
  card2: '#1b1f2a',
  fg: '#f5f6fa',
  muted: '#9ca3b4',
  faint: '#858b9b',
  gold: '#d6b34a',
  goldText: '#d6b34a',
  gold1: '#b8922c',
  gold2: '#f6e2a0',
  goldHover: '#e6c868',
  blue: '#536dff',
  blueText: '#94a3ff',
  line: 'rgba(255,255,255,0.10)',
  lineStrong: 'rgba(255,255,255,0.18)',
  grid: 'rgba(255,255,255,0.045)',
  glass: 'rgba(21,24,33,0.58)',
  glassStrong: 'rgba(16,18,24,0.82)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.07)',
  success: '#3ccb8a',
  danger: '#ff7a7a',
  header: 'rgba(8,9,13,0.72)',
  glowGold: 'rgba(214,179,74,0.16)',
  glowBlue: 'rgba(83,109,255,0.12)',
  onGold: '#08090d',
  goldTint: 'rgba(214,179,74,0.10)',
  goldBorder: 'rgba(214,179,74,0.45)',
  blueTint: 'rgba(83,109,255,0.14)',
  dangerTint: 'rgba(255,122,122,0.10)',
  successTint: 'rgba(60,203,138,0.10)',
  shadow: '0px 40px 80px -40px rgba(0,0,0,0.85)',
  shadowSoft: '0px 20px 50px -30px rgba(0,0,0,0.7)',
  goldGradient: ['#b8922c', '#d6b34a', '#f6e2a0', '#d6b34a', '#b8922c'],
};

const light: Palette = {
  bg: '#f5f3ed',
  bg2: '#ece8de',
  card: '#ffffff',
  card2: '#faf8f3',
  fg: '#15161b',
  muted: '#4f5463',
  faint: '#646a79',
  gold: '#d6b34a',
  goldText: '#8a6a12',
  gold1: '#7a5c0c',
  gold2: '#b8922c',
  goldHover: '#e6c868',
  blue: '#536dff',
  blueText: '#3a52d8',
  line: 'rgba(21,22,27,0.10)',
  lineStrong: 'rgba(21,22,27,0.18)',
  grid: 'rgba(21,22,27,0.055)',
  glass: 'rgba(255,255,255,0.62)',
  glassStrong: 'rgba(255,255,255,0.86)',
  glassBorder: 'rgba(21,22,27,0.09)',
  glassHighlight: 'rgba(255,255,255,0.9)',
  success: '#13804f',
  danger: '#c23a3a',
  header: 'rgba(245,243,237,0.78)',
  glowGold: 'rgba(214,179,74,0.22)',
  glowBlue: 'rgba(83,109,255,0.10)',
  onGold: '#15161b',
  goldTint: 'rgba(214,179,74,0.14)',
  goldBorder: 'rgba(138,106,18,0.45)',
  blueTint: 'rgba(83,109,255,0.10)',
  dangerTint: 'rgba(194,58,58,0.08)',
  successTint: 'rgba(19,128,79,0.08)',
  shadow: '0px 40px 80px -42px rgba(84,64,22,0.32)',
  shadowSoft: '0px 20px 50px -32px rgba(84,64,22,0.28)',
  goldGradient: ['#6e520a', '#8a6a12', '#b08a24', '#8a6a12', '#6e520a'],
};

/** The website's light editorial band (.band-paper): stays light in both themes. */
export const paperPalette = (theme: ThemeName): Palette => ({
  ...light,
  bg: theme === 'light' ? '#ffffff' : '#f3f2ee',
  bg2: '#ebe9e2',
  lineStrong: 'rgba(21,22,27,0.20)',
  grid: 'rgba(21,22,27,0.05)',
  glass: 'rgba(255,255,255,0.7)',
});

export const palettes: Record<ThemeName, Palette> = { dark, light };

/** Spacing scale (px). Website gutter is 1.25rem on phones → 20. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  x3: 32,
  x4: 40,
  x5: 48,
  x6: 56,
  gutter: 20,
} as const;

/** Radii from the website: .card 1.25rem, .field 0.85rem, .portrait 1rem, pills 999px. */
export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

/** Font families (each weight is its own family in React Native). */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;

/** Type scale translated from the website's clamp() values at phone width. */
export const type = {
  display: { fontSize: 40, lineHeight: 39, letterSpacing: -1.8 }, // .display: -0.045em, lh .94
  h1: { fontSize: 35, lineHeight: 35, letterSpacing: -1.47 }, // .h-section: -0.042em
  h2: { fontSize: 28, lineHeight: 30, letterSpacing: -1.18 },
  h3: { fontSize: 21, lineHeight: 26, letterSpacing: -0.42 },
  title: { fontSize: 17, lineHeight: 22, letterSpacing: -0.34 },
  lead: { fontSize: 16, lineHeight: 27, letterSpacing: 0 }, // .lead lh 1.7
  body: { fontSize: 15, lineHeight: 23, letterSpacing: 0 },
  bodySm: { fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  eyebrow: { fontSize: 11, lineHeight: 14, letterSpacing: 1.76 }, // .eyebrow .16em
  mono: { fontSize: 11, lineHeight: 14, letterSpacing: 1.54 }, // .mono-label .14em
  monoSm: { fontSize: 10, lineHeight: 13, letterSpacing: 1.4 },
  button: { fontSize: 13, lineHeight: 16, letterSpacing: 0.91 }, // .btn .07em
  stat: { fontSize: 30, lineHeight: 30, letterSpacing: -1.2 },
  amount: { fontSize: 40, lineHeight: 42, letterSpacing: -1.8 },
  mega: { fontSize: 72, lineHeight: 70, letterSpacing: -4 },
} as const;

/** Motion curves and durations from the website. */
export const motion = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOutQuart: [0.76, 0, 0.24, 1] as const,
  lineUp: 1150,
  fadeUp: 1000,
  reveal: 900,
  press: 350,
  stagger: 90,
} as const;

/** Bottom inset reserved for the floating tab bar. */
export const TAB_BAR_SPACE = 112;
