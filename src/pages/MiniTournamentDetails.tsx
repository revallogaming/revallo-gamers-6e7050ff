import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMiniTournament } from '@/hooks/useMiniTournaments';
import { useMiniTournamentParticipants } from '@/hooks/useMiniTournamentParticipants';
import { useUserPixKey } from '@/hooks/useUserPixKey';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentChat } from '@/components/mini-tournaments/MiniTournamentChat';
import { PrizeDepositDialog } from '@/components/mini-tournaments/PrizeDepositDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GAME_INFO, 
  MINI_TOURNAMENT_STATUS_INFO, 
  FORMAT_INFO,
} from '@/types';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Trophy, 
  Coins, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MiniTournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournament, isLoading, refetch } = useMiniTournament(id || '');
  const { 
    participants, 
    isParticipant, 
    joinTournament, 
    leaveTournament,
    isLoading: participantsLoading 
  } = useMiniTournamentParticipants(id || '');
  const { hasPixKey } = useUserPixKey();

  const isOrganizer = user?.id === tournament?.organizer_id;
  const canJoin = tournament?.status === 'open' && 
                  !isParticipant && 
                  !isOrganizer && 
                  hasPixKey &&
                  (tournament?.current_participants || 0) < (tournament?.max_participants || 0);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Torneio não encontrado</p>
            <Button asChild className="mt-4">
              <Link to="/comunidade">Voltar para Comunidade</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = MINI_TOURNAMENT_STATUS_INFO[tournament.status];
  const formatInfo = FORMAT_INFO[tournament.format];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{tournament.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{gameInfo.name}</Badge>
            <Badge variant="outline">{formatInfo.label}</Badge>
            <Badge 
              variant={statusInfo.variant}
              style={{ backgroundColor: statusInfo.color, color: 'white' }}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prize Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Premiação Total</p>
                    <p className="text-3xl font-bold text-primary">
                      R$ {tournament.prize_pool_brl.toFixed(2)}
                    </p>
                  </div>
                </div>
                {tournament.deposit_confirmed ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Garantido</span>
                  </div>
                ) : isOrganizer && tournament.status === 'draft' ? (
                  <PrizeDepositDialog tournament={tournament} onSuccess={refetch}>
                    <Button>Depositar Premiação</Button>
                  </PrizeDepositDialog>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Aguardando Depósito</span>
                  </div>
                )}
              </div>

              {/* Prize Distribution */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Distribuição</p>
                <div className="flex flex-wrap gap-2">
                  {tournament.prize_distribution.map((dist) => (
                    <div 
                      key={dist.place} 
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
                    >
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium">{dist.place}º lugar:</span>
                      <span className="text-primary font-bold">
                        R$ {(tournament.prize_pool_brl * dist.percentage / 100).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">({dist.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participantes</p>
                    <p className="font-medium">{tournament.current_participants}/{tournament.max_participants}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entrada</p>
                    <p className="font-medium">
                      {tournament.entry_fee_credits > 0 ? `${tournament.entry_fee_credits} créditos` : 'Grátis'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">
                      {format(new Date(tournament.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Inscrições até</p>
                    <p className="font-medium">
                      {format(new Date(tournament.registration_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {tournament.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Descrição</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{tournament.description}</p>
                  </div>
                </>
              )}

              {tournament.rules && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Regras</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chat */}
          <MiniTournamentChat 
            tournamentId={tournament.id} 
            isParticipant={isParticipant || isOrganizer} 
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!user ? (
                <Button asChild className="w-full">
                  <Link to="/auth">Entrar para Participar</Link>
                </Button>
              ) : isOrganizer ? (
                <p className="text-center text-muted-foreground">Você é o organizador</p>
              ) : isParticipant ? (
                <Button 
                  variant="destructive" 
                  onClick={() => leaveTournament.mutate()}
                  disabled={leaveTournament.isPending}
                  className="w-full"
                >
                  {leaveTournament.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sair do Torneio
                </Button>
              ) : !hasPixKey ? (
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/profile">Cadastrar Chave PIX</Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Você precisa cadastrar uma chave PIX para participar
                  </p>
                </div>
              ) : canJoin ? (
                <Button 
                  onClick={() => joinTournament.mutate()}
                  disabled={joinTournament.isPending}
                  className="w-full"
                >
                  {joinTournament.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar no Torneio
                  {tournament.entry_fee_credits > 0 && ` (${tournament.entry_fee_credits} créditos)`}
                </Button>
              ) : (
                <p className="text-center text-muted-foreground">
                  {tournament.status !== 'open' 
                    ? 'Inscrições encerradas'
                    : 'Torneio lotado'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Organizer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organizador</CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                to={`/profile/${tournament.organizer_id}`}
                className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 -m-2 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={tournament.organizer?.avatar_url || undefined} />
                  <AvatarFallback>
                    {tournament.organizer?.nickname?.charAt(0).toUpperCase() || 'O'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{tournament.organizer?.nickname || 'Organizador'}</span>
              </Link>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Participantes</span>
                <Badge variant="secondary">
                  {tournament.current_participants}/{tournament.max_participants}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participantsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : participants?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum participante ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {participants?.map((participant, index) => (
                    <Link 
                      key={participant.id}
                      to={`/profile/${participant.player_id}`}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.player?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {participant.player?.nickname?.charAt(0).toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate">
                        {participant.player?.nickname || 'Jogador'}
                      </span>
                      {participant.placement && (
                        <Badge variant="secondary" className="ml-auto">
                          {participant.placement}º
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
