import { useState } from 'react';
import { Search, Calendar, DollarSign, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { TournamentFilters as FilterType } from '@/hooks/useInfiniteTournaments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TournamentFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

const PRIZE_RANGES = [
  { label: 'Qualquer', min: undefined, max: undefined },
  { label: 'Até R$ 100', min: 0, max: 100 },
  { label: 'R$ 100 - R$ 500', min: 100, max: 500 },
  { label: 'R$ 500 - R$ 1.000', min: 500, max: 1000 },
  { label: 'R$ 1.000 - R$ 5.000', min: 1000, max: 5000 },
  { label: 'Acima de R$ 5.000', min: 5000, max: undefined },
];

export function TournamentFilters({ filters, onFiltersChange }: TournamentFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce search
    if (!value.trim()) {
      onFiltersChange({ ...filters, search: undefined });
    }
  };

  const handleDateChange = (type: 'from' | 'to', date: Date | undefined) => {
    if (type === 'from') {
      onFiltersChange({ ...filters, dateFrom: date });
    } else {
      onFiltersChange({ ...filters, dateTo: date });
    }
  };

  const handlePrizeChange = (min: number | undefined, max: number | undefined) => {
    onFiltersChange({ ...filters, prizeMin: min, prizeMax: max });
  };

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange({ game: filters.game });
  };

  const hasActiveFilters = !!(filters.search || filters.dateFrom || filters.dateTo || filters.prizeMin !== undefined || filters.prizeMax !== undefined);
  
  const activeFilterCount = [
    filters.search,
    filters.dateFrom || filters.dateTo,
    filters.prizeMin !== undefined || filters.prizeMax !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar torneio por nome..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 bg-card border-border/50"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" className="h-9">
          Buscar
        </Button>
        
        {/* Filters Toggle */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 relative">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Filtros Avançados</h4>
              
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Período
                </label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs justify-start">
                        {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yy', { locale: ptBR }) : 'De'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => handleDateChange('from', date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs justify-start">
                        {filters.dateTo ? format(filters.dateTo, 'dd/MM/yy', { locale: ptBR }) : 'Até'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => handleDateChange('to', date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Prize Range */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Faixa de Premiação
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRIZE_RANGES.map((range) => {
                    const isActive = filters.prizeMin === range.min && filters.prizeMax === range.max;
                    return (
                      <Button
                        key={range.label}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => handlePrizeChange(range.min, range.max)}
                      >
                        {range.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </form>
      
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.search && (
            <Badge variant="secondary" className="text-xs gap-1 h-6">
              "{filters.search}"
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => {
                setSearchValue('');
                onFiltersChange({ ...filters, search: undefined });
              }} />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="text-xs gap-1 h-6">
              {filters.dateFrom && format(filters.dateFrom, 'dd/MM', { locale: ptBR })}
              {filters.dateFrom && filters.dateTo && ' - '}
              {filters.dateTo && format(filters.dateTo, 'dd/MM', { locale: ptBR })}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => {
                onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined });
              }} />
            </Badge>
          )}
          {(filters.prizeMin !== undefined || filters.prizeMax !== undefined) && (
            <Badge variant="secondary" className="text-xs gap-1 h-6">
              {filters.prizeMin !== undefined && filters.prizeMax !== undefined
                ? `R$ ${filters.prizeMin} - R$ ${filters.prizeMax}`
                : filters.prizeMin !== undefined
                  ? `Acima de R$ ${filters.prizeMin}`
                  : `Até R$ ${filters.prizeMax}`}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => {
                onFiltersChange({ ...filters, prizeMin: undefined, prizeMax: undefined });
              }} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
