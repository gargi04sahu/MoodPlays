import { useState, useCallback, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation, Coffee, Utensils, Wine, Sparkles, TrendingUp, Users, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POPULAR_LOCATIONS } from '@/constants/locations';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  onUseCurrentLocation: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const features = [
  { icon: Coffee, label: 'Cafes', color: 'text-amber-500' },
  { icon: Utensils, label: 'Restaurants', color: 'text-rose-500' },
  { icon: Wine, label: 'Bars', color: 'text-violet-500' },
];

const stats = [
  { icon: TrendingUp, value: '5K+', label: 'Places', delay: 0 },
  { icon: Users, value: '10K+', label: 'Users', delay: 150 },
  { icon: Star, value: '4.8', label: 'Rating', delay: 300 },
];

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  
  useEffect(() => {
    const numericPart = parseInt(target.replace(/[^0-9]/g, ''));
    const hasDot = target.includes('.');
    const duration = 1500;
    const steps = 30;
    const increment = numericPart / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), numericPart);
      if (hasDot) {
        setDisplay((current / 10).toFixed(1));
      } else {
        setDisplay(current.toString());
      }
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(target.replace('+', '').replace('K', ''));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [target]);
  
  return <>{display}{target.includes('K') ? 'K' : ''}{target.includes('+') ? '+' : ''}{suffix}</>;
}

export function WelcomeScreen({ onLocationSelect, onUseCurrentLocation, isLoading, error }: WelcomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'User-Agent': 'MoodPlaces/1.0' } }
      );
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const name = display_name.split(',')[0];
        onLocationSelect(parseFloat(lat), parseFloat(lon), name);
      } else {
        setSearchError('Location not found. Try a different search.');
      }
    } catch (err) {
      setSearchError('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchQuery, onLocationSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <div className="relative flex-1 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-mood-date/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating food icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className={cn("absolute text-2xl animate-float transition-opacity duration-1000", mounted ? "opacity-20" : "opacity-0")} style={{ top: '15%', left: '10%', animationDelay: '0.5s' }}>☕</span>
          <span className={cn("absolute text-2xl animate-float transition-opacity duration-1000", mounted ? "opacity-20" : "opacity-0")} style={{ top: '25%', right: '15%', animationDelay: '1.5s' }}>🍕</span>
          <span className={cn("absolute text-2xl animate-float transition-opacity duration-1000", mounted ? "opacity-20" : "opacity-0")} style={{ top: '60%', left: '5%', animationDelay: '2.5s' }}>🍜</span>
          <span className={cn("absolute text-2xl animate-float transition-opacity duration-1000", mounted ? "opacity-20" : "opacity-0")} style={{ bottom: '20%', right: '8%', animationDelay: '0.8s' }}>🎉</span>
          <span className={cn("absolute text-2xl animate-float transition-opacity duration-1000", mounted ? "opacity-20" : "opacity-0")} style={{ top: '45%', right: '5%', animationDelay: '1.8s' }}>🍔</span>
        </div>

        <div className="relative flex h-full flex-col items-center justify-center px-4 py-16 sm:py-24">
          <div className={cn("mx-auto max-w-2xl text-center transition-all duration-700", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            {/* Logo/Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2.5 backdrop-blur-sm animate-scale-in">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">AI-Powered Places Discovery</span>
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Find your
              <span className="relative mx-3 inline-block">
                <span className="bg-gradient-to-r from-primary via-mood-date to-mood-fun bg-clip-text text-transparent">
                  perfect
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 7 Q50 0 100 7" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" opacity="0.3" />
                </svg>
              </span>
              <br className="hidden sm:block" />
              spot
            </h1>

            {/* Subheading */}
            <p className={cn("mb-8 text-lg text-muted-foreground sm:text-xl transition-all duration-700 delay-200", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              Discover amazing places based on your mood — with AI-powered recommendations.
            </p>

            {/* Feature pills */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {features.map(({ icon: Icon, label, color }, idx) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2 rounded-full border bg-card/50 px-4 py-2 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-md",
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                  style={{ transitionDelay: `${300 + idx * 100}ms` }}
                >
                  <Icon className={cn('h-4 w-4', color)} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className={cn("mb-10 flex items-center justify-center gap-6 sm:gap-10 transition-all duration-700 delay-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              {stats.map(({ icon: Icon, value, label, delay }) => (
                <div key={label} className="flex flex-col items-center gap-1" style={{ animationDelay: `${delay}ms` }}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold sm:text-2xl">
                      {mounted ? <AnimatedCounter target={value} /> : '0'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* Location Input */}
            <div className={cn("mx-auto max-w-md space-y-4 transition-all duration-700 delay-700", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              {/* Use current location button */}
              <Button
                size="lg"
                onClick={onUseCurrentLocation}
                disabled={isLoading}
                className="w-full gap-3 py-6 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Getting your location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-5 w-5" />
                    Use My Current Location
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-muted-foreground animate-fade-in">{error}</p>
              )}

              <div className="relative flex items-center">
                <div className="flex-1 border-t" />
                <span className="mx-4 text-xs text-muted-foreground">or search for a city</span>
                <div className="flex-1 border-t" />
              </div>

              {/* Search input */}
              <div className="flex items-center gap-2 rounded-xl border bg-card p-1.5 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for a city or place..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-5"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {searchError && (
                <p className="text-sm text-destructive animate-fade-in">{searchError}</p>
              )}

              {/* Popular cities */}
              <div className="pt-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground">Popular cities</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_LOCATIONS.map((loc, idx) => (
                    <Button
                      key={loc.name}
                      variant="outline"
                      size="sm"
                      onClick={() => onLocationSelect(loc.lat, loc.lng, loc.name)}
                      className={cn(
                        "h-9 gap-1.5 rounded-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent hover:scale-105 transition-all duration-200",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      )}
                      style={{ transitionDelay: `${900 + idx * 80}ms` }}
                    >
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {loc.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 px-4 py-4 text-center backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          Built with ❤️ • Powered by OpenStreetMap & AI
        </p>
      </footer>
    </div>
  );
}
