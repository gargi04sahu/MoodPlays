import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { MoodSelector } from '@/components/MoodSelector';
import { Filters, type SortOption, type PriceFilter } from '@/components/Filters';
import type { CuisineType } from '@/services/placesApi';
import { PlaceCard } from '@/components/PlaceCard';
import { PlaceCardSkeleton } from '@/components/PlaceCardSkeleton';
import { MapViewWrapper as MapView } from '@/components/MapViewWrapper';
import { EmptyState } from '@/components/EmptyState';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { PlaceDetailsModal } from '@/components/PlaceDetailsModal';
import { PullToRefresh } from '@/components/PullToRefresh';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { OnboardingOverlay, shouldShowOnboarding } from '@/components/OnboardingOverlay';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTheme } from '@/hooks/useTheme';
import { useFavorites } from '@/hooks/useFavorites';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { searchPlaces, type Place } from '@/services/placesApi';
import { getCategoriesForMood, type MoodType } from '@/utils/moodMapper';
export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { 
    latitude, 
    longitude, 
    error: locationError, 
    loading: locationLoading, 
    showLocationPicker,
    requestLocation, 
    setManualLocation,
    showPicker
  } = useGeolocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isMobile = useIsMobile();
  const { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [detailsPlace, setDetailsPlace] = useState<Place | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState<CuisineType | 'all'>('all');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding());
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reverse geocode to get location name when coordinates change
  useEffect(() => {
    if (latitude === null || longitude === null) return;
    
    const fetchLocationName = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'User-Agent': 'MoodPlaces/1.0' } }
        );
        const data = await response.json();
        if (data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.state_district || data.address.state;
          if (city) setLocationName(city);
        }
      } catch (error) {
        console.error('Failed to reverse geocode:', error);
      }
    };

    // Only fetch if we don't already have a name set
    if (!locationName) {
      fetchLocationName();
    }
  }, [latitude, longitude, locationName]);

  const handleLocationChange = useCallback((lat: number, lng: number, name: string) => {
    setManualLocation(lat, lng);
    setLocationName(name);
  }, [setManualLocation]);

  // Fetch places when location is available or mood changes
  useEffect(() => {
    if (latitude === null || longitude === null) {
      return;
    }

    const fetchPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError(false);
      try {
        const categories = selectedMood ? getCategoriesForMood(selectedMood) : ['restaurant', 'cafe', 'bar', 'fast_food'];
        const results = await searchPlaces({
          latitude,
          longitude,
          categories,
          radius: 5000,
        });
        setPlaces(results);
        if (results.length === 0) {
          setPlacesError(true);
        }
      } catch (error) {
        console.error('Failed to fetch places:', error);
        setPlaces([]);
        setPlacesError(true);
      } finally {
        setPlacesLoading(false);
      }
    };

    fetchPlaces();
  }, [selectedMood, latitude, longitude]);

  const handleRefresh = useCallback(async () => {
    if (latitude === null || longitude === null) {
      return;
    }

    try {
      const categories = selectedMood ? getCategoriesForMood(selectedMood) : ['restaurant', 'cafe', 'bar', 'fast_food'];
      const results = await searchPlaces({
        latitude,
        longitude,
        categories,
        radius: 5000,
      });
      setPlaces(results);
      toast.success('Places refreshed!');
    } catch (error) {
      console.error('Failed to refresh places:', error);
      toast.error('Failed to refresh places');
    }
  }, [selectedMood, latitude, longitude]);

  // Filter and sort places
  const filteredPlaces = useMemo(() => {
    let result = [...places];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((place) => 
        place.name.toLowerCase().includes(query) ||
        place.category.toLowerCase().includes(query) ||
        place.address?.toLowerCase().includes(query)
      );
    }

    // Filter by open status
    if (showOpenOnly) {
      result = result.filter((place) => place.isOpen === true);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((place) => isFavorite(place.id));
    }

    // Filter by price
    if (priceFilter !== 'all') {
      result = result.filter((place) => {
        const level = place.priceLevel || 2;
        if (priceFilter === 'budget') return level === 1;
        if (priceFilter === 'mid') return level === 2;
        if (priceFilter === 'premium') return level >= 3;
        return true;
      });
    }

    // Filter by cuisine
    if (cuisineFilter !== 'all') {
      result = result.filter((place) => place.cuisineType === cuisineFilter);
    }

    // Sort
    if (sortBy === 'distance') {
      result.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [places, searchQuery, showOpenOnly, showFavoritesOnly, priceFilter, cuisineFilter, sortBy, isFavorite]);

  const handlePlaceSelect = useCallback((placeId: string) => {
    setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
  }, []);

  const handlePlaceDetailsOpen = useCallback((place: Place) => {
    setDetailsPlace(place);
    addToRecentlyViewed(place);
  }, [addToRecentlyViewed]);

  const handlePlaceDetailsClose = useCallback(() => {
    setDetailsPlace(null);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: handlePlaceDetailsClose,
    searchInputRef,
  });

  const handleDetectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    setLocationName(null); // Clear existing name so it gets re-fetched
    try {
      await requestLocation();
    } finally {
      setIsDetectingLocation(false);
    }
  }, [requestLocation]);

  const userLocation = latitude !== null && longitude !== null
    ? { latitude, longitude }
    : null;

  // Show welcome screen if no location is set or if picker should be shown
  if (!userLocation || showLocationPicker) {
    return (
      <>
        {showOnboarding && (
          <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
        )}
        <WelcomeScreen
          onLocationSelect={handleLocationChange}
          onUseCurrentLocation={requestLocation}
          isLoading={locationLoading}
          error={locationError}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme}
        locationName={locationName || 'Current Location'}
        onChangeLocation={handleLocationChange}
        onBack={showPicker}
        onDetectLocation={handleDetectLocation}
        isDetectingLocation={isDetectingLocation}
      />

      <main className="flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-r bg-card lg:w-[420px] z-10 relative lg:h-full overflow-auto">
          <div className="flex h-full flex-col">
            {/* Mood Selector */}
            <div className="border-b p-5">
              <MoodSelector selectedMood={selectedMood} onSelectMood={setSelectedMood} />
            </div>

            {/* Filters */}
            {selectedMood && (
              <div className="border-b p-4">
                <Filters
                  searchInputRef={searchInputRef}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  showOpenOnly={showOpenOnly}
                  onOpenOnlyChange={setShowOpenOnly}
                  showFavoritesOnly={showFavoritesOnly}
                  onFavoritesOnlyChange={setShowFavoritesOnly}
                  priceFilter={priceFilter}
                  onPriceFilterChange={setPriceFilter}
                  cuisineFilter={cuisineFilter}
                  onCuisineFilterChange={setCuisineFilter}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setShowOpenOnly(false);
                    setShowFavoritesOnly(false);
                    setPriceFilter('all');
                    setCuisineFilter('all');
                  }}
                  totalResults={filteredPlaces.length}
                />
              </div>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && !selectedMood && (
              <div className="border-b px-4 py-3">
                <RecentlyViewed
                  places={recentlyViewed}
                  onPlaceClick={handlePlaceDetailsOpen}
                  onClear={clearRecentlyViewed}
                />
              </div>
            )}

            {/* Places List */}
            {isMobile ? (
              <PullToRefresh
                onRefresh={handleRefresh}
                className="flex-1 p-4 scrollbar-thin"
              >
                {placesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(i - 1) * 100}ms`, animationFillMode: 'backwards' }}
                      >
                        <PlaceCardSkeleton />
                      </div>
                    ))}
                  </div>
                ) : filteredPlaces.length > 0 ? (
                  <div className="space-y-3">
                    {filteredPlaces.map((place, index) => (
                      <div
                        key={place.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <PlaceCard
                          place={place}
                          isSelected={selectedPlaceId === place.id}
                          isFavorite={isFavorite(place.id)}
                          mood={selectedMood}
                          onClick={() => handlePlaceSelect(place.id)}
                          onDetailsClick={() => handlePlaceDetailsOpen(place)}
                          onFavoriteClick={() => toggleFavorite(place.id, place.name)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    hasMoodSelected={!!selectedMood} 
                    hasError={placesError && places.length === 0}
                    onRetry={handleRefresh}
                    isRetrying={placesLoading}
                  />
                )}
              </PullToRefresh>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {placesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(i - 1) * 100}ms`, animationFillMode: 'backwards' }}
                      >
                        <PlaceCardSkeleton />
                      </div>
                    ))}
                  </div>
                ) : filteredPlaces.length > 0 ? (
                  <div className="space-y-3">
                    {filteredPlaces.map((place, index) => (
                      <div
                        key={place.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <PlaceCard
                          place={place}
                          isSelected={selectedPlaceId === place.id}
                          isFavorite={isFavorite(place.id)}
                          mood={selectedMood}
                          onClick={() => handlePlaceSelect(place.id)}
                          onDetailsClick={() => handlePlaceDetailsOpen(place)}
                          onFavoriteClick={() => toggleFavorite(place.id, place.name)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    hasMoodSelected={!!selectedMood} 
                    hasError={placesError && places.length === 0}
                    onRetry={handleRefresh}
                    isRetrying={placesLoading}
                  />
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Map */}
        {/* Map */}
        <div className="flex-1 z-0 h-[400px] lg:h-auto">
          <MapView
            userLocation={userLocation}
            places={filteredPlaces}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>
      </main>

      {/* Place Details Modal */}
      <PlaceDetailsModal
        place={detailsPlace}
        isOpen={!!detailsPlace}
        onClose={handlePlaceDetailsClose}
        mood={selectedMood}
      />
    </div>
  );
}
