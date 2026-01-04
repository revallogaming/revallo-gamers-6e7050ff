import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Trophy, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GameIcon } from "@/components/GameIcon";
import { useSearch } from "@/hooks/useSearch";
import { GAME_INFO } from "@/types";

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown when results arrive
  useEffect(() => {
    if (data && (data.tournaments.length > 0 || data.users.length > 0)) {
      setIsOpen(true);
    }
  }, [data]);

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = () => {
    setQuery("");
    setIsOpen(false);
  };

  const hasResults = data && (data.tournaments.length > 0 || data.users.length > 0);
  const noResults = query.length >= 2 && !isLoading && data && data.tournaments.length === 0 && data.users.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar torneios ou jogadores..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasResults && setIsOpen(true)}
          className="pl-9 pr-9 bg-card/50 border-border/50 focus:border-primary/50 h-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (hasResults || noResults) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {noResults && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}

          {/* Users Section */}
          {data && data.users.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <User className="h-3 w-3" />
                  Jogadores ({data.users.length})
                </div>
              </div>
              <div className="py-1">
                {data.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 border border-border/50">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.nickname?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {user.nickname}
                        </span>
                        {user.is_highlighted && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            PRO
                          </Badge>
                        )}
                      </div>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tournaments Section */}
          {data && data.tournaments.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Trophy className="h-3 w-3" />
                  Torneios ({data.tournaments.length})
                </div>
              </div>
              <div className="py-1">
                {data.tournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    to={`/tournaments/${tournament.id}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/50">
                      {tournament.banner_url ? (
                        <img
                          src={tournament.banner_url}
                          alt={tournament.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <GameIcon game={tournament.game} className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {tournament.title}
                        </span>
                        {tournament.is_highlighted && (
                          <Badge className="text-[10px] h-4 px-1 bg-primary/20 text-primary border-0">
                            Destaque
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GameIcon game={tournament.game} className="h-3 w-3" />
                        <span>{GAME_INFO[tournament.game].name}</span>
                        {tournament.organizer && (
                          <>
                            <span>•</span>
                            <span className="truncate">por {tournament.organizer.nickname}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        tournament.status === "open"
                          ? "default"
                          : tournament.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {tournament.status === "open"
                        ? "Aberto"
                        : tournament.status === "in_progress"
                        ? "Em andamento"
                        : tournament.status === "upcoming"
                        ? "Em breve"
                        : tournament.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* View All Link */}
          {hasResults && (
            <div className="p-2 border-t border-border/50 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigate(`/tournaments?search=${encodeURIComponent(query)}`);
                  handleResultClick();
                }}
              >
                Ver todos os resultados para "{query}"
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
