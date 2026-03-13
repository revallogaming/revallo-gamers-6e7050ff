"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMiniTournaments,
  useMyMiniTournaments,
} from "@/hooks/useMiniTournaments";
import { useAuth } from "@/hooks/useAuth";
import { MiniTournamentCard } from "@/components/mini-tournaments/MiniTournamentCard";
import { CreateMiniTournamentDialog } from "@/components/mini-tournaments/CreateMiniTournamentDialog";
import { EditMiniTournamentDialog } from "@/components/mini-tournaments/EditMiniTournamentDialog";
import { DeleteMiniTournamentDialog } from "@/components/mini-tournaments/DeleteMiniTournamentDialog";
import { PrizeDepositDialog } from "@/components/mini-tournaments/PrizeDepositDialog";
import { GameIcon } from "@/components/GameIcon";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SEO } from "@/components/SEO";
import {
  GAME_INFO,
  GameType,
  FORMAT_INFO,
  MiniTournament,
  MiniTournamentFormat,
} from "@/types";
import {
  Search,
  Plus,
  Trophy,
  Users,
  Calendar,
  Coins,
  Edit,
  ExternalLink,
  Copy,
  CheckCircle,
  Bell,
  BellRing,
  Trash2,
  CreditCard,
  X,
  Gamepad2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

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

export default function FastTournamentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState<GameType | "all">("all");
  const [formatFilter, setFormatFilter] = useState<
    MiniTournamentFormat | "all"
  >("all");
  const [statusTab, setStatusTab] = useState<"open" | "all">("open");
  const [mainTab, setMainTab] = useState<"explore" | "my-tournaments">(
    "explore",
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const tournamentsFilters = useMemo(
    () => (statusTab === "open" ? { status: "open" as const } : undefined),
    [statusTab],
  );

  const { tournaments, isLoading } = useMiniTournaments(tournamentsFilters);

  const {
    data: myTournaments,
    isLoading: isLoadingMy,
    refetch: refetchMy,
  } = useMyMiniTournaments();

  // Stable list of tournament IDs to avoid re-subscribing unless they truly change
  const myTournamentIds = useMemo(
    () =>
      myTournaments
        ?.map((t: MiniTournament) => t.id)
        .sort()
        .join(",") || "",
    [myTournaments],
  );

  // Keep track of which additions have already been notified to avoid duplicates on re-subscription
  const processedAdditions = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!user || !myTournamentIds) {
      isInitialLoadRef.current = true;
      return;
    }

    const ids = myTournamentIds.split(",");
    if (ids.length === 0) return;

    // Use a stable reference for the query
    const q = query(
      collection(db, "mini_tournament_participants"),
      where("tournament_id", "in", ids),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const changes = snapshot.docChanges();

      // If we're coming from cache or it's the very first hit, skip notifications but mark as processed
      const shouldNotify =
        !isInitialLoadRef.current && !snapshot.metadata.fromCache;

      changes.forEach(async (change) => {
        if (change.type === "added") {
          const participantId = change.doc.id;
          if (processedAdditions.current.has(participantId)) return;
          processedAdditions.current.add(participantId);

          if (!shouldNotify) return;

          const newParticipant = change.doc.data() as {
            tournament_id: string;
            player_id: string;
          };

          try {
            const playerDoc = await getDoc(
              doc(db, "profiles", newParticipant.player_id),
            );
            const player = playerDoc.exists() ? playerDoc.data() : null;

            const tournament = myTournaments?.find(
              (t: MiniTournament) => t.id === newParticipant.tournament_id,
            );

            const notification: Notification = {
              id: `${participantId}-${Date.now()}`,
              message: `${player?.nickname || "Jogador"} entrou no torneio`,
              tournamentId: newParticipant.tournament_id,
              tournamentTitle: tournament?.title || "Campeonato",
              playerName: player?.nickname || "Jogador",
              timestamp: new Date(),
              read: false,
            };

            setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

            toast.success(
              `🎮 ${player?.nickname || "Jogador"} entrou em "${tournament?.title}"`,
              { duration: 5000 },
            );

            // Instead of manual refetch that might trigger a loop, we rely on the
            // separate useRealtimeParticipants hook to invalidate the query if needed,
            // or we just invalidate it specifically here without re-triggering this effect.
            queryClient.invalidateQueries({
              queryKey: ["my-mini-tournaments", user.uid],
            });
          } catch (error) {
            console.error("Error processing participant notification:", error);
          }
        }
      });

      isInitialLoadRef.current = false;
    });

    return () => {
      unsubscribe();
    };
  }, [user, user?.uid, myTournamentIds, myTournaments, queryClient]); // Corrected dependencies

  const filteredTournaments = tournaments?.filter((t: MiniTournament) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGame = gameFilter === "all" || t.game === gameFilter;
    const matchesFormat = formatFilter === "all" || t.format === formatFilter;
    return matchesSearch && matchesGame && matchesFormat;
  });

  const copyTournamentLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/fast-tournaments/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const activeTournaments =
    myTournaments?.filter((t: MiniTournament) =>
      [
        "draft",
        "pending_deposit",
        "open",
        "in_progress",
        "awaiting_result",
      ].includes(t.status),
    ) || [];
  const completedTournaments =
    myTournaments?.filter((t: MiniTournament) =>
      ["completed", "cancelled"].includes(t.status),
    ) || [];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <SEO
        title="Apostados FF - Revallo"
        description="Participe de Apostados FF comunitários e ganhe prêmios instantâneos."
      />
      <Header />

      <div className="container py-8 mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Início
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-2">
              Apostados <span className="text-primary">FF</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              Apostados FF com premiação em R$
            </p>
          </div>

          <div className="flex items-center gap-4">
            {user && mainTab === "my-tournaments" && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-xl border-white/10 bg-white/5 h-12 w-12"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {unreadCount > 0 ? (
                    <BellRing className="h-5 w-5 text-primary animate-pulse" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <Card className="absolute right-0 top-14 w-80 md:w-96 z-50 border-white/10 bg-[#0D0D0F]/95 backdrop-blur-xl rounded-[24px] shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-black italic uppercase text-xs tracking-widest text-white">
                        Notificações
                      </h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-bold uppercase text-primary"
                            onClick={markAllAsRead}
                          >
                            Limpar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500"
                          onClick={() => setShowNotifications(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="max-h-80">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                          <Bell className="h-10 w-10 mx-auto mb-4 text-gray-800" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                            Nada por aqui
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={`/fast-tournaments/${notification.tournamentId}`}
                              className={`block p-5 hover:bg-white/5 transition-all ${!notification.read ? "bg-primary/5" : ""}`}
                              onClick={() => {
                                setNotifications((prev) =>
                                  prev.map((n) =>
                                    n.id === notification.id
                                      ? { ...n, read: true }
                                      : n,
                                  ),
                                );
                              }}
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={`h-2 w-2 rounded-full mt-2 shrink-0 ${!notification.read ? "bg-primary" : "bg-gray-700"}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white leading-tight">
                                    {notification.playerName} entrou no torneio
                                  </p>
                                  <p className="text-[10px] font-bold text-gray-500 truncate uppercase mt-1">
                                    {notification.tournamentTitle}
                                  </p>
                                  <p className="text-[9px] font-black text-primary/60 uppercase tracking-tighter mt-2">
                                    {format(
                                      notification.timestamp,
                                      "dd 'de' MMMM, HH:mm",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-white/5 bg-white/2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white"
                          onClick={clearNotifications}
                        >
                          Limpar Histórico
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}

            {user && (
              <CreateMiniTournamentDialog>
                <Button className="bg-primary hover:opacity-90 text-white font-black uppercase italic rounded-xl px-8 h-12 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Campeonato
                </Button>
              </CreateMiniTournamentDialog>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as "explore" | "my-tournaments")}
          className="space-y-8"
        >
          <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
            <TabsTrigger
              value="explore"
              className="rounded-xl px-8 font-black uppercase italic text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white h-11"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Explorar
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="my-tournaments"
                className="rounded-xl px-8 font-black uppercase italic text-[11px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white h-11"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Meus Campeonatos
                {myTournaments && myTournaments.length > 0 && (
                  <Badge className="ml-2 bg-white/10 text-white h-5 px-2 border-0 font-black text-[9px]">
                    {myTournaments.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="explore" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Summary */}
              <Card className="border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[24px]">
                <CardContent className="pt-6 flex items-center gap-5">
                  <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20">
                    <Trophy className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-black italic tracking-tighter text-white">
                      {tournaments?.length || 0}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                      Campeonatos Ativos
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    placeholder="Buscar competições..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-white/5 border-white/5 h-14 rounded-2xl focus:border-primary/50 text-white font-bold"
                  />
                </div>
                <Select
                  value={gameFilter}
                  onValueChange={(v) => setGameFilter(v as GameType | "all")}
                >
                  <SelectTrigger className="w-full md:w-56 bg-white/5 border-white/5 h-14 rounded-2xl text-white font-black uppercase italic text-[10px] tracking-widest px-6">
                    <SelectValue placeholder="Todos os jogos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D0D0F] border-white/10 text-white">
                    <SelectItem
                      value="all"
                      className="font-bold uppercase text-[10px] tracking-widest"
                    >
                      Todos os Jogos
                    </SelectItem>
                    {Object.entries(GAME_INFO).map(([key, info]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="font-bold uppercase text-[10px] tracking-widest"
                      >
                        {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formatFilter}
                  onValueChange={(v) =>
                    setFormatFilter(v as MiniTournamentFormat | "all")
                  }
                >
                  <SelectTrigger className="w-full md:w-56 bg-white/5 border-white/5 h-14 rounded-2xl text-white font-black uppercase italic text-[10px] tracking-widest px-6">
                    <SelectValue placeholder="Todos os modos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D0D0F] border-white/10 text-white">
                    <SelectItem
                      value="all"
                      className="font-bold uppercase text-[10px] tracking-widest"
                    >
                      Todos os Modos
                    </SelectItem>
                    {Object.entries(FORMAT_INFO).map(([key, info]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="font-bold uppercase text-[10px] tracking-widest"
                      >
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs
              value={statusTab}
              onValueChange={(v) => setStatusTab(v as "open" | "all")}
              className="space-y-6"
            >
              <TabsList className="bg-transparent p-0 gap-6">
                <TabsTrigger
                  value="open"
                  className="bg-transparent p-0 font-black uppercase text-[10px] tracking-[0.2em] text-gray-600 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-2"
                >
                  Abertos agora
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="bg-transparent p-0 font-black uppercase text-[10px] tracking-[0.2em] text-gray-600 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-2"
                >
                  Todos os Campeonatos
                </TabsTrigger>
              </TabsList>

              <TabsContent value={statusTab} className="mt-0 pt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-64 rounded-[32px] bg-white/5"
                      />
                    ))}
                  </div>
                ) : filteredTournaments?.length === 0 ? (
                  <div className="text-center py-32 bg-white/2 border border-dashed border-white/5 rounded-[40px]">
                    <Trophy className="h-16 w-16 mx-auto mb-6 text-gray-800" />
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
                      Sem campeonatos ativos
                    </h3>
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                      Tente outros filtros ou crie o seu!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredTournaments?.map((tournament: MiniTournament) => (
                      <MiniTournamentCard
                        key={tournament.id}
                        tournament={tournament}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {user && (
            <TabsContent value="my-tournaments" className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="border-white/5 bg-[#0D0D0F]/80 rounded-[24px]">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-black italic tracking-tighter text-white">
                        {myTournaments?.length || 0}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                        Total
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/5 bg-[#0D0D0F]/80 rounded-[24px]">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Trophy className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black italic tracking-tighter text-white">
                        {activeTournaments.length}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                        Ativos
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/5 bg-[#0D0D0F]/80 rounded-[24px]">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black italic tracking-tighter text-white">
                        {myTournaments?.reduce(
                          (sum: number, t: MiniTournament) =>
                            sum + t.current_participants,
                          0,
                        ) || 0}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                        Players
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/5 bg-[#0D0D0F]/80 rounded-[24px]">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Coins className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black italic tracking-tighter text-white">
                        R${" "}
                        {myTournaments
                          ?.reduce(
                            (sum: number, t: MiniTournament) =>
                              sum + t.prize_pool_brl,
                            0,
                          )
                          .toFixed(0) || 0}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                        Prêmios
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="active" className="space-y-8">
                <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                  <TabsTrigger
                    value="active"
                    className="rounded-xl px-6 font-black uppercase italic text-[10px] tracking-widest h-10 data-[state=active]:bg-primary"
                  >
                    Ativos ({activeTournaments.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="rounded-xl px-6 font-black uppercase italic text-[10px] tracking-widest h-10 data-[state=active]:bg-primary"
                  >
                    Finalizados ({completedTournaments.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="rounded-xl px-6 font-black uppercase italic text-[10px] tracking-widest h-10 data-[state=active]:bg-primary"
                  >
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
    </div>
  );
}

interface MyTournamentsListProps {
  tournaments: MiniTournament[];
  isLoading: boolean;
  onCopyLink: (id: string) => void;
  copiedId: string | null;
  onRefetch: () => void;
}

function MyTournamentsList({
  tournaments,
  isLoading,
  onCopyLink,
  copiedId,
  onRefetch,
}: MyTournamentsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-[32px] bg-white/5" />
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-24 bg-white/2 border border-dashed border-white/5 rounded-[40px]">
        <Trophy className="h-16 w-16 mx-auto mb-6 text-gray-800" />
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
          Nenhum campeonato
        </h3>
        <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px] mb-8">
          Crie seu primeiro Apostados FF agora!
        </p>
        <CreateMiniTournamentDialog>
          <Button className="bg-primary hover:opacity-90 px-8 rounded-xl font-black italic uppercase h-12">
            <Plus className="mr-2 h-4 w-4" />
            Criar Agora
          </Button>
        </CreateMiniTournamentDialog>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => {
        const gameInfo = GAME_INFO[tournament.game as GameType];
        const formatInfo =
          FORMAT_INFO[tournament.format as MiniTournamentFormat];
        const statusInfo = MINI_STATUS_INFO[tournament.status];
        const canDeposit =
          tournament.status === "draft" ||
          tournament.status === "pending_deposit";

        return (
          <Card
            key={tournament.id}
            className="border-white/5 bg-[#0D0D0F]/80 rounded-[32px] overflow-hidden hover:border-primary/30 transition-all group"
          >
            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                    <GameIcon
                      game={tournament.game}
                      className="h-8 w-8 text-primary"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white truncate">
                      {tournament.title}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                      {formatInfo?.label} • {gameInfo?.name}
                    </p>
                  </div>
                </div>
                <Badge
                  className="text-[8px] font-black uppercase tracking-widest rounded-lg border-0 px-2.5 h-5 italic shrink-0"
                  style={{
                    backgroundColor: statusInfo?.color + "20",
                    color: statusInfo?.color,
                    border: `1px solid ${statusInfo?.color}40`,
                  }}
                >
                  {statusInfo?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                  <Users className="h-4 w-4 mx-auto mb-1.5 text-primary" />
                  <p className="text-sm font-black italic text-white leading-none">
                    {tournament.current_participants}/
                    {tournament.max_participants}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-tighter text-gray-700 mt-1">
                    Players
                  </p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                  <Coins className="h-4 w-4 mx-auto mb-1.5 text-amber-500" />
                  <p className="text-sm font-black italic text-white leading-none">
                    R$ {tournament.prize_pool_brl}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-tighter text-gray-700 mt-1">
                    Prêmio
                  </p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                  <Calendar className="h-4 w-4 mx-auto mb-1.5 text-blue-500" />
                  <p className="text-sm font-black italic text-white leading-none">
                    {format(new Date(tournament.start_date), "dd/MM")}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-tighter text-gray-700 mt-1">
                    Início
                  </p>
                </div>
              </div>

              {canDeposit && !tournament.deposit_confirmed && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pendente: R$ {tournament.prize_pool_brl}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-white/5 border border-white/5 rounded-xl text-gray-500 hover:text-white"
                  onClick={() => onCopyLink(tournament.id)}
                >
                  {copiedId === tournament.id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                <Link
                  href={`/fast-tournaments/${tournament.id}`}
                  className="flex-1"
                >
                  <Button
                    variant="ghost"
                    className="w-full h-10 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>
                </Link>

                {canDeposit && !tournament.deposit_confirmed && (
                  <PrizeDepositDialog
                    tournament={tournament}
                    onSuccess={onRefetch}
                  >
                    <Button className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20 group">
                      <CreditCard className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </Button>
                  </PrizeDepositDialog>
                )}

                {canDeposit && (
                  <EditMiniTournamentDialog
                    tournament={tournament}
                    onSuccess={onRefetch}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 bg-white/5 border border-white/5 rounded-xl text-gray-500 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </EditMiniTournamentDialog>
                )}

                {canDeposit && (
                  <DeleteMiniTournamentDialog
                    tournament={tournament}
                    onSuccess={onRefetch}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"
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
