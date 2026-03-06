import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  runTransaction
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentParticipant, Profile } from '@/types';
import { toast } from 'sonner';

export function useMiniTournamentParticipants(tournamentId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: participants, isLoading, error } = useQuery({
    queryKey: ['mini-tournament-participants', tournamentId],
    queryFn: async () => {
      const q = query(
        collection(db, 'mini_tournament_participants'),
        where('tournament_id', '==', tournamentId),
        orderBy('registered_at', 'asc')
      );

      const snapshot = await getDocs(q);
      
      const results = await Promise.all(
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
            prize_amount_brl: data.prize_amount_brl ? Number(data.prize_amount_brl) : null,
            player,
          } as MiniTournamentParticipant;
        })
      );

      return results;
    },
    enabled: !!tournamentId,
  });

  const { data: isParticipant } = useQuery({
    queryKey: ['mini-tournament-is-participant', tournamentId, user?.uid],
    queryFn: async () => {
      if (!user) return false;

      const q = query(
        collection(db, 'mini_tournament_participants'),
        where('tournament_id', '==', tournamentId),
        where('player_id', '==', user.uid),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    },
    enabled: !!tournamentId && !!user,
  });

  const joinTournament = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');

      // Use a transaction to ensure atomic join and count update
      await runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, 'mini_tournaments', tournamentId);
        const tournamentDoc = await transaction.get(tournamentRef);
        
        if (!tournamentDoc.exists()) {
          throw new Error('Torneio não encontrado');
        }

        const data = tournamentDoc.data();
        if (data.current_participants >= data.max_participants) {
          throw new Error('Torneio lotado');
        }

        if (data.status !== 'open') {
          throw new Error('Inscrições fechadas para este torneio');
        }

        // Check if already participant
        const participantQuery = query(
          collection(db, 'mini_tournament_participants'),
          where('tournament_id', '==', tournamentId),
          where('player_id', '==', user.uid),
          limit(1)
        );
        const participantSnap = await getDocs(participantQuery);
        if (!participantSnap.empty) {
          throw new Error('Você já está inscrito neste torneio');
        }

        // Logic for credits check would go here if needed
        // For now, simple join
        const newParticipantRef = doc(collection(db, 'mini_tournament_participants'));
        transaction.set(newParticipantRef, {
          tournament_id: tournamentId,
          player_id: user.uid,
          registered_at: new Date().toISOString(),
          score: 0
        });

        transaction.update(tournamentRef, {
          current_participants: (data.current_participants || 0) + 1
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-is-participant', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['user_credits'] });
      toast.success('Inscrição realizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const leaveTournament = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');

      await runTransaction(db, async (transaction) => {
        const participantQuery = query(
          collection(db, 'mini_tournament_participants'),
          where('tournament_id', '==', tournamentId),
          where('player_id', '==', user.uid),
          limit(1)
        );
        const participantSnap = await getDocs(participantQuery);
        
        if (participantSnap.empty) {
          throw new Error('Inscrição não encontrada');
        }

        const participantDoc = participantSnap.docs[0];
        transaction.delete(doc(db, 'mini_tournament_participants', participantDoc.id));

        const tournamentRef = doc(db, 'mini_tournaments', tournamentId);
        const tournamentDoc = await transaction.get(tournamentRef);
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data();
          transaction.update(tournamentRef, {
            current_participants: Math.max(0, (data.current_participants || 1) - 1)
          });
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-is-participant', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament', tournamentId] });
      toast.success('Você saiu do torneio');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao sair do torneio');
    },
  });

  return {
    participants,
    isLoading,
    error,
    isParticipant,
    joinTournament,
    leaveTournament,
  };
}
