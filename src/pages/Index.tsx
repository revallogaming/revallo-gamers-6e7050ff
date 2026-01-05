import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { GameFilter } from "@/components/GameFilter";
import { TournamentCard } from "@/components/TournamentCard";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { GameIcon } from "@/components/GameIcon";
import { HighlightedTournamentsBanner } from "@/components/HighlightedTournamentsBanner";
import { SEO, getWebsiteStructuredData } from "@/components/SEO";
import { useTournaments } from "@/hooks/useTournaments";
import { useRealtimeTournaments } from "@/hooks/useRealtimeParticipants";
import { useFollowingTournaments } from "@/hooks/useFollowingTournaments";
import { useAuth } from "@/hooks/useAuth";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, ChevronRight, Plus, ArrowRight, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";

const MAX_HOME_TOURNAMENTS = 48; // Limit for home page

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | "all">("all");
  const { user } = useAuth();
  const { data: tournaments, isLoading } = useTournaments(
    selectedGame === "all" ? undefined : selectedGame
  );
  const { data: followingTournaments, isLoading: isLoadingFollowing } = useFollowingTournaments();
  
  // Enable realtime updates for tournaments list
  useRealtimeTournaments();

  // Memoize sorted and limited tournaments to prevent recalculation on each render
  const { limitedTournaments, hasMoreTournaments, totalCount } = useMemo(() => {
    if (!tournaments) {
      return { limitedTournaments: [], hasMoreTournaments: false, totalCount: 0 };
    }
    const sorted = [...tournaments].sort((a, b) => {
      if (a.is_highlighted && !b.is_highlighted) return -1;
      if (!a.is_highlighted && b.is_highlighted) return 1;
      return 0;
    });
    return {
      limitedTournaments: sorted.slice(0, MAX_HOME_TOURNAMENTS),
      hasMoreTournaments: tournaments.length > MAX_HOME_TOURNAMENTS,
      totalCount: tournaments.length,
    };
  }, [tournaments]);

  // Memoize open tournaments count by game
  const openTournamentsByGame = useMemo(() => ({
    freefire: tournaments?.filter(t => t.game === 'freefire' && t.status === 'open').length || 0,
    fortnite: tournaments?.filter(t => t.game === 'fortnite' && t.status === 'open').length || 0,
    cod: tournaments?.filter(t => t.game === 'cod' && t.status === 'open').length || 0,
    league_of_legends: tournaments?.filter(t => t.game === 'league_of_legends' && t.status === 'open').length || 0,
    valorant: tournaments?.filter(t => t.game === 'valorant' && t.status === 'open').length || 0,
  } as Record<GameType, number>), [tournaments]);

  return (
    <>
      <SEO 
        structuredData={getWebsiteStructuredData()}
        keywords="esports, torneios, campeonatos, free fire, fortnite, call of duty, valorant, league of legends, gaming, brasil, competição online, jogos competitivos"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="flex">
          {/* Sidebar - Games (Desktop) */}
          <aside className="hidden md:flex w-52 lg:w-56 flex-col border-r border-border bg-sidebar min-h-[calc(100vh-3.5rem)] sticky top-14">
            <div className="p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4 px-2">
                Jogos
              </h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedGame("all")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    selectedGame === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Gamepad2 className="h-4 w-4" />
                  <span className="font-medium flex-1 text-left">Todos os Jogos</span>
                </button>
                {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
                  const info = GAME_INFO[game];
                  const count = openTournamentsByGame[game];
                  return (
                    <button
                      key={game}
                      onClick={() => setSelectedGame(game)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                        selectedGame === game
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <GameIcon game={game} className="h-4 w-4" />
                      <span className="font-medium flex-1 text-left">{info.name}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          selectedGame === game 
                            ? "bg-primary-foreground/20 text-primary-foreground" 
                            : "bg-primary/15 text-primary"
                        }`}>
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
          <section className="relative overflow-hidden border-b border-border/30">
            <div className="absolute inset-0 bg-gradient-subtle" />
            
            <div className="relative px-4 md:px-6 py-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-0.5">
                      Seu próximo <span className="text-primary">campeonato</span> começa aqui.
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Encontre torneios, desafie os melhores e prove que você é lenda.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user && (
                      <CreateTournamentDialog>
                        <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          Criar Torneio
                        </Button>
                      </CreateTournamentDialog>
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex justify-center md:justify-start">
                  <SearchBar />
                </div>

                {/* Mobile Game Filter - Grid Layout */}
                <div className="md:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedGame("all")}
                      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all text-xs ${
                        selectedGame === "all"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Gamepad2 className="h-5 w-5" />
                      <span className="font-medium">Todos</span>
                    </button>
                    {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
                      const info = GAME_INFO[game];
                      const count = openTournamentsByGame[game];
                      return (
                        <button
                          key={game}
                          onClick={() => setSelectedGame(game)}
                          className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all text-xs relative ${
                            selectedGame === game
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <GameIcon game={game} className="h-5 w-5" />
                          <span className="font-medium truncate">{info.name}</span>
                          {count > 0 && (
                            <span className={`absolute -top-1 -right-1 text-[9px] min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full font-semibold ${
                              selectedGame === game 
                                ? "bg-primary-foreground/20 text-primary-foreground" 
                                : "bg-primary text-primary-foreground"
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Floating Create Tournament Button - Mobile */}
          {user && (
            <div className="md:hidden fixed bottom-6 right-6 z-50">
              <CreateTournamentDialog>
                <Button 
                  size="lg" 
                  className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                >
                  <Plus className="h-6 w-6" />
                  <span className="sr-only">Criar Torneio</span>
                </Button>
              </CreateTournamentDialog>
            </div>
          )}

          {/* Highlighted Tournaments Banner */}
          {!isLoading && tournaments && tournaments.length > 0 && (
            <HighlightedTournamentsBanner tournaments={tournaments} />
          )}

          {/* Following Organizers Tournaments */}
          {user && followingTournaments && followingTournaments.length > 0 && (
            <section className="px-4 md:px-6 py-4 border-t border-border/20 bg-primary/3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
                    Quem você segue
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({followingTournaments.length})
                  </span>
                </div>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {followingTournaments.slice(0, 8).map((tournament) => (
                  <div key={tournament.id} className="relative">
                    <TournamentCard tournament={tournament} />
                    {tournament.organizer && (
                      <Link 
                        to={`/profile/${tournament.organizer.id}`}
                        className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={tournament.organizer.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {tournament.organizer.nickname?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-medium text-foreground truncate max-w-[60px]">
                          {tournament.organizer.nickname}
                        </span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(Object.keys(GAME_INFO) as GameType[]).map((game) => {
            const gameTournaments = selectedGame === "all" 
              ? limitedTournaments.filter(t => t.game === game)
              : game === selectedGame 
                ? limitedTournaments
                : [];
            
            if (gameTournaments.length === 0) return null;
            
            const info = GAME_INFO[game];
            
            return (
              <section key={game} className="px-4 md:px-6 py-4 border-t border-border/20">
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
            <section className="px-4 md:px-6 py-5 border-t border-border/20">
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
        <footer className="border-t border-border/30 bg-card/20">
          <div className="container mx-auto px-4 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                <span className="font-display text-base font-semibold text-foreground">REVALLO</span>
              </div>
              <nav className="flex items-center gap-4 text-xs text-muted-foreground" aria-label="Footer navigation">
                <Link to="/organizer" className="hover:text-foreground transition-colors">
                  Para Organizadores
                </Link>
                <span>Suporte</span>
                <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </nav>
              <p className="text-xs text-muted-foreground">
                © 2026 Revallo. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
