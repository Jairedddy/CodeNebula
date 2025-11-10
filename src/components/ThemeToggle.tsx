import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const isBrowser = typeof window !== 'undefined';

const getInitialTheme = (): Theme => {
  if (!isBrowser) return 'dark';
  const stored = window.localStorage.getItem('code-nebula-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (!isBrowser) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('code-nebula-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isBrowser) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem('code-nebula-theme')) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-full border-border/60 bg-card/80 transition-colors hover:border-primary/70 hover:bg-primary/20 hover:text-primary"
      aria-label={`Activate ${isDark ? 'light' : 'dark'} theme`}
    >
      <Sun className={`h-4 w-4 transition-transform ${isDark ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`} />
      <Moon className={`absolute h-4 w-4 transition-transform ${isDark ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
    </Button>
  );
}

