"use client";

import { useInfiniteTournaments } from "@/hooks/useInfiniteTournaments";
import { useLFG } from "@/hooks/useLFG";
import { Trophy, Users, ChevronRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NextImage from "next/image";

export function PlatformPreview() {
  const router = useRouter();
  const { data: tournamentsData } = useInfiniteTournaments();
  const { data: lfgPosts } = useLFG();

  const previewTournaments = tournamentsData?.pages[0]?.tournaments.slice(0, 2) || [];
  const previewSquads = lfgPosts?.slice(0, 3) || [];

  return (
    <section className="py-20 bg-[#0F0F18]/50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-4">
              O que está <span className="text-primary italic">acontecendo</span> agora
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
              Campeonatos ativos e squads se formando na comunidade.
            </p>
          </div>
          <button 
            onClick={() => router.push("/tournaments")}
            className="flex items-center gap-2 text-primary font-black italic uppercase tracking-widest text-sm hover:translate-x-1 transition-all"
          >
            Explorar tudo <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tournament Preview */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 italic">
              🏆 Campeonatos em destaque
            </p>
            <div className="grid gap-4">
              {previewTournaments.length > 0 ? (
                previewTournaments.map((t, i) => (
                   <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative h-32 rounded-3xl overflow-hidden border border-white/5 cursor-pointer"
                    onClick={() => router.push(`/tournaments/${t.id}`)}
                  >
                    <NextImage 
                      src={t.banner_url || "https://res.cloudinary.com/db8uqft43/image/upload/v1773364948/banners/scca78ak60bfz4m578ii.png"} 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-all duration-700"
                      alt={t.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0F] via-[#0D0D0F]/90 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0D0D0F] to-transparent" />
                    <div className="relative z-10 p-6 flex items-center justify-between h-full">
                      <div>
                        <h4 className="text-lg font-black italic uppercase text-white mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-xl border border-white/5">
                            <Plus className="text-primary h-3 w-3" />
                            <p className="text-primary font-black italic text-[10px] uppercase tracking-tighter">
                                R$ {(Number(t.entry_fee_brl) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <Trophy className="text-emerald-400 h-4 w-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <p className="text-emerald-300 font-black italic text-[14px] md:text-[16px] uppercase tracking-tighter drop-shadow-sm">
                                R$ {(Number(t.prize_amount_brl) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        </div>
                      </div>
                      <ChevronRight className="text-white/20 group-hover:text-white transition-colors" size={24} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-32 rounded-3xl border border-dashed border-white/10 flex items-center justify-center italic text-gray-500 text-sm">
                  Mais campeonatos em breve...
                </div>
              )}
            </div>
          </div>

          {/* Squad Preview */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2 italic">
              👥 Buscando Squad
            </p>
            <div className="grid gap-4">
              {previewSquads.length > 0 ? (
                previewSquads.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-3xl bg-[#0D0D0F]/60 border border-white/5 backdrop-blur-xl flex items-center gap-4 hover:border-blue-500/40 hover:bg-[#0D0D0F]/80 transition-all duration-300 cursor-pointer group/card"
                    onClick={() => router.push("/lfg")}
                  >
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={s.authorPhoto || undefined} />
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 font-bold">
                        {s.authorName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black italic text-sm truncate">
                        {s.authorName} precisa de squad
                      </p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        {s.game} • {s.rank}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black italic uppercase text-blue-400 group-hover/card:bg-blue-500 group-hover/card:text-white transition-all">
                      Entrar
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-32 rounded-3xl border border-dashed border-white/10 flex items-center justify-center italic text-gray-500 text-sm">
                  Seja o primeiro a buscar squad...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
