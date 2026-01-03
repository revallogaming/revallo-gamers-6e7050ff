import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Coins, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/tournament/${tournament.id}?join=true`);
  };

  const getButtonText = () => {
    if (tournament.status === 'completed') return 'Encerrado';
    if (tournament.status === 'cancelled') return 'Cancelado';
    if (tournament.status === 'in_progress') return 'Em andamento';
    if (!hasVacancy) return 'Vagas esgotadas';
    if (!deadlineNotPassed) return 'Prazo encerrado';
    return 'Inscrever-se';
  };

  return (
    <Link to={`/tournament/${tournament.id}`}>
      <Card className="card-hover border-glow bg-gradient-card overflow-hidden group">
        <CardContent className="p-0">
          {/* Banner Image - Compact */}
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
              <GameIcon game={tournament.game} className="h-10 w-10 opacity-50" />
            </div>
          )}
          
          <div className="p-3">
            {/* Badges - Compact */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {tournament.is_highlighted && (
                <Badge className="bg-accent text-accent-foreground gap-0.5 text-[10px] px-1.5 py-0">
                  <Star className="h-2.5 w-2.5" />
                  Destaque
                </Badge>
              )}
              <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">{statusInfo.label}</Badge>
              <Badge variant="outline" className="gap-0.5 text-[10px] px-1.5 py-0">
                <GameIcon game={tournament.game} className="h-2.5 w-2.5" />
                {gameInfo.name}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="font-display text-sm font-bold text-foreground mb-1 group-hover:text-gradient-primary transition-all line-clamp-1">
              {tournament.title}
            </h3>

            {/* Info Row - Compact */}
            <div className="flex items-center gap-3 text-[11px] mb-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3 text-secondary" />
                <span>{format(new Date(tournament.start_date), 'dd MMM', { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3 text-secondary" />
                <span>{tournament.current_participants}/{tournament.max_participants}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Coins className="h-3 w-3 text-accent" />
                <span>{tournament.entry_fee > 0 ? `R$${(tournament.entry_fee / 100).toFixed(0)}` : 'Grátis'}</span>
              </div>
            </div>

            {/* Prize - Compact */}
            {tournament.prize_description && (
              <div className="text-[11px] text-accent font-medium line-clamp-1 mb-2">
                🏆 {tournament.prize_description}
              </div>
            )}

            {/* Join Button - Smaller */}
            <Button
              onClick={handleJoinClick}
              className="w-full h-8 text-xs"
              variant={canJoin ? "default" : "secondary"}
              disabled={!canJoin}
              size="sm"
            >
              {getButtonText()}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
