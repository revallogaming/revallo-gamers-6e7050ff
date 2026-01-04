import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tournament } from "@/types";

interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  is_highlighted: boolean;
  bio: string | null;
}

interface SearchResults {
  tournaments: (Tournament & { organizer: Profile })[];
  users: Profile[];
}

export interface SearchFilters {
  prizeMin?: number;
  prizeMax?: number;
  entryFeeMin?: number;
  entryFeeMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// Helper to parse prize from prize_description
const parsePrizeValue = (prizeDescription: string | null): number => {
  if (!prizeDescription) return 0;
  const match = prizeDescription.match(/R?\$?\s*([\d.,]+)/);
  if (match) {
    return parseFloat(match[1].replace(/\./g, "").replace(",", ".")) || 0;
  }
  return 0;
};

export const useSearch = (query: string, filters?: SearchFilters) => {
  const searchTerm = query.trim().toLowerCase();
  
  return useQuery({
    queryKey: ["search", searchTerm, filters],
    queryFn: async (): Promise<SearchResults> => {
      const hasFilters = filters && (
        filters.prizeMin !== undefined ||
        filters.prizeMax !== undefined ||
        filters.entryFeeMin !== undefined ||
        filters.entryFeeMax !== undefined ||
        filters.dateFrom !== undefined ||
        filters.dateTo !== undefined
      );

      // If no search term and no filters, return empty
      if ((!searchTerm || searchTerm.length < 2) && !hasFilters) {
        return { tournaments: [], users: [] };
      }

      // Build base query
      let tournamentQuery = supabase
        .from("tournaments")
        .select(`
          *,
          organizer:profiles!tournaments_organizer_id_fkey(
            id,
            nickname,
            avatar_url,
            is_highlighted,
            bio
          )
        `)
        .order("is_highlighted", { ascending: false })
        .order("start_date", { ascending: true });

      // Apply text search if present
      if (searchTerm && searchTerm.length >= 2) {
        tournamentQuery = tournamentQuery.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
      }

      // Apply entry fee filters
      if (filters?.entryFeeMin !== undefined) {
        tournamentQuery = tournamentQuery.gte("entry_fee", filters.entryFeeMin);
      }
      if (filters?.entryFeeMax !== undefined) {
        tournamentQuery = tournamentQuery.lte("entry_fee", filters.entryFeeMax);
      }

      // Apply date filters
      if (filters?.dateFrom) {
        tournamentQuery = tournamentQuery.gte("start_date", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        tournamentQuery = tournamentQuery.lte("start_date", filters.dateTo.toISOString());
      }

      tournamentQuery = tournamentQuery.limit(50);

      // Search users only if there's a search term
      const usersPromise = searchTerm && searchTerm.length >= 2
        ? supabase
            .from("public_profiles")
            .select("id, nickname, avatar_url, is_highlighted, bio")
            .ilike("nickname", `%${searchTerm}%`)
            .limit(10)
        : Promise.resolve({ data: [], error: null });

      const [tournamentsResult, usersResult] = await Promise.all([
        tournamentQuery,
        usersPromise,
      ]);

      if (tournamentsResult.error) throw tournamentsResult.error;
      if (usersResult.error) throw usersResult.error;

      let tournaments = tournamentsResult.data || [];

      // Apply prize filter client-side (since it's parsed from prize_description)
      if (filters?.prizeMin !== undefined || filters?.prizeMax !== undefined) {
        tournaments = tournaments.filter((t: any) => {
          const prizeValue = parsePrizeValue(t.prize_description);
          if (filters.prizeMin !== undefined && prizeValue < filters.prizeMin) return false;
          if (filters.prizeMax !== undefined && prizeValue > filters.prizeMax) return false;
          return true;
        });
      }

      // Also search by organizer nickname if there's a search term
      if (searchTerm && searchTerm.length >= 2) {
        const organizerTournamentsResult = await supabase
          .from("tournaments")
          .select(`
            *,
            organizer:profiles!tournaments_organizer_id_fkey(
              id,
              nickname,
              avatar_url,
              is_highlighted,
              bio
            )
          `)
          .order("is_highlighted", { ascending: false })
          .order("start_date", { ascending: true })
          .limit(50);

        let organizerTournaments = (organizerTournamentsResult.data || [])
          .filter((t: any) => 
            t.organizer?.nickname?.toLowerCase().includes(searchTerm)
          );

        // Apply same filters
        if (filters?.entryFeeMin !== undefined) {
          organizerTournaments = organizerTournaments.filter((t: any) => t.entry_fee >= filters.entryFeeMin!);
        }
        if (filters?.entryFeeMax !== undefined) {
          organizerTournaments = organizerTournaments.filter((t: any) => t.entry_fee <= filters.entryFeeMax!);
        }
        if (filters?.dateFrom) {
          organizerTournaments = organizerTournaments.filter((t: any) => new Date(t.start_date) >= filters.dateFrom!);
        }
        if (filters?.dateTo) {
          organizerTournaments = organizerTournaments.filter((t: any) => new Date(t.start_date) <= filters.dateTo!);
        }
        if (filters?.prizeMin !== undefined || filters?.prizeMax !== undefined) {
          organizerTournaments = organizerTournaments.filter((t: any) => {
            const prizeValue = parsePrizeValue(t.prize_description);
            if (filters.prizeMin !== undefined && prizeValue < filters.prizeMin) return false;
            if (filters.prizeMax !== undefined && prizeValue > filters.prizeMax) return false;
            return true;
          });
        }

        // Merge and deduplicate
        const allTournaments = [...tournaments, ...organizerTournaments];
        tournaments = Array.from(
          new Map(allTournaments.map((t) => [t.id, t])).values()
        );
      }

      return {
        tournaments: tournaments.slice(0, 20) as (Tournament & { organizer: Profile })[],
        users: (usersResult.data || []) as Profile[],
      };
    },
    enabled: (searchTerm.length >= 2) || !!(filters && (
      filters.prizeMin !== undefined ||
      filters.prizeMax !== undefined ||
      filters.entryFeeMin !== undefined ||
      filters.entryFeeMax !== undefined ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined
    )),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
