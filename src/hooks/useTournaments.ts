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
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { Tournament, GameType, Profile, TournamentParticipant } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { normalizeTournamentData } from '@/lib/tournamentUtils';

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
      
      // Collect unique organizer IDs for bulk fetching
      const organizerIds = Array.from(new Set(
        snapshot.docs
          .map(doc => doc.data().organizer_id)
          .filter(id => !!id)
      ));

      // Fetch profiles in bulk
      const organizerMap = new Map<string, Profile>();
      if (organizerIds.length > 0) {
        // Chunk to 10 IDs (Firestore limit)
        for (let i = 0; i < organizerIds.length; i += 10) {
          const chunk = organizerIds.slice(i, i + 10);
          const profilesSnap = await getDocs(query(collection(db, 'profiles'), where('id', 'in', chunk)));
          profilesSnap.docs.forEach(doc => {
            organizerMap.set(doc.id, { id: doc.id, ...doc.data() } as Profile);
          });
        }
      }

      const tournaments = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const normalized = normalizeTournamentData(data);
        return {
          ...normalized,
          id: docSnap.id,
          organizer: organizerMap.get(data.organizer_id) || null,
        } as Tournament;
      });

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
      
      const data = docSnap.data() as any;
      let organizer: Profile | undefined = undefined;
      
      if (data.organizer_id) {
        const orgDoc = await getDoc(doc(db, 'profiles', data.organizer_id));
        if (orgDoc.exists()) {
          organizer = { id: orgDoc.id, ...orgDoc.data() } as Profile;
        }
      }

      const normalized = normalizeTournamentData(data);

      return {
        ...normalized,
        id: docSnap.id,
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
      const tRef = doc(db, 'tournaments', tournamentId);
      const tDoc = await getDoc(tRef);
      if (!tDoc.exists()) throw new Error('Torneio não encontrado');
      const tData = tDoc.data() as Tournament;
      
      if (tData.current_participants >= tData.max_participants) {
        throw new Error('Torneio lotado!');
      }

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
      
      // Collect unique player IDs for bulk fetching
      const playerIds = Array.from(new Set(
        snapshot.docs
          .map(doc => doc.data().player_id)
          .filter(id => !!id)
      ));

      // Fetch profiles in bulk
      const playerMap = new Map<string, Profile>();
      if (playerIds.length > 0) {
        for (let i = 0; i < playerIds.length; i += 10) {
          const chunk = playerIds.slice(i, i + 10);
          const profilesSnap = await getDocs(query(collection(db, 'profiles'), where('id', 'in', chunk)));
          profilesSnap.docs.forEach(doc => {
            playerMap.set(doc.id, { id: doc.id, ...doc.data() } as Profile);
          });
        }
      }

      const participants = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          player: playerMap.get(data.player_id) || null,
        } as TournamentParticipant;
      });
      
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
      const batch = writeBatch(db);

      // Delete participants
      const pQuery = query(collection(db, 'tournament_participants'), where('tournament_id', '==', tournamentId));
      const pSnap = await getDocs(pQuery);
      pSnap.docs.forEach(d => batch.delete(d.ref));
      
      // Delete matches
      const mQuery = query(collection(db, 'matches'), where('tournament_id', '==', tournamentId));
      const mSnap = await getDocs(mQuery);
      mSnap.docs.forEach(d => batch.delete(d.ref));

      // Delete tournament
      batch.delete(doc(db, 'tournaments', tournamentId));
      
      await batch.commit();
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
