import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where,
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
  const q = query(collection(db, 'tournaments'), limit(500));
  const snapshot = await getDocs(q);

  const rawTournaments = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Tournament[];

  // 1. Collect all unique organizer IDs
  const organizerIds = Array.from(new Set(
    rawTournaments
      .map(t => t.organizer_id)
      .filter((id): id is string => !!id)
  ));

  // 2. Fetch profiles in bulk (max 30 per 'in' query in Firestore, but usually less here)
  const organizerMap = new Map<string, Profile>();
  if (organizerIds.length > 0) {
    // Firestore 'in' limit is 30. If more, we'd need to chunk.
    const chunks = [];
    for (let i = 0; i < organizerIds.length; i += 30) {
      chunks.push(organizerIds.slice(i, i + 30));
    }

    await Promise.all(chunks.map(async (chunk) => {
      const pq = query(collection(db, 'profiles'), where('id', 'in', chunk));
      const pSnap = await getDocs(pq);
      pSnap.docs.forEach(d => organizerMap.set(d.id, { id: d.id, ...d.data() } as Profile));
    }));
  }

  // 3. Attach organizers to tournaments
  // 3. Attach organizers and conversions
  const tournaments = rawTournaments.map((t: any) => ({
    ...t,
    entry_fee_brl: t.entry_fee_brl || t.entry_fee || 10.00,
    prize_amount_brl: t.prize_amount_brl || t.prize_pool_brl || t.prize_amount || 120.00,
    fee_type: t.fee_type || (t.format === 'x1' ? 'per_player' : 'per_team'),
    organizer: t.organizer_id ? organizerMap.get(t.organizer_id) : undefined,
  })) as Tournament[];

  // Filter out entries that look like mini-tournaments (no tournament type field + mini format)
  const MINI_FORMATS = new Set(['x1', 'duo', 'trio', 'squad', '4v4']);
  const filtered = tournaments.filter(t => {
    if (MINI_FORMATS.has((t as any).format) && !(t as any).type) return false;
    return true;
  });

  // Sort: highlighted first, then by start_date ascending (missing date goes last)
  return filtered.sort((a, b) => {
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

      const gameFilter = filters.game && (filters.game as string) !== 'all' ? filters.game : 'freefire';
      filtered = filtered.filter(t => t.game === gameFilter);

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
