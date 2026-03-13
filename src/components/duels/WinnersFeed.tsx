'use client';

import { useRecentWinners } from '@/hooks/useDuels';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Zap, Sword, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function WinnersFeed() {
  const { data: winners, isLoading } = useRecentWinners();

  return (
    <div className="bg-[#0D0D0F]/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6">
      <h3 className="text-sm font-black italic uppercase tracking-tighter text-white flex items-center gap-2 mb-6">
        <TrendingUp className="text-primary h-4 w-4" />
        Feed de Conquistas
      </h3>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4 bg-white/5" />
                <Skeleton className="h-2 w-1/2 bg-white/5" />
              </div>
            </div>
          ))
        ) : winners && winners.length > 0 ? (
          winners.map((payout: any) => (
            <div key={payout.id} className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all cursor-default">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-white italic uppercase truncate">
                    Jogador Ganhou
                  </span>
                  <span className="text-[11px] font-black text-primary italic">
                    + R$ {payout.amount_brl.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Vencedor em Duelo 4v4
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-4">
             {/* Mock data if none exists to show potential */}
             <div className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 opacity-50">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sword className="h-5 w-5 text-primary opacity-40" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] text-white font-black italic uppercase">Time Alpha desafiou!</p>
                   <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Aguardando oponente...</p>
                </div>
             </div>
             <div className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 opacity-50">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-green-500 opacity-40" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] text-white font-black italic uppercase">Team Ghost ganhou R$ 80</p>
                   <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Duelo Finalizado</p>
                </div>
             </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
          <span>Total Pago Hoje</span>
          <span className="text-white">R$ 1.240,00</span>
        </div>
      </div>
    </div>
  );
}
