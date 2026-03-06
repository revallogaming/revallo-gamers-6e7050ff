"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { TournamentCard } from "@/components/TournamentCard";
import { TournamentFilters } from "@/components/TournamentFilters";
import { GameIcon } from "@/components/GameIcon";
import { SEO, getBreadcrumbStructuredData } from "@/components/SEO";
import {
  useInfiniteTournaments,
  TournamentFilters as FilterType,
} from "@/hooks/useInfiniteTournaments";
import { GameType, GAME_INFO } from "@/types";
import {
  Gamepad2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = 48;

// Normalize URL game param aliases → canonical GameType keys
function normalizeGameParam(raw: string | null | undefined): GameType | 'all' {
  if (!raw) return 'all';
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const aliases: Record<string, GameType | 'all'> = {
    all: 'all',
    freefire: 'freefire',
    free_fire: 'freefire',
    valorant: 'valorant',
    blood_strike: 'blood_strike',
    bloodstrike: 'blood_strike',
    blood: 'blood_strike',
    cod: 'cod',
    cod_warzone: 'cod',
    warzone: 'cod',
  };
  return aliases[s] ?? 'all';
}

function TournamentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(searchParams?.get("page") || "1", 10);
  });

  const [filters, setFilters] = useState<FilterType>(() => {
    const rawGame = searchParams?.get("game");
    const game = normalizeGameParam(rawGame) as GameType | "all";
    const search = searchParams?.get("search") || undefined;
    return { game: game || "all", search };
  });

  const { data, isLoading } = useInfiniteTournaments(filters);

  const allTournaments =
    data?.pages.flatMap((page) => page.tournaments || []) || [];
  const totalCount = allTournaments.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const tournaments = allTournaments.slice(startIndex, endIndex);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    let changed = false;
    if (currentPage > 1) {
      if (params.get("page") !== currentPage.toString()) {
        params.set("page", currentPage.toString());
        changed = true;
      }
    } else if (params.has("page")) {
      params.delete("page");
      changed = true;
    }
    if (filters.game && filters.game !== "all") {
      if (params.get("game") !== filters.game) {
        params.set("game", filters.game);
        changed = true;
      }
    } else if (params.has("game")) {
      params.delete("game");
      changed = true;
    }
    if (filters.search) {
      if (params.get("search") !== filters.search) {
        params.set("search", filters.search);
        changed = true;
      }
    } else if (params.has("search")) {
      params.delete("search");
      changed = true;
    }
    if (changed) router.replace(`/tournaments?${params.toString()}`);
  }, [filters, currentPage, searchParams, router]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (page > 1) params.set("page", page.toString());
    else params.delete("page");
    router.push(`/tournaments?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (newFilters.game && newFilters.game !== "all")
      params.set("game", newFilters.game);
    if (newFilters.search) params.set("search", newFilters.search);
    router.push(`/tournaments?${params.toString()}`);
  };

  const handleGameChange = (game: GameType | "all") =>
    handleFiltersChange({ ...filters, game });

  const getPaginationRange = () => {
    const range: (number | "ellipsis")[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (currentPage > 3) range.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (currentPage < totalPages - 2) range.push("ellipsis");
      range.push(totalPages);
    }
    return range;
  };

  const gameTitle =
    filters.game && filters.game !== "all"
      ? GAME_INFO[filters.game]?.name
      : undefined;

  return (
    <>
      <SEO
        title={gameTitle ? `Torneios de ${gameTitle}` : "Todos os Torneios"}
        structuredData={getBreadcrumbStructuredData([
          { name: "Início", url: "https://revallo.com.br" },
          {
            name: gameTitle ? `Torneios de ${gameTitle}` : "Torneios",
            url: "https://revallo.com.br/tournaments",
          },
        ])}
      />

      <div className="flex flex-1 min-h-0">
        {/* ── Game Filter Sidebar (tournament-specific only) ── */}
        <aside className="hidden xl:flex w-52 flex-col border-r border-white/5 bg-[#0D0D0F]/60 sticky top-32 h-[calc(100vh-8rem)] shrink-0">
          <div className="p-4 pt-12 overflow-y-auto flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 px-2 mb-4 italic">
              Filtrar por Jogo
            </p>
            <nav className="space-y-0.5">
              <button
                onClick={() => handleGameChange("all")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  filters.game === "all"
                    ? "bg-primary/10 text-primary font-black italic border border-primary/10"
                    : "text-gray-500 hover:bg-white/5 hover:text-white font-bold"
                }`}
              >
                <Gamepad2 className="h-4 w-4 shrink-0" />
                <span className="text-left flex-1 text-xs uppercase tracking-tight">
                  Todos os Jogos
                </span>
              </button>
              {(Object.keys(GAME_INFO) as GameType[]).map((game) => (
                <button
                  key={game}
                  onClick={() => handleGameChange(game)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                    filters.game === game
                      ? "bg-primary/10 text-primary font-black italic border border-primary/20"
                      : "text-gray-500 hover:bg-white/5 hover:text-white font-bold"
                  }`}
                >
                  <GameIcon game={game} className="h-4 w-4 shrink-0" />
                  <span className="text-left flex-1 text-xs uppercase tracking-tight">
                    {GAME_INFO[game].name}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          {/* Compact Inline Header */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/5 bg-[#0A0A0C]/80 backdrop-blur-md sticky top-16 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <Trophy className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-black italic uppercase tracking-tighter text-lg text-white leading-none truncate">
                {gameTitle ? gameTitle : "Torneios"}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <TournamentFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              <Button
                onClick={() => router.push(user ? "/organizer" : "/auth")}
                className="bg-primary hover:opacity-90 h-9 px-4 rounded-2xl font-black italic uppercase text-[11px] shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Criar</span>
              </Button>
            </div>
          </div>

          {/* Tournament Grid */}
          <div className="p-6">
            {isLoading ? (
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/5 bg-white/2 overflow-hidden"
                  >
                    <Skeleton className="aspect-[2.5/1] w-full bg-white/5" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full bg-white/5" />
                      <Skeleton className="h-3 w-2/3 bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tournaments.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournaments.map((tournament) => (
                    <div key={tournament.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <TournamentCard tournament={tournament} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl border-white/10 bg-white/2"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl border-white/10 bg-white/2"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPaginationRange().map((item, index) =>
                      item === "ellipsis" ? (
                        <span
                          key={`e-${index}`}
                          className="px-2 text-gray-600 text-sm"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          size="sm"
                          className={`h-8 w-8 p-0 rounded-xl ${
                            currentPage === item
                              ? "bg-primary border-0 text-white"
                              : "bg-white/2 border border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                          onClick={() => handlePageChange(item)}
                        >
                          {item}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl border-white/10 bg-white/2"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl border-white/10 bg-white/2"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-24 w-24 rounded-[32px] bg-white/2 border border-dashed border-white/8 flex items-center justify-center mb-8">
                  <Trophy className="h-10 w-10 text-gray-800" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
                  Nenhum Torneio
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 italic max-w-xs leading-relaxed">
                  Tente ajustar os filtros de busca ou crie o primeiro torneio.
                </p>
                {user && (
                  <Button
                    onClick={() => router.push("/organizer")}
                    className="mt-8 bg-primary hover:opacity-90 h-12 px-10 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-primary/20 flex items-center gap-3"
                  >
                    <Plus className="h-5 w-5" />
                    Criar Torneio
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default function TournamentsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        }
      >
        <TournamentsContent />
      </Suspense>
    </div>
  );
}
