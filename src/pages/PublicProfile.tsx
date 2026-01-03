import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Star, Gamepad2, Calendar } from "lucide-react";
import { GAME_INFO } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch user's tournament participations
  const { data: participations } = useQuery({
    queryKey: ["user-participations", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("*, tournament:tournaments(*)")
        .eq("player_id", id)
        .order("registered_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Perfil não encontrado</h1>
          <Link to="/">
            <Button className="mt-4">Voltar para início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-1 border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-primary/50 glow-primary">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {profile.nickname?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <h2 className="mt-4 font-display text-2xl font-bold text-foreground flex items-center gap-2">
                  {profile.nickname}
                  {profile.is_highlighted && (
                    <Star className="h-5 w-5 text-accent fill-accent" />
                  )}
                </h2>

                {profile.main_game && (
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <GameIcon game={profile.main_game} className="h-4 w-4" />
                    <span>{GAME_INFO[profile.main_game]?.name}</span>
                  </div>
                )}

                {profile.bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participations */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-primary" />
                  Torneios Participados
                </h3>

                {participations && participations.length > 0 ? (
                  <div className="space-y-3">
                    {participations.map((p: any) => (
                      <Link
                        key={p.id}
                        to={`/tournament/${p.tournament.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all bg-background/50">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{GAME_INFO[p.tournament.game]?.icon}</span>
                            <div>
                              <h4 className="font-medium text-foreground">{p.tournament.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(p.tournament.start_date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          {p.placement && p.placement <= 3 && (
                            <Badge variant="outline" className="text-accent border-accent">
                              #{p.placement}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma participação em torneios ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
