import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PlaceCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-10" />
      </div>

      <Skeleton className="mt-2 h-3 w-full" />

      <Skeleton className="mt-3 h-8 w-full" />
    </Card>
  );
}
