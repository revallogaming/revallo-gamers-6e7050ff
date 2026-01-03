import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Calendar, Coins, TrendingUp, Clock } from "lucide-react";
import { Tournament } from "@/types";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  tournaments: Tournament[];
}

export function TournamentStatsCard({ tournaments }: Props) {
  const totalParticipants = tournaments.reduce((acc, t) => acc + t.current_participants, 0);
  const totalRevenue = tournaments.reduce((acc, t) => acc + t.entry_fee * t.current_participants, 0);
  const activeTournaments = tournaments.filter(t => ["open", "upcoming", "in_progress"].includes(t.status));
  const completedTournaments = tournaments.filter(t => t.status === "completed");
  
  // Calculate average fill rate
  const avgFillRate = tournaments.length > 0
    ? Math.round(
        (tournaments.reduce((acc, t) => acc + (t.current_participants / t.max_participants) * 100, 0) /
          tournaments.length)
      )
    : 0;

  // Find upcoming tournament
  const upcomingTournament = tournaments
    .filter(t => t.status === "open" || t.status === "upcoming")
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

  const timeUntilNext = upcomingTournament
    ? differenceInDays(new Date(upcomingTournament.start_date), new Date())
    : null;

  const stats = [
    {
      icon: Trophy,
      label: "Total de Torneios",
      value: tournaments.length,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Users,
      label: "Total de Participantes",
      value: totalParticipants,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Calendar,
      label: "Torneios Ativos",
      value: activeTournaments.length,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Coins,
      label: "Receita Total (créditos)",
      value: totalRevenue.toLocaleString("pt-BR"),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: TrendingUp,
      label: "Taxa de Preenchimento",
      value: `${avgFillRate}%`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Clock,
      label: "Próximo Torneio",
      value: timeUntilNext !== null 
        ? timeUntilNext === 0 
          ? "Hoje!" 
          : `${timeUntilNext} dia${timeUntilNext !== 1 ? "s" : ""}`
        : "N/A",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full ${stat.bgColor} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
