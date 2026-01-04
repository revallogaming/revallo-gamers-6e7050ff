import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tournament, GameType } from '@/types';

export interface TournamentFilters {
  game?: GameType | 'all';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  prizeMin?: number;
  prizeMax?: number;
}

const PAGE_SIZE = 24;
const STALE_TIME = 1000 * 60 * 2; // 2 minutes
const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

export function useInfiniteTournaments(filters: TournamentFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['tournaments-infinite', filters],
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('tournaments')
        .select('*, organizer:profiles(*)', { count: 'exact' })
        .order('is_highlighted', { ascending: false })
        .order('start_date', { ascending: true })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      // Filter by game
      if (filters.game && filters.game !== 'all') {
        query = query.eq('game', filters.game);
      }
      
      // Filter by search (title)
      if (filters.search && filters.search.trim()) {
        query = query.ilike('title', `%${filters.search.trim()}%`);
      }
      
      // Filter by date range
      if (filters.dateFrom) {
        query = query.gte('start_date', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('start_date', filters.dateTo.toISOString());
      }
      
      // Filter by prize (we'll filter client-side since prize_description is text)
      // For now, we'll just fetch and filter server-side when possible
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      // Client-side filtering for prize range (if needed)
      let filteredData = data as Tournament[];
      
      // Parse prize from description for filtering (rough estimate)
      if (filters.prizeMin !== undefined || filters.prizeMax !== undefined) {
        filteredData = filteredData.filter(t => {
          if (!t.prize_description) return filters.prizeMin === undefined || filters.prizeMin === 0;
          
          // Extract numbers from prize description
          const numbers = t.prize_description.match(/[\d.,]+/g);
          if (!numbers) return true;
          
          const prizeValue = parseFloat(numbers[0].replace('.', '').replace(',', '.'));
          
          if (filters.prizeMin !== undefined && prizeValue < filters.prizeMin) return false;
          if (filters.prizeMax !== undefined && prizeValue > filters.prizeMax) return false;
          return true;
        });
      }
      
      return {
        tournaments: filteredData,
        totalCount: count || 0,
        nextPage: (data?.length || 0) === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
