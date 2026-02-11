import { useState, useEffect, useCallback } from 'react';
import { Place } from '@/services/placesApi';

const STORAGE_KEY = 'recentlyViewedPlaces';
const MAX_RECENT_PLACES = 5;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Place[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recently viewed places:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const addToRecentlyViewed = useCallback((place: Place) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter((p) => p.id !== place.id);
      // Add to front of array
      const updated = [place, ...filtered].slice(0, MAX_RECENT_PLACES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed };
}
