import { useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POPULAR_LOCATIONS } from '@/constants/locations';

export function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MapPin className="h-8 w-8" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Getting your location...</h2>
        <p className="text-sm text-muted-foreground">Please allow location access when prompted</p>
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onManualLocation?: (lat: number, lng: number) => void;
}

export function ErrorState({ message, onRetry, onManualLocation }: ErrorStateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('[LocationStates] Searching for:', searchQuery);
    setSearching(true);
    setSearchError('');
    
    try {
      // Use OpenStreetMap Nominatim for geocoding (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'User-Agent': 'MoodPlaces/1.0' } }
      );
      
      const results = await response.json();
      console.log('[LocationStates] Search results:', results);
      
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        console.log('[LocationStates] Setting location from search:', { lat, lon });
        onManualLocation?.(parseFloat(lat), parseFloat(lon));
      } else {
        setSearchError('Location not found. Try a different search.');
      }
    } catch (error) {
      console.error('[LocationStates] Search error:', error);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <MapPin className="h-8 w-8" />
      </div>
      
      <div className="text-center">
        <h2 className="text-lg font-semibold">Location Error</h2>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>

      <Button onClick={onRetry} variant="outline" size="sm">
        Try Again
      </Button>

      {onManualLocation && (
        <div className="w-full max-w-sm space-y-4">
          <div className="relative flex items-center gap-2 rounded-lg border bg-card p-1">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              onClick={handleSearch} 
              disabled={searching || !searchQuery.trim()}
              size="sm"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
          
          {searchError && (
            <p className="text-center text-sm text-destructive">{searchError}</p>
          )}

          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">Or select a popular city:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_LOCATIONS.map((loc) => (
                <Button
                  key={loc.name}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    console.log('[LocationStates] Popular city clicked:', loc.name, loc.lat, loc.lng);
                    onManualLocation(loc.lat, loc.lng);
                  }}
                  className="text-xs"
                >
                  {loc.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
