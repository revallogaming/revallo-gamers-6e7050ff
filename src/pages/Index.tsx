import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { GameFilter } from "@/components/GameFilter";
import { TournamentCard } from "@/components/TournamentCard";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { GameIcon } from "@/components/GameIcon";
import { useTournaments } from "@/hooks/useTournaments";
import { useAuth } from "@/hooks/useAuth";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, ChevronRight, Star, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | "all">("all");
  const { user } = useAuth();
  const { data: tournaments, isLoading } = useTournaments(
    selectedGame === "all" ? undefined : selectedGame
  );

  // Get highlighted tournaments
  const highlightedTournaments = tournaments?.filter(t => t.is_highlighted) || [];
  const regularTournaments = tournaments?.filter(t => !t.is_highlighted) || [];

  // Get tournaments by game for sidebar
  const tournamentsByGame: Record<GameType, typeof tournaments> = {
    freefire: tournaments?.filter(t => t.game === 'freefire' && t.status === 'open') || [],
    fortnite: tournaments?.filter(t => t.game === 'fortnite' && t.status === 'open') || [],
    cod: tournaments?.filter(t => t.game === 'cod' && t.status === 'open') || [],
    league_of_legends: tournaments?.filter(t => t.game === 'league_of_legends' && t.status === 'open') || [],
    valorant: tournaments?.filter(t => t.game === 'valorant' && t.status === 'open') || [],
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Sidebar - Games (Desktop) */}
        <aside className="hidden lg:flex w-60 flex-col border-r border-border/50 bg-card/30 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Jogos
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedGame("all")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedGame === "all"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Gamepad2 className="h-5 w-5" />
                <span className="font-medium flex-1 text-left">Todos</span>
              </button>
              {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
                const info = GAME_INFO[game];
                const count = tournamentsByGame[game].length;
                return (
                  <button
                    key={game}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedGame === game
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <GameIcon game={game} className="h-5 w-5" />
                    <span className="font-medium flex-1 text-left">{info.name}</span>
                    {count > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
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
            
            <div className="relative px-4 md:px-8 py-8 md:py-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Seu próximo <span className="text-gradient-primary">campeonato</span> começa aqui.
                  </h1>
                  <p className="text-muted-foreground max-w-lg">
                    Encontre torneios, desafie os melhores e prove que você é lenda.
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Create Tournament Button - Only for logged users */}
                  {user && (
                    <CreateTournamentDialog>
                      <Button className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Torneio
                      </Button>
                    </CreateTournamentDialog>
                  )}
                  
                  {/* Mobile Game Filter */}
                  <div className="lg:hidden">
                    <GameFilter selected={selectedGame} onSelect={setSelectedGame} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Highlighted Tournaments */}
          {highlightedTournaments.length > 0 && (
            <section className="px-4 md:px-8 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-accent" />
                <h2 className="font-display text-lg font-bold text-foreground">Em Destaque</h2>
              </div>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {highlightedTournaments.slice(0, 6).map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </section>
          )}

          {/* Tournament Categories */}
          {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
            const gameTournaments = selectedGame === "all" 
              ? tournaments?.filter(t => t.game === game) || []
              : game === selectedGame 
                ? tournaments || []
                : [];
            
            if (gameTournaments.length === 0) return null;
            
            const info = GAME_INFO[game];
            
            return (
              <section key={game} className="px-4 md:px-8 py-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GameIcon game={game} className="h-5 w-5" />
                    <h2 className="font-display text-lg font-bold text-foreground">{info.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      ({gameTournaments.length})
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-7">
                    Ver todos <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {gameTournaments.slice(0, 12).map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 md:px-8 py-4">
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-3">
                      <Skeleton className="mb-2 h-4 w-16" />
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!tournaments || tournaments.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Trophy className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Nenhum torneio encontrado</h3>
              <p className="text-muted-foreground text-center max-w-md">
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">REVALLO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/organizer" className="hover:text-foreground transition-colors">
                Para Organizadores
              </Link>
              <span>Suporte</span>
              <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Revallo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
