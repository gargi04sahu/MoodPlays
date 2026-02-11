import { RefObject } from 'react';
import { ArrowUpDown, Clock, Heart, IndianRupee, UtensilsCrossed, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CuisineType } from '@/services/placesApi';

export type SortOption = 'distance' | 'rating';
export type PriceFilter = 'all' | 'budget' | 'mid' | 'premium';

interface FiltersProps {
  searchInputRef?: RefObject<HTMLInputElement>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showOpenOnly: boolean;
  onOpenOnlyChange: (value: boolean) => void;
  showFavoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  priceFilter: PriceFilter;
  onPriceFilterChange: (value: PriceFilter) => void;
  cuisineFilter: CuisineType | 'all';
  onCuisineFilterChange: (value: CuisineType | 'all') => void;
  onClearFilters: () => void;
  totalResults: number;
}

const priceOptions: { value: PriceFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '₹' },
  { value: 'budget', label: 'Budget', icon: '₹' },
  { value: 'mid', label: 'Mid-Range', icon: '₹₹' },
  { value: 'premium', label: 'Premium', icon: '₹₹₹' },
];

const cuisineOptions: { value: CuisineType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Cuisines' },
  { value: 'north-indian', label: 'North Indian' },
  { value: 'south-indian', label: 'South Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'mughlai', label: 'Mughlai' },
  { value: 'fast-food', label: 'Fast Food' },
  { value: 'street-food', label: 'Street Food' },
  { value: 'cafe', label: 'Cafe & Coffee' },
  { value: 'continental', label: 'Continental' },
  { value: 'other', label: 'Other' },
];

export function Filters({
  searchInputRef,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  showOpenOnly,
  onOpenOnlyChange,
  showFavoritesOnly,
  onFavoritesOnlyChange,
  priceFilter,
  onPriceFilterChange,
  cuisineFilter,
  onCuisineFilterChange,
  onClearFilters,
  totalResults,
}: FiltersProps) {
  const hasActiveFilters = searchQuery || showOpenOnly || showFavoritesOnly || priceFilter !== 'all' || cuisineFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search places... (Press / to focus)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value.slice(0, 100))}
          className="pl-9 pr-9 h-9"
          maxLength={100}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? 'place' : 'places'} found
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-card p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortChange('distance')}
            className={cn(
              'h-7 gap-1.5 px-2.5 text-xs',
              sortBy === 'distance' && 'bg-accent text-accent-foreground'
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            Distance
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortChange('rating')}
            className={cn(
              'h-7 gap-1.5 px-2.5 text-xs',
              sortBy === 'rating' && 'bg-accent text-accent-foreground'
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            Rating
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenOnlyChange(!showOpenOnly)}
          className={cn(
            'h-8 gap-1.5 rounded-lg border px-3 text-xs',
            showOpenOnly
              ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              : 'border-border bg-card hover:bg-accent'
          )}
        >
          <Clock className="h-3 w-3" />
          Open Now
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFavoritesOnlyChange(!showFavoritesOnly)}
          className={cn(
            'h-8 gap-1.5 rounded-lg border px-3 text-xs',
            showFavoritesOnly
              ? 'border-red-500 bg-red-500 text-white hover:bg-red-600 hover:text-white'
              : 'border-border bg-card hover:bg-accent'
          )}
        >
          <Heart className={cn('h-3 w-3', showFavoritesOnly && 'fill-current')} />
          Favorites
        </Button>
      </div>

      {/* Price and Cuisine Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Price Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            Price:
          </span>
          <div className="flex rounded-lg border bg-card p-1">
            {priceOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                onClick={() => onPriceFilterChange(option.value)}
                className={cn(
                  'h-7 px-2.5 text-xs',
                  priceFilter === option.value && 'bg-accent text-accent-foreground'
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Cuisine Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <UtensilsCrossed className="h-3 w-3" />
            Cuisine:
          </span>
          <Select value={cuisineFilter} onValueChange={(value) => onCuisineFilterChange(value as CuisineType | 'all')}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="All Cuisines" />
            </SelectTrigger>
            <SelectContent>
              {cuisineOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
