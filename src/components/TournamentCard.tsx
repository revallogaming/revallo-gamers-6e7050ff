import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Star, Trophy, Clock, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameIcon } from '@/components/GameIcon';
import { Tournament, GAME_INFO, STATUS_INFO } from '@/types';

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard = memo(function TournamentCard({ tournament }: TournamentCardProps) {
  const navigate = useNavigate();
  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = STATUS_INFO[tournament.status];
  
  const isRegistrationOpen = ['open', 'upcoming'].includes(tournament.status);
  const hasVacancy = tournament.current_participants < tournament.max_participants;
  const deadlineNotPassed = new Date(tournament.registration_deadline) > new Date();
  const canJoin = isRegistrationOpen && hasVacancy && deadlineNotPassed;

  // Calculate countdown
  const countdown = useMemo(() => {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const hoursLeft = differenceInHours(startDate, now);
    const daysLeft = differenceInDays(startDate, now);
    
    if (hoursLeft < 0) return null;
    if (hoursLeft < 24) return { text: `${hoursLeft}h`, urgent: true };
    if (daysLeft <= 3) return { text: `${daysLeft}d`, urgent: daysLeft <= 1 };
    return { text: `${daysLeft} dias`, urgent: false };
  }, [tournament.start_date]);

  // Calculate fill percentage for urgency indicator
  const fillPercentage = useMemo(() => {
    return Math.round((tournament.current_participants / tournament.max_participants) * 100);
  }, [tournament.current_participants, tournament.max_participants]);

  const handleClick = useCallback(() => {
    if (canJoin) {
      navigate(`/tournament/${tournament.id}?join=true`);
    } else {
      navigate(`/tournament/${tournament.id}`);
    }
  }, [canJoin, navigate, tournament.id]);

  return (
    <Card 
      onClick={handleClick}
      className="bg-card border-border/20 hover:border-border/50 overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-lg"
    >
      {/* Banner Image */}
      <div className="relative">
        {tournament.banner_url ? (
          <div className="aspect-[16/10] w-full overflow-hidden">
            <img 
              src={tournament.banner_url} 
              alt={tournament.title}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            />
          </div>
        ) : (
          <div 
            className="aspect-[16/10] w-full flex items-center justify-center bg-muted/50"
          >
            <GameIcon game={tournament.game} className="h-10 w-10 opacity-30" />
          </div>
        )}
        
        {/* Game Badge */}
        <div className="absolute top-2 left-2">
          <Badge 
            className="gap-1 text-[10px] px-1.5 py-0.5 backdrop-blur-sm font-medium bg-background/85 text-foreground border-0"
          >
            <GameIcon game={tournament.game} className="h-3 w-3" />
            {gameInfo.name}
          </Badge>
        </div>

        {/* Countdown Badge - only when urgent */}
        {countdown && countdown.urgent && isRegistrationOpen && (
          <div className="absolute top-2 right-2">
            <Badge className="gap-1 text-[10px] px-1.5 py-0.5 bg-destructive text-destructive-foreground font-semibold">
              <Clock className="h-2.5 w-2.5" />
              {countdown.text}
            </Badge>
          </div>
        )}

        {/* Highlight Badge */}
        {tournament.is_highlighted && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-primary-foreground gap-0.5 text-[10px] px-1.5 py-0.5">
              <Star className="h-2.5 w-2.5 fill-current" />
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
            {statusInfo.label}
          </Badge>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2.5">
        {/* Title */}
        <h3 className="font-medium text-sm text-foreground mb-2 line-clamp-1">
          {tournament.title}
        </h3>

        {/* Info Row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(tournament.start_date), "dd/MM", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{tournament.current_participants}/{tournament.max_participants}</span>
            </div>
          </div>
          
          {/* Prize or Entry Fee - simplified */}
          {tournament.prize_description ? (
            <div className="flex items-center gap-1 text-primary font-semibold">
              <Trophy className="h-3 w-3" />
              <span className="truncate max-w-[70px]">{tournament.prize_description}</span>
            </div>
          ) : tournament.entry_fee > 0 ? (
            <span className="text-primary font-medium">R${(tournament.entry_fee / 100).toFixed(0)}</span>
          ) : (
            <span className="text-green-500 font-medium">Grátis</span>
          )}
        </div>
      </div>
    </Card>
  );
});
