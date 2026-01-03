import { GameType, GAME_INFO } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameFilterProps {
  selected: GameType | "all";
  onSelect: (game: GameType | "all") => void;
}

export function GameFilter({ selected, onSelect }: GameFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === "all" ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect("all")}
        className={cn(
          'font-semibold',
          selected === "all" && 'bg-gradient-primary glow-primary'
        )}
      >
        Todos
      </Button>
      {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
        const info = GAME_INFO[game];
        return (
          <Button
            key={game}
            variant={selected === game ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(game)}
            className={cn(
              'font-semibold gap-1',
              selected === game && `bg-${info.color} hover:bg-${info.color}/90`
            )}
          >
            <img src={info.image} alt={info.name} className="h-4 w-4 object-contain" />
            {info.name}
          </Button>
        );
      })}
    </div>
  );
}
