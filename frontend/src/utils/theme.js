export const THEME_KEY = 'eduTheme';
export const THEME_CHANGE_EVENT = 'edutrack:theme-change';

export function normalizeTheme(value) {
  if (value === 'light' || value === 'dark') return value;
  return null;
}

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';

  const saved = normalizeTheme(window.localStorage.getItem(THEME_KEY));
  if (saved) return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const nextTheme = normalizeTheme(theme) || 'dark';

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.setAttribute('data-auth-theme', nextTheme);
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: nextTheme } })
    );
  }

  return nextTheme;
}

export function toggleTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark';
}
