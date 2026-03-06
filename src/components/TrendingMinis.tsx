"use client";

import { ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { useMiniTournaments } from "@/hooks/useMiniTournaments";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export function TrendingMinis() {
  const { tournaments, isLoading } = useMiniTournaments();
  const router = useRouter();

  const trending = tournaments?.slice(0, 3) || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[12px] font-black text-white italic uppercase tracking-[0.2em] flex items-center gap-2">
          <Zap size={14} className="text-primary fill-primary" />
          Rápidos
        </h2>
        <Link
          href="/minitorneios"
          className="text-[10px] text-gray-500 hover:text-white transition-colors font-bold uppercase"
        >
          Ver todos
        </Link>
      </div>

      <div className="flex-1 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />
          ))
        ) : trending.length > 0 ? (
          trending.map((mini) => (
            <div
              key={mini.id}
              onClick={() => router.push(`/minitorneios/${mini.id}`)}
              className="group flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative shadow-sm hover:shadow-glow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center">
                {mini.game ? (
                   <img
                   src={`/games/${mini.game}.png`}
                   alt={mini.title}
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "/tournament-placeholder.png";
                   }}
                 />
                ) : (
                  <Zap size={20} className="text-primary/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black text-white uppercase italic truncate">
                  {mini.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-primary italic">
                    {mini.entry_fee_credits === 0 ? "GRÁTIS" : `${mini.entry_fee_credits} Cr`}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/10" />
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                    {mini.max_participants} JOGADORES
                  </span>
                </div>
              </div>

              <ChevronRight
                size={14}
                className="text-gray-700 group-hover:text-primary transition-colors"
              />
            </div>
          ))
        ) : (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center p-8 rounded-[32px] relative overflow-hidden group border border-primary/20 bg-black/40 shadow-glow-sm">
            <div className="absolute inset-0 z-0">
               <img 
                src="/premium_hero_banner.png" 
                className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <Zap size={32} className="text-primary mb-3 drop-shadow-glow" />
              <p className="text-[11px] font-black text-white italic uppercase tracking-widest mb-1">
                Prepare-se para o Combate
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">
                Mini torneios emocionantes <br /> estão chegando!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
