'use client';

import { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Trophy, Clock, Flame, CircleDollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameIcon } from '@/components/GameIcon';
import { Tournament, GAME_INFO, STATUS_INFO } from '@/types';
import NextImage from 'next/image';
import { useScale } from '@/hooks/useScale';

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard = memo(function TournamentCard({ tournament }: TournamentCardProps) {
  const router = useRouter();
  const { s } = useScale();
  const gameInfo = GAME_INFO[tournament.game];
  const statusInfo = STATUS_INFO[tournament.status];
  
  const isRegistrationOpen = ['open', 'upcoming'].includes(tournament.status);
  const hasVacancy = tournament.current_participants < tournament.max_participants;
  const deadlineNotPassed = new Date(tournament.registration_deadline) > new Date();
  const canJoin = isRegistrationOpen && hasVacancy && deadlineNotPassed;

  // Calculate countdown
  const countdown = useMemo(() => {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const hoursLeft = differenceInHours(startDate, now);
    const daysLeft = differenceInDays(startDate, now);
    
    if (hoursLeft < 0) return null;
    if (hoursLeft < 24) return { text: `${hoursLeft}h`, urgent: true };
    if (daysLeft <= 3) return { text: `${daysLeft}d`, urgent: daysLeft <= 1 };
    return { text: `${daysLeft} dias`, urgent: false };
  }, [tournament.start_date]);

  // Calculate fill percentage for urgency indicator
  const fillPercentage = useMemo(() => {
    return Math.round((tournament.current_participants / tournament.max_participants) * 100);
  }, [tournament.current_participants, tournament.max_participants]);

  const handleClick = useCallback(() => {
    if (canJoin) {
      router.push(`/tournaments/${tournament.id}?join=true`);
    } else {
      router.push(`/tournaments/${tournament.id}`);
    }
  }, [canJoin, router, tournament.id]);

  return (
    <Card 
      onClick={handleClick}
      className="bg-[#0D0D0F]/40 backdrop-blur-xl border-white/5 hover:border-primary/50 overflow-hidden group cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(138,43,226,0.15)] rounded-2xl md:rounded-3xl"
    >
      {/* Banner Image */}
      <div className="relative">
        {tournament.banner_url ? (
          <div className="aspect-[16/9] w-full relative" style={{ overflow: 'hidden' }}>
            <NextImage 
              src={tournament.banner_url} 
              alt={tournament.title}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div 
            className="aspect-[16/9] w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent"
          >
            <GameIcon game={tournament.game} className="h-12 w-12 text-primary opacity-20" />
          </div>
        )}
        
        {/* Overlay Gradients */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0D0D0F] to-transparent" />
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors duration-300" />

        {/* Game Badge */}
        <div className="absolute top-3 left-3" style={{ top: s(12), left: s(12) }}>
          <Badge 
            className="gap-2 px-3 py-1 bg-black/60 backdrop-blur-md text-white border-white/10 font-black uppercase tracking-widest italic"
            style={{ fontSize: s(9), paddingLeft: s(12), paddingRight: s(12), paddingTop: s(4), paddingBottom: s(4) }}
          >
            <div style={{ height: s(12), width: s(12) }} className="flex items-center justify-center">
              <GameIcon game={tournament.game} className="h-full w-full" />
            </div>
            {gameInfo.name}
          </Badge>
        </div>

        {/* Status & Indicators */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end" style={{ top: s(12), right: s(12), gap: s(8) }}>
          {tournament.is_highlighted && (
            <Badge 
              className="bg-primary text-white gap-1 px-3 py-1 font-black uppercase tracking-widest italic shadow-lg shadow-primary/20"
              style={{ fontSize: s(9), paddingLeft: s(12), paddingRight: s(12), paddingTop: s(4), paddingBottom: s(4) }}
            >
              <div style={{ height: s(12), width: s(12) }} className="flex items-center justify-center">
                <Flame className="h-full w-full fill-current" />
              </div>
              Destaque
            </Badge>
          )}
          {countdown && !countdown.urgent && isRegistrationOpen && (
            <Badge 
              className="gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-widest italic"
              style={{ fontSize: s(9), paddingLeft: s(12), paddingRight: s(12), paddingTop: s(4), paddingBottom: s(4) }}
            >
              <div style={{ height: s(12), width: s(12) }} className="flex items-center justify-center">
                <Clock className="h-full w-full" />
              </div>
              {countdown.text}
            </Badge>
          )}
          {countdown && countdown.urgent && isRegistrationOpen && (
            <Badge 
              className="gap-1 px-3 py-1 bg-red-500 text-white font-black uppercase tracking-widest italic animate-pulse"
              style={{ fontSize: s(9), paddingLeft: s(12), paddingRight: s(12), paddingTop: s(4), paddingBottom: s(4) }}
            >
              <div style={{ height: s(12), width: s(12) }} className="flex items-center justify-center">
                <Clock className="h-full w-full" />
              </div>
              Finalizando
            </Badge>
          )}
        </div>

        {/* Status badge (bottom left of the image) */}
        <div className="absolute bottom-3 left-3" style={{ bottom: s(12), left: s(12) }}>
          <Badge 
            variant={statusInfo.variant} 
            className="px-3 py-1 font-black uppercase tracking-widest italic backdrop-blur-md border-0"
            style={{ fontSize: s(9), paddingLeft: s(12), paddingRight: s(12), paddingTop: s(4), paddingBottom: s(4) }}
          >
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Title - OUTSIDE the banner so it can freely wrap */}
      <div className="px-4 pt-3" style={{ paddingLeft: s(16), paddingRight: s(16), paddingTop: s(12) }}>
        <h3 
          className="font-black italic uppercase tracking-tighter text-white leading-tight drop-shadow-lg"
          style={{ fontSize: s(18), overflowWrap: 'break-word', wordBreak: 'break-word' }}
        >
          {tournament.title}
        </h3>
      </div>
      
      {/* Content */}
      <div className="p-5 pt-4 space-y-4" style={{ padding: s(20), paddingTop: s(16), gap: s(16) }}>
          {/* Main Prize Highlight */}
          <div className="w-full p-5 rounded-3xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 shadow-[0_0_25px_rgba(138,43,226,0.08)] transition-all duration-300">
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60 italic mb-1">Premiação Total</span>
                  <div className="flex items-center gap-2 text-white font-black italic tracking-tighter text-lg drop-shadow-md">
                    <Trophy className="h-5 w-5 text-primary drop-shadow-[0_0_12px_rgba(138,43,226,0.4)]" />
                    <span>
                      {tournament.prize_description && tournament.prize_description.includes('R$') 
                        ? tournament.prize_description.match(/R\$[\s]?[\d.,]+/)?.[0] || tournament.prize_description
                        : `R$ ${(Number(tournament.prize_amount_brl) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end border-l border-primary/20 pl-5">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 italic mb-0.5">Inscrição</span>
                  <div className="flex items-center gap-1.5 text-white font-black italic tracking-tighter text-sm">
                    <CircleDollarSign className="h-3.5 w-3.5 text-primary/80" />
                    {Number(tournament.entry_fee_brl) > 0 ? (
                      <span>R$ {Number(tournament.entry_fee_brl).toFixed(2).replace('.', ',')}</span>
                    ) : (
                      <span className="text-primary">Grátis</span>
                    )}
                  </div>
                </div>
             </div>
          </div>

          {/* Secondary Info Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 italic">Data Início</span>
                 <div className="flex items-center gap-2 text-white font-black italic uppercase tracking-tighter text-xs">
                   <Calendar className="h-3.5 w-3.5 text-primary/70" />
                   <span>{format(new Date(tournament.start_date), "dd MMM", { locale: ptBR })}</span>
                 </div>
              </div>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 italic">Vagas</span>
                 <div className="flex items-center gap-2 text-white font-black italic uppercase tracking-tighter text-xs">
                   <Users className="h-3.5 w-3.5 text-primary/70" />
                   <span>{tournament.current_participants}/{tournament.max_participants}</span>
                 </div>
              </div>
            </div>
          </div>

        {/* Entry Progress Bar */}
        <div className="w-full space-y-1.5" style={{ gap: s(6) }}>
           <div className="flex justify-between items-center px-1">
             <span 
               className="font-black uppercase tracking-widest text-gray-700 italic"
               style={{ fontSize: s(9) }}
             >Inscritos</span>
             <span 
               className="font-black uppercase tracking-widest text-primary italic"
               style={{ fontSize: s(9) }}
             >{fillPercentage}%</span>
           </div>
           <div 
             className="w-full bg-white/5 rounded-full overflow-hidden"
             style={{ height: s(6) }}
           >
             <div 
               className="h-full bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_10px_rgba(138,43,226,0.3)] transition-all duration-1000"
               style={{ width: `${Math.min(100, fillPercentage)}%` }}
             />
           </div>
        </div>
      </div>
    </Card>
  );
});
