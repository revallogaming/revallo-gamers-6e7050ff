import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournament, MiniTournamentStatus, GameType, MiniTournamentFormat, PrizeDistributionConfig } from '@/types';
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
      let query = supabase
        .from('mini_tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.game) {
        query = query.eq('game', filters.game);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch organizers separately
      const organizerIds = [...new Set(data.map(t => t.organizer_id))];
      const { data: organizers } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, is_highlighted')
        .in('id', organizerIds);

      const organizerMap = new Map(organizers?.map(o => [o.id, o]) || []);

      return data.map(t => ({
        ...t,
        prize_pool_brl: Number(t.prize_pool_brl),
        prize_distribution: t.prize_distribution as unknown as PrizeDistributionConfig[],
        organizer: organizerMap.get(t.organizer_id),
      })) as MiniTournament[];
    },
  });

  const createTournament = useMutation({
    mutationFn: async (data: CreateMiniTournamentData) => {
      if (!user) throw new Error('Não autenticado');

      const insertData = {
        organizer_id: user.id,
        title: data.title,
        description: data.description || null,
        game: data.game,
        format: data.format,
        max_participants: data.max_participants,
        entry_fee_credits: data.entry_fee_credits,
        prize_pool_brl: data.prize_pool_brl,
        prize_distribution: JSON.stringify(data.prize_distribution),
        rules: data.rules || null,
        start_date: data.start_date,
        registration_deadline: data.registration_deadline,
        status: 'draft' as const,
      };

      const { data: tournament, error } = await supabase
        .from('mini_tournaments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return tournament;
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
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;

      const { error } = await supabase
        .from('mini_tournaments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('mini_tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch organizer
      const { data: organizer } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, is_highlighted')
        .eq('id', data.organizer_id)
        .single();

      return {
        ...data,
        prize_pool_brl: Number(data.prize_pool_brl),
        prize_distribution: data.prize_distribution as unknown as PrizeDistributionConfig[],
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
    queryKey: ['my-mini-tournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('mini_tournaments')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(t => ({
        ...t,
        prize_pool_brl: Number(t.prize_pool_brl),
        prize_distribution: t.prize_distribution as unknown as PrizeDistributionConfig[],
      })) as MiniTournament[];
    },
    enabled: !!user,
  });
}
