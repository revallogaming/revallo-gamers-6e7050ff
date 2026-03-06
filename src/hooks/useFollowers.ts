import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  deleteDoc, 
  doc, 
  getCountFromServer 
} from "firebase/firestore";
import { Tournament, GameType, Profile, TournamentParticipant } from '@/types';
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 15; // 15 minutes

export const useFollowers = (userId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is following this user
  const { data: isFollowing, isLoading: isCheckingFollow } = useQuery({
    queryKey: ["is-following", user?.uid, userId],
    queryFn: async () => {
      if (!user?.uid || !userId || user.uid === userId) return false;
      const q = query(
        collection(db, "followers"),
        where("follower_id", "==", user.uid),
        where("following_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    },
    enabled: !!user?.uid && !!userId && user.uid !== userId,
    staleTime: STALE_TIME,
  });

  // Get follower count
  const { data: followerCount } = useQuery({
    queryKey: ["follower-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const q = query(
        collection(db, "followers"),
        where("following_id", "==", userId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
  });

  // Get following count
  const { data: followingCount } = useQuery({
    queryKey: ["following-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const q = query(
        collection(db, "followers"),
        where("follower_id", "==", userId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid || !userId) throw new Error("Missing user IDs");
      await addDoc(collection(db, "followers"), {
        follower_id: user.uid,
        following_id: userId,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", user?.uid, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      toast.success("Você está seguindo este player!");
    },
    onError: () => {
      toast.error("Erro ao seguir");
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid || !userId) throw new Error("Missing user IDs");
      const q = query(
        collection(db, "followers"),
        where("follower_id", "==", user.uid),
        where("following_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "followers", d.id)));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", user?.uid, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      toast.success("Você deixou de seguir");
    },
    onError: (error) => {
        console.error("Unfollow error:", error);
      toast.error("Erro ao deixar de seguir");
    },
  });

  const toggleFollow = () => {
    if (!user) {
      toast.error("Faça login para seguir");
      return;
    }
    if (user.uid === userId) {
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

export const useFollowerProfiles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["follower-profiles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "followers"),
        where("following_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      
      const profiles = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const profileDoc = await getDoc(doc(db, "profiles", data.follower_id));
          if (profileDoc.exists()) {
            return { id: profileDoc.id, ...profileDoc.data() } as Profile;
          }
          return null;
        })
      );
      
      return profiles.filter(Boolean) as Profile[];
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
  });
};
