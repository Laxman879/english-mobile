import { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeKey = 'dark' | 'light' | 'golden';

export interface ThemeColors {
  bg: string; card: string; card2: string; border: string;
  text: string; text2: string; muted: string;
  primary: string; primaryDk: string; primaryFg: string; primarySoft: string;
  blue: string; blueSoft: string; fire: string; fireSoft: string;
  inputBg: string; nav: string;
}

const themes: Record<ThemeKey, ThemeColors> = {
  dark: {
    bg: '#0d1117', card: '#161b22', card2: '#1c2333', border: '#21262d',
    text: '#e6edf3', text2: '#b0bec5', muted: '#484f58',
    primary: '#3fb950', primaryDk: '#2ea043', primaryFg: '#ffffff', primarySoft: '#0d2818',
    blue: '#58a6ff', blueSoft: '#0d2149', fire: '#fb923c', fireSoft: '#2d1a0a',
    inputBg: '#1c2333', nav: 'rgba(13,17,23,0.96)',
  },
  light: {
    bg: '#f6f8fa', card: '#ffffff', card2: '#f0f4f8', border: '#e2e8f0',
    text: '#0f172a', text2: '#475569', muted: '#94a3b8',
    primary: '#22c55e', primaryDk: '#16a34a', primaryFg: '#ffffff', primarySoft: '#dcfce7',
    blue: '#3b82f6', blueSoft: '#dbeafe', fire: '#f97316', fireSoft: '#fff7ed',
    inputBg: '#f1f5f9', nav: 'rgba(255,255,255,0.94)',
  },
  golden: {
    bg: '#0d0a04', card: '#1a1508', card2: '#231e0c', border: '#3d3210',
    text: '#fefce8', text2: '#fde68a', muted: '#92700a',
    primary: '#F5B027', primaryDk: '#d4940f', primaryFg: '#0d0a04', primarySoft: '#3d2c05',
    blue: '#F5B027', blueSoft: '#3d2c05', fire: '#fb923c', fireSoft: '#3d1a05',
    inputBg: '#231e0c', nav: 'rgba(13,10,4,0.96)',
  },
};

interface ThemeContextType {
  theme: ThemeKey;
  C: ThemeColors;
  setTheme: (t: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark', C: themes.dark, setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeKey>('dark');
  return (
    <ThemeContext.Provider value={{ theme, C: themes[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
