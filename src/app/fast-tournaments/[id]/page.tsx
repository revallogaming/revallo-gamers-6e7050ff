"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMiniTournament } from "@/hooks/useMiniTournaments";
import { useMiniTournamentParticipants } from "@/hooks/useMiniTournamentParticipants";
import { useUserPixKey } from "@/hooks/useUserPixKey";
import { useAuth } from "@/hooks/useAuth";
import { MiniTournamentChat } from "@/components/mini-tournaments/MiniTournamentChat";
import { PrizeDepositDialog } from "@/components/mini-tournaments/PrizeDepositDialog";
import { EditMiniTournamentDialog } from "@/components/mini-tournaments/EditMiniTournamentDialog";
import { DeleteMiniTournamentDialog } from "@/components/mini-tournaments/DeleteMiniTournamentDialog";
import { ReportPlayerDialog } from "@/components/mini-tournaments/ReportPlayerDialog";
import { SubmitResultsDialog } from "@/components/mini-tournaments/SubmitResultsDialog";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GAME_INFO, MINI_TOURNAMENT_STATUS_INFO, FORMAT_INFO } from "@/types";
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
  Pencil,
  Trash2,
  Flag,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FastTournamentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tournament, isLoading, refetch } = useMiniTournament(
    (id as string) || "",
  );
  const {
    participants,
    isParticipant,
    joinTournament,
    leaveTournament,
    isLoading: participantsLoading,
  } = useMiniTournamentParticipants((id as string) || "");
  const { hasPixKey } = useUserPixKey();

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white">
        <Header />
        <div className="container py-20 mx-auto px-4">
          <Card className="border-white/5 bg-white/2 rounded-[40px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="h-16 w-16 text-gray-800 mb-6" />
              <p className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Competição não encontrada
              </p>
              <Button
                asChild
                className="mt-8 bg-primary hover:opacity-90 px-8 rounded-xl font-black italic uppercase h-12"
              >
                <Link href="/fast-tournaments">Explorar Torneios</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.uid === tournament.organizer_id;
  const canJoin =
    tournament.status === "open" &&
    !isParticipant &&
    !isOrganizer &&
    hasPixKey &&
    (tournament.current_participants || 0) < (tournament.max_participants || 0);

  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo =
    MINI_TOURNAMENT_STATUS_INFO[
      tournament.status as keyof typeof MINI_TOURNAMENT_STATUS_INFO
    ];
  const formatInfo = FORMAT_INFO[tournament.format as keyof typeof FORMAT_INFO];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <SEO title={`${tournament.title} - Revallo`} />
      <Header />

      <div className="container py-8 mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-14 w-14 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all shrink-0"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest italic">
                  {gameInfo.name}
                </Badge>
                <Badge className="bg-white/5 text-gray-400 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest italic">
                  {formatInfo.label}
                </Badge>
                <Badge
                  className="rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest italic border-0"
                  style={{
                    backgroundColor: statusInfo.color + "20",
                    color: statusInfo.color,
                    border: `1px solid ${statusInfo.color}40`,
                  }}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                {tournament.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Action Buttons based on status/role */}
            {!user ? (
              <Button
                asChild
                className="h-14 px-8 bg-primary hover:opacity-90 rounded-xl font-black italic uppercase"
              >
                <Link href="/auth">Entrar para Jogar</Link>
              </Button>
            ) : isOrganizer ? (
              <div className="flex gap-3">
                {tournament.deposit_confirmed &&
                  !tournament.prizes_distributed_at &&
                  participants &&
                  participants.length > 0 && (
                    <SubmitResultsDialog
                      tournament={tournament}
                      participants={participants}
                      onSuccess={refetch}
                    >
                      <Button className="h-14 px-8 bg-primary hover:opacity-90 rounded-xl font-black italic uppercase shadow-lg shadow-primary/20 transition-all hover:scale-105">
                        <Send className="h-5 w-5 mr-3" />
                        Lançar Resultados
                      </Button>
                    </SubmitResultsDialog>
                  )}
                <EditMiniTournamentDialog
                  tournament={tournament}
                  onSuccess={refetch}
                >
                  <Button
                    variant="ghost"
                    className="h-14 w-14 bg-white/5 border border-white/5 rounded-xl"
                  >
                    <Pencil className="h-5 w-5 text-gray-400" />
                  </Button>
                </EditMiniTournamentDialog>
              </div>
            ) : isParticipant ? (
              <Button
                variant="ghost"
                onClick={() => leaveTournament.mutate()}
                disabled={leaveTournament.isPending}
                className="h-14 px-8 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black italic uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                {leaveTournament.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Sair do Torneio"
                )}
              </Button>
            ) : canJoin ? (
              <Button
                onClick={() => joinTournament.mutate()}
                disabled={joinTournament.isPending}
                className="h-14 px-10 bg-primary hover:opacity-90 rounded-xl font-black italic uppercase shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                {joinTournament.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Participar Agora"
                )}
                {!joinTournament.isPending &&
                  tournament.entry_fee_brl > 0 && (
                    <Badge variant="outline" className="text-primary border-primary/20">
                      R$ {tournament.entry_fee_brl.toFixed(2)}
                    </Badge>
                  )}
              </Button>
            ) : (
              <div className="h-14 px-8 bg-white/5 border border-white/5 rounded-xl font-black italic uppercase flex items-center text-gray-600 text-[10px] tracking-widest">
                {tournament.status !== "open"
                  ? "Inscrições Fechadas"
                  : "Torneio Lotado"}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prize & Status Card */}
            <Card className="border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[40px] overflow-hidden group">
              <CardContent className="pt-8 px-10 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform">
                      <Trophy className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">
                        Premiação Total
                      </p>
                      <p className="text-5xl font-black italic tracking-tighter text-white">
                        R$ {tournament.prize_pool_brl.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    {tournament.deposit_confirmed ? (
                      <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest italic h-10 w-fit">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        PREMIAÇÃO CONFIRMADA
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest italic h-10 w-fit">
                        <Clock className="h-4 w-4 mr-2" />
                        AGUARDANDO DEPÓSITO
                      </Badge>
                    )}
                    <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest text-right px-2">
                      Pagamento processado via PIX Revallo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                    <Users className="h-5 w-5 text-primary mb-2" />
                    <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">
                      Slots
                    </p>
                    <p className="text-xl font-black italic text-white mt-1">
                      {tournament.current_participants}/
                      {tournament.max_participants}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                    <Coins className="h-5 w-5 text-amber-500 mb-2" />
                    <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">
                      Entrada
                    </p>
                    <p className="text-xl font-black italic text-white mt-1">
                      {tournament.entry_fee_brl > 0
                        ? `R$ ${tournament.entry_fee_brl.toFixed(2)}`
                        : "Grátis"}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                    <Calendar className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">
                      Início
                    </p>
                    <p className="text-sm font-black italic text-white mt-1.5">
                      {format(new Date(tournament.start_date), "dd/MM, HH:mm")}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                    <Clock className="h-5 w-5 text-red-500 mb-2" />
                    <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">
                      Deadline
                    </p>
                    <p className="text-sm font-black italic text-white mt-1.5">
                      {format(
                        new Date(tournament.registration_deadline),
                        "dd/MM, HH:mm",
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4 px-1 italic underline decoration-primary decoration-2 underline-offset-4">
                    Distribuição do Prêmio
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {tournament.prize_distribution.map((dist) => (
                      <div
                        key={dist.place}
                        className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-5 py-4 min-w-[180px] group/item hover:border-primary/30 transition-all"
                      >
                        <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-xl border border-primary/20 text-primary font-black italic text-lg">
                          {dist.place}º
                        </div>
                        <div>
                          <p className="text-xl font-black italic text-white leading-none">
                            R${" "}
                            {(
                              (tournament.prize_pool_brl * dist.percentage) /
                              100
                            ).toFixed(0)}
                          </p>
                          <p className="text-[9px] font-bold text-gray-600 uppercase mt-1">
                            ({dist.percentage}%)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-transparent p-0 gap-8 h-10 border-b border-white/5 w-full justify-start rounded-none">
                <TabsTrigger
                  value="overview"
                  className="bg-transparent p-0 font-black uppercase text-[11px] tracking-[0.2em] text-gray-600 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-4"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="participants"
                  className="bg-transparent p-0 font-black uppercase text-[11px] tracking-[0.2em] text-gray-600 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-4"
                >
                  Participantes ({tournament.current_participants})
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="bg-transparent p-0 font-black uppercase text-[11px] tracking-[0.2em] text-gray-600 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-4"
                >
                  Squad Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 pt-4">
                {tournament.description && (
                  <div className="bg-white/2 border border-white/5 rounded-[32px] p-8">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">
                      Sobre a Competição
                    </h3>
                    <p className="text-gray-400 font-medium leading-relaxed whitespace-pre-wrap">
                      {tournament.description}
                    </p>
                  </div>
                )}

                {tournament.rules && (
                  <div className="bg-white/2 border border-white/5 rounded-[32px] p-8">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">
                      Regras de Combate
                    </h3>
                    <p className="text-gray-400 font-medium leading-relaxed whitespace-pre-wrap">
                      {tournament.rules}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="participants" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participantsLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-20 rounded-[24px] bg-white/5"
                      />
                    ))
                  ) : participants?.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/2 border border-dashed border-white/5 rounded-[32px]">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-800" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                        Nenhum jogador inscrito ainda
                      </p>
                    </div>
                  ) : (
                    participants?.map((participant, index) => (
                      <Link
                        key={participant.id}
                        href={`/profile/${participant.player_id}`}
                        className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                      >
                        <span className="text-xs font-black italic text-gray-700 w-6">
                          #{(index + 1).toString().padStart(2, "0")}
                        </span>
                        <Avatar className="h-12 w-12 border-2 border-white/10 group-hover:border-primary/50 transition-all">
                          <AvatarImage
                            src={participant.player?.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-white/10 text-white font-black">
                            {participant.player?.nickname
                              ?.charAt(0)
                              .toUpperCase() || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-black italic uppercase tracking-tighter text-white truncate text-lg">
                            {participant.player?.nickname || "Jogador"}
                          </p>
                          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                            Membro Revallo
                          </p>
                        </div>
                        {participant.placement && (
                          <Badge className="bg-primary text-white font-black italic px-4 py-1.5 rounded-lg border-0 text-[10px]">
                            {participant.placement}º LUGAR
                          </Badge>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chat" className="pt-4">
                <div className="h-[600px] border border-white/5 rounded-[40px] overflow-hidden bg-[#0D0D0F]/60 backdrop-blur-xl">
                  <MiniTournamentChat
                    tournamentId={tournament.id}
                    isParticipant={isParticipant || isOrganizer}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Organizer Card */}
            <Card className="border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[32px] overflow-hidden">
              <CardHeader className="pt-8 px-8 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 italic">
                  Organizador
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <Link
                  href={`/profile/${tournament.organizer_id}`}
                  className="flex items-center gap-5 p-4 rounded-[24px] bg-white/2 hover:bg-white/5 transition-all group border border-white/5"
                >
                  <Avatar className="h-14 w-14 border-2 border-white/10 group-hover:border-primary/50 transition-all shrink-0">
                    <AvatarImage
                      src={tournament.organizer?.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-white/10 font-black italic text-xl">
                      {tournament.organizer?.nickname
                        ?.charAt(0)
                        .toUpperCase() || "O"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-black italic uppercase tracking-tighter text-white text-xl truncate leading-tight">
                      {tournament.organizer?.nickname || "Organizador"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        Verificado
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats Sidebar */}
            <Card className="border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[32px] overflow-hidden divide-y divide-white/5">
              <div className="p-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-6 italic">
                  Status da Competição
                </h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-black italic uppercase tracking-tighter text-gray-500">
                      Formato
                    </span>
                    <span className="font-black italic uppercase tracking-tighter text-white">
                      {formatInfo.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-black italic uppercase tracking-tighter text-gray-500">
                      Jogo Principal
                    </span>
                    <span className="font-black italic uppercase tracking-tighter text-white">
                      {gameInfo.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-black italic uppercase tracking-tighter text-gray-500">
                      Tipo de Entrada
                    </span>
                    <span className="font-black italic uppercase tracking-tighter text-white">
                      {tournament.entry_fee_brl > 0
                        ? "Paga"
                        : "Acesso Livre"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-6 italic">
                  Suporte & Denúncias
                </h4>
                <div className="space-y-3">
                  {isOrganizer && participants && participants.length > 0 && (
                    <ReportPlayerDialog
                      participants={participants}
                      tournamentId={tournament.id}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-white/5 bg-white/2 font-black uppercase tracking-widest text-[9px] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Denunciar Conduta
                      </Button>
                    </ReportPlayerDialog>
                  )}
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-white/5 bg-white/2 font-black uppercase tracking-widest text-[9px] text-gray-500 group"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                    Preciso de Ajuda
                  </Button>
                </div>
              </div>
            </Card>

            {isOrganizer && (
              <Card className="border-red-500/10 bg-red-500/5 rounded-[32px] overflow-hidden border">
                <CardContent className="p-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4 italic">
                    Zona de Perigo
                  </h4>
                  <DeleteMiniTournamentDialog
                    tournament={tournament}
                    onSuccess={() => router.push("/fast-tournaments")}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-12 rounded-xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white border border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Competição
                    </Button>
                  </DeleteMiniTournamentDialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
