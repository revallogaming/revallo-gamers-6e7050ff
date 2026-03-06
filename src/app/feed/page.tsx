"use client";

import { TrendingMinis } from "@/components/TrendingMinis";
import { useMiniTournaments } from "@/hooks/useMiniTournaments";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteTournaments } from "@/hooks/useInfiniteTournaments";
import { useCommunities } from "@/hooks/useCommunities";
import { useLFG } from "@/hooks/useLFG";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  MessageCircle,
  Users,
  Zap,
  ChevronRight,
  Play,
  Trophy,
} from "lucide-react";

const GAME_COLORS: Record<string, string> = {
  free_fire: "#FF6B00",
  freefire: "#FF6B00",
  valorant: "#FF4655",
  blood_strike: "#00C9FF",
  cod_warzone: "#8BC34A",
  cod: "#8BC34A",
};

function getGameColor(game?: string) {
  if (!game) return "#A78BFA";
  return GAME_COLORS[game.toLowerCase().replace(" ", "_")] ?? "#A78BFA";
}

export default function FeedPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const { data: tournamentsData, isLoading: loadingTournaments } =
    useInfiniteTournaments();
  const { data: communities, isLoading: loadingCommunities } = useCommunities();
  const { data: lfgPosts, isLoading: loadingLFG } = useLFG();

  const allTournaments = tournamentsData?.pages.flatMap((p: any) => p.tournaments) ?? [];
  const featuredTournament = allTournaments.find(t => t.is_highlighted) || allTournaments[0];
  const firstCommunity = communities?.[0];
  const squadPosts = lfgPosts?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header />

      <div
        className="flex-1 overflow-y-auto"
        style={{
          background:
            "radial-gradient(ellipse at 15% 10%, rgba(88,28,135,0.12) 0%, transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(16,185,129,0.06) 0%, transparent 45%), #0A0910",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-5 space-y-7">
          {/* ── Hero Banner (Consolidated & Refined) ── */}
          <div
            className="relative rounded-[32px] overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #0C0820 0%, #180B3A 50%, #0A1A14 100%)",
              border: "1px solid rgba(139,92,246,0.15)",
              minHeight: 160,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity duration-700"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.4), transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.25), transparent 50%)",
              }}
            />
            <div className="relative z-10 flex items-stretch min-h-[160px]">
              <div className="flex-1 flex flex-col justify-center px-10 py-4">
                <p className="text-[9px] font-black mb-1 italic text-[#34D399] uppercase tracking-[0.3em]">
                  Bem-vindo, {profile?.nickname || "jogador"}!
                </p>
                <h1 className="text-3xl font-black leading-[1.1] mb-0.5 italic tracking-tighter text-white">
                  Explore torneios <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary py-0.5">emocionantes</span>
                </h1>
                <h2 className="text-lg font-black leading-tight mb-4 italic tracking-tighter text-white/90">
                  e encontre novas comunidades
                </h2>
                {!user ? (
                  <button
                    onClick={() => router.push("/auth")}
                    className="w-fit px-6 h-9 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                      boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                    }}
                  >
                    Criar conta gratuita
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/tournaments")}
                    className="w-fit px-6 h-9 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    Ver Torneios
                  </button>
                )}
              </div>
              <div className="w-[280px] relative shrink-0 hidden lg:block overflow-hidden">
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background: "linear-gradient(to right, #0C0820 0%, transparent 25%)",
                  }}
                />
                <img
                  src="/feed-hero.png"
                  alt="Hero"
                  className="w-full h-full object-cover object-center scale-110 group-hover:scale-115 transition-transform duration-1000"
                  style={{ opacity: 0.9 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(16,185,129,0.1), transparent 70%)",
                  }}
                />
                <div className="absolute bottom-6 right-8 flex gap-2 z-20">
                  <div className="h-1.5 w-5 rounded-full bg-primary/80" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 1: Destaque + Minitorneios ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[12px] font-black text-white italic uppercase tracking-[0.2em]">
                  Destaque
                </h2>
                <Link
                  href="/tournaments"
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors font-bold uppercase"
                >
                  Ver todos <ChevronRight size={12} />
                </Link>
              </div>

              {loadingTournaments ? (
                <Skeleton
                  className="w-full rounded-[32px] bg-white/3"
                  style={{ minHeight: 140 }}
                />
              ) : featuredTournament ? (
                <div
                  className="relative rounded-[32px] overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(52,211,153,0.1)]"
                  style={{
                    background: "#080C14",
                    border: "2.5px solid #34D399",
                    boxShadow: "0 0 30px rgba(52,211,153,0.2), inset 0 0 30px rgba(52,211,153,0.1)",
                    minHeight: 180,
                  }}
                  onClick={() =>
                    router.push(`/tournaments/${featuredTournament.id}`)
                  }
                >
                  <div className="absolute inset-0 z-0 flex justify-end overflow-hidden group">
                  <div className="w-full lg:w-[70%] relative">
                    <img
                      src={featuredTournament.banner_url || `/banners/${featuredTournament.game ?? 'freefire'}.png`}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/banners/freefire.png';
                      }}
                    />
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#080C14] to-transparent hidden lg:block" />
                  </div>
                  {/* Subtle overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#080C14] via-[#080C14]/40 to-transparent z-[1]" />
                </div>
                  <div className="relative z-10 p-6 flex items-center justify-between h-full">
                    <div className="max-w-[80%]">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1 italic">
                        TORNEIO {String(featuredTournament.game ?? "VALORANT").replace("_", " ").toUpperCase()}
                      </p>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-[1.1] mb-2 group-hover:translate-x-1 transition-transform">
                        {featuredTournament.title}
                      </h3>
                      <p className="text-lg font-black italic text-white flex items-center gap-2 mb-4 drop-shadow-lg">
                        <Trophy size={18} className="text-primary fill-primary/20" />
                        {featuredTournament.prize_amount > 0
                          ? `R$ ${featuredTournament.prize_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : (featuredTournament.prize_description && featuredTournament.prize_description !== "Premiação a definir" 
                              ? featuredTournament.prize_description 
                              : "Premiação a definir")}
                      </p>
                      <button
                        className="flex items-center gap-2 px-6 h-9 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
                          boxShadow: "0 0 15px rgba(124,58,237,0.3)",
                        }}
                      >
                        Ver torneio <ChevronRight size={12} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center rounded-[32px] gap-4 p-12 text-center bg-white/1 border border-dashed border-white/5"
                  style={{ minHeight: 140 }}
                >
                  <Trophy size={48} className="text-gray-800" />
                  <p className="text-[12px] font-black uppercase tracking-widest text-gray-700 italic">
                    Nenhum destaque no momento
                  </p>
                </div>
              )}
            </div>

            {/* Trending / Minitorneios Sidebar */}
            <div className="hidden lg:block">
              <TrendingMinis />
            </div>
          </div>

          {/* ── Comunidades + Encontrar Squad ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* Comunidades */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[14px] font-black text-white italic uppercase tracking-[0.2em]">
                  Comunidades
                </h2>
                <Link
                  href="/communities"
                  className="flex items-center gap-2 px-4 h-8 rounded-xl bg-white/5 text-[10px] text-white hover:bg-white/10 transition-colors font-black italic uppercase"
                >
                  Ver todos <ChevronRight size={12} />
                </Link>
              </div>

              {loadingCommunities ? (
                <Skeleton className="w-full rounded-[32px] bg-white/3 h-48" />
              ) : communities && communities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {communities.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      className="group relative cursor-pointer overflow-hidden rounded-[24px] aspect-[4/3] bg-[#0D0D0F] border border-white/5 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                      onClick={() => router.push(`/communities/${c.id}`)}
                    >
                      <img
                        src={c.banner_url || "/tournament-placeholder.png"}
                        className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6 rounded-lg border border-white/20 shrink-0">
                            <AvatarImage src={c.banner_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-[8px] font-black">
                              {c.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-[11px] font-black italic text-white uppercase leading-none">
                            {c.name}
                          </p>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          {c.member_count?.toLocaleString() || 0} membros
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[32px] gap-4 py-16 text-center bg-white/1 border border-dashed border-white/5">
                  <Users size={48} className="text-gray-800" />
                  <p className="text-[12px] font-black uppercase tracking-widest text-gray-700 italic">
                    Explore comunidades agora
                  </p>
                </div>
              )}
            </div>

            {/* Encontrar Squad */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[14px] font-black text-white italic uppercase tracking-[0.2em]">
                  Encontrar Squad
                </h2>
                <Link
                  href="/lfg"
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-white transition-colors font-bold uppercase"
                >
                  Ver todos <ChevronRight size={12} />
                </Link>
              </div>

              <div className="space-y-3">
                {loadingLFG ? (
                  [...Array(3)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-20 rounded-[24px] bg-white/3"
                    />
                  ))
                ) : squadPosts.length > 0 ? (
                  squadPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-4 p-5 rounded-[24px] bg-[#0D0D0F] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <Avatar className="h-12 w-12 rounded-2xl">
                        <AvatarImage src={post.authorPhoto || undefined} />
                        <AvatarFallback className="bg-purple-900/30 text-purple-400 font-black">
                          {post.authorName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-black text-white italic truncate">
                            {post.authorName}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-600">
                            12
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate flex items-center gap-2">
                          {post.game}
                        </p>
                      </div>
                      <button className="px-5 h-10 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase italic text-white hover:bg-white/10 transition-all">
                        Entrar em contato
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 rounded-[24px] bg-white/1 border border-dashed border-white/5">
                    <p className="text-[10px] text-gray-700 font-black uppercase italic">
                      Nenhum squad buscando
                    </p>
                  </div>
                )}

                <div className="flex justify-center gap-1.5 mt-6">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
