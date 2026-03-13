'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MiniTournament, GAME_INFO, MINI_TOURNAMENT_STATUS_INFO, FORMAT_INFO } from '@/types';
import { Calendar, Users, Trophy, CircleDollarSign, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  tournament: MiniTournament;
}

export function MiniTournamentCard({ tournament }: Props) {
  const gameInfo = GAME_INFO[tournament.game];
  const formatInfo = FORMAT_INFO[tournament.format];

  return (
    <Link href={`/apostados/${tournament.id}`}>
      <div className="flex items-center gap-4 bg-[#1A1A24] border border-white/10 p-4 rounded-xl hover:border-primary/50 hover:bg-[#222230] hover:shadow-[0_0_20px_rgba(138,43,226,0.1)] transition-all group overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <Avatar className="w-14 h-14 border border-white/10 shrink-0 shadow-lg">
          <AvatarImage src={tournament.organizer?.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="font-black italic text-primary bg-primary/10 text-lg">
            {tournament.organizer?.nickname?.charAt(0).toUpperCase() || 'O'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <h3 className="font-black italic uppercase tracking-tight text-white text-base truncate">
            {tournament.title}
          </h3>
          
          {/* Prize - always its own line */}
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-black italic tracking-tighter text-[15px]">
              R$ {(Number(tournament.prize_pool_brl) || 0).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-white/20 text-xs">•</span>
            <span className="text-white/70 font-bold text-[12px] uppercase">
              {formatInfo.label || tournament.format}
            </span>
          </div>

          {/* Entry + vagas row */}
          <div className="flex items-center gap-1.5">
            {Number(tournament.entry_fee_brl) > 0 && (
              <span className="text-gray-400 text-[12px]">
                Entrada R$ {Number(tournament.entry_fee_brl).toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className="text-white/20 text-xs">•</span>
            <span className="text-gray-400 text-[12px]">
              {tournament.max_participants - tournament.current_participants > 0 
                ? `${tournament.max_participants - tournament.current_participants} vagas` 
                : 'Lotado'}
            </span>
          </div>
        </div>
        
        <div className="shrink-0 ml-2">
          <div className="bg-primary hover:bg-primary/80 text-white shadow-[0_0_15px_rgba(138,43,226,0.5)] border border-primary/50 px-4 py-2 rounded-lg font-black uppercase italic tracking-widest text-[11px] md:text-xs transition-all">
            Entrar
          </div>
        </div>
      </div>
    </Link>
  );
}
