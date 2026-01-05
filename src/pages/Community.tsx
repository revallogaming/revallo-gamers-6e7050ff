import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMiniTournaments, useMyMiniTournaments } from '@/hooks/useMiniTournaments';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentCard } from '@/components/mini-tournaments/MiniTournamentCard';
import { CreateMiniTournamentDialog } from '@/components/mini-tournaments/CreateMiniTournamentDialog';
import { EditMiniTournamentDialog } from '@/components/mini-tournaments/EditMiniTournamentDialog';
import { DeleteMiniTournamentDialog } from '@/components/mini-tournaments/DeleteMiniTournamentDialog';
import { PrizeDepositDialog } from '@/components/mini-tournaments/PrizeDepositDialog';
import { GameIcon } from '@/components/GameIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';
import { GAME_INFO, GameType, FORMAT_INFO, MiniTournament, MiniTournamentFormat } from '@/types';
import { 
  Search, Plus, Trophy, Users, Calendar, Coins, Edit, 
  ExternalLink, Copy, CheckCircle, Bell, BellRing,
  Trash2, CreditCard, X, Gamepad2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MINI_STATUS_INFO: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "#6b7280" },
  pending_deposit: { label: "Aguardando Depósito", color: "#f59e0b" },
  open: { label: "Aberto", color: "#22c55e" },
  in_progress: { label: "Em Andamento", color: "#3b82f6" },
  awaiting_result: { label: "Aguardando Resultado", color: "#8b5cf6" },
  completed: { label: "Finalizado", color: "#10b981" },
  cancelled: { label: "Cancelado", color: "#ef4444" },
};

interface Notification {
  id: string;
  message: string;
  tournamentId: string;
  tournamentTitle: string;
  playerName: string;
  timestamp: Date;
  read: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<MiniTournamentFormat | 'all'>('all');
  const [statusTab, setStatusTab] = useState<'open' | 'all'>('open');
  const [mainTab, setMainTab] = useState<'explore' | 'my-tournaments'>('explore');
  
  // Notifications state for organizer section
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { tournaments, isLoading } = useMiniTournaments(
    statusTab === 'open' ? { status: 'open' } : undefined
  );
  
  const { data: myTournaments, isLoading: isLoadingMy, refetch: refetchMy } = useMyMiniTournaments();

  // Real-time subscription for new participants in organizer's tournaments
  useEffect(() => {
    if (!user || !myTournaments?.length) return;

    const tournamentIds = myTournaments.map(t => t.id);

    const channel = supabase
      .channel('mini-tournament-participants-organizer')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mini_tournament_participants',
        },
        async (payload) => {
          const newParticipant = payload.new as { tournament_id: string; player_id: string };
          
          if (!tournamentIds.includes(newParticipant.tournament_id)) return;

          // Fetch player info
          const { data: player } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', newParticipant.player_id)
            .single();

          // Fetch tournament info
          const tournament = myTournaments.find(t => t.id === newParticipant.tournament_id);

          const notification: Notification = {
            id: `${newParticipant.tournament_id}-${newParticipant.player_id}-${Date.now()}`,
            message: `${player?.nickname || 'Jogador'} entrou no torneio`,
            tournamentId: newParticipant.tournament_id,
            tournamentTitle: tournament?.title || 'Torneio',
            playerName: player?.nickname || 'Jogador',
            timestamp: new Date(),
            read: false,
          };

          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          toast.success(`🎮 ${player?.nickname || 'Jogador'} entrou em "${tournament?.title}"`, {
            duration: 5000,
          });

          refetchMy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, myTournaments, refetchMy]);

