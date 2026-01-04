import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tournament, GameType } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Cache durations for performance optimization
const STALE_TIME = 1000 * 60 * 2; // 2 minutes - data considered fresh
const CACHE_TIME = 1000 * 60 * 10; // 10 minutes - keep in cache

export function useTournaments(game?: GameType) {
  return useQuery({
    queryKey: ['tournaments', game],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select('*, organizer:profiles(id, nickname, avatar_url, is_highlighted)')
        .order('is_highlighted', { ascending: false })
        .order('start_date', { ascending: true });
      
      if (game) {
        query = query.eq('game', game);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Tournament[];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, organizer:profiles(id, nickname, avatar_url, is_highlighted, bio)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Tournament | null;
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
      const { data, error } = await supabase
        .from('tournaments')
        .insert(tournament)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('tournament_participants')
        .insert({ tournament_id: tournamentId, player_id: playerId })
        .select()
        .single();
      
      if (error) throw error;
      
      // Participant count is now updated automatically via database trigger
      return data;
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
      // Use the secure RPC function that doesn't expose participant emails
      const { data, error } = await supabase
        .rpc('get_tournament_participants', { p_tournament_id: tournamentId });
      
      if (error) throw error;
      
      // Transform the flat result to match expected format
      return (data || []).map((p: any) => ({
        id: p.id,
        tournament_id: p.tournament_id,
        player_id: p.player_id,
        placement: p.placement,
        score: p.score,
        registered_at: p.registered_at,
        player: {
          id: p.player_id,
          nickname: p.player_nickname,
          avatar_url: p.player_avatar_url,
          is_highlighted: p.player_is_highlighted,
        },
      }));
    },
    enabled: !!tournamentId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}
