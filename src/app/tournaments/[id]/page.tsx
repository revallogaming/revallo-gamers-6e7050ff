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
  useDeleteTournament,
} from "@/hooks/useTournaments";
import { useMatches } from "@/hooks/useMatches";
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { PointsTournamentHub } from "@/components/tournaments/PointsTournamentHub";
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
  Trash2,
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
import NextImage from "next/image";

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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "about" | "participants"
  >("about");

  const deleteTournament = useDeleteTournament();

  const { data: matches } = useMatches(id || "");

  // Enable realtime updates for participants
  useRealtimeParticipants(id);

  const organizerId = tournament?.organizer_id;
  const { isFollowing, toggleFollow, isToggling, followerCount } =
    useFollowers(organizerId);

  // Use sessionStorage so it persists across React Strict Mode double-renders
  // Key is unique per tournament so navigating between tournaments works correctly
  const joinSessionKey = `join_processed_${id}`;

  // Auto-open join dialog if ?join=true — wait for ALL data to be ready first
  useEffect(() => {
    const joinParam = searchParams?.get("join");
    // Only proceed if the param is explicitly set
    if (!joinParam || joinParam !== "true") return;
    // Wait until tournament, user AND participants are all loaded
    if (isLoading || !tournament || !user || participants === undefined) return;
    // Only process once per page visit (survives Strict Mode remount)
    if (typeof window !== "undefined" && sessionStorage.getItem(joinSessionKey)) return;
    if (typeof window !== "undefined") sessionStorage.setItem(joinSessionKey, "1");

    const isRegisteredNow = participants?.some((p: any) => p.player_id === user?.uid);
    const isRegistrationOpen = ["open", "upcoming"].includes(tournament.status);
    const hasVacancyNow = tournament.current_participants < tournament.max_participants;
    const deadlineNotPassed = new Date(tournament.registration_deadline) > new Date();

    if (!isRegisteredNow && isRegistrationOpen && hasVacancyNow && deadlineNotPassed) {
      setJoinDialogOpen(true);
    }

    // Strip the ?join=true param from the URL cleanly
    router.replace(window.location.pathname);
  }, [searchParams, tournament, user, participants, isLoading, router, joinSessionKey]);

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

  const handleDeleteTournament = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      // Auto-reset after 5 seconds
      setTimeout(() => setDeleteConfirm(false), 5000);
      return;
    }
    await deleteTournament.mutateAsync(id);
    router.replace("/tournaments");
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
              <NextImage
                src={tournament.banner_url}
                alt={tournament.title}
                className="object-cover"
                fill
                priority
                sizes="100vw"
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
                <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground leading-tight">
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
            <div className="flex flex-wrap items-center gap-2">
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
              {user?.uid === tournament.organizer_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteTournament}
                  disabled={deleteTournament.isPending}
                  className={`font-black uppercase italic tracking-widest text-[10px] transition-all ${
                    deleteConfirm
                      ? "border-red-500/60 text-red-400 hover:bg-red-500/20 animate-pulse"
                      : "border-red-500/20 text-red-500/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
                  }`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteConfirm ? "CONFIRMAR REMOÇÃO" : "Remover Torneio"}
                </Button>
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

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit mb-4 border border-white/5 overflow-x-auto max-w-full no-scrollbar">
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
                    className={`flex items-center gap-2 px-5 md:px-8 py-3 rounded-xl text-[11px] font-black italic uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-gray-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "about" && (
                <div className="space-y-8">
                  {/* Performance/Context Highlight: If tournament is in progress and is points-based, show the Hub Overview */}
                  {tournament.type === 'points' && tournament.status !== 'open' && (
                    <PointsTournamentHub 
                      tournament={tournament} 
                      participants={participants || []} 
                      isOrganizer={user?.uid === tournament.organizer_id} 
                    />
                  )}

                  {/* Bracket View: Only for bracket tournaments that are in progress */}
                  {tournament.type === 'bracket' && tournament.status !== 'open' && (
                    <div className="py-8 overflow-x-auto">
                      <TournamentBracket 
                        tournamentId={id} 
                        matches={matches || []}
                        isOrganizer={user?.uid === tournament.organizer_id}
                      />
                    </div>
                  )}

                  {/* Description */}
                  <Card className="bg-[#0D0D0F]/40 border-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl">
                    <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-30 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center gap-3 p-6 md:p-8 pb-0">
                      <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xs font-black italic uppercase tracking-widest text-white">Sobre o Torneio</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap italic">
                        {tournament.description || "Nenhuma descrição disponível."}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Rules */}
                  {tournament.rules && (
                    <Card className="bg-[#0D0D0F]/40 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden group shadow-2xl">
                      <div className="h-1 w-full bg-gradient-to-r from-gray-500/50 via-gray-500 to-gray-500/50 opacity-20 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="flex flex-row items-center gap-3 p-6 md:p-8 pb-0">
                        <div className="p-2.5 bg-gray-500/10 rounded-xl">
                          <CheckCircle className="h-5 w-5 text-gray-500" />
                        </div>
                        <CardTitle className="text-xs font-black italic uppercase tracking-widest text-white">Regras e Condições</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8">
                        <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap italic">
                          {tournament.rules}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Prize */}
                  {tournament.prize_description && (
                    <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl rounded-3xl overflow-hidden group shadow-2xl relative">
                      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
                      <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                      <CardHeader className="flex flex-row items-center gap-3 p-6 md:p-8 pb-0">
                        <div className="p-2.5 bg-primary/20 rounded-xl">
                          <Medal className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xs font-black italic uppercase tracking-widest text-primary">Premiação</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8">
                        <p className="text-white text-lg md:text-2xl font-black italic uppercase tracking-tighter whitespace-pre-wrap leading-tight">
                          {tournament.prize_description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}


              {activeTab === "participants" && (
                <div className="space-y-6">
                  {/* Participants */}
                  <Card className="bg-[#0D0D0F]/40 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
                    <CardHeader className="p-6 md:p-8">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-3 text-sm font-black italic uppercase tracking-widest text-white">
                          <Users className="h-5 w-5 text-primary" />
                          Lista de Inscritos
                        </span>
                        <Badge className="bg-white/5 text-gray-400 font-black italic uppercase tracking-tighter border-0">
                          {tournament.current_participants} / {tournament.max_participants}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 pt-0">
                      {participants && participants.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {participants.map((p: TournamentParticipant, i: number) => (
                            <Link
                              key={p.id}
                              href={`/profile/${p.player_id}`}
                              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 p-4 hover:border-primary/30 hover:bg-white/5 transition-all group"
                            >
                              <span className="text-[10px] font-black italic text-gray-700 w-5">
                                #{String(i + 1).padStart(2, '0')}
                              </span>
                              <Avatar className="h-10 w-10 border-2 border-white/5 ring-1 ring-primary/10 transition-transform group-hover:scale-105">
                                <AvatarImage src={p.player?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-black italic">
                                  {p.player?.nickname?.[0]?.toUpperCase() ||
                                    "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-black italic uppercase tracking-tighter text-white">
                                  {p.player?.nickname || "Jogador"}
                                </span>
                                <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest italic">Nível Platinum</span>
                              </div>
                              <div className="ml-auto flex items-center gap-2">
                                {user && user.uid !== p.player_id && (
                                  <Link href={`/chat?user=${p.player_id}`}>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                             <Users className="h-12 w-12 mb-4" />
                             <p className="font-black italic uppercase tracking-widest text-[10px]">Aguardando primeiros desafiantes</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="bg-[#0D0D0F]/60 border-primary/20 backdrop-blur-2xl rounded-3xl overflow-hidden sticky top-24 shadow-2xl shadow-primary/5">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/50 to-primary" />
                <CardContent className="p-8 space-y-6">
                  {/* Info Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        DATA INÍCIO
                      </span>
                      <span className="text-xs font-black italic uppercase tracking-tighter text-white">
                        {tournament.start_date &&
                          format(
                            new Date(tournament.start_date),
                            "dd MMM, HH:mm",
                            { locale: ptBR },
                          )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        INSCRIÇÕES ATÉ
                      </span>
                      <span className="text-xs font-black italic uppercase tracking-tighter text-white">
                        {tournament.registration_deadline &&
                          format(
                            new Date(tournament.registration_deadline),
                            "dd MMM, HH:mm",
                            { locale: ptBR },
                          )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        VAGAS DISPONÍVEIS
                      </span>
                      <span className="text-xs font-black italic uppercase tracking-tighter text-white">
                        {tournament.current_participants}/{tournament.max_participants}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white/2 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary" />
                        TAXA DE ENTRADA
                      </span>
                      <span className="text-lg font-black italic uppercase tracking-tighter text-primary">
                        {tournament.entry_fee > 0
                          ? `R$ ${(tournament.entry_fee / 100).toFixed(2).replace(".", ",")}`
                          : "Grátis"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {!user ? (
                    <div className="space-y-3">
                      <Link href="/auth" className="block">
                        <Button className="w-full h-14 bg-white text-black hover:bg-white/90 font-black uppercase italic tracking-widest rounded-2xl shadow-xl transition-transform active:scale-95">
                          FAZER LOGIN
                        </Button>
                      </Link>
                      <p className="text-[9px] text-center text-gray-600 font-black uppercase tracking-widest italic">Fácil e rápido via Google</p>
                    </div>
                  ) : isRegistered ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                      <div className="p-2 bg-green-500 rounded-full shadow-lg shadow-green-500/20">
                         <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-black italic uppercase tracking-widest text-xs text-green-500">Inscrição Confirmada</span>
                    </div>
                  ) : canRegister ? (
                    <Button
                      className="w-full h-14 bg-primary text-white hover:opacity-90 font-black uppercase italic tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                      style={{
                        background: "linear-gradient(90deg, #6C5CE7 0%, #A99CFF 100%)",
                      }}
                      onClick={handleJoin}
                    >
                      {tournament.entry_fee > 0
                        ? `INSCREVER AGORA (R$ ${(tournament.entry_fee / 100).toFixed(2).replace(".", ",")})`
                        : "INSCREVER GRÁTIS"}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-3 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl opacity-50">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="font-black italic uppercase tracking-widest text-xs text-red-500">Inscrições Finalizadas</span>
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
