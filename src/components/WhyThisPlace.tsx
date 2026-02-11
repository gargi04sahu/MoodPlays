import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Place } from '@/services/placesApi';
import type { MoodType } from '@/utils/moodMapper';

interface WhyThisPlaceProps {
  place: Place;
  mood?: MoodType | null;
  className?: string;
}

// In-memory cache for AI explanations
const explanationCache = new Map<string, { text: string; timestamp: number }>();
const EXPLANATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function WhyThisPlace({ place, mood, className }: WhyThisPlaceProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const cacheKey = `${place.id}-${mood || 'none'}`;

  const fetchExplanation = useCallback(async () => {
    // Check cache first
    const cached = explanationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < EXPLANATION_CACHE_TTL) {
      setExplanation(cached.text);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('why-this-place', {
        body: {
          place: {
            name: place.name,
            category: place.category,
            distance: place.distance,
            rating: place.rating,
            priceLevel: place.priceLevel,
            cuisineType: place.cuisineType,
            isOpen: place.isOpen,
            address: place.address,
          },
          mood: mood || undefined,
        },
      });

      if (fnError) throw fnError;

      const text = data?.explanation || '';
      setExplanation(text);
      explanationCache.set(cacheKey, { text, timestamp: Date.now() });
    } catch (err) {
      console.error('Failed to get AI explanation:', err);
      setError(true);
      // Generate a fallback explanation
      const fallback = generateFallback(place, mood);
      setExplanation(fallback);
    } finally {
      setLoading(false);
    }
  }, [place, mood, cacheKey]);

  useEffect(() => {
    fetchExplanation();
  }, [fetchExplanation]);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2', className)}>
        <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Thinking why this is great...</span>
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  return (
    <div className={cn(
      'group relative flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 animate-fade-in',
      className
    )}>
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <p className="flex-1 text-xs leading-relaxed text-foreground/80">{explanation}</p>
      {error && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            fetchExplanation();
          }}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function generateFallback(place: Place, mood?: MoodType | null): string {
  const parts: string[] = [];
  
  if (place.distance < 500) parts.push("Just a short walk away");
  else if (place.distance < 1000) parts.push("Close by");
  
  if (place.rating && place.rating >= 4.5) parts.push("with excellent ratings");
  else if (place.rating && place.rating >= 4.0) parts.push("highly rated");

  if (mood === 'work' && place.category?.toLowerCase().includes('cafe')) {
    parts.push("— perfect for a productive session");
  } else if (mood === 'date') {
    parts.push("— great ambiance for a memorable evening");
  } else if (mood === 'budget' && place.priceLevel === 1) {
    parts.push("— easy on your wallet");
  } else if (mood === 'quick_bite') {
    parts.push("— quick and satisfying");
  }

  return parts.join(' ') + '.';
}
