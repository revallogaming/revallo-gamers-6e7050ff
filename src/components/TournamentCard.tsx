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
      className="bg-card border-border/40 hover:border-primary/40 overflow-hidden group cursor-pointer transition-colors"
    >
      {/* Banner Image */}
      <div className="relative">
        {tournament.banner_url ? (
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src={tournament.banner_url} 
              alt={tournament.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div 
            className="aspect-[4/3] w-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${gameInfo.color}40 0%, hsl(var(--muted)) 100%)` }}
          >
            <GameIcon game={tournament.game} className="h-12 w-12 opacity-50" />
          </div>
        )}
        
        {/* Game Badge Overlay */}
        <div className="absolute top-1.5 left-1.5">
          <Badge 
            className="gap-1 text-[9px] px-1.5 py-0.5 backdrop-blur-sm font-medium"
            style={{ backgroundColor: `${gameInfo.color}cc` }}
          >
            <GameIcon game={tournament.game} className="h-2.5 w-2.5" />
            {gameInfo.name}
          </Badge>
        </div>

        {/* Highlight Badge */}
        {tournament.is_highlighted && (
          <div className="absolute top-1.5 right-1.5">
            <Badge className="bg-accent/90 text-accent-foreground gap-0.5 text-[9px] px-1 py-0.5">
              <Star className="h-2 w-2" />
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-1.5 left-1.5">
          <Badge variant={statusInfo.variant} className="text-[9px] px-1.5 py-0.5 backdrop-blur-sm">
            {statusInfo.label}
          </Badge>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2.5">
        {/* Title */}
        <h3 className="font-medium text-xs text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {tournament.title}
        </h3>

        {/* Info Row */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <Calendar className="h-2.5 w-2.5" />
            <span>{format(new Date(tournament.start_date), "dd/MM", { locale: ptBR })}</span>
          </div>
          <span className="text-border/50">•</span>
          <div className="flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" />
            <span>{tournament.current_participants}/{tournament.max_participants}</span>
          </div>
          {tournament.entry_fee > 0 && (
            <>
              <span className="text-border/50">•</span>
              <span className="text-primary font-medium">R${(tournament.entry_fee / 100).toFixed(0)}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
