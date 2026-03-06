import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  limit, 
  orderBy,
  QueryConstraint
} from "firebase/firestore";
import { Tournament, Profile } from "@/types";

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

export const useSearch = (queryStr: string, filters?: SearchFilters) => {
  const searchTerm = queryStr.trim().toLowerCase();
  const hasFilters = !!(filters && (
    filters.prizeMin !== undefined ||
    filters.prizeMax !== undefined ||
    filters.entryFeeMin !== undefined ||
    filters.entryFeeMax !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined
  ));

  return useQuery({
    queryKey: ["search", searchTerm, filters],
    queryFn: async (): Promise<SearchResults> => {
      // If no search term and no filters, return empty
      if ((!searchTerm || searchTerm.length < 2) && !hasFilters) {
        return { tournaments: [], users: [] };
      }

      // 1. Search Tournaments
      const tourneyConstraints: QueryConstraint[] = [
        orderBy("is_highlighted", "desc"),
        orderBy("start_date", "asc"),
        limit(50)
      ];

      // Note: Complex filtering in Firebase usually requires indexes.
      // We'll do base query and filter more precisely client-side if needed
      if (filters?.entryFeeMin !== undefined) {
        tourneyConstraints.push(where("entry_fee", ">=", filters.entryFeeMin));
      }

      const tourneyQuery = query(collection(db, "tournaments"), ...tourneyConstraints);
      const tourneySnapshot = await getDocs(tourneyQuery);
      
      let tournaments = await Promise.all(
        tourneySnapshot.docs.map(async (docSnap) => {
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
            organizer
          } as (Tournament & { organizer: Profile });
        })
      );

      // Client-side filtering for text and other filters to avoid index hell
      if (searchTerm && searchTerm.length >= 2) {
        tournaments = tournaments.filter(t => 
          t.title.toLowerCase().includes(searchTerm) || 
          t.description?.toLowerCase().includes(searchTerm) ||
          t.organizer?.nickname?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.entryFeeMax !== undefined) {
        tournaments = tournaments.filter(t => t.entry_fee <= filters.entryFeeMax!);
      }

      if (filters?.dateFrom) {
        tournaments = tournaments.filter(t => new Date(t.start_date) >= filters.dateFrom!);
      }
      if (filters?.dateTo) {
        tournaments = tournaments.filter(t => new Date(t.start_date) <= filters.dateTo!);
      }

      if (filters?.prizeMin !== undefined || filters?.prizeMax !== undefined) {
        tournaments = tournaments.filter(t => {
          const prizeValue = parsePrizeValue(t.prize_description || "");
          if (filters.prizeMin !== undefined && prizeValue < filters.prizeMin) return false;
          if (filters.prizeMax !== undefined && prizeValue > filters.prizeMax) return false;
          return true;
        });
      }

      // 2. Search Users
      let users: Profile[] = [];
      if (searchTerm && searchTerm.length >= 2) {
        // Simple prefix search for nickname (Firebase Limitation: no native case-insensitive ilike)
        // We'll fetch a batch and filter client-side for better UX if needed
        const userQuery = query(collection(db, "profiles"), limit(100)); // Reasonable limit
        const userSnapshot = await getDocs(userQuery);
        
        users = userSnapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Profile))
          .filter(u => u.nickname?.toLowerCase().includes(searchTerm))
          .slice(0, 10);
      }

      return {
        tournaments: tournaments.slice(0, 20),
        users,
      };
    },
    enabled: (searchTerm.length >= 2) || hasFilters,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
