import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Trophy, User, Loader2, SlidersHorizontal, Calendar, Coins, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GameIcon } from "@/components/GameIcon";
import { useSearch, SearchFilters } from "@/hooks/useSearch";
import { GAME_INFO } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  
  const { data, isLoading } = useSearch(query, filters);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Count active filters
  const activeFiltersCount = [
    filters.prizeMin !== undefined || filters.prizeMax !== undefined,
    filters.entryFeeMin !== undefined || filters.entryFeeMax !== undefined,
    filters.dateFrom !== undefined || filters.dateTo !== undefined,
  ].filter(Boolean).length;

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

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleResultClick = () => {
    setQuery("");
    setIsOpen(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const hasResults = data && (data.tournaments.length > 0 || data.users.length > 0);
  const noResults = (query.length >= 2 || activeFiltersCount > 0) && !isLoading && data && data.tournaments.length === 0 && data.users.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
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

        {/* Filters Button */}
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-2 shrink-0 ${activeFiltersCount > 0 ? "border-primary text-primary" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={handleClearFilters}
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {/* Prize Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Award className="h-3 w-3" />
                  Premiação (R$)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.prizeMin ?? ""}
                    onChange={(e) => updateFilter("prizeMin", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground self-center">-</span>
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.prizeMax ?? ""}
                    onChange={(e) => updateFilter("prizeMax", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Entry Fee Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  Taxa de Inscrição (créditos)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.entryFeeMin ?? ""}
                    onChange={(e) => updateFilter("entryFeeMin", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground self-center">-</span>
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.entryFeeMax ?? ""}
                    onChange={(e) => updateFilter("entryFeeMax", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Data do Torneio
                </Label>
                <div className="flex gap-2">
                  <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs justify-start font-normal"
                      >
                        {filters.dateFrom
                          ? format(filters.dateFrom, "dd/MM/yy", { locale: ptBR })
                          : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => {
                          updateFilter("dateFrom", date);
                          setDateFromOpen(false);
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground self-center">-</span>
                  <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs justify-start font-normal"
                      >
                        {filters.dateTo
                          ? format(filters.dateTo, "dd/MM/yy", { locale: ptBR })
                          : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => {
                          updateFilter("dateTo", date);
                          setDateToOpen(false);
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(filters.dateFrom || filters.dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground w-full"
                    onClick={() => {
                      updateFilter("dateFrom", undefined);
                      updateFilter("dateTo", undefined);
                    }}
                  >
                    Limpar datas
                  </Button>
                )}
              </div>

              {/* Apply Button */}
              <Button
                className="w-full"
                size="sm"
                onClick={() => setFiltersOpen(false)}
              >
                Aplicar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(filters.prizeMin !== undefined || filters.prizeMax !== undefined) && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1">
              Prêmio: {filters.prizeMin !== undefined ? `R$${filters.prizeMin}` : "0"} - {filters.prizeMax !== undefined ? `R$${filters.prizeMax}` : "∞"}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  updateFilter("prizeMin", undefined);
                  updateFilter("prizeMax", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.entryFeeMin !== undefined || filters.entryFeeMax !== undefined) && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1">
              Inscrição: {filters.entryFeeMin ?? 0} - {filters.entryFeeMax ?? "∞"} créditos
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  updateFilter("entryFeeMin", undefined);
                  updateFilter("entryFeeMax", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.dateFrom !== undefined || filters.dateTo !== undefined) && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1">
              Data: {filters.dateFrom ? format(filters.dateFrom, "dd/MM", { locale: ptBR }) : "início"} - {filters.dateTo ? format(filters.dateTo, "dd/MM", { locale: ptBR }) : "fim"}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  updateFilter("dateFrom", undefined);
                  updateFilter("dateTo", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && (hasResults || noResults) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {noResults && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhum resultado encontrado{query.length >= 2 ? ` para "${query}"` : ""}
              {activeFiltersCount > 0 && " com os filtros selecionados"}
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
                  const params = new URLSearchParams();
                  if (query) params.set("search", query);
                  if (filters.prizeMin !== undefined) params.set("prizeMin", String(filters.prizeMin));
                  if (filters.prizeMax !== undefined) params.set("prizeMax", String(filters.prizeMax));
                  if (filters.entryFeeMin !== undefined) params.set("entryFeeMin", String(filters.entryFeeMin));
                  if (filters.entryFeeMax !== undefined) params.set("entryFeeMax", String(filters.entryFeeMax));
                  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom.toISOString());
                  if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString());
                  navigate(`/tournaments?${params.toString()}`);
                  handleResultClick();
                }}
              >
                Ver todos os resultados{query.length >= 2 ? ` para "${query}"` : ""}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
