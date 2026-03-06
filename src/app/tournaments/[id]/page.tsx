"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { EditTournamentDialog } from "@/components/EditTournamentDialog";
import { Header } from "@/components/Header";
import {
  SEO,
  getTournamentStructuredData,
  getBreadcrumbStructuredData,
} from "@/components/SEO";
import {
  useTournament,
  useTournamentParticipants,
} from "@/hooks/useTournaments";
import { useMatches } from "@/hooks/useMatches";
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { useAuth } from "@/hooks/useAuth";
import { useFollowers } from "@/hooks/useFollowers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  Users,
  Coins,
  Clock,
  ArrowLeft,
  Star,
  Medal,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Link as LinkIcon,
  UserPlus,
  UserCheck,
  Flag,
  MessageSquare,
  Settings,
} from "lucide-react";
import { GAME_INFO, STATUS_INFO, TournamentParticipant } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { JoinTournamentDialog } from "@/components/JoinTournamentDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { toast } from "sonner";
import { normalizeExternalUrl } from "@/lib/links";
import Link from "next/link";

export default function TournamentDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: tournament, isLoading } = useTournament(id || "");
  const { data: participants } = useTournamentParticipants(id || "");
  const { user } = useAuth();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "about" | "participants"
  >("about");

  const { data: matches } = useMatches(id || "");

  // Enable realtime updates for participants
  useRealtimeParticipants(id);

  const organizerId = tournament?.organizer_id;
  const { isFollowing, toggleFollow, isToggling, followerCount } =
    useFollowers(organizerId);

  // Use a ref to prevent double-processing and infinite navigation loops
  const joinProcessed = useRef(false);

  // Auto-open join dialog if ?join=true
  useEffect(() => {
    if (joinProcessed.current) return;

    const joinParam = searchParams?.get("join");
    if (joinParam === "true" && tournament && user && !isLoading) {
      const isRegistered = participants?.some((p: any) => p.player_id === user?.uid);
      const isRegistrationOpen = ["open", "upcoming"].includes(
        tournament.status,
      );
      const hasVacancy =
        tournament.current_participants < tournament.max_participants;
      const deadlineNotPassed =
        new Date(tournament.registration_deadline) > new Date();

      if (
        !isRegistered &&
        isRegistrationOpen &&
        hasVacancy &&
        deadlineNotPassed
      ) {
        setJoinDialogOpen(true);
      }

      // Mark as processed BEFORE calling replace to prevent race conditions
      joinProcessed.current = true;

      // Clear the query param by pushing back to the same URL without it
      const newPath = window.location.pathname;
      router.replace(newPath);
    }
  }, [searchParams, tournament, user, participants, isLoading, router]);

  if (!id) {
    return null;
  }

  const isRegistered = participants?.some((p: any) => p.player_id === user?.uid);
  const isRegistrationOpen = tournament
    ? ["open", "upcoming"].includes(tournament.status)
    : false;
  const hasVacancy =
    (tournament?.current_participants ?? 0) <
    (tournament?.max_participants ?? 0);
  const deadlineNotPassed = tournament
    ? new Date(tournament.registration_deadline) > new Date()
    : false;
  const canRegister =
    isRegistrationOpen && !isRegistered && hasVacancy && deadlineNotPassed;

  const handleJoin = () => {
    if (!user) {
      toast.error("Faça login para se inscrever");
      return;
    }
    setJoinDialogOpen(true);
  };

  const copyTournamentLink = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success("Link do torneio copiado!");
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
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Torneio não encontrado
          </h1>
          <Link href="/tournaments">
            <Button className="mt-4">Explorar Torneios</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gameInfo = tournament.game ? GAME_INFO[tournament.game] : null;
  const statusInfo = tournament.status ? STATUS_INFO[tournament.status] : null;

  if (!gameInfo || !statusInfo) return null;

  return (
    <>
      <SEO
        title={tournament.title}
        description={
          tournament.description ||
          `Torneio de ${gameInfo.name} na Revallo. ${tournament.max_participants} vagas, inscrição ${tournament.entry_fee > 0 ? `R$ ${(tournament.entry_fee / 100).toFixed(2).replace(".", ",")}` : "grátis"}.`
        }
        image={tournament.banner_url || undefined}
        type="website"
        structuredData={[
          getTournamentStructuredData(tournament),
          getBreadcrumbStructuredData([
            { name: "Início", url: "https://revallo.com.br" },
            { name: "Torneios", url: "https://revallo.com.br/tournaments" },
            {
              name: tournament.title,
              url: `https://revallo.com.br/tournaments/${tournament.id}`,
            },
          ]),
        ]}
        keywords={`torneio ${gameInfo.name.toLowerCase()}, ${tournament.title.toLowerCase()}, campeonato esports, competição gaming`}
      />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Facebook-style Banner + Avatar */}
        <div className="relative">
          {/* Banner */}
          <div
            className="relative h-48 md:h-72 overflow-hidden"
            style={{
              background: tournament.banner_url
                ? undefined
                : `linear-gradient(135deg, ${gameInfo.color}40 0%, hsl(var(--background)) 100%)`,
            }}
          >
            {tournament.banner_url ? (
              <img
                src={tournament.banner_url}
                alt={tournament.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <GameIcon
                  game={tournament.game}
                  className="h-24 w-24 opacity-30"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>

          {/* Organizer Avatar + Title (overlapping banner) */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
              {/* Organizer Avatar */}
              <Link
                href={`/profile/${tournament.organizer_id}`}
                className="flex-shrink-0"
              >
                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage src={tournament.organizer?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl md:text-3xl font-bold">
                    {tournament.organizer?.nickname?.[0]?.toUpperCase() || "O"}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* Title and Status */}
              <div className="flex-1 pb-2">
                <Badge
                  variant="outline"
                  className="mb-2"
                  style={{
                    borderColor: statusInfo.color,
                    color: statusInfo.color,
                  }}
                >
                  {statusInfo.label}
                </Badge>
                <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground">
                  {tournament.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Link
                    href={`/profile/${tournament.organizer_id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm inline-flex items-center gap-1"
                  >
                    Organizado por{" "}
                    <span className="font-medium text-primary">
                      {tournament.organizer?.nickname || "Organizador"}
                    </span>
                  </Link>
                  {followerCount !== undefined && followerCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      • {followerCount}{" "}
                      {followerCount === 1 ? "seguidor" : "seguidores"}
                    </span>
                  )}
                  {user && user.uid !== organizerId && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={toggleFollow}
                      disabled={isToggling}
                      className="h-7 text-xs"
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Seguir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Game Icon */}
              <div className="hidden md:flex items-center gap-2 pb-2">
                <GameIcon game={tournament.game} className="h-8 w-8" />
                <span className="text-muted-foreground font-medium">
                  {gameInfo.name}
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-border/50" />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportDialogOpen(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Denunciar
                </Button>
              )}
              {user?.uid === tournament.organizer_id && (
                <EditTournamentDialog tournament={tournament}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-black uppercase italic tracking-widest text-[10px]"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Torneio
                  </Button>
                </EditTournamentDialog>
              )}
              <Link href={`/tournaments/${id}/hub`}>
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-black uppercase italic tracking-widest text-[10px]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ir ao Chat
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={copyTournamentLink} className="border-white/10 hover:bg-white/5 font-black uppercase italic tracking-widest text-[10px]">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit mb-6 border border-white/5">
                {[
                  { id: "about", label: "Sobre", icon: Trophy },
                  { id: "participants", label: "Participantes", icon: Users },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as "about" | "participants",
                      )
                    }
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black italic uppercase tracking-widest transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-gray-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "about" && (
                <div className="space-y-6">
                  {/* Description */}
                  <Card className="bg-white/2 border-white/5 backdrop-blur-sm rounded-none overflow-hidden group">
                    <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-30 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-sm font-black italic uppercase tracking-widest">Sobre o Torneio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {tournament.description || "Nenhuma descrição disponível."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Rules */}
                  {tournament.rules && (
                    <Card className="bg-white/2 border-white/5 backdrop-blur-sm rounded-none overflow-hidden group">
                      <div className="h-1 w-full bg-gradient-to-r from-gray-500/50 via-gray-500 to-gray-500/50 opacity-20 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-gray-500/10 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-gray-500" />
                        </div>
                        <CardTitle className="text-sm font-black italic uppercase tracking-widest">Regras</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                          {tournament.rules}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Prize */}
                  {tournament.prize_description && (
                    <Card className="bg-primary/5 border-primary/20 backdrop-blur-sm rounded-none overflow-hidden group">
                      <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                      <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Medal className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-sm font-black italic uppercase tracking-widest text-primary">Premiação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white text-base font-black italic uppercase tracking-tight whitespace-pre-wrap">
                          {tournament.prize_description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Internal coordination is now handled via the Bracket/Matches */}
                </div>
              )}


              {activeTab === "participants" && (
                <div className="space-y-6">
                  {/* Participants */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Participantes
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {tournament.current_participants}/
                          {tournament.max_participants}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {participants && participants.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {participants.map((p: TournamentParticipant, i: number) => (
                            <Link
                              key={p.id}
                              href={`/profile/${p.player_id}`}
                              className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 hover:border-primary/30 transition-all"
                            >
                              <span className="text-sm font-bold text-muted-foreground w-6">
                                #{i + 1}
                              </span>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={p.player?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {p.player?.nickname?.[0]?.toUpperCase() ||
                                    "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">
                                {p.player?.nickname || "Jogador"}
                              </span>
                              <div className="ml-auto flex items-center gap-2">
                                {user && user.uid !== p.player_id && (
                                  <Link href={`/chat?user=${p.player_id}`}>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {p.placement && p.placement <= 3 && (
                                  <Star className="h-4 w-4 text-accent" />
                                )}
                              </div>
                            </Link>
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
              )}
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
                        {tournament.start_date &&
                          format(
                            new Date(tournament.start_date),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR },
                          )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Inscrições até
                      </span>
                      <span className="font-medium text-foreground">
                        {tournament.registration_deadline &&
                          format(
                            new Date(tournament.registration_deadline),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR },
                          )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Vagas
                      </span>
                      <span className="font-medium text-foreground">
                        {tournament.current_participants}/
                        {tournament.max_participants}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Inscrição
                      </span>
                      <span className="font-bold text-accent">
                        {tournament.entry_fee > 0
                          ? `R$ ${(tournament.entry_fee / 100).toFixed(2).replace(".", ",")}`
                          : "Grátis"}
                      </span>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Action Button */}
                  {!user ? (
                    <>
                      <Link href="/auth" className="block">
                        <Button className="w-full">
                          Fazer Login para Inscrever
                        </Button>
                      </Link>
                      <div className="flex justify-center gap-2">
                        <Link href="/chat">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/tournament/${tournament.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : isRegistered ? (
                    <div className="flex items-center justify-center gap-2 text-green-500 py-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Você está inscrito!</span>
                    </div>
                  ) : canRegister ? (
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
                      onClick={handleJoin}
                    >
                      {tournament.entry_fee > 0
                        ? `Inscrever-se (R$ ${(tournament.entry_fee / 100).toFixed(2).replace(".", ",")})`
                        : "Inscrever-se Grátis"}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-3">
                      <AlertCircle className="h-5 w-5" />
                      <span>Inscrições encerradas</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Join Tournament Dialog */}
        {tournament && user && (
          <JoinTournamentDialog
            open={joinDialogOpen}
            onOpenChange={setJoinDialogOpen}
            tournament={tournament}
            userId={user.uid}
          />
        )}

        {/* Report Dialog */}
        {tournament && id && (
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            targetId={id}
            targetType="tournament"
            targetName={tournament.title}
          />
        )}
      </div>
    </>
  );
}
