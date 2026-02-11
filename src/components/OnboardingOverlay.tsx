import { useState, useEffect } from 'react';
import { MapPin, Sparkles, Heart, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'moodplaces_onboarding_seen';

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    icon: MapPin,
    title: 'Pick your location',
    description: 'We find the best spots near you — use GPS or search for any city.',
    color: 'from-primary to-primary/60',
  },
  {
    icon: Sparkles,
    title: 'Choose your mood',
    description: 'Working? Date night? Quick bite? We tailor results to how you feel.',
    color: 'from-mood-date to-mood-fun',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filter & explore',
    description: 'Refine by cuisine, price, open status — and see places on the map.',
    color: 'from-mood-quick to-mood-budget',
  },
  {
    icon: Heart,
    title: 'Save your favorites',
    description: 'Tap the heart to save places you love. They\'re stored for next time.',
    color: 'from-mood-date to-rose-400',
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay for entrance animation
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setVisible(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setTimeout(onComplete, 300);
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={cn(
          'relative mx-4 max-w-sm w-full rounded-2xl border bg-card p-6 shadow-2xl transition-all duration-500',
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        {/* Skip button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="absolute right-3 top-3 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Step content */}
        <div className="flex flex-col items-center text-center">
          {/* Animated icon */}
          <div
            key={currentStep}
            className={cn(
              'mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg animate-scale-in',
              step.color
            )}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>

          <h3
            key={`title-${currentStep}`}
            className="mb-2 text-lg font-bold animate-fade-in"
          >
            {step.title}
          </h3>
          <p
            key={`desc-${currentStep}`}
            className="mb-6 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="mb-5 flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === currentStep
                    ? 'w-6 bg-primary'
                    : idx < currentStep
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted-foreground/20'
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex w-full gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Back
              </Button>
            )}
            <Button
              className={cn('flex-1 gap-2', currentStep === 0 && 'w-full')}
              onClick={handleNext}
            >
              {isLast ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>

          {/* Step counter */}
          <p className="mt-3 text-[10px] text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}
