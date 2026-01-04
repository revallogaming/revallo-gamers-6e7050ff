import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Tournament } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { Button } from "@/components/ui/button";
import { GAME_INFO } from "@/types";

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
    }, 5000);
    
    return () => clearInterval(interval);
  }, [highlightedTournaments.length]);
  
  if (highlightedTournaments.length === 0) return null;
  
  const currentTournament = highlightedTournaments[currentIndex];
  const gameInfo = GAME_INFO[currentTournament.game];
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? highlightedTournaments.length - 1 : prev - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % highlightedTournaments.length);
  };
  
  return (
    <section className="px-4 md:px-6 py-4">
      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card">
        {/* Navigation Arrows - Always visible */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-background/90 border border-border/50 text-foreground hover:bg-background transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-background/90 border border-border/50 text-foreground hover:bg-background transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        <Link to={`/tournament/${currentTournament.id}`} className="block">
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 sm:p-4">
            {/* Banner Image */}
            <div className="relative w-full sm:w-32 md:w-40 lg:w-48 aspect-video sm:aspect-square rounded-md overflow-hidden flex-shrink-0">
              {currentTournament.banner_url ? (
                <img
                  src={currentTournament.banner_url}
                  alt={currentTournament.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                  <GameIcon game={currentTournament.game} className="h-8 w-8 opacity-50" />
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[9px] sm:text-[10px] font-medium">
                <Sparkles className="h-2.5 w-2.5" />
                Patrocinado
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center sm:text-left min-w-0 px-6 sm:px-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <GameIcon game={currentTournament.game} className="h-3.5 w-3.5" />
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{gameInfo.name}</span>
              </div>
              
              <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-foreground mb-1 line-clamp-1">
                {currentTournament.title}
              </h3>
              
              {currentTournament.description && (
                <p className="hidden sm:block text-xs text-muted-foreground line-clamp-1 mb-2">
                  {currentTournament.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded bg-muted/50">
                  {currentTournament.current_participants}/{currentTournament.max_participants}
                </span>
                {currentTournament.entry_fee > 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    R$ {currentTournament.entry_fee.toFixed(2)}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 font-medium">
                    Grátis
                  </span>
                )}
              </div>
            </div>
            
            {/* CTA Button - Hidden on mobile, visible on larger screens */}
            <div className="hidden md:block flex-shrink-0">
              <Button size="sm" variant="outline" className="text-xs">
                Ver Torneio
              </Button>
            </div>
          </div>
        </Link>
        
        {/* Dots Indicator */}
        {highlightedTournaments.length > 1 && (
          <div className="flex items-center justify-center gap-1 pb-2">
            {highlightedTournaments.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(index);
                }}
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-3 sm:w-4"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
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
