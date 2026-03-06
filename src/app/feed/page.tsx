"use client";
import { useState } from "react";

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
import { Button } from "@/components/ui/button";

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
  const [searchQuery, setSearchQuery] = useState("");

  const allTournaments = tournamentsData?.pages.flatMap((p: any) => p.tournaments) ?? [];
  
  const filteredTournaments = allTournaments.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredTournament = filteredTournaments.find(t => t.is_highlighted) || filteredTournaments[0];
  const firstCommunity = communities?.[0];
  const squadPosts = lfgPosts?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        searchPlaceholder="BUSCAR TORNEIO PELO NOME..."
      />

      <div
        className="flex-1 overflow-y-auto bg-transparent relative"
      >
        {/* Subtle atmospheric glows for depth */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-5 space-y-5">
          {/* ── Hero Banner (Consolidated & Refined) ── */}
          <div
            className="relative rounded-[32px] overflow-hidden group shadow-glow-lg"
            style={{
              background: "rgba(13, 10, 30, 0.4)",
              border: "1px solid hsl(var(--primary) / 0.2)",
              minHeight: 160,
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
                <h1 className="text-3xl font-black leading-[1.1] mb-0.5 italic tracking-tighter text-white text-shadow-glow">
                  Explore torneios <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary py-0.5">emocionantes</span>
                </h1>
                <h2 className="text-lg font-black leading-tight mb-4 italic tracking-tighter text-white/90">
                  e encontre novas comunidades
                </h2>
                {!user ? (
                  <button
                    onClick={() => router.push("/auth")}
                    className="w-fit px-6 h-9 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-glow-sm"
                    style={{
                      background: "var(--gradient-primary)",
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
              <div className="w-[320px] relative shrink-0 hidden lg:block overflow-hidden">
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background: "linear-gradient(to right, #010002 0%, transparent 40%)",
                  }}
                />
                <img
                  src="/premium_hero_banner.png"
                  alt="Hero"
                  className="w-full h-full object-cover object-center scale-110 group-hover:scale-115 transition-transform duration-1000"
                  style={{ opacity: 0.9 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(16,185,129,0.15), transparent 70%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Row 1: Destaque + Minitorneios ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-[12px] font-black text-white italic uppercase tracking-[0.2em] text-shadow-glow">
                    Destaque
                  </h2>
                  <Link
                    href="/tournaments"
                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors font-bold uppercase"
                  >
                    Ver todos <ChevronRight size={12} />
                  </Link>
                </div>
                
                
              </div>

              {loadingTournaments ? (
                <Skeleton
                  className="w-full rounded-[32px] bg-white/3"
                  style={{ minHeight: 140 }}
                />
              ) : featuredTournament ? (
                <div
                  className="relative rounded-[32px] overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.01] border-2 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.25)]"
                  style={{
                    background: "rgba(13, 10, 30, 0.4)",
                    minHeight: 260,
                  }}
                  onClick={() =>
                    router.push(`/tournaments/${featuredTournament.id}`)
                  }
                >
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={featuredTournament.banner_url || `/banners/${featuredTournament.game ?? 'freefire'}.png`}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/banners/freefire.png';
                      }}
                    />
                    {/* Dark gradient for text readability and smooth blend */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020106] via-[#020106]/80 to-transparent z-[1]" />
                  </div>
                  <div className="relative z-10 p-10 flex items-center justify-between h-full">
                    <div className="max-w-[60%]">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 italic drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                        TORNEIO {String(featuredTournament.game ?? "VALORANT").replace("_", " ").toUpperCase()}
                      </p>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-[1.1] mb-2 group-hover:translate-x-1 transition-transform text-shadow-glow">
                        {featuredTournament.title}
                      </h3>
                      <p className="text-lg font-black italic text-white flex items-center gap-2 mb-6 drop-shadow-lg">
                        <Trophy size={20} className="text-emerald-400 fill-emerald-400/20" />
                        {featuredTournament.prize_amount > 0
                          ? `R$ ${featuredTournament.prize_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : (featuredTournament.prize_description && featuredTournament.prize_description.trim() !== ""
                              ? featuredTournament.prize_description 
                              : "Sem premiação")}
                      </p>
                      <button
                        className="flex items-center gap-2 px-8 h-10 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-glow-sm"
                        style={{
                          background: "var(--gradient-primary)",
                        }}
                      >
                        Ver torneio <ChevronRight size={12} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-[32px] p-8 lg:p-12 relative overflow-hidden group shadow-2xl min-h-[300px] flex flex-col justify-center"
                  style={{
                    background: "rgba(13, 10, 30, 0.4)",
                  }}
                >
                  <div className="absolute inset-0 z-0">
                    <img
                      src="/premium_hero_banner.png"
                      alt="Cosmic Gaming"
                      className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020106] via-[#020106]/60 to-transparent" />
                  </div>
                  <div className="relative z-10 p-10 flex items-center h-full">
                    <div className="max-w-[50%]">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 italic">
                        DESTAQUE SEU TRABALHO
                      </p>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-[1.1] mb-4 text-shadow-glow">
                        Anuncie aqui e ganhe <span className="text-primary">visibilidade</span> para seus torneios
                      </h3>
                      <button
                        className="flex items-center gap-2 px-8 h-10 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-glow-sm"
                        style={{
                          background: "var(--gradient-primary)",
                        }}
                      >
                        Saiba mais <ChevronRight size={12} className="ml-1" />
                      </button>
                    </div>
                  </div>
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
                        src={c.banner_url || c.icon_url || "/fictitious-community.png"}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <Link href={`/communities/${c.id}`} className="flex items-center gap-2 mb-1 relative z-10">
                          <Avatar
                            className="h-10 w-10 shrink-0 border-2 border-primary/20 group-hover:border-primary/50 transition-colors shadow-glow-sm"
                          >
                            <AvatarImage src={c.banner_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-[8px] font-black">
                              {c.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-[11px] font-black italic text-white uppercase leading-none">
                            {c.name}
                          </p>
                        </Link>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          {c.member_count?.toLocaleString() || 0} membros
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center rounded-[32px] gap-4 py-16 text-center bg-white/[0.02] border border-dashed border-white/10 relative overflow-hidden group"
                >
                  <img
                    src="/fictitious-community.png"
                    className="absolute inset-0 w-full h-full object-cover opacity-10 filter grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700"
                  />
                  <div className="relative z-10 flex flex-col items-center">
                    <Users size={48} className="text-primary mb-2 shadow-glow-sm" />
                    <p className="text-[12px] font-black uppercase tracking-widest text-white italic">
                      Hubs da Comunidade
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Explore e conecte-se
                    </p>
                  </div>
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
                    <Button
                      key={post.id}
                      variant="ghost"
                      className="h-14 px-4 hover:bg-white/5 flex items-center gap-4 transition-all group rounded-2xl border border-white/10 bg-white/[0.02] shadow-glow-sm"
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-colors shadow-glow-sm">
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
                    </Button>
                  ))
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center py-12 rounded-[24px] bg-white/[0.02] border border-dashed border-white/10 relative overflow-hidden group"
                  >
                    <img 
                      src="/fictitious-squad.png" 
                      className="absolute inset-0 w-full h-full object-cover opacity-10 filter grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700"
                    />
                    <div className="relative z-10 flex flex-col items-center">
                      <p className="text-[10px] text-white font-black uppercase italic tracking-widest">
                        Nenhum squad buscando no momento
                      </p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                        Seja o primeiro a postar!
                      </p>
                    </div>
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
