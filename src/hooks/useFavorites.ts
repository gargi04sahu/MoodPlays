import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FAVORITES_KEY = 'mood-places-favorites';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [synced, setSynced] = useState(false);

  // Sync from database when user logs in
  useEffect(() => {
    if (!user) {
      setSynced(false);
      return;
    }

    const syncFavorites = async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('place_id')
        .eq('user_id', user.id);

      if (!error && data) {
        const dbFavorites = new Set(data.map((f: any) => f.place_id));
        
        // Merge localStorage favorites into DB on first sync
        if (!synced) {
          const localFavs = favorites;
          const toInsert = [...localFavs].filter(id => !dbFavorites.has(id));
          if (toInsert.length > 0) {
            await supabase.from('favorites').insert(
              toInsert.map(place_id => ({ user_id: user.id, place_id }))
            );
            toInsert.forEach(id => dbFavorites.add(id));
          }
        }

        setFavorites(dbFavorites);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...dbFavorites]));
        setSynced(true);
      }
    };

    syncFavorites();
  }, [user]);

  // Persist to localStorage for offline/guest use
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((placeId: string, placeName?: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const wasAdded = !next.has(placeId);

      if (wasAdded) {
        next.add(placeId);
      } else {
        next.delete(placeId);
      }

      // Sync to database if logged in
      if (user) {
        if (wasAdded) {
          supabase.from('favorites').insert({ user_id: user.id, place_id: placeId, place_name: placeName }).then();
        } else {
          supabase.from('favorites').delete().eq('user_id', user.id).eq('place_id', placeId).then();
        }
      }

      const displayName = placeName || 'Place';
      toast(wasAdded ? `Added ${displayName} to favorites` : `Removed ${displayName} from favorites`, {
        action: {
          label: 'Undo',
          onClick: () => {
            setFavorites((current) => {
              const undone = new Set(current);
              if (wasAdded) {
                undone.delete(placeId);
                if (user) supabase.from('favorites').delete().eq('user_id', user.id).eq('place_id', placeId).then();
              } else {
                undone.add(placeId);
                if (user) supabase.from('favorites').insert({ user_id: user.id, place_id: placeId, place_name: placeName }).then();
              }
              return undone;
            });
          },
        },
        duration: 4000,
      });

      return next;
    });
  }, [user]);

  const isFavorite = useCallback((placeId: string) => favorites.has(placeId), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
