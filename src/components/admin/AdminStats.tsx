import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Coins, Gamepad2, TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  bannedUsers: number;
  totalTournaments: number;
  activeTournaments: number;
  totalMiniTournaments: number;
  activeMiniTournaments: number;
  totalCreditsInCirculation: number;
  totalTransactions: number;
}

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<Stats> => {
      const [
        profilesRes,
        tournamentsRes,
        miniTournamentsRes,
        creditsRes,
        transactionsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, is_banned'),
        supabase.from('tournaments').select('id, status'),
        supabase.from('mini_tournaments').select('id, status'),
        supabase.from('user_credits').select('balance'),
        supabase.from('credit_transactions').select('id', { count: 'exact', head: true })
      ]);

      const profiles = profilesRes.data || [];
      const tournaments = tournamentsRes.data || [];
      const miniTournaments = miniTournamentsRes.data || [];
      const credits = creditsRes.data || [];

      return {
        totalUsers: profiles.length,
        bannedUsers: profiles.filter(p => p.is_banned).length,
        totalTournaments: tournaments.length,
        activeTournaments: tournaments.filter(t => ['open', 'in_progress'].includes(t.status)).length,
        totalMiniTournaments: miniTournaments.length,
        activeMiniTournaments: miniTournaments.filter(t => ['open', 'in_progress', 'awaiting_result'].includes(t.status)).length,
        totalCreditsInCirculation: credits.reduce((sum, c) => sum + (c.balance || 0), 0),
        totalTransactions: transactionsRes.count || 0
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statCards = [
    { 
      label: "Total de Usuários", 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      label: "Usuários Banidos", 
      value: stats?.bannedUsers || 0, 
      icon: Users, 
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    { 
      label: "Torneios Totais", 
      value: stats?.totalTournaments || 0, 
      icon: Trophy, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Torneios Ativos", 
      value: stats?.activeTournaments || 0, 
      icon: Calendar, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      label: "Mini Torneios", 
      value: stats?.totalMiniTournaments || 0, 
      icon: Gamepad2, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      label: "Mini Ativos", 
      value: stats?.activeMiniTournaments || 0, 
      icon: TrendingUp, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      label: "Créditos em Circulação", 
      value: stats?.totalCreditsInCirculation?.toLocaleString('pt-BR') || 0, 
      icon: Coins, 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    { 
      label: "Total Transações", 
      value: stats?.totalTransactions || 0, 
      icon: TrendingUp, 
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
