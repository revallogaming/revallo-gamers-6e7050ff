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
  updateDoc,
  limit
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MatchDuel, MatchDuelStatus, GameType, Profile } from '@/types';
import { toast } from 'sonner';

export function useDuels(filters?: { status?: MatchDuelStatus; game?: GameType }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: duels, isLoading, error } = useQuery({
    queryKey: ['duels', filters],
    queryFn: async () => {
      let q = query(
        collection(db, 'matches'),
        where('tournament_type', '==', 'duel'),
        orderBy('created_at', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.game) {
        q = query(q, where('game', '==', filters.game));
      }

      const snapshot = await getDocs(q);
      
      let rawDuels = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as any[];

      // PREPEND PREMIUM DUELS
      const DEFAULTS = [
        {
          id: 'premium-duel-4v4-1',
          title: "DESAFIO 4V4 APOSTADO",
          game: "freefire",
          mode: "4v4",
          entry_fee_brl: 40.00,
          prize_pool_brl: 300.00,
          platform_fee_brl: 20.00,
          format: "BO3",
          map: "Bermuda",
          status: "open",
          created_at: new Date().toISOString(),
          creator_id: 'system',
          tournament_type: 'duel'
        },
        {
          id: 'premium-duel-1v1-1',
          title: "X1 DOS CRIA - APOSTADO",
          game: "freefire",
          mode: "1v1",
          entry_fee_brl: 20.00,
          prize_pool_brl: 36.00,
          platform_fee_brl: 4.00,
          format: "BO1",
          map: "Bermuda",
          status: "open",
          created_at: new Date().toISOString(),
          creator_id: 'system',
          tournament_type: 'duel'
        }
      ];

      rawDuels = [...DEFAULTS, ...rawDuels];

      // 1. Collect unique creator IDs
      const creatorIds = Array.from(new Set(
        rawDuels
          .map(d => d.creator_id)
          .filter((id): id is string => !!id && id !== 'system')
      ));

      // 2. Fetch profiles in bulk
      const profileMap = new Map<string, Profile>();
      if (creatorIds.length > 0) {
        const chunks = [];
        for (let i = 0; i < creatorIds.length; i += 30) {
          chunks.push(creatorIds.slice(i, i + 30));
        }

        await Promise.all(chunks.map(async (chunk) => {
          const pq = query(collection(db, 'profiles'), where('id', 'in', chunk));
          const pSnap = await getDocs(pq);
          pSnap.docs.forEach(d => profileMap.set(d.id, { id: d.id, ...d.data() } as Profile));
        }));
      }

      // 3. Map with profiles and conversions
      return rawDuels.map((d: any) => {
        const fee = Number(d.entry_fee_brl || (d.entry_fee ? d.entry_fee / 100 : 0));
        const finalFee = fee > 0 ? fee : 20.00; // Force 20.00 if zero

        return {
          ...d,
          entry_fee_brl: finalFee,
          prize_pool_brl: Number(d.prize_pool_brl || (d.prize_pool_total ? d.prize_pool_total / 100 : 0)) || (finalFee * 1.8),
          creator: d.creator_id === 'system' ? {
            id: 'system',
            nickname: 'Revallo Bot',
            avatar_url: '/avatars/avatar_ninja.png',
            is_highlighted: true
          } : (d.creator_id ? profileMap.get(d.creator_id) : undefined),
        };
      }) as MatchDuel[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const createDuel = useMutation({
    mutationFn: async (data: Omit<MatchDuel, 'id' | 'creator_id' | 'created_at' | 'updated_at' | 'status' | 'platform_fee_brl' | 'prize_pool_brl' | 'teamA_id'>) => {
      if (!user) throw new Error('Não autenticado');

      const playersCount = data.mode === '4v4' ? 8 : (data.mode === '2v2' ? 4 : 2);
      const totalPool = data.entry_fee_brl * playersCount;
      const platform_fee_brl = totalPool * 0.15;
      const prize_pool_brl = totalPool - platform_fee_brl;

      const docRef = await addDoc(collection(db, 'matches'), {
        ...data,
        tournament_type: 'duel',
        creator_id: user.uid,
        teamA_id: user.uid, // Simplified for now: creator's team
        status: 'open',
        platform_fee_brl,
        prize_pool_brl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { id: docRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      toast.success('Duelo criado com sucesso!');
    },
    onError: (err) => {
      console.error('Error creating duel:', err);
      toast.error('Erro ao criar duelo');
    }
  });

  const acceptDuel = useMutation({
    mutationFn: async (duelId: string) => {
      if (!user) throw new Error('Não autenticado');

      await updateDoc(doc(db, 'matches', duelId), {
        teamB_id: user.uid,
        status: 'matched',
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      toast.success('Duelo aceito!');
    },
    onError: (err) => {
      console.error('Error accepting duel:', err);
      toast.error('Erro ao aceitar duelo');
    }
  });

  return { duels, isLoading, error, createDuel, acceptDuel };
}

export function useRecentWinners() {
  return useQuery({
    queryKey: ['recent-winners'],
    queryFn: async () => {
      const q = query(
        collection(db, 'payouts'),
        where('status', '==', 'paid'),
        orderBy('created_at', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
