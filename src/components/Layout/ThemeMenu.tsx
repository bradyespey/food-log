import { Monitor, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

interface ThemeMenuProps {
  className?: string;
  showLabel?: boolean;
  side?: 'top' | 'bottom';
  align?: 'start' | 'end';
}

export function ThemeMenu({ className, showLabel = false, side = 'bottom', align = 'end' }: ThemeMenuProps) {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle appearance"
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors',
            'border-border bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground',
            className
          )}
        >
          <ThemeIcon className="h-4 w-4" />
          {showLabel && <span>Appearance</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
