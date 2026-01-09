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
      className="bg-card border-border/30 hover:border-primary/50 overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Banner Image */}
      <div className="relative">
        {tournament.banner_url ? (
          <div className="aspect-[16/10] w-full overflow-hidden">
            <img 
              src={tournament.banner_url} 
              alt={tournament.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div 
            className="aspect-[16/10] w-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/30"
          >
            <GameIcon game={tournament.game} className="h-12 w-12 opacity-40" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        
        {/* Game Badge Overlay */}
        <div className="absolute top-2 left-2">
          <Badge 
            className="gap-1.5 text-[11px] px-2 py-1 backdrop-blur-md font-semibold bg-background/90 text-foreground border-0 shadow-lg"
          >
            <GameIcon game={tournament.game} className="h-3.5 w-3.5" />
            {gameInfo.name}
          </Badge>
        </div>

        {/* Countdown Badge */}
        {countdown && isRegistrationOpen && (
          <div className="absolute top-2 right-2">
            <Badge 
              className={`gap-1 text-[10px] px-2 py-1 backdrop-blur-md font-bold shadow-lg ${
                countdown.urgent 
                  ? "bg-destructive/90 text-destructive-foreground animate-pulse" 
                  : "bg-accent/90 text-accent-foreground"
              }`}
            >
              <Clock className="h-3 w-3" />
              {countdown.text}
            </Badge>
          </div>
        )}

        {/* Highlight Badge */}
        {tournament.is_highlighted && (
          <div className="absolute bottom-12 right-2">
            <Badge className="bg-yellow-500/90 text-yellow-950 gap-1 text-[10px] px-2 py-1 font-bold shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              Destaque
            </Badge>
          </div>
        )}

        {/* Status & Participants Row */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <Badge variant={statusInfo.variant} className="text-[11px] px-2 py-1 backdrop-blur-md font-semibold">
            {statusInfo.label}
          </Badge>
          
          {/* Participants with fill indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/90 backdrop-blur-md">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className={`text-[11px] font-bold ${
              fillPercentage >= 80 ? 'text-destructive' : 
              fillPercentage >= 50 ? 'text-yellow-500' : 'text-foreground'
            }`}>
              {tournament.current_participants}/{tournament.max_participants}
            </span>
            {fillPercentage >= 80 && <Flame className="h-3 w-3 text-destructive animate-pulse" />}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-display font-bold text-sm md:text-base text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {tournament.title}
        </h3>

        {/* Info Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">{format(new Date(tournament.start_date), "dd MMM", { locale: ptBR })}</span>
            </div>
          </div>
          
          {/* Prize / Entry Fee */}
          <div className="flex items-center gap-1.5">
            {tournament.prize_description && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-primary truncate max-w-[80px]">
                  {tournament.prize_description}
                </span>
              </div>
            )}
            {!tournament.prize_description && tournament.entry_fee > 0 && (
              <span className="text-sm font-bold text-primary">
                R${(tournament.entry_fee / 100).toFixed(0)}
              </span>
            )}
            {!tournament.prize_description && tournament.entry_fee === 0 && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                Grátis
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
