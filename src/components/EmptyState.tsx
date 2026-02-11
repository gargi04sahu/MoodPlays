import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  hasMoodSelected: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function EmptyState({ hasMoodSelected, hasError, onRetry, isRetrying }: EmptyStateProps) {
  const getIcon = () => {
    if (hasError) return <AlertCircle className="h-6 w-6 text-destructive" />;
    return <Search className="h-6 w-6 text-muted-foreground" />;
  };

  const getTitle = () => {
    if (hasError) return 'Failed to load places';
    if (hasMoodSelected) return 'No places found';
    return 'Select a mood';
  };

  const getMessage = () => {
    if (hasError) return 'There was a problem fetching places. Please try again.';
    if (hasMoodSelected) return 'Try adjusting your filters or selecting a different mood';
    return "Choose how you're feeling to discover nearby places";
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${hasError ? 'bg-destructive/10' : 'bg-muted'}`}>
        {getIcon()}
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {getTitle()}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[250px]">
        {getMessage()}
      </p>
      {hasError && onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="mt-4 gap-2"
          disabled={isRetrying}
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
    </div>
  );
}
