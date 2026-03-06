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
  updateDoc
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournament, MiniTournamentStatus, GameType, MiniTournamentFormat, PrizeDistributionConfig, Profile } from '@/types';
import { toast } from 'sonner';

interface CreateMiniTournamentData {
  title: string;
  description?: string;
  game: GameType;
  format: MiniTournamentFormat;
  max_participants: number;
  entry_fee_credits: number;
  prize_pool_brl: number;
  prize_distribution: PrizeDistributionConfig[];
  rules?: string;
  start_date: string;
  registration_deadline: string;
}

export function useMiniTournaments(filters?: { status?: MiniTournamentStatus; game?: GameType }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tournaments, isLoading, error } = useQuery({
    queryKey: ['mini-tournaments', filters],
    queryFn: async () => {
      let q = query(
        collection(db, 'mini_tournaments'),
        orderBy('created_at', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.game) {
        q = query(q, where('game', '==', filters.game));
      }

      const snapshot = await getDocs(q);
      
      const results = await Promise.all(
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
            prize_pool_brl: Number(data.prize_pool_brl),
            prize_distribution: data.prize_distribution as PrizeDistributionConfig[],
            organizer,
          } as MiniTournament;
        })
      );

      return results;
    },
  });

  const createTournament = useMutation({
    mutationFn: async (data: CreateMiniTournamentData) => {
      if (!user) throw new Error('Não autenticado');

      const docRef = await addDoc(collection(db, 'mini_tournaments'), {
        organizer_id: user.uid,
        title: data.title,
        description: data.description || null,
        game: data.game,
        format: data.format,
        max_participants: data.max_participants,
        entry_fee_credits: data.entry_fee_credits,
        prize_pool_brl: data.prize_pool_brl,
        prize_distribution: data.prize_distribution,
        rules: data.rules || null,
        start_date: data.start_date,
        registration_deadline: data.registration_deadline,
        status: 'draft',
        current_participants: 0,
        deposit_confirmed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const newDoc = await getDoc(docRef);
      return { id: docRef.id, ...newDoc.data() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournaments'] });
      toast.success('Mini torneio criado! Deposite a premiação para publicar.');
    },
    onError: (error) => {
      console.error('Error creating mini tournament:', error);
      toast.error('Erro ao criar mini torneio');
    },
  });

  const updateTournament = useMutation({
    mutationFn: async ({ id, status }: { id: string; status?: MiniTournamentStatus }) => {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      if (status) updateData.status = status;

      await updateDoc(doc(db, 'mini_tournaments', id), updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournaments'] });
    },
  });

  return {
    tournaments,
    isLoading,
    error,
    createTournament,
    updateTournament,
  };
}

export function useMiniTournament(id: string) {
  const { data: tournament, isLoading, error, refetch } = useQuery({
    queryKey: ['mini-tournament', id],
    queryFn: async () => {
      const docSnap = await getDoc(doc(db, 'mini_tournaments', id));
      if (!docSnap.exists()) throw new Error('Torneio não encontrado');
      
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
        prize_pool_brl: Number(data.prize_pool_brl),
        prize_distribution: data.prize_distribution as PrizeDistributionConfig[],
        organizer,
      } as MiniTournament;
    },
    enabled: !!id,
  });

  return { tournament, isLoading, error, refetch };
}

export function useMyMiniTournaments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-mini-tournaments', user?.uid],
    queryFn: async () => {
      if (!user) return [];

      const q = query(
        collection(db, 'mini_tournaments'),
        where('organizer_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          prize_pool_brl: Number(data.prize_pool_brl),
          prize_distribution: data.prize_distribution as PrizeDistributionConfig[],
        } as MiniTournament;
      });
    },
    enabled: !!user,
  });
}
