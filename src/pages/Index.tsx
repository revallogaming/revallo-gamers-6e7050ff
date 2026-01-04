import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { GameFilter } from "@/components/GameFilter";
import { TournamentCard } from "@/components/TournamentCard";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { GameIcon } from "@/components/GameIcon";
import { HighlightedTournamentsBanner } from "@/components/HighlightedTournamentsBanner";
import { useTournaments } from "@/hooks/useTournaments";
import { useAuth } from "@/hooks/useAuth";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, ChevronRight, Plus, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const MAX_HOME_TOURNAMENTS = 48; // Limit for home page

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | "all">("all");
  const { user } = useAuth();
  const { data: tournaments, isLoading } = useTournaments(
    selectedGame === "all" ? undefined : selectedGame
  );

  // Limit tournaments on home page - prioritize highlighted first
  const sortedTournaments = [...(tournaments || [])].sort((a, b) => {
    if (a.is_highlighted && !b.is_highlighted) return -1;
    if (!a.is_highlighted && b.is_highlighted) return 1;
    return 0;
  });
  const limitedTournaments = sortedTournaments.slice(0, MAX_HOME_TOURNAMENTS);
  const hasMoreTournaments = (tournaments?.length || 0) > MAX_HOME_TOURNAMENTS;
  const totalCount = tournaments?.length || 0;

  // Get tournaments by game for sidebar
  const openTournamentsByGame: Record<GameType, number> = {
    freefire: tournaments?.filter(t => t.game === 'freefire' && t.status === 'open').length || 0,
    fortnite: tournaments?.filter(t => t.game === 'fortnite' && t.status === 'open').length || 0,
    cod: tournaments?.filter(t => t.game === 'cod' && t.status === 'open').length || 0,
    league_of_legends: tournaments?.filter(t => t.game === 'league_of_legends' && t.status === 'open').length || 0,
    valorant: tournaments?.filter(t => t.game === 'valorant' && t.status === 'open').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Sidebar - Games (Desktop) */}
        <aside className="hidden md:flex w-48 lg:w-56 flex-col border-r border-border/50 bg-card/30 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Jogos
            </h3>
            <nav className="space-y-0.5">
              <button
                onClick={() => setSelectedGame("all")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                  selectedGame === "all"
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
                    onClick={() => setSelectedGame(game)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedGame === game
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
          {/* Hero Banner */}
          <section className="relative overflow-hidden border-b border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
            
            <div className="relative px-4 md:px-6 py-6">
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
                      <Button size="sm" className="bg-gradient-primary hover:opacity-90 font-semibold gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Torneio
                      </Button>
                    </CreateTournamentDialog>
                  )}
                  
                  {/* Mobile Game Filter */}
                  <div className="md:hidden">
                    <GameFilter selected={selectedGame} onSelect={setSelectedGame} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Highlighted Tournaments Banner */}
          {!isLoading && tournaments && tournaments.length > 0 && (
            <HighlightedTournamentsBanner tournaments={tournaments} />
          )}

          {/* Tournament Categories */}
          {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
            const gameTournaments = selectedGame === "all" 
              ? limitedTournaments.filter(t => t.game === game)
              : game === selectedGame 
                ? limitedTournaments
                : [];
            
            if (gameTournaments.length === 0) return null;
            
            const info = GAME_INFO[game];
            
            return (
              <section key={game} className="px-4 md:px-6 py-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GameIcon game={game} className="h-5 w-5" />
                    <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">{info.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      ({gameTournaments.length})
                    </span>
                  </div>
                  <Link to={`/tournaments?game=${game}`}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-7 gap-1">
                      Ver todos <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {gameTournaments.slice(0, 8).map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 md:px-6 py-4">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-3">
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View All Button - When there are more tournaments */}
          {hasMoreTournaments && (
            <section className="px-4 md:px-6 py-6 border-t border-border/30">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Exibindo {limitedTournaments.length} de {totalCount} torneios
                </p>
                <Link to="/tournaments">
                  <Button className="gap-2" variant="outline">
                    Ver todos os torneios
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          )}

          {/* Empty State */}
          {!isLoading && (!tournaments || tournaments.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">Nenhum torneio encontrado</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {selectedGame === "all"
                  ? "Ainda não há torneios disponíveis. Volte em breve!"
                  : `Não há torneios de ${GAME_INFO[selectedGame as GameType].name} no momento.`}
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
