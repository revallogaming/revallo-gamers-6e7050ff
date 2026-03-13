import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Trophy, Users, Calendar, Clock, ArrowRight } from "lucide-react";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tournament } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_INFO, STATUS_INFO } from "@/types";
import NextImage from "next/image";

interface HighlightedTournamentsBannerProps {
  tournaments: Tournament[];
}

// Shuffle array randomly
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const HighlightedTournamentsBanner = ({ tournaments }: HighlightedTournamentsBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Randomize highlighted tournaments on mount
  const highlightedTournaments = useMemo(() => {
    const highlighted = tournaments.filter(t => t.is_highlighted);
    return shuffleArray(highlighted);
  }, [tournaments]);
  
  useEffect(() => {
    if (highlightedTournaments.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highlightedTournaments.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [highlightedTournaments.length]);
  
  if (highlightedTournaments.length === 0) return null;
  
  const currentTournament = highlightedTournaments[currentIndex];
  const gameInfo = GAME_INFO[currentTournament.game];
  const statusInfo = STATUS_INFO[currentTournament.status];
  
  // Calculate countdown
  const now = new Date();
  const startDate = new Date(currentTournament.start_date);
  const hoursLeft = differenceInHours(startDate, now);
  const daysLeft = differenceInDays(startDate, now);
  
  let countdownText = "";
  let isUrgent = false;
  if (hoursLeft > 0 && hoursLeft < 24) {
    countdownText = `Começa em ${hoursLeft}h`;
    isUrgent = true;
  } else if (daysLeft > 0 && daysLeft <= 7) {
    countdownText = `Começa em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`;
    isUrgent = daysLeft <= 2;
  }
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? highlightedTournaments.length - 1 : prev - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % highlightedTournaments.length);
  };
  
  return (
    <section className="px-4 md:px-6 py-5">
      <div className="flex items-center gap-2 mb-4 pl-1">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">
          Campeonatos em Destaque
        </h2>
      </div>
      
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0D0D0F]/60 shadow-[0_0_40px_rgba(138,43,226,0.1)] group">
        {/* Navigation Arrows */}
        {highlightedTournaments.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:border-primary transition-all shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:border-primary transition-all shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        <Link href={`/tournaments/${currentTournament.id}`} className="block">
          <div className="flex flex-col lg:flex-row relative">
            {/* Background ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />

            {/* Banner Image - Large */}
            <div className="relative w-full lg:w-1/2 xl:w-2/5 aspect-[16/9] lg:aspect-auto min-h-[300px] lg:min-h-[400px]">
              {currentTournament.banner_url ? (
                <NextImage
                  src={currentTournament.banner_url}
                  alt={currentTournament.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority={currentIndex === 0}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1A1A24] to-[#0D0D0F] flex items-center justify-center">
                  <GameIcon game={currentTournament.game} className="h-20 w-20 text-primary opacity-20" />
                </div>
              )}
              
              {/* Fade gradient to blend with content on large screens */}
              <div className="hidden lg:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0D0D0F] to-transparent z-10" />
              {/* Fade gradient for mobile */}
              <div className="lg:hidden absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0D0D0F] to-transparent z-10" />
              
              {/* Overlay badges on image */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.5)]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest italic">Destaque</span>
                </div>
                {countdownText && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-lg backdrop-blur-md ${
                    isUrgent 
                      ? "bg-red-500/20 border-red-500/50 text-red-500" 
                      : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{countdownText}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Content Container */}
            <div className="flex-1 p-6 lg:p-10 flex flex-col justify-center relative z-20 bg-[#0D0D0F] lg:bg-transparent -mt-10 lg:mt-0 lg:-ml-10 rounded-t-[32px] lg:rounded-none">
              
              {/* Game & Status */}
              <div className="flex items-center gap-2 mb-4">
                <Badge className="gap-2 px-3 py-1.5 bg-white/5 text-white border border-white/10 font-black uppercase text-[10px] tracking-widest italic">
                  <GameIcon game={currentTournament.game} className="h-3.5 w-3.5" />
                  {gameInfo.name}
                </Badge>
                <Badge variant={statusInfo.variant} className="px-3 py-1.5 bg-black/40 text-white border-white/10 font-bold text-[10px] uppercase tracking-widest italic">
                  {statusInfo.label}
                </Badge>
              </div>
              
              {/* Title */}
              <h3 className="font-orbitron-bold italic uppercase tracking-tighter text-3xl sm:text-4xl text-white mb-3 line-clamp-2 drop-shadow-md">
                {currentTournament.title}
              </h3>
              
              {/* Description */}
              {currentTournament.description && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-6 max-w-2xl leading-relaxed">
                  {currentTournament.description}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                {/* Prize */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Trophy className="h-6 w-6 text-emerald-400 drop-shadow-md" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70 italic mb-0.5">Premiação Total</span>
                    <span className="text-lg font-black italic tracking-tighter text-white">
                      {currentTournament.prize_description?.match(/R\$[\s]?[\d.,]+/)?.[0] || 
                       `R$ ${(Number(currentTournament.prize_amount_brl) || 0).toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                </div>
                
                {/* Entry Fee */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 italic mb-0.5">Inscrição</span>
                    <span className="text-sm font-black italic tracking-tight text-white">
                      {Number(currentTournament.entry_fee_brl) > 0 
                        ? `R$ ${Number(currentTournament.entry_fee_brl).toFixed(2).replace('.', ',')}` 
                        : <span className="text-emerald-400">Grátis</span>
                      }
                    </span>
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-white/5">
                  <Users className="h-4 w-4 text-primary/70" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 italic mb-0.5">Vagas</span>
                    <span className="text-sm font-black italic tracking-tight text-white">
                      {currentTournament.current_participants}/{currentTournament.max_participants}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-white/5">
                  <Calendar className="h-4 w-4 text-primary/70" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 italic mb-0.5">Início</span>
                    <span className="text-sm font-black italic tracking-tight text-white">
                      {format(startDate, "dd MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <div className="flex items-center gap-2 self-start bg-primary/20 hover:bg-primary border border-primary/50 text-primary hover:text-white px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(138,43,226,0.3)] group/btn">
                <span className="font-black italic uppercase tracking-widest text-sm text-shadow-glow">Ver Campeonato</span>
                <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
        
        {/* Dots Indicator */}
        {highlightedTournaments.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-30 pointer-events-none">
            {highlightedTournaments.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8 shadow-[0_0_10px_rgba(138,43,226,0.8)]"
                    : "bg-white/20 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
