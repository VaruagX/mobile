import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { palettes, paperPalette, type Palette, type ThemeName } from './tokens';

export type ThemePreference = 'system' | ThemeName;

type ThemeContextValue = {
  name: ThemeName;
  colors: Palette;
  paper: Palette;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
};

const STORAGE_KEY = 'vos.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Web preview only: ?theme=light|dark lets reviewers and screenshots pick a theme. */
function previewTheme(): ThemePreference | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('theme');
  return value === 'light' || value === 'dark' ? value : null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(() => previewTheme() ?? 'dark');

  useEffect(() => {
    if (previewTheme()) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'system' || saved === 'dark' || saved === 'light') setPref(saved);
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPref(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  }, []);

  // The website defaults to dark; "system" follows the phone setting.
  const name: ThemeName = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      name,
      colors: palettes[name],
      paper: paperPalette(name),
      preference,
      setPreference,
      toggle: () => setPreference(name === 'dark' ? 'light' : 'dark'),
    }),
    [name, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/** Lets a subtree (the leadership "paper" band) use a different palette. */
const PaletteOverride = createContext<Palette | null>(null);
export const PaletteScope = PaletteOverride.Provider;

/** Colours for the current scope: the paper band inside it, else the theme. */
export function useColors(): Palette {
  const override = useContext(PaletteOverride);
  const { colors } = useTheme();
  return override ?? colors;
}
