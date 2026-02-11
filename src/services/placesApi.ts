import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/utils/distanceCalculator';

export type CuisineType = 'north-indian' | 'south-indian' | 'chinese' | 'fast-food' | 'cafe' | 'continental' | 'mughlai' | 'street-food' | 'other';

export interface Place {
  id: string;
  name: string;
  category: string;
  categoryIcon?: string;
  distance: number;
  rating?: number;
  isOpen?: boolean;
  address?: string;
  latitude: number;
  longitude: number;
  priceLevel?: number;
  cuisineType?: CuisineType;
  openingHours?: string;
}

export interface DayHours {
  day: string;
  open: string;
  close: string;
}

export interface HourlyPopularity {
  hour: number;
  popularity: number; // 0-100
}

export interface PlaceDetails {
  description?: string;
  phone?: string;
  website?: string;
  photos: string[];
  tips: Array<{
    text: string;
    createdAt?: string;
  }>;
  weeklyHours?: DayHours[];
  popularTimes?: HourlyPopularity[];
}

export interface PlacesSearchParams {
  latitude: number;
  longitude: number;
  categories: string[];
  radius?: number;
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const STALE_TTL = 30 * 1000; // 30 seconds before considering stale (revalidate in background)
const CACHE_STORAGE_KEY = 'moodplaces_details_cache';
const MAX_CACHE_SIZE = 50;

// Cache entry structure
interface CacheEntry {
  details: PlaceDetails;
  timestamp: number;
}

interface CacheStorage {
  entries: Record<string, CacheEntry>;
  version: number;
}

// Initialize cache from localStorage
function loadCacheFromStorage(): Map<string, CacheEntry> {
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!stored) return new Map();
    
    const parsed: CacheStorage = JSON.parse(stored);
    if (parsed.version !== 1) return new Map(); // Version mismatch, clear cache
    
    const now = Date.now();
    const entries = new Map<string, CacheEntry>();
    
    // Only load non-expired entries
    for (const [key, entry] of Object.entries(parsed.entries)) {
      if (now - entry.timestamp <= CACHE_TTL) {
        entries.set(key, entry);
      }
    }
    
    console.log(`Loaded ${entries.size} cached place details from localStorage`);
    return entries;
  } catch (e) {
    console.warn('Failed to load cache from localStorage:', e);
    return new Map();
  }
}

// Save cache to localStorage
function saveCacheToStorage(cache: Map<string, CacheEntry>): void {
  try {
    const entries: Record<string, CacheEntry> = {};
    cache.forEach((value, key) => {
      entries[key] = value;
    });
    
    const storage: CacheStorage = {
      entries,
      version: 1,
    };
    
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.warn('Failed to save cache to localStorage:', e);
  }
}

// Initialize cache
const placeDetailsCache = loadCacheFromStorage();

interface CacheResult {
  details: PlaceDetails | null;
  isStale: boolean;
}

function getCachedDetails(placeId: string): CacheResult {
  const entry = placeDetailsCache.get(placeId);
  if (!entry) return { details: null, isStale: false };
  
  const age = Date.now() - entry.timestamp;
  
  // Check if cache is expired
  if (age > CACHE_TTL) {
    placeDetailsCache.delete(placeId);
    saveCacheToStorage(placeDetailsCache);
    return { details: null, isStale: false };
  }
  
  // Check if cache is stale (should revalidate in background)
  const isStale = age > STALE_TTL;
  
  return { details: entry.details, isStale };
}

function setCachedDetails(placeId: string, details: PlaceDetails): void {
  placeDetailsCache.set(placeId, {
    details,
    timestamp: Date.now(),
  });
  
  // Limit cache size to prevent memory/storage issues
  if (placeDetailsCache.size > MAX_CACHE_SIZE) {
    const oldestKey = placeDetailsCache.keys().next().value;
    if (oldestKey) placeDetailsCache.delete(oldestKey);
  }
  
  // Persist to localStorage
  saveCacheToStorage(placeDetailsCache);
}

