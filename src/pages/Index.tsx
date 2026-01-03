import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { GameFilter } from "@/components/GameFilter";
import { TournamentCard } from "@/components/TournamentCard";
import { TournamentFilters } from "@/components/TournamentFilters";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { GameIcon } from "@/components/GameIcon";
import { useInfiniteTournaments, TournamentFilters as FilterType } from "@/hooks/useInfiniteTournaments";
import { useAuth } from "@/hooks/useAuth";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [filters, setFilters] = useState<FilterType>({ game: 'all' });
  const { user } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTournaments(filters);

  // Flatten all pages into a single array
  const tournaments = data?.pages.flatMap(page => page.tournaments) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleGameChange = (game: GameType | 'all') => {
    setFilters(prev => ({ ...prev, game }));
  };

  // Get highlighted tournaments
  const highlightedTournaments = tournaments.filter(t => t.is_highlighted);
  const regularTournaments = tournaments.filter(t => !t.is_highlighted);

  // Get tournaments by game for sidebar counts
  const openTournamentsByGame: Record<GameType, number> = {
    freefire: tournaments.filter(t => t.game === 'freefire' && t.status === 'open').length,
    fortnite: tournaments.filter(t => t.game === 'fortnite' && t.status === 'open').length,
    cod: tournaments.filter(t => t.game === 'cod' && t.status === 'open').length,
    league_of_legends: tournaments.filter(t => t.game === 'league_of_legends' && t.status === 'open').length,
    valorant: tournaments.filter(t => t.game === 'valorant' && t.status === 'open').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Sidebar - Games (Desktop) */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border/50 bg-card/30 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Jogos
            </h3>
            <nav className="space-y-0.5">
              <button
                onClick={() => handleGameChange("all")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                  filters.game === "all"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Gamepad2 className="h-4 w-4" />
                <span className="font-medium flex-1 text-left">Todos</span>
              </button>
              {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
                const info = GAME_INFO[game];
                const count = openTournamentsByGame[game];
                return (
                  <button
                    key={game}
                    onClick={() => handleGameChange(game)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                      filters.game === game
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <GameIcon game={game} className="h-4 w-4" />
                    <span className="font-medium flex-1 text-left">{info.name}</span>
                    {count > 0 && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Banner - Compact */}
          <section className="relative overflow-hidden border-b border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
            
            <div className="relative px-4 md:px-6 py-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
                      Seu próximo <span className="text-gradient-primary">campeonato</span> começa aqui.
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Encontre torneios, desafie os melhores e prove que você é lenda.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {user && (
                      <CreateTournamentDialog>
                        <Button size="sm" className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold gap-2">
                          <Plus className="h-4 w-4" />
                          Criar Torneio
                        </Button>
                      </CreateTournamentDialog>
                    )}
                    
                    {/* Mobile Game Filter */}
                    <div className="lg:hidden">
                      <GameFilter selected={filters.game || 'all'} onSelect={handleGameChange} />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <TournamentFilters filters={filters} onFiltersChange={setFilters} />
              </div>
            </div>
          </section>

          {/* Results Count */}
          {!isLoading && tournaments.length > 0 && (
            <div className="px-4 md:px-6 py-3 border-b border-border/30">
              <p className="text-xs text-muted-foreground">
                {totalCount} torneio{totalCount !== 1 && 's'} encontrado{totalCount !== 1 && 's'}
                {hasNextPage && ` (mostrando ${tournaments.length})`}
              </p>
            </div>
          )}

          {/* Highlighted Tournaments */}
          {highlightedTournaments.length > 0 && (
            <section className="px-4 md:px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-accent" />
                <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">Em Destaque</h2>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {highlightedTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}

          {/* All Tournaments Grid */}
          {regularTournaments.length > 0 && (
            <section className="px-4 md:px-6 py-4">
              {highlightedTournaments.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Gamepad2 className="h-4 w-4 text-secondary" />
                  <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">Todos os Torneios</h2>
                </div>
              )}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {regularTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 md:px-6 py-4">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-3">
                      <Skeleton className="mb-2 h-3 w-14" />
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-7 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="h-10">
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando mais torneios...</span>
              </div>
            )}
          </div>

          {/* Empty State */}
          {!isLoading && tournaments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">Nenhum torneio encontrado</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {filters.search || filters.dateFrom || filters.dateTo || filters.prizeMin !== undefined
                  ? "Tente ajustar os filtros para encontrar mais torneios."
                  : filters.game !== 'all'
                    ? `Não há torneios de ${GAME_INFO[filters.game as GameType].name} no momento.`
                    : "Ainda não há torneios disponíveis. Volte em breve!"}
              </p>
            </div>
          )}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold text-foreground">REVALLO</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/organizer" className="hover:text-foreground transition-colors">
                Para Organizadores
              </Link>
              <span>Suporte</span>
              <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Revallo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
