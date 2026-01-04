import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes for follower data
const CACHE_TIME = 1000 * 60 * 15; // 15 minutes

export const useFollowers = (userId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is following this user
  const { data: isFollowing, isLoading: isCheckingFollow } = useQuery({
    queryKey: ["is-following", user?.id, userId],
    queryFn: async () => {
      if (!user?.id || !userId || user.id === userId) return false;
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!userId && user.id !== userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Get follower count
  const { data: followerCount } = useQuery({
    queryKey: ["follower-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Get following count
  const { data: followingCount } = useQuery({
    queryKey: ["following-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !userId) throw new Error("Missing user IDs");
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: user.id, following_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      toast.success("Você está seguindo este organizador!");
    },
    onError: () => {
      toast.error("Erro ao seguir");
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !userId) throw new Error("Missing user IDs");
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      toast.success("Você deixou de seguir");
    },
    onError: () => {
      toast.error("Erro ao deixar de seguir");
    },
  });

  const toggleFollow = () => {
    if (!user) {
      toast.error("Faça login para seguir");
      return;
    }
    if (user.id === userId) {
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    isCheckingFollow,
    followerCount,
    followingCount,
    toggleFollow,
    isToggling: followMutation.isPending || unfollowMutation.isPending,
  };
};
