import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, Trophy, Users, Calendar, Clock, ArrowRight } from "lucide-react";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tournament } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_INFO, STATUS_INFO } from "@/types";

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
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
          Torneios em Destaque
        </h2>
      </div>
      
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl shadow-primary/10">
        {/* Navigation Arrows */}
        {highlightedTournaments.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-background/95 border border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-lg"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-background/95 border border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-lg"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        <Link to={`/tournament/${currentTournament.id}`} className="block">
          <div className="flex flex-col lg:flex-row">
            {/* Banner Image - Large */}
            <div className="relative w-full lg:w-1/2 xl:w-2/5">
              <div className="aspect-video lg:aspect-[4/3] w-full overflow-hidden">
                {currentTournament.banner_url ? (
                  <img
                    src={currentTournament.banner_url}
                    alt={currentTournament.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center">
                    <GameIcon game={currentTournament.game} className="h-20 w-20 opacity-30" />
                  </div>
                )}
              </div>
              
              {/* Overlay badges on image */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge className="gap-1.5 px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  Patrocinado
                </Badge>
              </div>
              
              {countdownText && (
                <div className="absolute top-3 right-3">
                  <Badge 
                    className={`gap-1.5 px-2.5 py-1 text-xs font-bold shadow-lg ${
                      isUrgent 
                        ? "bg-destructive text-destructive-foreground animate-pulse" 
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {countdownText}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 p-5 lg:p-8 flex flex-col justify-center">
              {/* Game & Status */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className="gap-1.5 text-xs px-2.5 py-1 bg-muted/80 text-foreground border-0">
                  <GameIcon game={currentTournament.game} className="h-4 w-4" />
                  {gameInfo.name}
                </Badge>
                <Badge variant={statusInfo.variant} className="text-xs px-2.5 py-1">
                  {statusInfo.label}
                </Badge>
              </div>
              
              {/* Title */}
              <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 line-clamp-2">
                {currentTournament.title}
              </h3>
              
              {/* Description */}
              {currentTournament.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {currentTournament.description}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {/* Prize */}
                {currentTournament.prize_description && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prêmio</p>
                      <p className="text-sm font-bold text-primary">{currentTournament.prize_description}</p>
                    </div>
                  </div>
                )}
                
                {/* Participants */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vagas</p>
                    <p className="text-sm font-bold text-foreground">
                      {currentTournament.current_participants}/{currentTournament.max_participants}
                    </p>
                  </div>
                </div>
                
                {/* Date */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Início</p>
                    <p className="text-sm font-bold text-foreground">
                      {format(startDate, "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                {/* Entry Fee */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inscrição</p>
                    <p className="text-sm font-bold text-foreground">
                      {currentTournament.entry_fee > 0 
                        ? `R$ ${currentTournament.entry_fee.toFixed(2)}` 
                        : "Grátis"
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <Button size="lg" className="w-full sm:w-auto gap-2 font-bold">
                Ver Torneio
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Link>
        
        {/* Dots Indicator */}
        {highlightedTournaments.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-3 bg-background/50">
            {highlightedTournaments.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
                }`}
                aria-label={`Ir para torneio ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
