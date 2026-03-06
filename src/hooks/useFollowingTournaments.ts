import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { Tournament, Profile } from "@/types";

const STALE_TIME = 1000 * 60 * 2; // 2 minutes
const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

export const useFollowingTournaments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["following-tournaments", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      // 1. Get all users the current user is following
      const followQuery = query(
        collection(db, "followers"),
        where("follower_id", "==", user.uid)
      );
      const followSnapshot = await getDocs(followQuery);
      
      if (followSnapshot.empty) return [];

      const followingIds = followSnapshot.docs.map(docSnap => docSnap.data().following_id);

      // 2. Get tournaments from those organizers
      // Note: Firebase 'in' operator is limited to 10-30 values depending on version/config.
      // For a simple following feed, we'll fetch and filter if necessary, 
      // or just fetch from the first 10 for now as a reasonable limit for a "quick look" feed.
      const tournamentQuery = query(
        collection(db, "tournaments"),
        where("organizer_id", "in", followingIds.slice(0, 10)),
        where("status", "in", ["open", "upcoming", "in_progress"]),
        orderBy("start_date", "asc"),
        limit(20)
      );

      const tournamentSnapshot = await getDocs(tournamentQuery);
      
      const tournaments = await Promise.all(
        tournamentSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let organizer: Profile | undefined = undefined;
          
          if (data.organizer_id) {
            const orgDoc = await getDoc(doc(db, "profiles", data.organizer_id));
            if (orgDoc.exists()) {
              organizer = { id: orgDoc.id, ...orgDoc.data() } as Profile;
            }
          }

          return {
            id: docSnap.id,
            ...data,
            organizer,
          } as (Tournament & { organizer: Profile });
        })
      );

      return tournaments;
    },
    enabled: !!user?.uid,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};
