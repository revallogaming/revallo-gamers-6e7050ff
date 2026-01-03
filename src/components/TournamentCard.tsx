import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Coins, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tournament, GAME_INFO, STATUS_INFO } from '@/types';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = STATUS_INFO[tournament.status];

  return (
    <Link to={`/tournament/${tournament.id}`}>
      <Card className="card-hover border-glow bg-gradient-card overflow-hidden group">
        <CardContent className="p-0">
          {/* Game Header */}
          <div className={`h-2 bg-${gameInfo.color}`} />
          
          <div className="p-5">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              {tournament.is_highlighted && (
                <Badge className="bg-accent text-accent-foreground gap-1">
                  <Star className="h-3 w-3" />
                  Destaque
                </Badge>
              )}
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="outline" className="gap-1">
                <img src={gameInfo.image} alt={gameInfo.name} className="h-3 w-3 object-contain" />
                {gameInfo.name}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-gradient-primary transition-all">
              {tournament.title}
            </h3>

            {/* Description */}
            {tournament.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {tournament.description}
              </p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4 text-secondary" />
                <span>{format(new Date(tournament.start_date), 'dd MMM', { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 text-secondary" />
                <span>{tournament.current_participants}/{tournament.max_participants}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Coins className="h-4 w-4 text-accent" />
                <span>{tournament.entry_fee > 0 ? `R$ ${(tournament.entry_fee / 100).toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
              </div>
            </div>

            {/* Prize */}
            {tournament.prize_description && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Premiação</span>
                <p className="text-sm font-semibold text-accent">{tournament.prize_description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
