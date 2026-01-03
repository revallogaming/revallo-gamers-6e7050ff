import { cn } from '@/lib/utils';
import { GameType } from '@/types';
import { Flame, Crosshair, Target, Sword, Shield } from 'lucide-react';

interface GameIconProps {
  game: GameType;
  className?: string;
}

export function GameIcon({ game, className }: GameIconProps) {
  const iconClass = cn("", className);
  
  switch (game) {
    case 'freefire':
      return <Flame className={cn(iconClass, "text-orange-500")} />;
    case 'fortnite':
      return <Crosshair className={cn(iconClass, "text-blue-500")} />;
    case 'cod':
      return <Target className={cn(iconClass, "text-green-500")} />;
    case 'league_of_legends':
      return <Sword className={cn(iconClass, "text-yellow-500")} />;
    case 'valorant':
      return <Shield className={cn(iconClass, "text-red-500")} />;
    default:
      return <Flame className={iconClass} />;
  }
}