export function clearPlaceDetailsCache(): void {
  placeDetailsCache.clear();
  localStorage.removeItem(CACHE_STORAGE_KEY);
}

// Callback type for stale-while-revalidate updates
export type OnDetailsUpdateCallback = (details: PlaceDetails) => void;

// Helper function to guess cuisine type from category/name
function guessCuisineType(category: string, name: string): CuisineType {
  const lowerCategory = (category || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  
  if (lowerName.includes('chinese') || lowerName.includes('wok') || lowerName.includes('noodle')) return 'chinese';
  if (lowerName.includes('dosa') || lowerName.includes('idli') || lowerName.includes('saravana') || lowerName.includes('south')) return 'south-indian';
  if (lowerName.includes('punjab') || lowerName.includes('dhaba') || lowerName.includes('tandoor') || lowerName.includes('mughal')) return 'north-indian';
  if (lowerName.includes('burger') || lowerName.includes('pizza') || lowerName.includes('kfc') || lowerName.includes('mcdonald')) return 'fast-food';
  if (lowerName.includes('cafe') || lowerName.includes('coffee') || lowerName.includes('starbucks') || lowerName.includes('chai')) return 'cafe';
  if (lowerName.includes('chaat') || lowerName.includes('pani puri') || lowerName.includes('golgappa')) return 'street-food';
  
  if (lowerCategory.includes('fast_food')) return 'fast-food';
  if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) return 'cafe';
  if (lowerCategory.includes('restaurant')) return 'north-indian';
  
  return 'other';
}

