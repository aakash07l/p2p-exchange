'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useCallback } from 'react';

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    toggleTheme,
    setTheme,
  };
}
