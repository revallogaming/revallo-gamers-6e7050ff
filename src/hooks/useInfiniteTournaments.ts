import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  limit, 
  getDocs, 
  getDoc,
  doc,
} from 'firebase/firestore';
import { Tournament, GameType, Profile } from '@/types';

export interface TournamentFilters {
  game?: GameType | 'all';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  prizeMin?: number;
  prizeMax?: number;
}

// Fetch ALL tournaments once, cache them, then paginate client-side.
// This avoids composite index requirements and missing-field exclusions from orderBy.
const PAGE_SIZE = 24;
const STALE_TIME = 1000 * 60 * 2;
const CACHE_TIME = 1000 * 60 * 10;

async function fetchAllTournaments(): Promise<Tournament[]> {
  // Fetch in batches of 500 (Firestore max per getDocs) if needed
  const q = query(collection(db, 'tournaments'), limit(500));
  const snapshot = await getDocs(q);

  const tournaments = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let organizer: Profile | undefined = undefined;

      if (data.organizer_id) {
        const orgDoc = await getDoc(doc(db, 'profiles', data.organizer_id));
        if (orgDoc.exists()) {
          organizer = { id: orgDoc.id, ...orgDoc.data() } as Profile;
        }
      }

      return {
        id: docSnap.id,
        ...data,
        organizer,
      } as Tournament;
    })
  );

  // Sort: highlighted first, then by start_date ascending (missing date goes last)
  return tournaments.sort((a, b) => {
    if (a.is_highlighted && !b.is_highlighted) return -1;
    if (!a.is_highlighted && b.is_highlighted) return 1;
    const da = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
    const db2 = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
    return da - db2;
  });
}

export function useInfiniteTournaments(filters: TournamentFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['tournaments-infinite', filters],
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      // Fetch all tournaments (cached by React Query)
      const all = await fetchAllTournaments();

      // Apply all filters client-side
      let filtered = all;

      if (filters.game && (filters.game as string) !== 'all') {
        filtered = filtered.filter(t => t.game === filters.game);
      }

      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase().trim();
        filtered = filtered.filter(t =>
          t.title?.toLowerCase().includes(s)
        );
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(t =>
          t.start_date && new Date(t.start_date) >= filters.dateFrom!
        );
      }

      if (filters.dateTo) {
        filtered = filtered.filter(t =>
          t.start_date && new Date(t.start_date) <= filters.dateTo!
        );
      }

      // Client-side pagination
      const start = pageParam * PAGE_SIZE;
      const page = filtered.slice(start, start + PAGE_SIZE);
      const hasMore = start + PAGE_SIZE < filtered.length;

      return {
        tournaments: page,
        nextPage: hasMore ? pageParam + 1 : undefined,
        totalCount: filtered.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
