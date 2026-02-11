import { useState, useEffect, useCallback, useRef } from 'react';

const LOCATION_STORAGE_KEY = 'moodplaces_saved_location';
const GEOLOCATION_TIMEOUT = 5000; // 5 seconds timeout

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  isManual: boolean;
  showLocationPicker: boolean;
}

interface SavedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

function getSavedLocation(): SavedLocation | null {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SavedLocation;
      // Only use if less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        console.log('[Geolocation] Found saved location:', parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Geolocation] Failed to read saved location:', e);
  }
  return null;
}

function saveLocation(latitude: number, longitude: number) {
  try {
    const data: SavedLocation = { latitude, longitude, timestamp: Date.now() };
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(data));
    console.log('[Geolocation] Saved location to storage:', data);
  } catch (e) {
    console.warn('[Geolocation] Failed to save location:', e);
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => {
    // Check for saved location on init
    const saved = getSavedLocation();
    if (saved) {
      return {
        latitude: saved.latitude,
        longitude: saved.longitude,
        error: null,
        loading: false,
        isManual: true,
        showLocationPicker: false,
      };
    }
    return {
      latitude: null,
      longitude: null,
      error: null,
      loading: true,
      isManual: false,
      showLocationPicker: false,
    };
  });

  const timeoutRef = useRef<number | null>(null);

  const showPicker = useCallback(() => {
    setState((prev) => ({
      ...prev,
      loading: false,
      showLocationPicker: true,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    console.log('[Geolocation] Requesting browser location...');
    
    if (!navigator.geolocation) {
      console.warn('[Geolocation] Browser does not support geolocation');
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        showLocationPicker: true,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, showLocationPicker: false }));

    // Set a timeout to show the picker if geolocation takes too long
    timeoutRef.current = window.setTimeout(() => {
      console.log('[Geolocation] Timeout - showing location picker');
      showPicker();
    }, GEOLOCATION_TIMEOUT);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        console.log('[Geolocation] Got browser location:', position.coords);
        const { latitude, longitude } = position.coords;
        saveLocation(latitude, longitude);
        setState({
          latitude,
          longitude,
          error: null,
          loading: false,
          isManual: false,
          showLocationPicker: false,
        });
      },
      (error) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        console.warn('[Geolocation] Browser location error:', error.code, error.message);
        // On any error, immediately show the location picker without error message
        // This provides a smoother UX - user can just pick a city
        setState((prev) => ({
          ...prev,
          error: null,
          loading: false,
          showLocationPicker: true,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 5000, // Reduced timeout for faster fallback
        maximumAge: 600000, // 10 minutes cache
      }
    );
  }, [showPicker]);

  const setManualLocation = useCallback((latitude: number, longitude: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    console.log('[Geolocation] Setting manual location:', { latitude, longitude });
    saveLocation(latitude, longitude);
    setState({
      latitude,
      longitude,
      error: null,
      loading: false,
      isManual: true,
      showLocationPicker: false,
    });
  }, []);

  useEffect(() => {
    // Only request if we don't already have a location
    if (state.latitude === null && state.longitude === null && !state.error && !state.showLocationPicker) {
      requestLocation();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { ...state, requestLocation, setManualLocation, showPicker };
}
