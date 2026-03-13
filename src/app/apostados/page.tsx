"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { MiniTournamentCard } from "@/components/mini-tournaments/MiniTournamentCard";
import { GameIcon } from "@/components/GameIcon";
import { SEO, getBreadcrumbStructuredData } from "@/components/SEO";
import { useMiniTournaments } from "@/hooks/useMiniTournaments";
import { useDuels } from "@/hooks/useDuels";
import { GameType, GAME_INFO, MiniTournamentStatus, MatchDuel } from "@/types";
import {
  Gamepad2,
  Trophy,
  Plus,
  Filter,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CreateMiniTournamentDialog } from "@/components/mini-tournaments/CreateMiniTournamentDialog";
import { DuelingLobby } from "@/components/duels/DuelingLobby";
import { WinnersFeed } from "@/components/duels/WinnersFeed";
import { CreateDuelDialog } from "@/components/duels/CreateDuelDialog";
import { toast } from "sonner";

function ApostadosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);
  
  const [filters, setFilters] = useState<{ game: GameType | "all"; search?: string }>({
    game: "freefire",
    search: searchParams?.get("search") || undefined,
  });

  // For Apostados, we usually show 'open' status by default in the "Explorar" sense,
  // but let's allow all active statuses.
  // Memoize filters for hooks to prevent unnecessary re-renders/refetches
  const miniTournamentsFilters = useMemo(() => ({
    game: filters.game === "all" ? undefined : filters.game,
  }), [filters.game]);

  const duelsFilters = useMemo(() => ({
    game: filters.game === "all" ? undefined : filters.game,
    status: 'open' as const
  }), [filters.game]);

  const { tournaments, isLoading: isTournamentsLoading } = useMiniTournaments(miniTournamentsFilters);
  const { duels, isLoading: isDuelsLoading } = useDuels(duelsFilters);

  const isLoading = isTournamentsLoading || isDuelsLoading;

  // Map Duels to a similar structure as MiniTournaments for the card
  const mappedDuels = (duels || []).map((duel: MatchDuel) => ({
    id: duel.id,
    title: duel.title || `${duel.mode} Challenge`,
    game: duel.game,
    format: (duel.mode === '1v1' ? 'x1' : duel.mode === '2v2' ? 'duo' : 'squad') as any,
    entry_fee_brl: duel.entry_fee_brl,
    prize_pool_brl: duel.prize_pool_brl,
    current_participants: (duel as any).playersCount || (duel.mode === '4v4' ? 4 : duel.mode === '2v2' ? 2 : 1), 
    max_participants: duel.mode === '4v4' ? 8 : duel.mode === '2v2' ? 4 : 2,
    status: 'open',
    organizer: duel.creator,
    banner_url: duel.banner_url,
    isDuel: true
  }));

  const combinedItems = [...(tournaments || []), ...mappedDuels].sort((a: any, b: any) => {
    // Sort by created_at descending
    const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
    const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const filteredItems = combinedItems.filter((t: any) => {
    if (!filters.search) return true;
    return t.title.toLowerCase().includes(filters.search.toLowerCase());
  });

  const handleGameChange = (game: GameType | "all") => {
    const newFilters = { ...filters, game };
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (game !== "all") params.set("game", game);
    if (filters.search) params.set("search", filters.search);
    router.push(`/apostados?${params.toString()}`);
  };

  const handleSearchChange = (query: string) => {
    const newFilters = { ...filters, search: query };
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (filters.game !== "all") params.set("game", filters.game);
    if (query) params.set("search", query);
    router.push(`/apostados?${params.toString()}`);
  };

  const gameTitle = "Free Fire";

  return (
    <>
      <SEO
        title={gameTitle ? `Apostados FF de ${gameTitle}` : "Apostados FF - Revallo"}
        description="Participe de Apostados FF comunitários e ganhe prêmios instantâneos."
        structuredData={getBreadcrumbStructuredData([
          { name: "Início", url: "https://revallo.com.br" },
          {
            name: gameTitle ? `Apostados de ${gameTitle}` : "Apostados",
            url: "https://revallo.com.br/apostados",
          },
        ])}
      />

      <div className="flex flex-1 min-h-0 bg-transparent">
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          <Header 
            searchQuery={filters.search} 
            setSearchQuery={handleSearchChange}
            searchPlaceholder="BUSCAR APOSTADO PELO NOME..."
          />
          
          {/* Premium Hero Section */}
          <div className="relative px-6 py-12 overflow-hidden border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('/images/banners/gametiles_com.dts.freefireth.jpg')] bg-cover bg-center opacity-10 grayscale blur-sm" />
            
            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="h-16 w-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-glow-sm">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-4">
                Apostados <span className="text-primary italic">FF</span>
              </h1>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 italic mb-8 max-w-md leading-relaxed">
                Desafie oponentes em tempo real, aposte alto e domine o cenário competitivo do Free Fire.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {user ? (
                  <CreateDuelDialog>
                    <Button className="w-full sm:w-auto bg-primary hover:opacity-90 h-14 px-10 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-primary/30 flex items-center gap-3 group transition-all hover:scale-105 active:scale-95">
                      <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                      CRIAR APOSTADO
                    </Button>
                  </CreateDuelDialog>
                ) : (
                  <Button
                    onClick={() => router.push("/auth")}
                    className="w-full sm:w-auto bg-primary hover:opacity-90 h-14 px-10 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-primary/30 flex items-center gap-3"
                  >
                    <Plus className="h-5 w-5" />
                    CRIAR APOSTADO
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="p-6 pt-10 space-y-16 max-w-7xl mx-auto">
            
            {/* Unified Apostados Section */}
            <section id="apostados-grid" className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                    Apostados Ativos
                  </h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 italic">Desafios 1v1, 2v2 e 4v4 aguardando oponentes</p>
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-3xl border border-white/5 bg-white/2 overflow-hidden"
                    >
                      <Skeleton className="aspect-video w-full bg-white/5" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-full bg-white/5" />
                        <Skeleton className="h-3 w-2/3 bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item: any) => (
                    <div key={item.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <MiniTournamentCard tournament={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
                  <div className="h-20 w-20 rounded-[32px] bg-white/2 border border-dashed border-white/8 flex items-center justify-center mb-6">
                    <Trophy className="h-8 w-8 text-gray-800" />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-1">
                    Nenhum Apostado Ativo
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 italic max-w-xs leading-relaxed">
                    Tente ajustar os filtros ou organize o próximo grande desafio.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

export default function ApostadosPage() {
  return (
    <div className="flex flex-col flex-1">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        }
      >
        <ApostadosContent />
      </Suspense>
    </div>
  );
}
