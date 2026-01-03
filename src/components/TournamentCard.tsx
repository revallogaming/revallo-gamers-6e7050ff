import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameIcon } from '@/components/GameIcon';
import { Tournament, GAME_INFO, STATUS_INFO } from '@/types';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const navigate = useNavigate();
  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = STATUS_INFO[tournament.status];
  
  const isRegistrationOpen = ['open', 'upcoming'].includes(tournament.status);
  const hasVacancy = tournament.current_participants < tournament.max_participants;
  const deadlineNotPassed = new Date(tournament.registration_deadline) > new Date();
  const canJoin = isRegistrationOpen && hasVacancy && deadlineNotPassed;

  const handleClick = () => {
    if (canJoin) {
      navigate(`/tournament/${tournament.id}?join=true`);
    } else {
      navigate(`/tournament/${tournament.id}`);
    }
  };

  return (
    <Card 
      onClick={handleClick}
      className="card-hover border-glow bg-gradient-card overflow-hidden group cursor-pointer"
    >
      {/* Banner Image */}
      <div className="relative">
        {tournament.banner_url ? (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={tournament.banner_url} 
              alt={tournament.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div 
            className="aspect-video w-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${gameInfo.color}40 0%, hsl(var(--muted)) 100%)` }}
          >
            <GameIcon game={tournament.game} className="h-12 w-12 opacity-50" />
          </div>
        )}
        
        {/* Game Badge Overlay */}
        <div className="absolute top-2 left-2">
          <Badge 
            className="gap-1 text-[10px] px-2 py-0.5 backdrop-blur-sm"
            style={{ backgroundColor: `${gameInfo.color}cc` }}
          >
            <GameIcon game={tournament.game} className="h-3 w-3" />
            {gameInfo.name.toUpperCase()}
          </Badge>
        </div>

        {/* Highlight Badge */}
        {tournament.is_highlighted && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-accent text-accent-foreground gap-0.5 text-[10px] px-1.5 py-0.5">
              <Star className="h-2.5 w-2.5" />
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
      <div className="p-3">
        {/* Title */}
        <h3 className="font-display text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
          {tournament.title}
        </h3>

        {/* Info Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(tournament.start_date), "dd 'de' MMM", { locale: ptBR })}</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{tournament.current_participants}/{tournament.max_participants}</span>
          </div>
          {tournament.entry_fee > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-accent font-medium">R${(tournament.entry_fee / 100).toFixed(0)}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
