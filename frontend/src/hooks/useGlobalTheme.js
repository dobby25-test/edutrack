import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  getInitialTheme,
  THEME_CHANGE_EVENT,
  toggleTheme as flipTheme
} from '../utils/theme';

export default function useGlobalTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onThemeChange = (event) => {
      const next = event?.detail?.theme;
      if (next === 'light' || next === 'dark') {
        setTheme(next);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => flipTheme(prev));
  }, []);

  return { theme, setTheme, toggleTheme };
}
