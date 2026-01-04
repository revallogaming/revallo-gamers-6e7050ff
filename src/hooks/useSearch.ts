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

export const useSearch = (query: string) => {
  const searchTerm = query.trim().toLowerCase();
  
  return useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async (): Promise<SearchResults> => {
      if (!searchTerm || searchTerm.length < 2) {
        return { tournaments: [], users: [] };
      }

      // Search tournaments and users in parallel
      const [tournamentsResult, usersResult] = await Promise.all([
        supabase
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
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order("is_highlighted", { ascending: false })
          .order("start_date", { ascending: true })
          .limit(20),
        supabase
          .from("public_profiles")
          .select("id, nickname, avatar_url, is_highlighted, bio")
          .ilike("nickname", `%${searchTerm}%`)
          .limit(10),
      ]);

      if (tournamentsResult.error) throw tournamentsResult.error;
      if (usersResult.error) throw usersResult.error;

      // Also search tournaments by organizer nickname
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

      const organizerTournaments = (organizerTournamentsResult.data || [])
        .filter((t: any) => 
          t.organizer?.nickname?.toLowerCase().includes(searchTerm)
        )
        .slice(0, 20);

      // Merge and deduplicate tournaments
      const allTournaments = [...(tournamentsResult.data || []), ...organizerTournaments];
      const uniqueTournaments = Array.from(
        new Map(allTournaments.map((t) => [t.id, t])).values()
      );

      return {
        tournaments: uniqueTournaments as (Tournament & { organizer: Profile })[],
        users: (usersResult.data || []) as Profile[],
      };
    },
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
