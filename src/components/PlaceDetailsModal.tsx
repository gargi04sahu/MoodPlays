import { useState, useEffect } from 'react';
import { Star, MapPin, Clock, Phone, Globe, Navigation, X, ChevronLeft, ChevronRight, Calendar, Share2, Flag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PopularTimesChart } from '@/components/PopularTimesChart';
import { getPlaceDetails, type PlaceDetails, type DayHours } from '@/services/placesApi';
import { formatDistance } from '@/utils/distanceCalculator';
import { cn } from '@/lib/utils';
import type { Place } from '@/services/placesApi';
import type { MoodType } from '@/utils/moodMapper';
import { WhyThisPlace } from '@/components/WhyThisPlace';

interface PlaceDetailsModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  mood?: MoodType | null;
}

function getTodayDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

export function PlaceDetailsModal({ place, isOpen, onClose, mood }: PlaceDetailsModalProps) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    if (place && isOpen) {
      setLoading(true);
      setRevalidating(false);
      setCurrentPhotoIndex(0);
      
      getPlaceDetails(place.id, place, (freshDetails) => {
        console.log('Background revalidation complete for:', place.id);
        setDetails(freshDetails);
        setRevalidating(false);
      })
        .then((initialDetails) => {
          setDetails(initialDetails);
          if (initialDetails._isStale) {
            setRevalidating(true);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
      setRevalidating(false);
    }
  }, [place, isOpen]);

  const handleGetDirections = () => {
    if (!place) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (!place) return;
    
    const shareData = {
      title: place.name,
      text: `Check out ${place.name}${place.address ? ` at ${place.address}` : ''}`,
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        console.error('Copy failed:', err);
        toast.error('Failed to copy link');
      }
    }
  };

  const handleReportIssue = () => {
    if (!place) return;
    
    const subject = encodeURIComponent(`Issue Report: ${place.name}`);
    const body = encodeURIComponent(
      `I'd like to report an issue with the following place:\n\n` +
      `Name: ${place.name}\n` +
      `Address: ${place.address || 'N/A'}\n` +
      `Place ID: ${place.id}\n\n` +
      `Issue Description:\n[Please describe the issue here]\n\n` +
      `Suggested Correction:\n[Please provide the correct information]`
    );
    
    // Open mailto link or show toast for feedback
    const mailtoUrl = `mailto:feedback@example.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
    
    toast.success('Thank you for helping us improve!', {
      description: 'Your report helps keep our data accurate.',
    });
  };

  const nextPhoto = () => {
    if (details?.photos && details.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % details.photos.length);
    }
  };

  const prevPhoto = () => {
    if (details?.photos && details.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + details.photos.length) % details.photos.length);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ) : place && details ? (
          <ScrollArea className="max-h-[90vh]">
            {/* Photo Gallery */}
            {details.photos && details.photos.length > 0 ? (
              <div className="relative h-56 w-full bg-muted">
                <img
                  src={details.photos[currentPhotoIndex]}
                  alt={`${place.name} photo ${currentPhotoIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                {details.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {details.photos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full transition-all',
                            idx === currentPhotoIndex
                              ? 'w-4 bg-primary'
                              : 'bg-background/60 hover:bg-background/80'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center bg-muted">
                <MapPin className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}

            <div className="space-y-5 p-6">
              {/* Header */}
              <DialogHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl">{place.name}</DialogTitle>
                      {revalidating && (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{place.category}</p>
                  </div>
                  {place.isOpen !== undefined && (
                    <Badge
                      variant={place.isOpen ? 'default' : 'secondary'}
                      className={cn(
                        place.isOpen
                          ? 'bg-status-open/10 text-status-open hover:bg-status-open/20'
                          : 'bg-status-closed/10 text-status-closed hover:bg-status-closed/20'
                      )}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {place.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{formatDistance(place.distance)}</span>
                </div>
                {place.rating !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{place.rating.toFixed(1)}</span>
                  </div>
                )}
                {place.priceLevel !== undefined && (
                  <span className="text-muted-foreground">
                    {'$'.repeat(place.priceLevel)}
                    <span className="opacity-30">{'$'.repeat(4 - place.priceLevel)}</span>
                  </span>
                )}
              </div>

              {/* AI "Why this place?" */}
              <WhyThisPlace place={place} mood={mood} />

              {/* Description */}
              {details.description && (
                <p className="text-sm text-muted-foreground">{details.description}</p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-2">
                {details.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1.5"
                  >
                    <a href={`tel:${details.phone}`}>
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  </Button>
                )}
                {details.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-1.5"
                  >
                    <a href={details.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGetDirections}
                  className="gap-1.5"
                >
                  <Navigation className="h-4 w-4" />
                  Directions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Address */}
              {place.address && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">{place.address}</p>
                </div>
              )}

              {/* Popular Times */}
              {details.popularTimes && details.popularTimes.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <PopularTimesChart data={details.popularTimes} />
                </div>
              )}

              {/* Weekly Hours */}
              {details.weeklyHours && details.weeklyHours.length > 0 && (
                <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex w-full items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Opening Hours</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        hoursOpen && "rotate-90"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      {details.weeklyHours.map((dayHours: DayHours) => {
                        const isToday = dayHours.day === getTodayDayName();
                        const isClosed = dayHours.open === 'Closed';
                        return (
                          <div
                            key={dayHours.day}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                              isToday && "bg-primary/10 font-medium"
                            )}
                          >
                            <span className={cn(
                              "min-w-[90px]",
                              isToday && "text-primary"
                            )}>
                              {dayHours.day}
                              {isToday && <span className="ml-1 text-xs">(Today)</span>}
                            </span>
                            <span className={cn(
                              "text-muted-foreground",
                              isClosed && "text-status-closed",
                              isToday && "text-foreground"
                            )}>
                              {isClosed ? 'Closed' : `${dayHours.open} - ${dayHours.close}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Tips/Reviews */}
              {details.tips && details.tips.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Reviews</h4>
                  <div className="space-y-3">
                    {details.tips.map((tip, index) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-card p-3"
                      >
                        <p className="text-sm">{tip.text}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {tip.createdAt && new Date(tip.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Issue */}
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReportIssue}
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Flag className="h-4 w-4" />
                  Report incorrect information
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
