"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SEO, getProfileStructuredData } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trophy,
  Star,
  Gamepad2,
  Calendar,
  UserPlus,
  UserCheck,
  Users,
  Flag,
  Copy,
  ChevronRight,
  Shield,
  MessageSquare,
} from "lucide-react";
import {
  GAME_INFO,
  GameType,
  STATUS_INFO,
  Profile,
  Tournament,
  TournamentParticipant,
} from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useFollowers } from "@/hooks/useFollowers";
import { FollowersDialog } from "@/components/FollowersDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const {
    isFollowing,
    toggleFollow,
    isToggling,
    followerCount,
    followingCount,
  } = useFollowers(id);

  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const profileDoc = await getDoc(doc(db, "profiles", id));
      if (!profileDoc.exists()) return null;
      return { id: profileDoc.id, ...profileDoc.data() } as Profile;
    },
    enabled: !!id,
  });

  const { data: participations, isLoading: isParticipationsLoading } = useQuery<
    (TournamentParticipant & { tournament: Tournament })[]
  >({
      queryKey: ["user-participations", id],
      queryFn: async () => {
        if (!id) return [];
        const q = query(
          collection(db, "tournament_participants"),
          where("player_id", "==", id),
          orderBy("registered_at", "desc"),
          limit(10),
        );
        const snapshot = await getDocs(q);
        const participations = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const tournamentDoc = await getDoc(
              doc(db, "tournaments", data.tournament_id || docSnap.id),
            );
            return {
              id: docSnap.id,
              ...data,
              tournament: tournamentDoc.exists()
                ? { id: tournamentDoc.id, ...tournamentDoc.data() }
                : null,
            } as TournamentParticipant & { tournament: Tournament };
          }),
        );
        return participations;
      },
      enabled: !!id,
    },
  );

  const { data: createdTournaments, isLoading: isCreatedLoading } = useQuery<Tournament[]>({
    queryKey: ["user-created-tournaments", id],
    queryFn: async () => {
      if (!id) return [];
      const q = query(
        collection(db, "tournaments"),
        where("organizer_id", "==", id),
        orderBy("created_at", "desc"),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tournament[];
    },
    enabled: !!id,
  });

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col">
        <Header />
        <div className="container py-20 mx-auto px-4 flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white">
        <Header />
        <div className="container py-32 mx-auto px-4 text-center">
          <div className="h-24 w-24 rounded-[32px] bg-white/5 border border-white/5 mx-auto flex items-center justify-center mb-8">
            <Gamepad2 className="h-10 w-10 text-gray-700" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">
            Perfil não encontrado
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-12">
            O usuário que você busca não existe ou foi removido.
          </p>
          <Link href="/">
            <Button className="bg-primary hover:opacity-90 px-12 h-14 rounded-2xl font-black italic uppercase shadow-lg shadow-primary/20">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.uid === id;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <SEO
        title={`${profile.nickname} - Perfil`}
        description={profile.bio || "Perfil gamer na Revallo."}
        image={profile.avatar_url || undefined}
        type="profile"
      />
      <Header />

      <div className="container py-12 mx-auto px-4 relative">
        {/* Top Actions */}
        <div className="flex items-center justify-between mb-12 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <ArrowLeft className="h-4 w-4" />
            Explorar Revallo
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/profile/${id}`
                    : "";
                navigator.clipboard.writeText(url);
                toast.success("Link do perfil copiado!");
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-4 h-10 font-bold uppercase text-[9px] tracking-widest"
            >
              <Copy className="h-3.5 w-3.5 mr-2" />
              Compartilhar
            </Button>
            {user && !isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportDialogOpen(true)}
                className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 h-10 font-bold uppercase text-[9px] tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <Flag className="h-3.5 w-3.5 mr-2" />
                Denunciar
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Left: Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[40px] overflow-hidden group border-t-primary/20">
              <CardContent className="pt-12 px-8 pb-10">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full opacity-50 transition-all duration-1000 group-hover:opacity-100" />
                    <Avatar className="h-40 w-40 border-4 border-white/10 relative z-10 shadow-2xl">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-white/5 text-primary text-5xl font-black italic">
                        {profile.nickname?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center justify-center gap-3">
                      {profile.nickname}
                      <VerificationBadge type={(profile as any).verification_type || "verified"} size="md" showText />
                      {profile.is_highlighted && (
                        <Star className="h-6 w-6 text-primary fill-primary" />
                      )}
                    </h2>
                    {profile.main_game && (
                      <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic mx-auto w-fit flex items-center gap-2">
                        <GameIcon
                          game={profile.main_game as GameType}
                          className="h-3 w-3"
                        />
                        {
                          GAME_INFO[profile.main_game as GameType]
                            ?.name
                        }
                      </Badge>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-8 text-sm text-gray-400 font-medium leading-relaxed max-w-xs">
                      {profile.bio}
                    </p>
                  )}

                  {/* Social Stats */}
                  <div className="mt-10 grid grid-cols-2 gap-4 w-full">
                    <button
                      onClick={() => setFollowersDialogOpen(true)}
                      className="p-4 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group/stat"
                    >
                      <p className="text-2xl font-black italic tracking-tighter text-white">
                        {followerCount ?? 0}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover/stat:text-primary transition-colors">
                        seguidores
                      </p>
                    </button>
                    <button
                      onClick={() => setFollowingDialogOpen(true)}
                      className="p-4 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group/stat"
                    >
                      <p className="text-2xl font-black italic tracking-tighter text-white">
                        {followingCount ?? 0}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover/stat:text-primary transition-colors">
                        seguindo
                      </p>
                    </button>
                  </div>

                  {/* Action Button */}
                  {user && !isOwnProfile && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      className={`mt-6 w-full h-14 rounded-2xl font-black italic uppercase text-sm shadow-xl transition-all active:scale-95 ${
                        isFollowing
                          ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          : "bg-primary text-white hover:opacity-90 shadow-primary/20"
                      }`}
                      onClick={toggleFollow}
                      disabled={isToggling}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-5 w-5 mr-3" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-3" />
                          Seguir Player
                        </>
                      )}
                    </Button>
                  )}

                  <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
                    <Calendar className="h-3.5 w-3.5" />
                    Membro desde{" "}
                    {format(new Date(profile.created_at), "MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges/Achievements Card ?? */}
            <Card className="border-white/5 bg-[#0D0D0F]/60 rounded-[32px] p-8 hidden md:block">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-6 italic">
                Conquistas de Player
              </h3>
              <div className="flex flex-wrap gap-3">
                <div
                  className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500"
                  title="Beta Member"
                >
                  <Shield className="h-5 w-5" />
                </div>
                <div
                  className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500"
                  title="First Tournament"
                >
                  <Trophy className="h-5 w-5" />
                </div>
                <div
                  className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500"
                  title="Active Chatter"
                >
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: History & Stats */}
          <div className="lg:col-span-8 space-y-12">
            {/* Organized Tournaments Section */}
            {createdTournaments && createdTournaments.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                    Torneios <span className="text-primary">Organizados</span>
                  </h3>
                  <Badge className="bg-white/5 text-gray-400 border border-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em]">
                    ORGANIZADOR
                  </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {createdTournaments.map((t: Tournament) => {
                    const statusInfo =
                      STATUS_INFO[t.status as keyof typeof STATUS_INFO];
                    return (
                      <Link
                        key={t.id}
                        href={`/tournaments/${t.id}`}
                        className="group"
                      >
                        <Card className="border-white/5 bg-[#0D0D0F]/60 rounded-[32px] overflow-hidden hover:border-primary/30 transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                              {t.banner_url ? (
                                <img
                                  src={t.banner_url}
                                  alt={t.title}
                                  className="w-16 h-16 rounded-2xl object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                  <GameIcon
                                    game={t.game}
                                    className="h-8 w-8 text-gray-700 group-hover:text-primary transition-colors"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-lg font-black italic uppercase tracking-tighter text-white truncate group-hover:text-primary transition-colors">
                                  {t.title}
                                </h4>
                                <Badge
                                  className="rounded-lg px-2.5 h-5 text-[8px] font-black uppercase border-0 italic mt-1"
                                  style={{
                                    backgroundColor: statusInfo?.color + "20",
                                    color: statusInfo?.color,
                                    border: `1px solid ${statusInfo?.color}40`,
                                  }}
                                >
                                  {statusInfo?.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Users className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-black italic">
                                    {t.current_participants}/
                                    {t.max_participants}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-black italic">
                                    {format(new Date(t.start_date), "dd/MM/yy")}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Participations Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  Histórico de{" "}
                  <span className="text-primary">Participações</span>
                </h3>
                <Trophy className="h-6 w-6 text-primary/20" />
              </div>

              {participations && participations.length > 0 ? (
                <div className="space-y-3">
                  {participations.map((p: TournamentParticipant & { tournament: Tournament }) => (
                    <Link
                      key={p.id}
                      href={`/tournaments/${p.tournament_id || p.id}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between p-6 rounded-[32px] bg-white/2 border border-white/5 hover:bg-white/5 group-hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-700 group-hover:text-primary transition-colors">
                            <GameIcon
                              game={p.tournament?.game}
                              className="h-6 w-6"
                            />
                          </div>
                          <div>
                            <h4 className="font-black italic uppercase tracking-tighter text-white text-lg">
                              {p.tournament?.title || "Campeonato Encerrado"}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                {p.tournament?.start_date
                                  ? format(
                                      new Date(p.tournament.start_date),
                                      "dd 'de' MMMM, yyyy",
                                      { locale: ptBR },
                                    )
                                  : "Data Indisponível"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {p.placement && p.placement <= 3 && (
                            <Badge
                              className={`rounded-xl px-4 h-9 text-[11px] font-black italic uppercase border-0 ${
                                p.placement === 1
                                  ? "bg-amber-500 text-black"
                                  : p.placement === 2
                                    ? "bg-gray-300 text-black"
                                    : "bg-amber-700 text-white"
                              }`}
                            >
                              #{p.placement} LUGAR
                            </Badge>
                          )}
                          <ChevronRight className="h-5 w-5 text-gray-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/1 border border-dashed border-white/5 rounded-[40px]">
                  <Gamepad2 className="h-16 w-16 mx-auto mb-6 text-gray-800" />
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">
                    Sem Batalhas Registradas
                  </h4>
                  <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                    Este player ainda não iniciou sua jornada competitiva.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Dialogs */}
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
            <ReportDialog
              open={reportDialogOpen}
              onOpenChange={setReportDialogOpen}
              targetId={id}
              targetType="user"
              targetName={profile?.nickname || "Usuário"}
            />
          </>
        )}
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        className="animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      </svg>
    </div>
  );
}
