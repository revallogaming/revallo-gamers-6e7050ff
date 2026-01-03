import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tournament, GameType } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useTournaments(game?: GameType) {
  return useQuery({
    queryKey: ['tournaments', game],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select('*, organizer:profiles(*)')
        .order('is_highlighted', { ascending: false })
        .order('start_date', { ascending: true });
      
      if (game) {
        query = query.eq('game', game);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Tournament[];
    },
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, organizer:profiles(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Tournament | null;
    },
    enabled: !!id,
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
      
      // Update participant count
      await supabase.rpc('increment_participants', { tournament_id: tournamentId });
      
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
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('*, player:profiles(*)')
        .eq('tournament_id', tournamentId)
        .order('score', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
}
