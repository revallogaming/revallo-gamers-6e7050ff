import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { TournamentCard } from "@/components/TournamentCard";
import { TournamentFilters } from "@/components/TournamentFilters";
import { GameIcon } from "@/components/GameIcon";
import { useInfiniteTournaments, TournamentFilters as FilterType } from "@/hooks/useInfiniteTournaments";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 48;

const Tournaments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [filters, setFilters] = useState<FilterType>(() => {
    const game = searchParams.get('game') as GameType | 'all' | null;
    const search = searchParams.get('search') || undefined;
    return { 
      game: game || 'all',
      search,
    };
  });

  // Fetch all pages up to current page for accurate data
  const { data, isLoading } = useInfiniteTournaments(filters);
  
  // For pagination, we use the total count from first page
  const totalCount = data?.pages[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Get tournaments for current page
  const allTournaments = data?.pages.flatMap(page => page.tournaments) || [];
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const tournaments = allTournaments.slice(startIndex, endIndex);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (filters.game && filters.game !== 'all') params.set('game', filters.game);
    if (filters.search) params.set('search', filters.search);
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    const params = new URLSearchParams();
    if (newFilters.game && newFilters.game !== 'all') params.set('game', newFilters.game);
    if (newFilters.search) params.set('search', newFilters.search);
    setSearchParams(params);
  };

  const handleGameChange = (game: GameType | 'all') => {
    handleFiltersChange({ ...filters, game });
  };

  // Pagination range calculation
  const getPaginationRange = () => {
    const range: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      
      if (currentPage > 3) range.push('ellipsis');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) range.push(i);
      
      if (currentPage < totalPages - 2) range.push('ellipsis');
      
      range.push(totalPages);
    }
    
    return range;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Sidebar - Games (Desktop) */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border/50 bg-card/30 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao início
            </Link>
            
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Filtrar por Jogo
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
                <span className="font-medium flex-1 text-left">Todos os Jogos</span>
              </button>
              {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
                const info = GAME_INFO[game];
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
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Page Header */}
          <section className="border-b border-border/50 bg-card/30">
            <div className="px-4 md:px-6 py-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <Trophy className="h-6 w-6 text-primary" />
                      Todos os Torneios
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {totalCount} torneio{totalCount !== 1 && 's'} disponíve{totalCount !== 1 ? 'is' : 'l'}
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <TournamentFilters filters={filters} onFiltersChange={handleFiltersChange} />
              </div>
            </div>
          </section>

          {/* Tournaments Grid */}
          <section className="px-4 md:px-6 py-6">
            {isLoading ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {[...Array(18)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-3">
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tournaments.length > 0 ? (
              <>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {tournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {getPaginationRange().map((item, index) => (
                      item === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={item}
                          variant={currentPage === item ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(item)}
                        >
                          {item}
                        </Button>
                      )
                    ))}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Page Info */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Página {currentPage} de {totalPages} • Exibindo {startIndex + 1}-{Math.min(endIndex, totalCount)} de {totalCount}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Nenhum torneio encontrado</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Tente ajustar os filtros para encontrar mais torneios.
                </p>
              </div>
            )}
          </section>
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

export default Tournaments;