  const filteredTournaments = tournaments?.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = gameFilter === 'all' || t.game === gameFilter;
    const matchesFormat = formatFilter === 'all' || t.format === formatFilter;
    return matchesSearch && matchesGame && matchesFormat;
  });

  const copyTournamentLink = (id: string) => {
    const url = `${window.location.origin}/comunidade/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Organizer tournament lists
  const activeTournaments = myTournaments?.filter((t) => 
    ["draft", "pending_deposit", "open", "in_progress", "awaiting_result"].includes(t.status)
  ) || [];
  const completedTournaments = myTournaments?.filter((t) => 
    ["completed", "cancelled"].includes(t.status)
  ) || [];

  return (
    <>
      <SEO 
        title="Comunidade - Mini Torneios"
        description="Participe de mini torneios comunitários com premiação em dinheiro real via PIX"
      />

      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Comunidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Mini torneios com premiação garantida em R$
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Bell - only show when on my-tournaments tab */}
            {user && mainTab === 'my-tournaments' && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {unreadCount > 0 ? (
                    <BellRing className="h-5 w-5 text-accent animate-pulse" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <Card className="absolute right-0 top-12 w-80 md:w-96 z-50 shadow-xl border-border/50">
                    <div className="p-4 border-b border-border/50 flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Notificações</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                            Marcar lidas
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNotifications(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="max-h-80">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma notificação</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              to={`/comunidade/${notification.tournamentId}`}
                              className={`block p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-accent/5' : ''}`}
                              onClick={() => {
                                setNotifications(prev =>
                                  prev.map(n =>
                                    n.id === notification.id ? { ...n, read: true } : n
                                  )
                                );
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`h-2 w-2 rounded-full mt-2 ${!notification.read ? 'bg-accent' : 'bg-muted'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {notification.playerName} entrou
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {notification.tournamentTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(notification.timestamp, "dd/MM HH:mm")}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-border/50">
                        <Button variant="ghost" size="sm" className="w-full" onClick={clearNotifications}>
                          Limpar todas
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}

            {user && (
              <CreateMiniTournamentDialog>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Mini Torneio
                </Button>
              </CreateMiniTournamentDialog>
            )}
          </div>
        </div>

        {/* Main Tabs - Explore vs My Tournaments */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'explore' | 'my-tournaments')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="explore" className="gap-2">
              <Trophy className="h-4 w-4" />
              Explorar
            </TabsTrigger>
            {user && (
              <TabsTrigger value="my-tournaments" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Meus Mini Torneios
                {myTournaments && myTournaments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {myTournaments.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Explore Tab Content */}
          <TabsContent value="explore" className="mt-6 space-y-6">
            {/* Stats */}
            <Card className="w-full sm:w-auto sm:max-w-xs">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tournaments?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Torneios Ativos</p>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar torneios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={gameFilter} onValueChange={(v) => setGameFilter(v as GameType | 'all')}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Todos os jogos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Jogos</SelectItem>
                    {Object.entries(GAME_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v as MiniTournamentFormat | 'all')}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Todos os modos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Modos</SelectItem>
                    {Object.entries(FORMAT_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as 'open' | 'all')}>
              <TabsList>
                <TabsTrigger value="open">Abertos para Inscrição</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
              </TabsList>

              <TabsContent value={statusTab} className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={i} className="h-64" />
                    ))}
                  </div>
                ) : filteredTournaments?.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Nenhum torneio encontrado</p>
                      <p className="text-muted-foreground text-center mt-1">
                        {user ? 'Seja o primeiro a criar um mini torneio!' : 'Volte mais tarde ou crie uma conta para organizar!'}
                      </p>
                      {user && (
                        <CreateMiniTournamentDialog>
                          <Button className="mt-4 gap-2">
                            <Plus className="h-4 w-4" />
                            Criar Mini Torneio
                          </Button>
                        </CreateMiniTournamentDialog>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTournaments?.map(tournament => (
                      <MiniTournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* My Tournaments Tab Content */}
          {user && (
            <TabsContent value="my-tournaments" className="mt-6 space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{myTournaments?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{activeTournaments.length}</p>
                        <p className="text-xs text-muted-foreground">Ativos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {myTournaments?.reduce((sum, t) => sum + t.current_participants, 0) || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Participantes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Coins className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          R$ {myTournaments?.reduce((sum, t) => sum + t.prize_pool_brl, 0).toFixed(0) || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Em Prêmios</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Organizer Tournaments List with Sub-tabs */}
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="active">
                    Ativos ({activeTournaments.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Finalizados ({completedTournaments.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    Todos ({myTournaments?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <MyTournamentsList 
                    tournaments={activeTournaments} 
                    isLoading={isLoadingMy}
                    onCopyLink={copyTournamentLink}
                    copiedId={copiedId}
                    onRefetch={refetchMy}
                  />
                </TabsContent>

                <TabsContent value="completed">
                  <MyTournamentsList 
                    tournaments={completedTournaments} 
                    isLoading={isLoadingMy}
                    onCopyLink={copyTournamentLink}
                    copiedId={copiedId}
                    onRefetch={refetchMy}
                  />
                </TabsContent>

                <TabsContent value="all">
                  <MyTournamentsList 
                    tournaments={myTournaments || []} 
                    isLoading={isLoadingMy}
                    onCopyLink={copyTournamentLink}
                    copiedId={copiedId}
                    onRefetch={refetchMy}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}

interface MyTournamentsListProps {
  tournaments: MiniTournament[];
  isLoading: boolean;
  onCopyLink: (id: string) => void;
  copiedId: string | null;
  onRefetch: () => void;
}

function MyTournamentsList({ tournaments, isLoading, onCopyLink, copiedId, onRefetch }: MyTournamentsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-16">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum mini torneio encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro mini torneio e comece a receber jogadores!
            </p>
            <CreateMiniTournamentDialog>
              <Button className="bg-gradient-primary hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Mini Torneio
              </Button>
            </CreateMiniTournamentDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => {
        const gameInfo = GAME_INFO[tournament.game as GameType];
        const formatInfo = FORMAT_INFO[tournament.format as MiniTournamentFormat];
        const statusInfo = MINI_STATUS_INFO[tournament.status];
        const canDeposit = tournament.status === 'draft' || tournament.status === 'pending_deposit';
        const canEdit = tournament.status === 'draft' || tournament.status === 'pending_deposit';
        const canDelete = tournament.status === 'draft' || tournament.status === 'pending_deposit';

        return (
          <Card key={tournament.id} className="border-border/50 overflow-hidden hover:border-primary/30 transition-colors">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <GameIcon game={tournament.game} className="h-10 w-10" />
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-foreground truncate">
                      {tournament.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatInfo?.label} • {gameInfo?.name}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className="shrink-0"
                  style={{ 
                    borderColor: statusInfo?.color,
                    color: statusInfo?.color 
                  }}
                >
                  {statusInfo?.label}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">
                    {tournament.current_participants}/{tournament.max_participants}
                  </p>
                  <p className="text-xs text-muted-foreground">Jogadores</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Coins className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">
                    R$ {tournament.prize_pool_brl}
                  </p>
                  <p className="text-xs text-muted-foreground">Prêmio</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">
                    {format(new Date(tournament.start_date), "dd/MM")}
                  </p>
                  <p className="text-xs text-muted-foreground">Início</p>
                </div>
              </div>

              {/* Deposit Alert */}
              {canDeposit && !tournament.deposit_confirmed && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-500 font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Deposite R$ {tournament.prize_pool_brl} para publicar
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => onCopyLink(tournament.id)}
                >
                  {copiedId === tournament.id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                
                <Link to={`/comunidade/${tournament.id}`}>
                  <Button variant="ghost" size="sm" className="h-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>

                {canDeposit && !tournament.deposit_confirmed && (
                  <PrizeDepositDialog tournament={tournament} onSuccess={onRefetch}>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-amber-500 border-amber-500/30">
                      <CreditCard className="h-4 w-4" />
                      Depositar
                    </Button>
                  </PrizeDepositDialog>
                )}

                {canEdit && (
                  <EditMiniTournamentDialog tournament={tournament} onSuccess={onRefetch}>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </EditMiniTournamentDialog>
                )}

                {canDelete && (
                  <DeleteMiniTournamentDialog tournament={tournament} onSuccess={onRefetch}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DeleteMiniTournamentDialog>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
