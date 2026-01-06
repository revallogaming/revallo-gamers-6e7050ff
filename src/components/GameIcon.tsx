import { cn } from '@/lib/utils';
import { Flame, Shield, Zap } from 'lucide-react';

interface GameIconProps {
  game: string;
  className?: string;
}

export function GameIcon({ game, className }: GameIconProps) {
  const iconClass = cn("", className);
  
  switch (game) {
    case 'freefire':
      return <Flame className={cn(iconClass, "text-orange-500")} />;
    case 'valorant':
      return <Shield className={cn(iconClass, "text-red-500")} />;
    case 'blood_strike':
      return <Zap className={cn(iconClass, "text-cyan-500")} />;
    default:
      return <Flame className={iconClass} />;
  }
}
