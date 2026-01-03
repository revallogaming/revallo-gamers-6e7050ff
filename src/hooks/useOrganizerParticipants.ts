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
      // First get basic participant data (without email due to RLS)
      const { data: basicData, error: basicError } = await supabase
        .from('tournament_participants')
        .select(`
          id,
          tournament_id,
          player_id,
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

      if (basicError) throw basicError;

      // Then get emails via secure RPC function (only works for organizers)
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_organizer_participant_emails', { p_tournament_id: tournamentId });

      if (emailError) {
        console.warn('Could not fetch participant emails:', emailError.message);
      }

      // Create email lookup map
      const emailMap = new Map<string, string>();
      if (emailData) {
        emailData.forEach((e: { participant_id: string; participant_email: string }) => {
          if (e.participant_email) {
            emailMap.set(e.participant_id, e.participant_email);
          }
        });
      }

      // Merge data
      return (basicData || []).map((p: any) => ({
        id: p.id,
        tournament_id: p.tournament_id,
        player_id: p.player_id,
        participant_email: emailMap.get(p.id) || null,
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