// Helper function to guess price level from category/name
function guessPriceLevel(category: string, name: string): number {
  const lowerCategory = (category || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  
  // Premium places (₹₹₹)
  if (lowerName.includes('starbucks') || lowerName.includes('mainland') || lowerName.includes('barbeque') || 
      lowerName.includes('grill') || lowerName.includes('fine dining') || lowerName.includes('taj')) {
    return 3;
  }
  
  // Budget places (₹)
  if (lowerName.includes('chaat') || lowerName.includes('dhaba') || lowerCategory.includes('fast_food') ||
      lowerName.includes('street') || lowerName.includes('chai')) {
    return 1;
  }
  
  // Mid-range (₹₹)
  return 2;
}

export async function searchPlaces(params: PlacesSearchParams): Promise<Place[]> {
  const { latitude, longitude, categories, radius = 5000 } = params;

  try {
    const { data, error } = await supabase.functions.invoke('search-places', {
      body: { latitude, longitude, categories, radius },
    });

    if (error) {
      console.error('Edge function error:', error);
      return getMockPlaces(latitude, longitude);
    }

    if (data.error || !data.results || data.results.length === 0) {
      console.log('No results from API, using mock places');
      return getMockPlaces(latitude, longitude);
    }

    return data.results.map((place: any) => {
      // Determine cuisine type based on category
      const cuisineType = guessCuisineType(place.category, place.name);
      // Determine price level based on category (1=budget, 2=mid, 3=premium)
      const priceLevel = guessPriceLevel(place.category, place.name);
      
      return {
        id: place.id,
        name: place.name,
        category: formatCategory(place.category),
        distance: calculateDistance(
          latitude,
          longitude,
          place.latitude,
          place.longitude
        ),
        rating: Math.random() * 2 + 3, // Random rating 3-5 for OSM data
        isOpen: true, // OSM doesn't provide real-time status
        address: place.address || 'Address not available',
        latitude: place.latitude,
        longitude: place.longitude,
        priceLevel,
        cuisineType,
        openingHours: place.opening_hours || null,
      };
    });
  } catch (error) {
    console.error('Failed to fetch places:', error);
    return getMockPlaces(latitude, longitude);
  }
}

function formatCategory(category: string): string {
  if (!category) return 'Place';
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getPlaceDetails(
  placeId: string, 
  place?: Place,
  onUpdate?: OnDetailsUpdateCallback
): Promise<PlaceDetails & { _isStale?: boolean }> {
  // Check cache first
  const { details: cachedDetails, isStale } = getCachedDetails(placeId);
  
  if (cachedDetails) {
    console.log('Using cached details for:', placeId, isStale ? '(stale, revalidating)' : '(fresh)');
    
    // If cache is stale, revalidate in background
    if (isStale && onUpdate) {
      fetchFreshDetails(placeId, place).then((freshDetails) => {
        if (freshDetails) {
          setCachedDetails(placeId, freshDetails);
          onUpdate(freshDetails);
        }
      });
    }
    
    return { ...cachedDetails, _isStale: isStale };
  }

  // Return mock data for mock places
  if (placeId.startsWith('mock-')) {
    const mockDetails: PlaceDetails = {
      description: 'A wonderful local spot loved by the community.',
      photos: [],
      tips: [
        { text: 'Great atmosphere and friendly staff!', createdAt: new Date().toISOString() },
        { text: 'Love coming here on weekends.', createdAt: new Date().toISOString() },
      ],
      weeklyHours: [
        { day: 'Monday', open: '9:00 AM', close: '10:00 PM' },
        { day: 'Tuesday', open: '9:00 AM', close: '10:00 PM' },
        { day: 'Wednesday', open: '9:00 AM', close: '10:00 PM' },
        { day: 'Thursday', open: '9:00 AM', close: '10:00 PM' },
        { day: 'Friday', open: '9:00 AM', close: '11:00 PM' },
        { day: 'Saturday', open: '10:00 AM', close: '11:00 PM' },
        { day: 'Sunday', open: '10:00 AM', close: '9:00 PM' },
      ],
      popularTimes: generateMockPopularTimes(),
    };
    setCachedDetails(placeId, mockDetails);
    return mockDetails;
  }
  
  return fetchFreshDetails(placeId, place);
}

async function fetchFreshDetails(placeId: string, place?: Place): Promise<PlaceDetails> {

  try {
    // Pass place data to edge function for OSM places
    const { data, error } = await supabase.functions.invoke('get-place-details', {
      body: { 
        placeId,
        placeData: place ? {
          name: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address,
          rating: place.rating,
          priceLevel: place.priceLevel,
          cuisineType: place.cuisineType,
          openingHours: place.openingHours,
          phone: (place as any).phone,
          website: (place as any).website,
        } : undefined
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return generateFallbackDetails(place);
    }

    if (data.error) {
      console.error('API error:', data.error);
      return generateFallbackDetails(place);
    }

    const photos = (data.photos || []).map(
      (photo: any) => `${photo.prefix}original${photo.suffix}`
    );

    const tips = (data.tips || []).map((tip: any) => ({
      text: tip.text,
      createdAt: tip.created_at,
    }));

    // Parse weekly hours from response
    const weeklyHours = parseWeeklyHours(data.details?.hours);
    
    // Parse popular times from response
    const popularTimes = parsePopularTimes(data.details?.hours_popular) || generateMockPopularTimes();

    const result: PlaceDetails = {
      description: data.details?.description,
      phone: data.details?.tel,
      website: data.details?.website,
      photos,
      tips: tips.length > 0 ? tips : generateFallbackTips(place),
      weeklyHours,
      popularTimes,
    };
    
    // Cache the result
    setCachedDetails(placeId, result);
    
    return result;
  } catch (error) {
    console.error('Failed to fetch place details:', error);
    const fallback = generateFallbackDetails(place);
    setCachedDetails(placeId, fallback);
    return fallback;
  }
}

function generateFallbackDetails(place?: Place): PlaceDetails {
  return {
    description: place ? `${place.name} is a popular ${place.category?.toLowerCase() || 'place'} in the area.` : undefined,
    photos: [],
    tips: generateFallbackTips(place),
    popularTimes: generateMockPopularTimes(),
  };
}

function generateFallbackTips(place?: Place): Array<{ text: string; createdAt?: string }> {
  const tips = [];
  if (place?.cuisineType) {
    tips.push({ text: `Great for ${place.cuisineType.replace('-', ' ')} food lovers!`, createdAt: new Date().toISOString() });
  }
  tips.push({ text: 'The ambiance here is really nice. Perfect for a relaxed visit.', createdAt: new Date().toISOString() });
  return tips;
}
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseWeeklyHours(hours: any): DayHours[] | undefined {
  if (!hours?.regular) return undefined;
  
  const dayMap: Record<number, DayHours> = {};
  
  // Foursquare uses 1=Monday, 2=Tuesday, etc.
  for (const slot of hours.regular) {
    const dayIndex = slot.day - 1; // Convert to 0-indexed
    if (dayIndex >= 0 && dayIndex < 7) {
      const openTime = formatTime(slot.open);
      const closeTime = formatTime(slot.close);
      dayMap[dayIndex] = {
        day: DAYS_OF_WEEK[dayIndex],
        open: openTime,
        close: closeTime,
      };
    }
  }
  
  // Fill in all days, marking closed days
  return DAYS_OF_WEEK.map((day, index) => {
    if (dayMap[index]) {
      return dayMap[index];
    }
    return { day, open: 'Closed', close: '' };
  });
}

function formatTime(time: string): string {
  if (!time || time.length !== 4) return time;
  const hours = parseInt(time.substring(0, 2), 10);
  const minutes = time.substring(2);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}
function parsePopularTimes(hoursPopular: any): HourlyPopularity[] | undefined {
  if (!hoursPopular || !Array.isArray(hoursPopular)) {
    return undefined;
  }
  
  // Get today's day (Foursquare uses 1=Monday, 7=Sunday)
  const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
  const foursquareToday = today === 0 ? 7 : today;
  
  // Find today's popular times
  const todayData = hoursPopular.find((d: any) => d.day === foursquareToday);
  if (!todayData?.popular) return undefined;
  
  return todayData.popular.map((slot: any) => ({
    hour: parseInt(slot.open.substring(0, 2), 10),
    popularity: slot.popularity || Math.floor(Math.random() * 60 + 20),
  }));
}

function generateMockPopularTimes(): HourlyPopularity[] {
  // Generate realistic popular times curve (busier during meals)
  const hours: HourlyPopularity[] = [];
  for (let h = 6; h <= 23; h++) {
    let popularity = 10;
    // Morning rush (8-10)
    if (h >= 8 && h <= 10) popularity = 30 + Math.random() * 30;
    // Lunch rush (12-14)
    if (h >= 12 && h <= 14) popularity = 60 + Math.random() * 35;
    // Evening rush (18-21)
    if (h >= 18 && h <= 21) popularity = 70 + Math.random() * 30;
    // Late night (22-23)
    if (h >= 22) popularity = 20 + Math.random() * 20;
    
    hours.push({ hour: h, popularity: Math.min(100, Math.round(popularity)) });
  }
  return hours;
}

function getMockPlaces(userLat: number, userLon: number): Place[] {
  // Indian-themed mock places with cuisine types (food & drink only)
  const mockPlaces: Array<{
    name: string;
    category: string;
    latOffset: number;
    lonOffset: number;
    rating: number;
    isOpen: boolean;
    cuisineType: CuisineType;
    openingHours: string;
  }> = [
    { name: 'Chai Point', category: 'Cafe', latOffset: 0.005, lonOffset: 0.003, rating: 4.5, isOpen: true, cuisineType: 'cafe', openingHours: '7:00 AM - 11:00 PM' },
    { name: 'Cafe Coffee Day', category: 'Coffee Shop', latOffset: -0.003, lonOffset: 0.007, rating: 4.2, isOpen: true, cuisineType: 'cafe', openingHours: '8:00 AM - 10:00 PM' },
    { name: 'Saravana Bhavan', category: 'Restaurant', latOffset: 0.008, lonOffset: -0.002, rating: 4.7, isOpen: false, cuisineType: 'south-indian', openingHours: '7:00 AM - 10:30 PM' },
    { name: 'Haldiram\'s', category: 'Restaurant', latOffset: -0.002, lonOffset: -0.004, rating: 3.9, isOpen: true, cuisineType: 'north-indian', openingHours: '9:00 AM - 11:00 PM' },
    { name: 'Social', category: 'Bar', latOffset: 0.004, lonOffset: -0.008, rating: 4.4, isOpen: false, cuisineType: 'continental', openingHours: '12:00 PM - 1:00 AM' },
    { name: 'Burger King', category: 'Fast Food', latOffset: 0.002, lonOffset: 0.009, rating: 3.8, isOpen: true, cuisineType: 'fast-food', openingHours: '10:00 AM - 11:00 PM' },
    { name: 'Mainland China', category: 'Restaurant', latOffset: -0.007, lonOffset: 0.002, rating: 4.8, isOpen: true, cuisineType: 'chinese', openingHours: '12:00 PM - 11:30 PM' },
    { name: 'Starbucks India', category: 'Coffee Shop', latOffset: 0.006, lonOffset: -0.005, rating: 4.3, isOpen: true, cuisineType: 'cafe', openingHours: '7:00 AM - 10:00 PM' },
    { name: 'Barbeque Nation', category: 'Restaurant', latOffset: -0.004, lonOffset: 0.008, rating: 4.5, isOpen: true, cuisineType: 'mughlai', openingHours: '12:00 PM - 11:00 PM' },
    { name: 'Punjab Grill', category: 'Restaurant', latOffset: 0.010, lonOffset: 0.004, rating: 4.6, isOpen: true, cuisineType: 'north-indian', openingHours: '12:00 PM - 12:00 AM' },
    { name: 'Wok Express', category: 'Fast Food', latOffset: -0.005, lonOffset: -0.006, rating: 4.0, isOpen: true, cuisineType: 'chinese', openingHours: '11:00 AM - 10:00 PM' },
    { name: 'Dosa Plaza', category: 'Restaurant', latOffset: 0.007, lonOffset: 0.006, rating: 4.3, isOpen: true, cuisineType: 'south-indian', openingHours: '8:00 AM - 10:00 PM' },
    { name: 'Chaat Corner', category: 'Street Food', latOffset: -0.008, lonOffset: 0.004, rating: 4.1, isOpen: true, cuisineType: 'street-food', openingHours: '10:00 AM - 9:00 PM' },
    { name: 'The Irish House', category: 'Bar', latOffset: 0.003, lonOffset: 0.005, rating: 4.2, isOpen: true, cuisineType: 'continental', openingHours: '12:00 PM - 1:30 AM' },
    { name: 'Toit Brewpub', category: 'Bar', latOffset: -0.006, lonOffset: -0.003, rating: 4.6, isOpen: true, cuisineType: 'continental', openingHours: '12:00 PM - 12:30 AM' },
  ];

  // Assign realistic price levels based on place type
  const priceLevels: Record<string, number> = {
    'Chai Point': 1,
    'Cafe Coffee Day': 2,
    'Saravana Bhavan': 2,
    'Haldiram\'s': 1,
    'Social': 2,
    'Burger King': 1,
    'Mainland China': 3,
    'Starbucks India': 3,
    'Barbeque Nation': 3,
    'Punjab Grill': 3,
    'Wok Express': 1,
    'Dosa Plaza': 2,
    'Chaat Corner': 1,
    'The Irish House': 2,
    'Toit Brewpub': 2,
  };

  return mockPlaces.map((place, index) => {
    const lat = userLat + place.latOffset;
    const lon = userLon + place.lonOffset;
    return {
      id: `mock-${index}`,
      name: place.name,
      category: place.category,
      distance: calculateDistance(userLat, userLon, lat, lon),
      rating: place.rating,
      isOpen: place.isOpen,
      latitude: lat,
      longitude: lon,
      address: `${Math.floor(Math.random() * 999) + 1} Main Road`,
      priceLevel: priceLevels[place.name] || 2,
      cuisineType: place.cuisineType,
      openingHours: place.openingHours,
    };
  });
}
