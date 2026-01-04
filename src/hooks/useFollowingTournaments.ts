import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tournament } from "@/types";

const STALE_TIME = 1000 * 60 * 2; // 2 minutes
const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

export const useFollowingTournaments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["following-tournaments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get all users the current user is following
      const { data: following, error: followError } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followError) throw followError;
      if (!following || following.length === 0) return [];

      const followingIds = following.map((f) => f.following_id);

      // Then get tournaments from those organizers
      const { data: tournaments, error: tournamentError } = await supabase
        .from("tournaments")
        .select(`
          *,
          organizer:profiles!tournaments_organizer_id_fkey(
            id,
            nickname,
            avatar_url,
            is_highlighted
          )
        `)
        .in("organizer_id", followingIds)
        .in("status", ["open", "upcoming", "in_progress"])
        .order("start_date", { ascending: true })
        .limit(20);

      if (tournamentError) throw tournamentError;
      return tournaments as (Tournament & { organizer: { id: string; nickname: string; avatar_url: string | null; is_highlighted: boolean } })[];
    },
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};
