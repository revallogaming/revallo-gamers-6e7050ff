import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentParticipant } from '@/types';
import { toast } from 'sonner';

export function useMiniTournamentParticipants(tournamentId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: participants, isLoading, error } = useQuery({
    queryKey: ['mini-tournament-participants', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mini_tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('registered_at', { ascending: true });

      if (error) throw error;

      // Fetch player profiles separately
      const playerIds = data.map(p => p.player_id);
      const { data: players } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, is_highlighted')
        .in('id', playerIds);

      const playerMap = new Map(players?.map(p => [p.id, p]) || []);

      return data.map(p => ({
        ...p,
        prize_amount_brl: p.prize_amount_brl ? Number(p.prize_amount_brl) : null,
        player: playerMap.get(p.player_id),
      })) as MiniTournamentParticipant[];
    },
    enabled: !!tournamentId,
  });

  const { data: isParticipant } = useQuery({
    queryKey: ['mini-tournament-is-participant', tournamentId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('mini_tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('player_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!tournamentId && !!user,
  });

  const joinTournament = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-mini-tournament`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ tournament_id: tournamentId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao entrar no torneio');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-is-participant', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('Inscrição realizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const leaveTournament = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('mini_tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-is-participant', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament', tournamentId] });
      toast.success('Você saiu do torneio');
    },
    onError: () => {
      toast.error('Erro ao sair do torneio');
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
