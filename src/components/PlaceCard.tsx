import { Star, MapPin, Clock, ChevronRight, Heart, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from '@/utils/distanceCalculator';
import { getClosingSoonInfo, formatTimeUntilClose } from '@/utils/openingHoursParser';
import type { Place, CuisineType } from '@/services/placesApi';
import type { MoodType } from '@/utils/moodMapper';
import { WhyThisPlace } from '@/components/WhyThisPlace';
import { cn } from '@/lib/utils';

const cuisineLabels: Record<CuisineType, string> = {
  'north-indian': 'North Indian',
  'south-indian': 'South Indian',
  'chinese': 'Chinese',
  'fast-food': 'Fast Food',
  'cafe': 'Cafe',
  'continental': 'Continental',
  'mughlai': 'Mughlai',
  'street-food': 'Street Food',
  'other': 'Other',
};

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
  isFavorite?: boolean;
  mood?: MoodType | null;
  onClick?: () => void;
  onDetailsClick?: () => void;
  onFavoriteClick?: () => void;
}

export function PlaceCard({ place, isSelected, isFavorite, mood, onClick, onDetailsClick, onFavoriteClick }: PlaceCardProps) {
  const closingSoonInfo = getClosingSoonInfo(place.openingHours);
  
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDetailsClick?.();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick?.();
  };

  return (
    <Card
      className={cn(
        'cursor-pointer p-4 transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight truncate">{place.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{place.category}</p>
            {place.cuisineType && place.cuisineType !== 'other' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {cuisineLabels[place.cuisineType]}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 shrink-0">
          {place.isOpen !== undefined && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                place.isOpen
                  ? closingSoonInfo.isClosingSoon
                    ? 'bg-status-warning/10 text-status-warning'
                    : 'bg-status-open/10 text-status-open'
                  : 'bg-status-closed/10 text-status-closed'
              )}
            >
              {closingSoonInfo.isClosingSoon ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {place.isOpen 
                ? closingSoonInfo.isClosingSoon && closingSoonInfo.minutesUntilClose
                  ? formatTimeUntilClose(closingSoonInfo.minutesUntilClose)
                  : 'Open'
                : 'Closed'}
            </span>
          )}
          {place.openingHours && !closingSoonInfo.isClosingSoon && (
            <span className="text-[10px] text-muted-foreground max-w-[100px] text-right truncate" title={place.openingHours}>
              {place.openingHours}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{formatDistance(place.distance)}</span>
        </div>

        {place.rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium">{place.rating.toFixed(1)}</span>
          </div>
        )}

        {place.priceLevel !== undefined && (
          <span className="text-muted-foreground font-medium">
            {'₹'.repeat(place.priceLevel)}
            <span className="opacity-30">{'₹'.repeat(3 - place.priceLevel)}</span>
          </span>
        )}
      </div>

      {place.address && (
        <p className="mt-2 text-xs text-muted-foreground truncate">{place.address}</p>
      )}

      {/* AI-powered recommendation */}
      {isSelected && (
        <WhyThisPlace place={place} mood={mood} className="mt-3" />
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFavoriteClick}
          className={cn(
            'h-8 w-8 p-0',
            isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'
          )}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDetailsClick}
          className="flex-1 justify-between text-xs text-muted-foreground hover:text-foreground"
        >
          View details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
