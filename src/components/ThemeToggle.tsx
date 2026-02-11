import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        'relative h-10 w-10 overflow-hidden rounded-full transition-colors duration-300',
        isDark 
          ? 'bg-accent hover:bg-accent/80' 
          : 'bg-secondary hover:bg-secondary/80',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon */}
      <Sun 
        className={cn(
          'absolute h-5 w-5 text-amber-500 transition-all duration-500 ease-out',
          isDark 
            ? 'translate-y-10 rotate-90 opacity-0' 
            : 'translate-y-0 rotate-0 opacity-100'
        )}
      />
      
      {/* Moon icon */}
      <Moon 
        className={cn(
          'absolute h-5 w-5 text-primary transition-all duration-500 ease-out',
          isDark 
            ? 'translate-y-0 rotate-0 opacity-100' 
            : '-translate-y-10 -rotate-90 opacity-0'
        )}
      />
      
      {/* Background glow effect */}
      <span 
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-500',
          isDark 
            ? 'bg-gradient-to-br from-primary/20 to-transparent' 
            : 'bg-gradient-to-br from-amber-500/20 to-transparent'
        )}
      />
    </Button>
  );
}
