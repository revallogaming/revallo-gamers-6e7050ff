import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Tournament } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { Button } from "@/components/ui/button";
import { GAME_INFO } from "@/types";

interface HighlightedTournamentsBannerProps {
  tournaments: Tournament[];
}

export const HighlightedTournamentsBanner = ({ tournaments }: HighlightedTournamentsBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const highlightedTournaments = tournaments.filter(t => t.is_highlighted);
  
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
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5">
        {/* Navigation Arrows */}
        {highlightedTournaments.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        <Link to={`/tournament/${currentTournament.id}`} className="block">
          <div className="flex flex-col md:flex-row items-center gap-4 p-4 md:p-6">
            {/* Banner Image */}
            <div className="relative w-full md:w-48 lg:w-64 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0">
              {currentTournament.banner_url ? (
                <img
                  src={currentTournament.banner_url}
                  alt={currentTournament.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <GameIcon game={currentTournament.game} className="h-12 w-12 opacity-50" />
                </div>
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold">
                <Sparkles className="h-3 w-3" />
                Patrocinado
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <GameIcon game={currentTournament.game} className="h-4 w-4" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{gameInfo.name}</span>
              </div>
              
              <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-2 line-clamp-2">
                {currentTournament.title}
              </h3>
              
              {currentTournament.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {currentTournament.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-muted/50">
                  {currentTournament.current_participants}/{currentTournament.max_participants} jogadores
                </span>
                {currentTournament.entry_fee > 0 ? (
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    R$ {currentTournament.entry_fee.toFixed(2)}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 font-medium">
                    Gratuito
                  </span>
                )}
                {currentTournament.prize_description && (
                  <span className="px-2 py-1 rounded bg-accent/10 text-accent-foreground">
                    🏆 {currentTournament.prize_description}
                  </span>
                )}
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="flex-shrink-0">
              <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                Ver Torneio
              </Button>
            </div>
          </div>
        </Link>
        
        {/* Dots Indicator */}
        {highlightedTournaments.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {highlightedTournaments.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-4"
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
