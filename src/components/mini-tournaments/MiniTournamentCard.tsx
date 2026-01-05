import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MiniTournament, GAME_INFO, MINI_TOURNAMENT_STATUS_INFO, FORMAT_INFO } from '@/types';
import { Calendar, Users, Trophy, Coins, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  tournament: MiniTournament;
}

export function MiniTournamentCard({ tournament }: Props) {
  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = MINI_TOURNAMENT_STATUS_INFO[tournament.status];
  const formatInfo = FORMAT_INFO[tournament.format];

  return (
    <Link to={`/comunidade/${tournament.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 overflow-hidden group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {tournament.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {gameInfo.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatInfo.label}
                </Badge>
              </div>
            </div>
            <Badge 
              variant={statusInfo.variant}
              style={{ backgroundColor: statusInfo.color, color: 'white' }}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-3">
          {/* Prize Pool - Highlight */}
          <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-primary">
              R$ {tournament.prize_pool_brl.toFixed(2)}
            </span>
            {tournament.deposit_confirmed && (
              <div className="flex items-center gap-1 text-green-500 text-xs">
                <CheckCircle className="h-3 w-3" />
                <span>Garantido</span>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{tournament.current_participants}/{tournament.max_participants}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>{tournament.entry_fee_credits > 0 ? `${tournament.entry_fee_credits} créditos` : 'Grátis'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(tournament.start_date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          </div>

          {/* Prize Distribution Preview */}
          <div className="flex gap-1 text-xs">
            {tournament.prize_distribution.slice(0, 3).map((dist) => (
              <Badge key={dist.place} variant="secondary" className="text-xs">
                {dist.place}º: {dist.percentage}%
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={tournament.organizer?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {tournament.organizer?.nickname?.charAt(0).toUpperCase() || 'O'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {tournament.organizer?.nickname || 'Organizador'}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
