import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { GameFilter } from "@/components/GameFilter";
import { TournamentCard } from "@/components/TournamentCard";
import { useTournaments } from "@/hooks/useTournaments";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, Users, Zap, ChevronRight, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | "all">("all");
  const { data: tournaments, isLoading } = useTournaments(
    selectedGame === "all" ? undefined : selectedGame
  );

  // Get highlighted tournaments
  const highlightedTournaments = tournaments?.filter(t => t.is_highlighted) || [];
  const regularTournaments = tournaments?.filter(t => !t.is_highlighted) || [];

  // Get tournaments by game for sidebar
  const tournamentsByGame = {
    freefire: tournaments?.filter(t => t.game === 'freefire' && t.status === 'open') || [],
    fortnite: tournaments?.filter(t => t.game === 'fortnite' && t.status === 'open') || [],
    cod: tournaments?.filter(t => t.game === 'cod' && t.status === 'open') || [],
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
                    <span className="text-xl">{info.icon}</span>
                    <span className="font-medium flex-1 text-left">{info.name}</span>
                    {count > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
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
            </nav>
          </div>
          
          {/* Live Stats */}
          <div className="mt-auto p-4 border-t border-border/50">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">Torneios ativos</span>
                <span className="ml-auto font-bold text-foreground">
                  {tournaments?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Jogadores</span>
                <span className="ml-auto font-bold text-foreground">
                  {tournaments?.reduce((acc, t) => acc + t.current_participants, 0) || 0}
                </span>
              </div>
            </div>
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
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
                    <Zap className="h-4 w-4" />
                    <span>Torneios ao vivo agora</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Compete. Vença. <span className="text-gradient-primary">Conquiste.</span>
                  </h1>
                  <p className="text-muted-foreground max-w-lg">
                    Participe dos melhores torneios de Free Fire, Fortnite e Call of Duty do Brasil.
                  </p>
                </div>
                
                {/* Mobile Game Filter */}
                <div className="lg:hidden">
                  <GameFilter selected={selectedGame} onSelect={setSelectedGame} />
                </div>
              </div>
            </div>
          </section>

          {/* Highlighted Tournaments */}
          {highlightedTournaments.length > 0 && (
            <section className="px-4 md:px-8 py-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-bold text-foreground">Em Destaque</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {highlightedTournaments.slice(0, 3).map((tournament) => (
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
              <section key={game} className="px-4 md:px-8 py-6 border-t border-border/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <h2 className="font-display text-xl font-bold text-foreground">{info.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      {gameTournaments.length} torneio{gameTournaments.length !== 1 && 's'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {gameTournaments.slice(0, 6).map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 md:px-8 py-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
                    <Skeleton className="mb-3 h-5 w-20" />
                    <Skeleton className="mb-2 h-6 w-full" />
                    <Skeleton className="mb-4 h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
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

          {/* CTA Section */}
          <section className="px-4 md:px-8 py-12 border-t border-border/50">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Pronto para competir?
              </h2>
              <p className="text-muted-foreground mb-6">
                Crie sua conta e comece a participar dos melhores torneios de eSports do Brasil.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/auth">
                  <Button className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold px-8">
                    Criar Conta Grátis
                  </Button>
                </Link>
                <Link to="/credits">
                  <Button variant="outline">
                    Comprar Créditos
                  </Button>
                </Link>
              </div>
            </div>
          </section>
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
              <span>Termos de Uso</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Revallo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
