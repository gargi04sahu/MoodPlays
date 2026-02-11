import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Place } from '@/services/placesApi';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: `<div style="width:20px;height:20px;background:hsl(245 58% 51%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const placeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string) => void;
}

export function MapView({ userLocation, places, selectedPlaceId, onPlaceSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = userLocation 
      ? [userLocation.latitude, userLocation.longitude] 
      : [28.6139, 77.2090]; // Default to Delhi

    mapRef.current = L.map(containerRef.current).setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current);

    // Invalidate size after a delay
    setTimeout(() => mapRef.current?.invalidateSize(), 250);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .bindPopup('Your Location')
        .addTo(mapRef.current);
    }
    mapRef.current.setView([userLocation.latitude, userLocation.longitude], 14);
    mapRef.current.invalidateSize();
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m, id) => {
      if (!places.find(p => p.id === id)) {
        m.remove();
        markersRef.current.delete(id);
      }
    });

    places.forEach((place) => {
      if (!markersRef.current.has(place.id)) {
        const marker = L.marker([place.latitude, place.longitude], { icon: placeIcon })
          .bindPopup(`<b>${place.name}</b><br>${place.category}`)
          .on('click', () => onPlaceSelect(place.id))
          .addTo(mapRef.current!);
        markersRef.current.set(place.id, marker);
      }
    });

    if (places.length > 0 && userLocation) {
      const bounds = L.latLngBounds(places.map(p => [p.latitude, p.longitude] as [number, number]));
      bounds.extend([userLocation.latitude, userLocation.longitude]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [places, userLocation, onPlaceSelect]);

  useEffect(() => {
    if (!mapRef.current || !selectedPlaceId) return;
    const place = places.find(p => p.id === selectedPlaceId);
    if (place) {
      mapRef.current.flyTo([place.latitude, place.longitude], 16);
      markersRef.current.get(selectedPlaceId)?.openPopup();
    }
  }, [selectedPlaceId, places]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />;
}
