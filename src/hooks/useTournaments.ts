import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  updateDoc
} from 'firebase/firestore';
import { Tournament, GameType, Profile, TournamentParticipant } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Cache durations for performance optimization
const STALE_TIME = 1000 * 60 * 2; // 2 minutes - data considered fresh
const CACHE_TIME = 1000 * 60 * 10; // 10 minutes - keep in cache

export function useTournaments(game?: GameType) {
  return useQuery({
    queryKey: ['tournaments', game],
    queryFn: async () => {
      // No orderBy/where combo — avoids composite index requirement
      // Fetch all, filter and sort client-side
      const q = query(
        collection(db, 'tournaments'),
      );
      
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

      // Client-side game filter
      const filtered = game && (game as string) !== 'all'
        ? tournaments.filter(t => t.game === game)
        : tournaments;
      
      // Sort: highlighted first, then by start_date asc (missing date goes last)
      return filtered.sort((a, b) => {
        if (a.is_highlighted && !b.is_highlighted) return -1;
        if (!a.is_highlighted && b.is_highlighted) return 1;
        const da = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        const db2 = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db2;
      });
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const docSnap = await getDoc(doc(db, 'tournaments', id));
      if (!docSnap.exists()) return null;
      
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
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'current_participants' | 'organizer'>) => {
      const docRef = await addDoc(collection(db, 'tournaments'), {
        ...tournament,
        current_participants: 0,
        is_highlighted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      const newDoc = await getDoc(docRef);
      return { id: docRef.id, ...newDoc.data() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({ title: 'Torneio criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar torneio', description: error.message, variant: 'destructive' });
    },
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tournamentId, playerId }: { tournamentId: string; playerId: string }) => {
      const participantRef = await addDoc(collection(db, 'tournament_participants'), {
        tournament_id: tournamentId,
        player_id: playerId,
        score: 0,
        registered_at: new Date().toISOString(),
      });

      // Update participant count in the tournament document
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        current_participants: increment(1)
      });
      
      return { id: participantRef.id };
    },
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['participants', tournamentId] });
      toast({ title: 'Inscrição realizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro na inscrição', description: error.message, variant: 'destructive' });
    },
  });
}

export function useTournamentParticipants(tournamentId: string) {
  return useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: async () => {
      const q = query(
        collection(db, 'tournament_participants'),
        where('tournament_id', '==', tournamentId)
      );
      
      const snapshot = await getDocs(q);
      const participants = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let player: Profile | undefined = undefined;
          
          if (data.player_id) {
            const playerDoc = await getDoc(doc(db, 'profiles', data.player_id));
            if (playerDoc.exists()) {
              player = { id: playerDoc.id, ...playerDoc.data() } as Profile;
            }
          }

          return {
            id: docSnap.id,
            ...data,
            player,
          } as TournamentParticipant;
        })
      );
      
      return participants;
    },
    enabled: !!tournamentId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      await deleteDoc(doc(db, 'tournaments', tournamentId));
      return tournamentId;
    },
    onSuccess: (tournamentId) => {
      // Immediately remove stale data so the page doesn't flash on navigate
      queryClient.removeQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({ title: 'Torneio removido com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover torneio', description: error.message, variant: 'destructive' });
    },
  });
}
