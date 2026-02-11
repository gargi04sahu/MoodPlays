import { Clock, X } from 'lucide-react';
import { Place } from '@/services/placesApi';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface RecentlyViewedProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
  onClear: () => void;
}

export function RecentlyViewed({ places, onPlaceClick, onClear }: RecentlyViewedProps) {
  if (places.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Recently Viewed</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {places.map((place) => (
            <button
              key={place.id}
              onClick={() => onPlaceClick(place)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {place.name.charAt(0).toUpperCase()}
              </div>
              <div className="max-w-[120px]">
                <p className="text-sm font-medium truncate">{place.name}</p>
                <p className="text-xs text-muted-foreground truncate">{place.category}</p>
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
