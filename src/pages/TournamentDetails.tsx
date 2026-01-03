import { useParams, Navigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useTournament, useTournamentParticipants, useJoinTournament } from "@/hooks/useTournaments";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Calendar, Users, Coins, Clock, 
  ArrowLeft, Star, Medal, CheckCircle, AlertCircle 
} from "lucide-react";
import { GAME_INFO, STATUS_INFO } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, isLoading } = useTournament(id || "");
  const { data: participants } = useTournamentParticipants(id || "");
  const { user, profile } = useAuth();
  const { spendCredits } = useCredits();
  const joinTournament = useJoinTournament();
  const { toast } = useToast();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  const isRegistered = participants?.some((p) => p.player_id === user?.id);
  const canRegister = tournament?.status === "open" && 
    !isRegistered && 
    (tournament?.current_participants ?? 0) < (tournament?.max_participants ?? 0);

  const handleJoin = async () => {
    if (!user || !tournament) {
      toast({ title: "Faça login para se inscrever", variant: "destructive" });
      return;
    }

    if ((profile?.credits ?? 0) < tournament.entry_fee) {
      toast({ 
        title: "Créditos insuficientes", 
        description: `Você precisa de ${tournament.entry_fee} créditos`,
        variant: "destructive" 
      });
      return;
    }

    try {
      // Spend credits first
      if (tournament.entry_fee > 0) {
        await spendCredits.mutateAsync({
          amount: tournament.entry_fee,
          type: "tournament_entry",
          description: `Inscrição: ${tournament.title}`,
          referenceId: tournament.id,
        });
      }

      // Then join tournament
      await joinTournament.mutateAsync({
        tournamentId: tournament.id,
        playerId: user.id,
      });
    } catch (error: any) {
      toast({ 
        title: "Erro na inscrição", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Trophy className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Torneio não encontrado</h1>
          <Link to="/">
            <Button className="mt-4">Voltar para início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = STATUS_INFO[tournament.status];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <div 
        className="relative h-48 md:h-64 overflow-hidden border-b border-border/50"
        style={{ 
          background: `linear-gradient(135deg, ${gameInfo.color}40 0%, hsl(var(--background)) 100%)` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="container relative h-full flex items-end pb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{gameInfo.icon}</div>
            <div>
              <Badge 
                variant="outline" 
                className="mb-2"
                style={{ borderColor: statusInfo.color, color: statusInfo.color }}
              >
                {statusInfo.label}
              </Badge>
              <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground">
                {tournament.title}
              </h1>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Sobre o Torneio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {tournament.description || "Nenhuma descrição disponível."}
                </p>
              </CardContent>
            </Card>
            
            {/* Rules */}
            {tournament.rules && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Regras</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {tournament.rules}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Prize */}
            {tournament.prize_description && (
              <Card className="border-border/50 border-accent/30 bg-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <Medal className="h-5 w-5" />
                    Premiação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {tournament.prize_description}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Participants */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {tournament.current_participants}/{tournament.max_participants}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants && participants.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {participants.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3"
                      >
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          #{i + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={(p as any).player?.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {(p as any).player?.nickname?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {(p as any).player?.nickname || "Jogador"}
                        </span>
                        {p.placement && p.placement <= 3 && (
                          <Star className="ml-auto h-4 w-4 text-accent" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum participante ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="border-border/50 sticky top-24">
              <CardContent className="pt-6 space-y-4">
                {/* Info Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Início
                    </span>
                    <span className="font-medium text-foreground">
                      {format(new Date(tournament.start_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Inscrições até
                    </span>
                    <span className="font-medium text-foreground">
                      {format(new Date(tournament.registration_deadline), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Vagas
                    </span>
                    <span className="font-medium text-foreground">
                      {tournament.current_participants}/{tournament.max_participants}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Inscrição
                    </span>
                    <span className="font-bold text-accent">
                      {tournament.entry_fee > 0 ? `${tournament.entry_fee} créditos` : "Grátis"}
                    </span>
                  </div>
                </div>
                
                <hr className="border-border" />
                
                {/* Action Button */}
                {!user ? (
                  <Link to="/auth" className="block">
                    <Button className="w-full">
                      Fazer Login para Inscrever
                    </Button>
                  </Link>
                ) : isRegistered ? (
                  <div className="flex items-center justify-center gap-2 text-green-500 py-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Você está inscrito!</span>
                  </div>
                ) : canRegister ? (
                  <Button
                    className="w-full bg-gradient-primary hover:opacity-90 glow-primary"
                    onClick={handleJoin}
                    disabled={joinTournament.isPending || spendCredits.isPending}
                  >
                    {joinTournament.isPending || spendCredits.isPending
                      ? "Inscrevendo..."
                      : tournament.entry_fee > 0
                      ? `Inscrever-se (${tournament.entry_fee} créditos)`
                      : "Inscrever-se Grátis"}
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground py-3">
                    <AlertCircle className="h-5 w-5" />
                    <span>Inscrições encerradas</span>
                  </div>
                )}
                
                {user && !isRegistered && tournament.entry_fee > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Seu saldo: {profile?.credits ?? 0} créditos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
