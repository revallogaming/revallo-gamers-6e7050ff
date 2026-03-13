'use client';

import { useDuels } from '@/hooks/useDuels';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sword, Users, Trophy, Zap, ChevronRight } from 'lucide-react';
import { GAME_INFO } from '@/types';
import { CreateDuelDialog } from './CreateDuelDialog';
import { SubmitDuelResultDialog } from './SubmitDuelResultDialog';
import { useAuth } from '@/hooks/useAuth';

export function DuelingLobby() {
  const { user } = useAuth();
  const { duels, isLoading, acceptDuel } = useDuels();

  const openDuels = duels?.filter(d => d.status === 'open') || [];
  const myActiveDuels = duels?.filter(d => 
    (d.status === 'matched' || d.status === 'playing') && 
    (d.teamA_id === user?.uid || d.teamB_id === user?.uid)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 px-4">
        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
            <Sword className="text-primary h-6 w-6" />
            Duelos Instantâneos
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic mt-1">
            {myActiveDuels.length > 0 ? 'Você tem duelos em andamento!' : 'Desafios aguardando oponente'}
          </p>
        </div>
      </div>

      {myActiveDuels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black italic uppercase text-primary">Meus Duelos Ativos</h3>
          <div className="grid grid-cols-1 gap-4">
            {myActiveDuels.map((duel) => (
              <div 
                key={duel.id}
                className="group relative overflow-hidden rounded-3xl bg-primary/10 border border-primary/20 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                    <Sword className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white italic uppercase">{duel.mode} {GAME_INFO[duel.game].name}</p>
                    <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
                      {duel.status === 'matched' ? 'Aguardando Início' : 'Em Andamento'}
                    </p>
                  </div>
                </div>
                <SubmitDuelResultDialog duel={duel} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/5 border border-white/10" />
          ))
        ) : openDuels.length > 0 ? (
          openDuels.map((duel) => (
            <div 
              key={duel.id}
              className="group relative overflow-hidden rounded-[32px] bg-[#0D0D0F]/60 border border-white/5 hover:border-primary/50 transition-all duration-300 p-6 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-black flex items-center justify-center">
                   <img 
                    src={`/images/games/${duel.game}.png`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={duel.game}
                   />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/20 text-primary border-primary/20 text-[9px] font-black uppercase italic tracking-widest h-5">
                      {duel.mode}
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-gray-400 text-[9px] font-black uppercase italic tracking-widest h-5">
                      {duel.format}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">
                    {duel.creator?.nickname || 'Time Rival'} <span className="text-gray-600">Desafiou!</span>
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-500 italic tracking-widest">
                       <Zap className="h-3 w-3 text-primary" />
                       <span>Aposta: <span className="text-white">R$ {(duel.entry_fee_brl || 0).toFixed(2)}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-500 italic tracking-widest">
                       <Trophy className="h-3 w-3 text-primary" />
                       <span>Prêmio: <span className="text-primary font-bold">R$ {(duel.prize_pool_brl || 0).toFixed(2)}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                <Button 
                  onClick={() => acceptDuel.mutate(duel.id)}
                  disabled={acceptDuel.isPending}
                  className="flex-1 md:flex-none h-12 px-8 bg-primary hover:opacity-90 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  {acceptDuel.isPending ? <Skeleton className="h-4 w-4 rounded-full" /> : <Sword className="h-4 w-4" />}
                  Aceitar Desafio
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
            <Sword className="h-12 w-12 text-gray-700 mb-4" />
            <h4 className="text-white font-black italic uppercase tracking-tighter">Nenhum duelo aberto</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Crie o seu primeiro desafio agora!</p>
          </div>
        )}
      </div>
    </div>
  );
}
