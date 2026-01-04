import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEO, getProfileStructuredData } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Star, Gamepad2, Calendar, UserPlus, UserCheck, Users } from "lucide-react";
import { GAME_INFO, STATUS_INFO } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useFollowers } from "@/hooks/useFollowers";
import { FollowersDialog } from "@/components/FollowersDialog";

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, isToggling, followerCount, followingCount } = useFollowers(id);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);

  // Fetch profile data using secure RPC function
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .rpc("get_public_profile", { profile_id: id })
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

  // Fetch tournaments created by this user
  const { data: createdTournaments } = useQuery({
    queryKey: ["user-created-tournaments", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organizer_id", id)
        .order("created_at", { ascending: false });
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

  const isOwnProfile = user?.id === id;

  return (
    <>
      <SEO 
        title={`${profile.nickname} - Perfil`}
        description={profile.bio || `Perfil de ${profile.nickname} na Revallo. ${profile.main_game ? `Jogador de ${GAME_INFO[profile.main_game as keyof typeof GAME_INFO]?.name || profile.main_game}.` : 'Participe de torneios de eSports!'}`}
        image={profile.avatar_url || undefined}
        type="profile"
        structuredData={getProfileStructuredData({ 
          nickname: profile.nickname || 'Jogador', 
          bio: profile.bio, 
          avatar_url: profile.avatar_url, 
          id: id || '' 
        })}
        keywords={`${profile.nickname}, jogador esports, gamer brasil${profile.main_game ? `, ${GAME_INFO[profile.main_game as keyof typeof GAME_INFO]?.name || ''}` : ''}`}
      />
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
                <Avatar className="h-32 w-32 border-4 border-primary/50 glow-primary">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
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
                    <GameIcon game={profile.main_game as keyof typeof GAME_INFO} className="h-4 w-4" />
                    <span>{GAME_INFO[profile.main_game as keyof typeof GAME_INFO]?.name}</span>
                  </div>
                )}

                {profile.bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                )}

                {/* Follower Stats */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <button 
                    onClick={() => setFollowersDialogOpen(true)}
                    className="text-center hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-foreground">{followerCount ?? 0}</span>
                    <span className="text-muted-foreground ml-1">seguidores</span>
                  </button>
                  <button 
                    onClick={() => setFollowingDialogOpen(true)}
                    className="text-center hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-foreground">{followingCount ?? 0}</span>
                    <span className="text-muted-foreground ml-1">seguindo</span>
                  </button>
                </div>

                {/* Follow Button */}
                {user && !isOwnProfile && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    className="mt-4 w-full"
                    onClick={toggleFollow}
                    disabled={isToggling}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Created Tournaments */}
            {createdTournaments && createdTournaments.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-accent" />
                    Torneios Organizados
                  </h3>

                  <div className="space-y-3">
                    {createdTournaments.map((t: any) => {
                      const statusInfo = STATUS_INFO[t.status as keyof typeof STATUS_INFO];
                      return (
                        <Link
                          key={t.id}
                          to={`/tournament/${t.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all bg-background/50">
                            <div className="flex items-center gap-3">
                              {t.banner_url ? (
                                <img 
                                  src={t.banner_url} 
                                  alt={t.title} 
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                  <GameIcon game={t.game} className="h-6 w-6" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-foreground">{t.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{format(new Date(t.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                                  <span>•</span>
                                  <span>{t.current_participants}/{t.max_participants} jogadores</span>
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              style={{ borderColor: statusInfo?.color, color: statusInfo?.color }}
                            >
                              {statusInfo?.label}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participations */}
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
      {/* Followers Dialog */}
      {id && (
        <>
          <FollowersDialog
            open={followersDialogOpen}
            onOpenChange={setFollowersDialogOpen}
            userId={id}
            type="followers"
          />
          <FollowersDialog
            open={followingDialogOpen}
            onOpenChange={setFollowingDialogOpen}
            userId={id}
            type="following"
          />
        </>
      )}
    </div>
    </>
  );
};

export default PublicProfile;
