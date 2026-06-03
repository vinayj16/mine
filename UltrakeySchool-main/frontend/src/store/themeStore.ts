import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggle: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const stored = localStorage.getItem('theme');
  const initialDark = stored === 'dark';

  if (initialDark) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  }

  return {
    isDarkMode: initialDark,
    toggle: () =>
      set((state) => {
        const next = !state.isDarkMode;
        document.documentElement.setAttribute('data-bs-theme', next ? 'dark' : 'light');
        localStorage.setItem('theme', next ? 'dark' : 'light');
        return { isDarkMode: next };
      }),
    setDarkMode: (dark: boolean) => {
      document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      set({ isDarkMode: dark });
    },
  };
});
