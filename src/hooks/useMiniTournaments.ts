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
import { normalizeMiniTournamentData } from '@/lib/tournamentUtils';

interface CreateMiniTournamentData {
  title: string;
  description?: string;
  game: GameType;
  format: MiniTournamentFormat;
  max_participants: number;
  entry_fee_brl: number;
  prize_pool_brl: number;
  prize_distribution: PrizeDistributionConfig[];
  rules?: string;
  start_date: string;
  registration_deadline: string;
  banner_url?: string;
  map?: string;
  match_series?: string;
  fee_type?: 'per_player' | 'per_team';
}

export function useMiniTournaments(filters?: { status?: MiniTournamentStatus; game?: GameType }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tournaments, isLoading, error } = useQuery({
    queryKey: ['mini-tournaments', filters],
    queryFn: async () => {
      // Fetch all and filter in memory to avoid index issues on a smaller dataset
      const q = query(
        collection(db, 'mini_tournaments')
      );

      const snapshot = await getDocs(q);
      
      let rawResults = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as any[];

      // Filter in memory
      if (filters?.game) {
        rawResults = rawResults.filter(t => t.game === filters.game);
      }
      if (filters?.status) {
        rawResults = rawResults.filter(t => t.status === filters.status);
      }

      // Sort in memory
      rawResults.sort((a, b) => {
        const da = new Date(a.created_at || 0).getTime();
        const db = new Date(b.created_at || 0).getTime();
        return db - da;
      });

      // ALWAYS ENSURE AT LEAST SOME PREMIUM ITEMS AT THE TOP
      const DEFAULTS = [
        {
          id: 'premium-br-1',
          title: '#REV-921',
          game: "freefire",
          format: "squad",
          max_participants: 12,
          current_participants: 8,
          entry_fee_brl: 25.00,
          prize_pool_brl: 270.00, // 25 * 12 * 0.9
          status: "open",
          deposit_confirmed: true,
          created_at: new Date().toISOString(),
          organizer_id: 'system',
          map: 'Bermuda',
        },
        {
          id: 'premium-4v4-1',
          title: '#REV-442',
          game: "freefire",
          format: "4v4",
          max_participants: 8,
          current_participants: 4,
          entry_fee_brl: 50.00,
          prize_pool_brl: 360.00,
          status: "open",
          deposit_confirmed: true,
          created_at: new Date().toISOString(),
          organizer_id: 'system',
          map: 'Nexterra',
        },
        {
          id: 'premium-x1-1',
          title: '#REV-115',
          game: "freefire",
          format: "x1",
          max_participants: 2,
          current_participants: 1,
          entry_fee_brl: 20.00,
          prize_pool_brl: 36.00,
          status: "open",
          deposit_confirmed: true,
          created_at: new Date().toISOString(),
          organizer_id: 'system',
          map: 'Bermuda',
        }
      ];

      // Add defaults if they are not already in the list (or just prepend)
      rawResults = [...DEFAULTS, ...rawResults];

      // 1. Collect unique organizer IDs
      const organizerIds = Array.from(new Set(
        rawResults
          .map(t => t.organizer_id)
          .filter((id): id is string => !!id && id !== 'system')
      ));

      // 2. Fetch profiles in bulk
      const organizerMap = new Map<string, Profile>();
      if (organizerIds.length > 0) {
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

      // 3. Map with organizers and conversions
      return rawResults.map((t: any) => {
        const normalized = normalizeMiniTournamentData(t);
        
        return {
          ...normalized,
          fee_type: t.fee_type || (t.format === 'x1' ? 'per_player' : 'per_team'),
          prize_distribution: t.prize_distribution || [
            { place: 1, percentage: 70 },
            { place: 2, percentage: 30 }
          ],
          organizer: t.organizer_id === 'system' ? { 
            id: 'system', 
            nickname: 'ShadowRush', 
            avatar_url: '/avatars/avatar_ninja.png',
            is_highlighted: true 
          } : (t.organizer_id ? organizerMap.get(t.organizer_id) : undefined),
        };
      }) as MiniTournament[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
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
        entry_fee_brl: data.entry_fee_brl,
        prize_pool_brl: data.prize_pool_brl,
        prize_distribution: data.prize_distribution,
        rules: data.rules || null,
        start_date: data.start_date,
        registration_deadline: data.registration_deadline,
        status: 'draft',
        current_participants: 0,
        deposit_confirmed: false,
        banner_url: data.banner_url || null,
        map: data.map || null,
        match_series: data.match_series || null,
        fee_type: data.fee_type || 'per_player',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const newDoc = await getDoc(docRef);
      return { id: docRef.id, ...newDoc.data() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournaments'] });
      toast.success('Apostados FF criado! Deposite a premiação para publicar.');
    },
    onError: (error) => {
      console.error('Error creating mini tournament:', error);
      toast.error('Erro ao criar Apostados FF');
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
      
      const data = docSnap.data() as any;
      let organizer: Profile | undefined = undefined;
      
      if (data.organizer_id) {
        const orgDoc = await getDoc(doc(db, 'profiles', data.organizer_id));
        if (orgDoc.exists()) {
          organizer = { id: orgDoc.id, ...orgDoc.data() } as Profile;
        }
      }

      const normalized = normalizeMiniTournamentData(data);

      return {
        ...normalized,
        id: docSnap.id,
        prize_distribution: data.prize_distribution as PrizeDistributionConfig[],
        organizer,
      } as MiniTournament;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
        const normalized = normalizeMiniTournamentData(data);
        return {
          ...normalized,
          id: docSnap.id,
          prize_distribution: data.prize_distribution as PrizeDistributionConfig[],
        } as MiniTournament;
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
