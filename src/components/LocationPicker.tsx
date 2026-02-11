import { useState, useCallback } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POPULAR_LOCATIONS } from '@/constants/locations';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  onClose?: () => void;
}

export function LocationPicker({ onLocationSelect, onClose }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setError('');
    
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
        onClose?.();
      } else {
        setError('Location not found');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery, onLocationSelect, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCityClick = (loc: typeof POPULAR_LOCATIONS[0]) => {
    onLocationSelect(loc.lat, loc.lng, loc.name);
    onClose?.();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Search location</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter city or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            size="icon"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Popular food cities</label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_LOCATIONS.map((loc) => (
            <Button
              key={loc.name}
              variant="outline"
              size="sm"
              onClick={() => handleCityClick(loc)}
              className="h-auto flex-col gap-0.5 rounded-xl px-3 py-2 text-xs hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-3 w-3 text-primary" />
                {loc.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{loc.tag}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
