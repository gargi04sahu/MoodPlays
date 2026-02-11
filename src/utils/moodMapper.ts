export type MoodType = 'work' | 'date' | 'quick_bite' | 'budget' | 'sad' | 'fun';

export interface MoodConfig {
  id: MoodType;
  label: string;
  emoji: string;
  description: string;
  color: string;
  categories: string[];
}

// Foursquare category IDs mapping
// https://docs.foursquare.com/data-products/docs/categories
export const moodConfigs: MoodConfig[] = [
  {
    id: 'work',
    label: 'Work',
    emoji: '💼',
    description: 'Focus & productivity',
    color: 'mood-work',
    categories: ['cafe', 'coffee_shop'], // Cafes for work
  },
  {
    id: 'date',
    label: 'Date',
    emoji: '❤️',
    description: 'Romantic vibes',
    color: 'mood-date',
    categories: ['restaurant', 'cafe', 'bar'], // Restaurants, cafes, bars for dates
  },
  {
    id: 'quick_bite',
    label: 'Quick Bite',
    emoji: '🍔',
    description: 'Fast & tasty',
    color: 'mood-quick',
    categories: ['fast_food', 'cafe', 'restaurant'], // Fast food and quick spots
  },
  {
    id: 'budget',
    label: 'Budget',
    emoji: '💸',
    description: 'Easy on wallet',
    color: 'mood-budget',
    categories: ['fast_food', 'cafe', 'restaurant'], // Budget-friendly places
  },
  {
    id: 'sad',
    label: 'Chill',
    emoji: '😌',
    description: 'Relax & unwind',
    color: 'mood-sad',
    categories: ['cafe', 'bar', 'restaurant'], // Chill cafes and bars
  },
  {
    id: 'fun',
    label: 'Fun',
    emoji: '🎉',
    description: 'Party time!',
    color: 'mood-fun',
    categories: ['bar', 'pub', 'restaurant'], // Bars and party spots
  },
];

export const getMoodConfig = (moodId: MoodType): MoodConfig | undefined => {
  return moodConfigs.find((mood) => mood.id === moodId);
};

export const getCategoriesForMood = (moodId: MoodType): string[] => {
  const config = getMoodConfig(moodId);
  return config?.categories || [];
};
