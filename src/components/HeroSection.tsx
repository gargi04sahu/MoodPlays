import { MapPin, Sparkles, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  onGetStarted: () => void;
  isLoading?: boolean;
  locationName?: string;
}

export function HeroSection({ onGetStarted, isLoading, locationName }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      
      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 animate-pulse rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Place Discovery</span>
          </div>
          
          {/* Heading */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find the{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              perfect spot
            </span>
            <br />
            for your mood
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Whether you're looking for a cozy café to work, a romantic dinner spot, 
            or a fun place to hang out — we've got you covered.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={onGetStarted}
              disabled={isLoading}
              className={cn(
                "gap-2 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? (
                <>
                  <Navigation className="h-5 w-5 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5" />
                  {locationName ? `Continue in ${locationName}` : 'Start Exploring'}
                </>
              )}
            </Button>
            
            {!locationName && !isLoading && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                We'll ask for your location to find nearby places
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
