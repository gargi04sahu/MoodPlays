import { MapView } from './MapViewComponent';
import type { Place } from '@/services/placesApi';

interface MapViewWrapperProps {
  userLocation: { latitude: number; longitude: number } | null;
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string) => void;
}

export function MapViewWrapper(props: MapViewWrapperProps) {
  return <MapView {...props} />;
}
