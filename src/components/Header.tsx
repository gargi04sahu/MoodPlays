import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronDown, Sparkles, Navigation, Loader2, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LocationPicker } from '@/components/LocationPicker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  locationName?: string;
  onChangeLocation?: (lat: number, lng: number, name: string) => void;
  onBack?: () => void;
  onDetectLocation?: () => void;
  isDetectingLocation?: boolean;
}

export function Header({ theme, onToggleTheme, locationName, onChangeLocation, onBack, onDetectLocation, isDetectingLocation }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-xl transition-colors duration-300">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 rounded-full transition-all duration-200 hover:bg-accent"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MoodPlaces</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Discover places that match your vibe</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onDetectLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDetectLocation}
              disabled={isDetectingLocation}
              className="gap-2 rounded-full border-border/50 bg-card/50 px-3 backdrop-blur-sm transition-colors duration-300 hover:bg-accent"
              title="Detect my location"
            >
              {isDetectingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Navigation className="h-4 w-4 text-primary" />
              )}
              <span className="hidden text-sm sm:block">
                {isDetectingLocation ? 'Detecting...' : 'Detect Location'}
              </span>
            </Button>
          )}
          
          {locationName && onChangeLocation && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full border-border/50 bg-card/50 px-4 backdrop-blur-sm transition-colors duration-300 hover:bg-accent"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="hidden max-w-[120px] truncate text-sm sm:block">{locationName}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <LocationPicker 
                  onLocationSelect={onChangeLocation} 
                  onClose={() => setOpen(false)} 
                />
              </PopoverContent>
            </Popover>
          )}
          
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="gap-2 rounded-full border-border/50 bg-card/50 px-3 backdrop-blur-sm"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden text-sm sm:block">Sign out</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-2 rounded-full border-border/50 bg-card/50 px-3 backdrop-blur-sm"
            >
              <User className="h-4 w-4" />
              <span className="hidden text-sm sm:block">Sign in</span>
            </Button>
          )}

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
