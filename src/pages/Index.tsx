import { useState } from "react";
import { Header } from "@/components/Header";
import { GameFilter } from "@/components/GameFilter";
import { TournamentCard } from "@/components/TournamentCard";
import { useTournaments } from "@/hooks/useTournaments";
import { GameType, GAME_INFO } from "@/types";
import { Gamepad2, Trophy, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | "all">("all");
  const { data: tournaments, isLoading } = useTournaments(
    selectedGame === "all" ? undefined : selectedGame
  );

  const stats = [
    { icon: Trophy, label: "Torneios Ativos", value: "150+" },
    { icon: Users, label: "Jogadores", value: "25K+" },
    { icon: Zap, label: "Partidas/Dia", value: "500+" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Gamepad2 className="h-4 w-4" />
              <span>Plataforma #1 de eSports no Brasil</span>
            </div>
            
            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              <span className="text-foreground">Domine a </span>
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Arena
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Participe de torneios competitivos de Free Fire, Fortnite e Call of Duty. 
              Mostre suas habilidades, conquiste prêmios e suba no ranking.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              {Object.entries(GAME_INFO).map(([key, game]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2 backdrop-blur-sm"
                >
                  <span className="text-2xl">{game.icon}</span>
                  <span className="font-medium text-foreground">{game.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card/80"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Tournaments Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Torneios Disponíveis
            </h2>
            <p className="text-muted-foreground">
              Encontre o torneio perfeito para você
            </p>
          </div>
          <GameFilter selected={selectedGame} onSelect={setSelectedGame} />
        </div>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-6">
                <Skeleton className="mb-4 h-6 w-24" />
                <Skeleton className="mb-2 h-8 w-full" />
                <Skeleton className="mb-4 h-4 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 py-16 text-center">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              Nenhum torneio encontrado
            </h3>
            <p className="text-muted-foreground">
              {selectedGame === "all"
                ? "Ainda não há torneios disponíveis. Volte em breve!"
                : `Não há torneios de ${GAME_INFO[selectedGame as GameType].name} no momento.`}
            </p>
          </div>
        )}
      </section>
      
      {/* CTA Section */}
      <section className="border-t border-border/50 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">
            Pronto para competir?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Crie sua conta agora e comece a participar dos melhores torneios de eSports do Brasil.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25">
              Criar Conta Grátis
            </button>
            <button className="rounded-lg border border-border bg-card px-8 py-3 font-semibold text-foreground transition-all hover:bg-card/80">
              Saiba Mais
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">REVALLO</span>
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
