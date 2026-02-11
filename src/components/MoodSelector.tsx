import { moodConfigs, type MoodType } from '@/utils/moodMapper';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
}

const moodGradients: Record<MoodType, string> = {
  work: 'from-indigo-500 to-violet-600',
  date: 'from-rose-500 to-pink-600',
  quick_bite: 'from-orange-500 to-amber-600',
  budget: 'from-emerald-500 to-green-600',
  sad: 'from-sky-500 to-cyan-600',
  fun: 'from-purple-500 to-fuchsia-600',
};

const moodBgColors: Record<MoodType, string> = {
  work: 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20',
  date: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20',
  quick_bite: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20',
  budget: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20',
  sad: 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20',
  fun: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
};

const moodSelectedColors: Record<MoodType, string> = {
  work: 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent shadow-lg shadow-indigo-500/25',
  date: 'bg-gradient-to-br from-rose-500 to-pink-600 border-transparent shadow-lg shadow-rose-500/25',
  quick_bite: 'bg-gradient-to-br from-orange-500 to-amber-600 border-transparent shadow-lg shadow-orange-500/25',
  budget: 'bg-gradient-to-br from-emerald-500 to-green-600 border-transparent shadow-lg shadow-emerald-500/25',
  sad: 'bg-gradient-to-br from-sky-500 to-cyan-600 border-transparent shadow-lg shadow-sky-500/25',
  fun: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-transparent shadow-lg shadow-purple-500/25',
};

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">What's your mood?</h2>
        {selectedMood && (
          <span className="text-xs text-muted-foreground">Tap to change</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {moodConfigs.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => onSelectMood(mood.id)}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-300',
                isSelected
                  ? cn(moodSelectedColors[mood.id], 'scale-[1.02]')
                  : moodBgColors[mood.id]
              )}
            >
              <span 
                className={cn(
                  "text-3xl transition-transform duration-300",
                  isSelected ? "scale-110" : "group-hover:scale-110"
                )}
              >
                {mood.emoji}
              </span>
              <div className="text-center">
                <span className={cn(
                  "block text-sm font-semibold transition-colors",
                  isSelected ? "text-white" : "text-foreground"
                )}>
                  {mood.label}
                </span>
                <span className={cn(
                  "text-[10px] transition-colors",
                  isSelected ? "text-white/80" : "text-muted-foreground"
                )}>
                  {mood.description}
                </span>
              </div>
              
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
                  <svg
                    className="h-3 w-3 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
