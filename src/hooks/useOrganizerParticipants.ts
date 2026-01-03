import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ParticipantWithEmail {
  id: string;
  tournament_id: string;
  player_id: string;
  participant_email: string | null;
  placement: number | null;
  score: number | null;
  registered_at: string;
  player: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    is_highlighted: boolean;
  };
}

export function useOrganizerParticipants(tournamentId: string, isOrganizer: boolean) {
  return useQuery({
    queryKey: ['organizer-participants', tournamentId],
    queryFn: async () => {
      // Organizers can access full participant data including emails via RLS
      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`
          id,
          tournament_id,
          player_id,
          participant_email,
          placement,
          score,
          registered_at,
          player:profiles!tournament_participants_player_id_fkey (
            id,
            nickname,
            avatar_url,
            is_highlighted
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('registered_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        tournament_id: p.tournament_id,
        player_id: p.player_id,
        participant_email: p.participant_email,
        placement: p.placement,
        score: p.score,
        registered_at: p.registered_at,
        player: p.player,
      })) as ParticipantWithEmail[];
    },
    enabled: !!tournamentId && isOrganizer,
  });
}

export function useOrganizerTournaments(organizerId: string | undefined) {
  return useQuery({
    queryKey: ['organizer-tournaments', organizerId],
    queryFn: async () => {
      if (!organizerId) return [];
      
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizerId,
  });
}
