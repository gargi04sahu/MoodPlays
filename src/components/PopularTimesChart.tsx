import { cn } from '@/lib/utils';
import type { HourlyPopularity } from '@/services/placesApi';

interface PopularTimesChartProps {
  data: HourlyPopularity[];
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function getPopularityLabel(popularity: number): string {
  if (popularity >= 80) return 'Very busy';
  if (popularity >= 60) return 'Busy';
  if (popularity >= 40) return 'Moderate';
  if (popularity >= 20) return 'Not busy';
  return 'Quiet';
}

export function PopularTimesChart({ data }: PopularTimesChartProps) {
  const currentHour = new Date().getHours();
  const maxPopularity = Math.max(...data.map(d => d.popularity), 1);
  
  // Find current hour's data
  const currentData = data.find(d => d.hour === currentHour);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Popular Times</h4>
        {currentData && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            currentData.popularity >= 60 
              ? "bg-status-closed/10 text-status-closed" 
              : "bg-status-open/10 text-status-open"
          )}>
            {getPopularityLabel(currentData.popularity)} now
          </span>
        )}
      </div>
      
      <div className="flex items-end gap-0.5 h-20">
        {data.map((item) => {
          const isCurrentHour = item.hour === currentHour;
          const heightPercent = (item.popularity / maxPopularity) * 100;
          
          return (
            <div
              key={item.hour}
              className="flex-1 flex flex-col items-center group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
                  <div className="font-medium">{formatHour(item.hour)}</div>
                  <div className="text-muted-foreground">{getPopularityLabel(item.popularity)}</div>
                </div>
              </div>
              
              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-200",
                  isCurrentHour 
                    ? "bg-primary" 
                    : "bg-muted-foreground/20 group-hover:bg-muted-foreground/40"
                )}
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        {data.filter((_, i) => i % 3 === 0).map((item) => (
          <span key={item.hour}>{formatHour(item.hour)}</span>
        ))}
      </div>
    </div>
  );
}
